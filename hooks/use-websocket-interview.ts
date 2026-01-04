import { useCallback, useEffect, useRef } from "react";

import { fetcher } from "@/lib/fetcher";
import { logger } from "@/lib/logger";
import {
  calculateReconnectionDelay,
  createCloseMessage,
  createPingMessage,
  DEFAULT_RECONNECTION_CONFIG,
  parseServerMessage,
  type EndInterviewResponse,
  type ReconnectionConfig,
  type StartInterviewRequest,
  type StartInterviewResponse,
} from "@/lib/websocket";
import { useInterviewStore } from "@/store/interview-store";

/**
 * Configuration for the WebSocket interview hook
 */
interface UseWebSocketInterviewConfig {
  /** Ping interval in milliseconds (default: 30000) */
  pingInterval?: number;
  /** Reconnection configuration */
  reconnectionConfig?: ReconnectionConfig;
  /** Callback when connection is ready */
  onReady?: () => void;
  /** Callback when receiving audio data */
  onAudioData?: (data: ArrayBuffer) => void;
  /** Callback when interview ends */
  onInterviewEnd?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Return type for the WebSocket interview hook
 */
interface UseWebSocketInterviewResult {
  /** Start a new interview session */
  startInterview: (request: StartInterviewRequest) => Promise<boolean>;
  /** Connect to an existing session's WebSocket */
  connect: (audioWebSocketUrl: string) => Promise<void>;
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** End the interview session */
  endInterview: () => Promise<void>;
  /** Send audio data chunk */
  sendAudioChunk: (data: ArrayBuffer) => void;
  /** Check if WebSocket is ready for streaming */
  isReady: boolean;
}

/**
 * Custom hook for managing WebSocket connection to voice interview agent.
 * Handles connection lifecycle, authentication, message parsing, and reconnection.
 */
export function useWebSocketInterview(
  config?: UseWebSocketInterviewConfig
): UseWebSocketInterviewResult {
  const {
    pingInterval = 30000,
    reconnectionConfig = DEFAULT_RECONNECTION_CONFIG,
    onReady,
    onAudioData,
    onInterviewEnd,
    onError,
  } = config ?? {};

  // Store actions
  const {
    sessionId,
    connectionStatus,
    reconnectAttempts,
    setSession,
    clearSession,
    setConnectionStatus,
    setError,
    incrementReconnectAttempts,
    resetReconnectAttempts,
    handleServerMessage,
    reset,
  } = useInterviewStore();

  // Refs for WebSocket and intervals
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isIntentionalCloseRef = useRef(false);

  /**
   * Clear all intervals and timeouts
   */
  const clearTimers = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start ping interval to keep connection alive
   */
  const startPingInterval = useCallback(() => {
    clearTimers();
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(createPingMessage());
      }
    }, pingInterval);
  }, [pingInterval, clearTimers]);

  /**
   * Connect to WebSocket (sessionId is included in the URL as query param)
   */
  const connect = useCallback(
    async (wsUrl: string) => {
      logger.info("WebSocket", "Starting connection", { wsUrl });

      // Clean up existing connection
      if (wsRef.current) {
        logger.debug("WebSocket", "Cleaning up existing connection");
        isIntentionalCloseRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }

      logger.stateTransition("WebSocket", "idle", "connecting");
      setConnectionStatus("connecting");
      isIntentionalCloseRef.current = false;

      // Create WebSocket connection - sessionId is included in the URL as query param
      logger.debug("WebSocket", "Creating WebSocket connection");
      const ws = new WebSocket(wsUrl);

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        logger.wsEvent("WebSocket", "Connected", { readyState: ws.readyState });
        logger.stateTransition("WebSocket", "connecting", "connected");
        setConnectionStatus("connected");
        resetReconnectAttempts();
        startPingInterval();
      };

      ws.onmessage = (event) => {
        // Handle binary audio data
        if (event.data instanceof ArrayBuffer) {
          const audioSize = event.data.byteLength;
          logger.debug("WebSocket", "Received binary audio data", {
            sizeBytes: audioSize,
            sizeKB: (audioSize / 1024).toFixed(2),
            hasOnAudioData: !!onAudioData,
          });

          if (onAudioData) {
            onAudioData(event.data);
          } else {
            logger.warn(
              "WebSocket",
              "Received audio but no onAudioData callback"
            );
          }
          return;
        }

        // Handle JSON messages
        const message = parseServerMessage(event.data);
        if (message) {
          logger.wsEvent("WebSocket", "Message received", {
            type: message.type,
            timestamp: message.timestamp,
            message,
          });
          handleServerMessage(message);

          // Trigger callbacks for specific message types
          if (message.type === "ready") {
            logger.info("WebSocket", "WebSocket ready for streaming");
            onReady?.();
          } else if (message.type === "error") {
            logger.error("WebSocket", "Server error received", {
              error: message.message,
            });
            onError?.(message.message);
          } else if (message.type === "conversation_text") {
            logger.info("WebSocket", "Conversation message", {
              role: message.role,
              contentLength: message.content.length,
            });
          } else if (message.type === "user_speaking") {
            logger.debug("WebSocket", "User speaking detected");
          } else if (message.type === "agent_audio_done") {
            logger.debug("WebSocket", "Agent audio playback completed");
          }
        } else {
          logger.warn("WebSocket", "Failed to parse server message", {
            rawData: event.data,
          });
        }
      };

      ws.onerror = (event) => {
        logger.error("WebSocket", "Connection error", {
          error: event,
          readyState: ws.readyState,
        });
        setError("WebSocket connection error");
        onError?.("WebSocket connection error");
      };

      ws.onclose = (event) => {
        logger.wsEvent("WebSocket", "Connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          intentional: isIntentionalCloseRef.current,
        });
        clearTimers();

        // Don't reconnect if intentionally closed
        if (isIntentionalCloseRef.current) {
          logger.info("WebSocket", "Intentional disconnect - not reconnecting");
          logger.stateTransition(
            "WebSocket",
            "connected",
            "disconnected",
            "intentional close"
          );
          setConnectionStatus("disconnected");
          return;
        }

        // Handle specific close codes
        if (event.code === 1011) {
          // Internal server error - voice agent session not ready
          logger.error("WebSocket", "Voice agent session not ready", {
            code: event.code,
          });
          setError("Voice agent session not ready. Please try again.");
          setConnectionStatus("error");
          onError?.("Voice agent session not ready");
          return;
        }

        // Attempt reconnection
        if (reconnectAttempts < reconnectionConfig.maxAttempts) {
          logger.stateTransition(
            "WebSocket",
            "connected",
            "reconnecting",
            "unexpected close"
          );
          setConnectionStatus("reconnecting");
          const delay = calculateReconnectionDelay(
            reconnectAttempts,
            reconnectionConfig
          );

          logger.info("WebSocket", `Reconnecting in ${Math.round(delay)}ms`, {
            attempt: reconnectAttempts + 1,
            maxAttempts: reconnectionConfig.maxAttempts,
            delayMs: Math.round(delay),
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            incrementReconnectAttempts();
            connect(wsUrl);
          }, delay);
        } else {
          logger.error("WebSocket", "Max reconnection attempts reached", {
            attempts: reconnectAttempts,
            maxAttempts: reconnectionConfig.maxAttempts,
          });
          setError("Failed to reconnect after maximum attempts");
          setConnectionStatus("error");
          onError?.("Failed to reconnect");
        }
      };

      wsRef.current = ws;
    },
    [
      setConnectionStatus,
      setError,
      resetReconnectAttempts,
      startPingInterval,
      handleServerMessage,
      reconnectAttempts,
      reconnectionConfig,
      incrementReconnectAttempts,
      clearTimers,
      onReady,
      onAudioData,
      onError,
    ]
  );

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    logger.info("WebSocket", "Initiating disconnect");
    isIntentionalCloseRef.current = true;
    clearTimers();

    if (wsRef.current) {
      // Send close message before closing
      if (wsRef.current.readyState === WebSocket.OPEN) {
        logger.debug("WebSocket", "Sending close message to server");
        wsRef.current.send(createCloseMessage());
      }
      wsRef.current.close(1000, "Client initiated close");
      wsRef.current = null;
    }

    logger.stateTransition(
      "WebSocket",
      "connected",
      "disconnected",
      "client disconnect"
    );
    setConnectionStatus("disconnected");
  }, [clearTimers, setConnectionStatus]);

  /**
   * Start a new interview session
   */
  const startInterview = useCallback(
    async (request: StartInterviewRequest): Promise<boolean> => {
      logger.info("Interview", "Starting interview session", {
        candidateName: request.candidate_name,
        jobRole: request.job_role,
        sector: request.sector,
        seniority: request.seniority,
        language: request.language,
      });

      // Reset any existing state
      reset();

      // Call the start interview endpoint
      logger.apiRequest("Interview", "/v1/interviews/start", "POST", request);
      const { data, error } = await fetcher<StartInterviewResponse>(
        "/v1/interviews/start",
        {
          method: "POST",
          body: request,
        }
      );

      if (error || !data) {
        logger.apiResponse(
          "Interview",
          "/v1/interviews/start",
          0,
          undefined,
          error ?? "Failed to start interview"
        );
        setError(error ?? "Failed to start interview");
        onError?.(error ?? "Failed to start interview");
        return false;
      }

      logger.apiResponse("Interview", "/v1/interviews/start", 200, {
        sessionId: data.sessionId,
        audioWebSocketUrl: data.audioWebSocketUrl,
        status: data.status,
      });

      // Store session info
      logger.debug("Interview", "Storing session info", {
        sessionId: data.sessionId,
      });
      setSession(data.sessionId, data.audioWebSocketUrl);

      // Connect to WebSocket
      logger.debug("Interview", "Connecting to WebSocket");
      await connect(data.audioWebSocketUrl);

      // Mark session as connected
      logger.apiRequest(
        "Interview",
        `/v1/interviews/${data.sessionId}/connect`,
        "GET"
      );
      const connectResult = await fetcher(
        `/v1/interviews/${data.sessionId}/connect`,
        {
          method: "GET",
        }
      );

      if (connectResult.error) {
        logger.apiResponse(
          "Interview",
          `/v1/interviews/${data.sessionId}/connect`,
          0,
          undefined,
          connectResult.error
        );
      } else {
        logger.apiResponse(
          "Interview",
          `/v1/interviews/${data.sessionId}/connect`,
          200,
          connectResult.data
        );
      }

      logger.info("Interview", "Interview session started successfully", {
        sessionId: data.sessionId,
      });
      return true;
    },
    [reset, setSession, setError, connect, onError]
  );

  /**
   * End the current interview session
   */
  const endInterview = useCallback(async () => {
    if (!sessionId) {
      logger.warn("Interview", "No active session to end");
      return;
    }

    logger.info("Interview", "Ending interview session", { sessionId });

    // Disconnect WebSocket first
    disconnect();

    // Call end interview endpoint
    logger.apiRequest("Interview", `/v1/interviews/${sessionId}/end`, "GET");
    const { data, error } = await fetcher<EndInterviewResponse>(
      `/v1/interviews/${sessionId}/end`,
      {
        method: "GET",
      }
    );

    if (error) {
      logger.apiResponse(
        "Interview",
        `/v1/interviews/${sessionId}/end`,
        0,
        undefined,
        error
      );
    } else {
      logger.apiResponse(
        "Interview",
        `/v1/interviews/${sessionId}/end`,
        200,
        data
      );
      logger.info("Interview", "Interview session ended successfully", {
        sessionId,
        endedAt: data?.ended_at,
      });
    }

    // Clear session
    logger.debug("Interview", "Clearing session data");
    clearSession();
    onInterviewEnd?.();
  }, [sessionId, disconnect, clearSession, onInterviewEnd]);

  /**
   * Send audio data chunk to WebSocket
   */
  const sendAudioChunk = useCallback((data: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug("Audio", "Sending audio chunk", {
        sizeBytes: data.byteLength,
        sizeKB: (data.byteLength / 1024).toFixed(2),
      });
      wsRef.current.send(data);
    } else {
      logger.warn("Audio", "Cannot send audio - WebSocket not ready", {
        readyState: wsRef.current?.readyState,
      });
    }
  }, []);

  /**
   * Check if WebSocket is ready for streaming
   */
  const isReady = connectionStatus === "ready";

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isIntentionalCloseRef.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [clearTimers]);

  return {
    startInterview,
    connect,
    disconnect,
    endInterview,
    sendAudioChunk,
    isReady,
  };
}
