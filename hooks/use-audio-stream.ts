import {
  AudioModule,
  AudioQuality,
  IOSOutputFormat,
  RecordingOptions,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  AUDIO_STREAM_CONFIG,
  calculateRmsLevel,
  float32ToInt16,
  normalizeMeteringDb,
} from "@/lib/audio-utils";
import { logger } from "@/lib/logger";

/**
 * Audio streaming status
 */
export type AudioStreamStatus =
  | "idle"
  | "initializing"
  | "streaming"
  | "paused"
  | "error";

/**
 * Configuration for audio streaming
 */
interface UseAudioStreamConfig {
  /** Sample rate for audio capture (default: 16000 for voice) */
  sampleRate?: number;
  /** Enable metering for visualization (default: true) */
  enableMetering?: boolean;
  /** Callback when audio chunk is ready to send */
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  /** Callback for audio level updates (0-1) */
  onAudioLevel?: (level: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Return type for the audio stream hook
 */
interface UseAudioStreamResult {
  /** Current streaming status */
  status: AudioStreamStatus;
  /** Start audio streaming */
  startStreaming: () => Promise<boolean>;
  /** Stop audio streaming */
  stopStreaming: () => Promise<void>;
  /** Pause audio streaming */
  pauseStreaming: () => void;
  /** Resume audio streaming */
  resumeStreaming: () => void;
  /** Current audio level (0-1) for visualization */
  audioLevel: number;
  /** Play received audio data (web only) */
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  /** Stop audio playback */
  stopPlayback: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
}

/**
 * Recording options optimized for voice streaming at 16kHz
 */
const STREAMING_RECORDING_OPTIONS: RecordingOptions = {
  extension: ".m4a",
  sampleRate: AUDIO_STREAM_CONFIG.SAMPLE_RATE,
  numberOfChannels: 1,
  bitRate: AUDIO_STREAM_CONFIG.BIT_RATE,
  isMeteringEnabled: true,
  android: {
    outputFormat: "mpeg4",
    audioEncoder: "aac",
    sampleRate: AUDIO_STREAM_CONFIG.SAMPLE_RATE,
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    sampleRate: AUDIO_STREAM_CONFIG.SAMPLE_RATE,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: AUDIO_STREAM_CONFIG.BIT_RATE,
  },
};

/**
 * Custom hook for streaming audio to WebSocket.
 *
 * Platform behavior:
 * - Web: Uses Web Audio API for real-time audio chunk streaming
 * - Native: Uses expo-audio for metering; actual audio streaming handled separately
 */
export function useAudioStream(
  config?: UseAudioStreamConfig
): UseAudioStreamResult {
  const {
    sampleRate = AUDIO_STREAM_CONFIG.SAMPLE_RATE,
    enableMetering = true,
    onAudioChunk,
    onAudioLevel,
    onError,
  } = config ?? {};

  // State
  const [status, setStatus] = useState<AudioStreamStatus>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Ref to track audio mode readiness (avoids stale closure issues)
  const isAudioModeReadyRef = useRef(false);

  // Native audio recorder with built-in state polling
  const audioRecorder = useAudioRecorder(STREAMING_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(
    audioRecorder,
    AUDIO_STREAM_CONFIG.METERING_INTERVAL
  );

  // Web audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set up audio mode on mount for native platforms
  // This ensures the audio session is configured before any recording attempts
  useEffect(() => {
    if (Platform.OS === "web") {
      isAudioModeReadyRef.current = true;
      return;
    }

    let mounted = true;

    const setupAudioMode = async () => {
      try {
        logger.debug("AudioStream", "Setting up audio mode on mount");

        // Request permission using AudioModule directly
        const permissionStatus =
          await AudioModule.requestRecordingPermissionsAsync();
        if (!permissionStatus.granted) {
          logger.warn("AudioStream", "Permission not granted during setup");
          return;
        }

        if (!mounted) return;

        // Activate the audio subsystem
        logger.debug("AudioStream", "Activating audio subsystem");
        await setIsAudioActiveAsync(true);

        // Wait a bit after activation
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!mounted) return;

        // Configure audio mode for recording with explicit settings:
        // - allowsRecording: true - Enable microphone recording
        // - playsInSilentMode: true - Allow audio playback when iOS silent switch is on
        // - interruptionMode: "doNotMix" - Request exclusive audio focus for clear recording
        logger.debug("AudioStream", "Configuring audio mode");
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: "doNotMix",
        });

        // Give iOS more time to configure the audio session
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (mounted) {
          logger.info("AudioStream", "Audio mode ready");
          isAudioModeReadyRef.current = true;
        }
      } catch (error) {
        logger.error("AudioStream", "Failed to set up audio mode", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    setupAudioMode();

    return () => {
      mounted = false;
      isAudioModeReadyRef.current = false;
      // Reset audio mode on unmount
      setAudioModeAsync({ allowsRecording: false }).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

  // Native metering via useAudioRecorderState (replaces manual polling)
  useEffect(() => {
    if (Platform.OS === "web" || !enableMetering) return;
    if (status !== "streaming") return;

    if (recorderState?.metering != null) {
      const level = normalizeMeteringDb(recorderState.metering);
      setAudioLevel(level);
      onAudioLevel?.(level);
    }
  }, [recorderState?.metering, status, enableMetering, onAudioLevel]);

  /**
   * Create AudioWorklet processor code as a blob URL.
   * This allows us to use AudioWorklet without external files.
   */
  const createWorkletProcessor = useCallback(() => {
    const processorCode = `
      class AudioStreamProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.chunkCount = 0;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input[0] && input[0].length > 0) {
            const channelData = input[0];
            
            // Send audio data to main thread
            this.port.postMessage({
              type: 'audio',
              samples: channelData,
              chunkCount: this.chunkCount++
            });
          }
          return true;
        }
      }

      registerProcessor('audio-stream-processor', AudioStreamProcessor);
    `;

    const blob = new Blob([processorCode], { type: "application/javascript" });
    return URL.createObjectURL(blob);
  }, []);

  /**
   * Start audio streaming for Web platform using AudioWorklet API
   */
  const startWebStreaming = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("AudioStream", "Starting web audio streaming", {
        sampleRate,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Create and load the AudioWorklet processor
      const workletUrl = createWorkletProcessor();
      try {
        await audioContext.audioWorklet.addModule(workletUrl);
      } finally {
        URL.revokeObjectURL(workletUrl);
      }

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(
        audioContext,
        "audio-stream-processor"
      );
      workletNodeRef.current = workletNode;

      // Handle audio data from worklet
      workletNode.port.onmessage = (event) => {
        if (!isMountedRef.current || statusRef.current !== "streaming") return;

        const { samples, chunkCount } = event.data;
        const inputData = new Float32Array(samples);

        // Calculate and emit audio level
        const level = calculateRmsLevel(inputData);
        setAudioLevel(level);
        onAudioLevel?.(level);

        // Convert and send audio chunk
        const int16Data = float32ToInt16(inputData);
        onAudioChunk?.(int16Data.buffer as ArrayBuffer);

        if (chunkCount % 50 === 0) {
          logger.debug("AudioStream", "Processing chunk", {
            chunk: chunkCount,
            level: level.toFixed(3),
          });
        }
      };

      // Connect the audio graph
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      logger.info("AudioStream", "Web streaming started");
      return true;
    } catch (error) {
      logger.error("AudioStream", "Web streaming error", {
        error: error instanceof Error ? error.message : String(error),
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [sampleRate, createWorkletProcessor, onAudioChunk, onAudioLevel, onError]);

  /**
   * Start audio streaming for native platforms using expo-audio
   */
  const startNativeStreaming = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("AudioStream", "Starting native audio streaming", {
        platform: Platform.OS,
        isAudioModeReady: isAudioModeReadyRef.current,
      });

      // Ensure audio mode is ready (set up in useEffect)
      if (!isAudioModeReadyRef.current) {
        logger.warn(
          "AudioStream",
          "Audio mode not ready, waiting for setup..."
        );
        // Wait for audio mode to be ready with timeout
        const maxWait = 2000;
        const checkInterval = 100;
        let waited = 0;

        while (!isAudioModeReadyRef.current && waited < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
          waited += checkInterval;
        }

        if (!isAudioModeReadyRef.current) {
          logger.error("AudioStream", "Audio mode setup timed out");
          return false;
        }
      }

      // Verify permission is still granted using AudioModule
      const permissionStatus = await AudioModule.getRecordingPermissionsAsync();
      if (!permissionStatus.granted) {
        logger.error("AudioStream", "Audio permission not granted");
        // Try requesting again
        const requestStatus =
          await AudioModule.requestRecordingPermissionsAsync();
        if (!requestStatus.granted) {
          logger.error("AudioStream", "Audio permission denied after request");
          return false;
        }
      }

      // Ensure audio is active
      logger.debug("AudioStream", "Ensuring audio is active");
      await setIsAudioActiveAsync(true);

      // Ensure recorder is fully stopped before starting
      try {
        if (audioRecorder.isRecording) {
          logger.debug("AudioStream", "Stopping active recording");
          await audioRecorder.stop();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (cleanupError) {
        logger.debug("AudioStream", "Cleanup error (expected)", {
          error:
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError),
        });
      }

      // Re-configure audio mode to ensure it's properly set for recording
      // playsInSilentMode: true ensures audio works even when iOS silent switch is on
      logger.debug("AudioStream", "Ensuring audio mode is configured");
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
      });

      // Allow time for iOS audio session to configure properly
      const configureDelay = Platform.OS === "ios" ? 400 : 100;
      await new Promise((resolve) => setTimeout(resolve, configureDelay));

      // Check recorder state before preparing
      const recorderStatus = audioRecorder.getStatus();
      logger.debug("AudioStream", "Recorder status before prepare", {
        canRecord: recorderStatus.canRecord,
        isRecording: recorderStatus.isRecording,
      });

      // Prepare recorder with retry logic and increasing delays
      let prepareAttempts = 0;
      const maxAttempts = 4;
      let lastError: Error | null = null;

      while (prepareAttempts < maxAttempts) {
        try {
          prepareAttempts++;
          logger.debug("AudioStream", "Preparing recorder", {
            attempt: prepareAttempts,
          });

          // On retry attempts, try resetting audio session first
          if (prepareAttempts > 1 && Platform.OS === "ios") {
            logger.debug("AudioStream", "Resetting audio session before retry");
            try {
              await setAudioModeAsync({ allowsRecording: false });
              await new Promise((resolve) => setTimeout(resolve, 200));
              await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
                interruptionMode: "doNotMix",
              });
              await new Promise((resolve) => setTimeout(resolve, 400));
            } catch {
              // Ignore reset errors
            }
          }

          await audioRecorder.prepareToRecordAsync();
          lastError = null;
          break;
        } catch (prepareError) {
          lastError =
            prepareError instanceof Error
              ? prepareError
              : new Error(String(prepareError));

          logger.warn("AudioStream", "Prepare failed", {
            attempt: prepareAttempts,
            error: lastError.message,
          });

          if (prepareAttempts >= maxAttempts) {
            break;
          }

          // Exponentially increase wait time before retry
          const retryDelay = 250 * Math.pow(2, prepareAttempts - 1);
          logger.debug("AudioStream", "Waiting before retry", {
            delayMs: retryDelay,
          });
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      if (lastError) {
        throw lastError;
      }

      logger.debug("AudioStream", "Starting recording");
      audioRecorder.record();

      logger.info("AudioStream", "Native streaming started");
      return true;
    } catch (error) {
      logger.error("AudioStream", "Native streaming error", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Attempt recovery: reset audio mode on failure
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch {
        // Ignore cleanup errors
      }

      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [audioRecorder, onError]);

  /**
   * Start audio streaming
   */
  const startStreaming = useCallback(async (): Promise<boolean> => {
    if (status === "streaming") {
      logger.warn("AudioStream", "Already streaming");
      return true;
    }

    if (status === "initializing") {
      logger.warn("AudioStream", "Already initializing");
      return false;
    }

    logger.stateTransition("AudioStream", status, "initializing");
    setStatus("initializing");

    const success =
      Platform.OS === "web"
        ? await startWebStreaming()
        : await startNativeStreaming();

    const newStatus = success ? "streaming" : "error";
    logger.stateTransition("AudioStream", "initializing", newStatus);
    setStatus(newStatus);

    return success;
  }, [status, startWebStreaming, startNativeStreaming]);

  /**
   * Stop audio streaming and clean up resources
   */
  const stopStreaming = useCallback(async () => {
    logger.info("AudioStream", "Stopping streaming", { platform: Platform.OS });

    if (Platform.OS === "web") {
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current.port.close();
        workletNodeRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    } else {
      try {
        if (audioRecorder.isRecording) {
          logger.debug("AudioStream", "Stopping recorder");
          await audioRecorder.stop();
          // Wait for recorder to fully stop before changing audio mode
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        logger.debug("AudioStream", "Stop recorder error (expected)", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      try {
        logger.debug("AudioStream", "Resetting audio mode");
        await setAudioModeAsync({ allowsRecording: false });
      } catch (error) {
        logger.debug("AudioStream", "Reset audio mode error (expected)", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setAudioLevel(0);
    setStatus("idle");
    logger.info("AudioStream", "Streaming stopped");
  }, [audioRecorder]);

  /**
   * Pause audio streaming
   */
  const pauseStreaming = useCallback(() => {
    if (status !== "streaming") return;

    logger.info("AudioStream", "Pausing");

    if (Platform.OS === "web") {
      audioContextRef.current?.suspend();
    } else {
      try {
        audioRecorder.pause();
      } catch (error) {
        logger.debug("AudioStream", "Pause error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setStatus("paused");
  }, [status, audioRecorder]);

  /**
   * Resume audio streaming
   */
  const resumeStreaming = useCallback(() => {
    if (status !== "paused") return;

    logger.info("AudioStream", "Resuming");

    if (Platform.OS === "web") {
      audioContextRef.current?.resume();
    } else {
      try {
        audioRecorder.record();
      } catch (error) {
        logger.debug("AudioStream", "Resume error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setStatus("streaming");
  }, [status, audioRecorder]);

  /**
   * Play received audio data (web only)
   */
  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      if (Platform.OS !== "web" || !audioContextRef.current) {
        logger.warn("AudioStream", "Playback only supported on web");
        return;
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(
        audioData.slice(0)
      );

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      playbackSourceRef.current = source;

      source.onended = () => {
        playbackSourceRef.current = null;
        setIsPlaying(false);
      };

      source.start();
      setIsPlaying(true);

      logger.debug("AudioStream", "Playing audio", {
        duration: audioBuffer.duration.toFixed(2),
      });
    } catch (error) {
      logger.error("AudioStream", "Playback error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  /**
   * Stop audio playback
   */
  const stopPlayback = useCallback(() => {
    if (playbackSourceRef.current) {
      try {
        playbackSourceRef.current.stop();
      } catch {
        // May already be stopped
      }
      playbackSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    status,
    startStreaming,
    stopStreaming,
    pauseStreaming,
    resumeStreaming,
    audioLevel,
    playAudio,
    stopPlayback,
    isPlaying,
  };
}
