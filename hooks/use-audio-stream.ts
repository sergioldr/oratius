import {
  AudioDataEvent,
  ExpoAudioStreamModule,
  RecordingConfig,
  useAudioRecorder,
} from "@siteed/expo-audio-studio";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

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
  /** Interval in ms for audio buffer emission (default: 100) */
  interval?: number;
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
  pauseStreaming: () => Promise<void>;
  /** Resume audio streaming */
  resumeStreaming: () => Promise<void>;
  /** Current audio level (0-1) for visualization */
  audioLevel: number;
  /** Play received audio data */
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  /** Stop audio playback */
  stopPlayback: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
}

/** Audio stream configuration optimized for voice WebSocket streaming */
const STREAM_CONFIG = {
  SAMPLE_RATE: 16000 as const,
  CHANNELS: 1 as const,
  ENCODING: "pcm_16bit" as const,
  INTERVAL: 100, // ms between audio buffer emissions
};

/**
 * Custom hook for streaming audio to WebSocket using @siteed/expo-audio-studio.
 *
 * This hook provides cross-platform real-time audio streaming with:
 * - PCM audio chunks via onAudioStream callback
 * - Built-in RMS/energy analysis for visualization
 * - Zero-latency recording start via prepareRecording API
 * - Consistent behavior across iOS, Android, and Web
 */
export function useAudioStream(
  config?: UseAudioStreamConfig
): UseAudioStreamResult {
  const {
    sampleRate = STREAM_CONFIG.SAMPLE_RATE,
    interval = STREAM_CONFIG.INTERVAL,
    onAudioChunk,
    onAudioLevel,
    onError,
  } = config ?? {};

  // State
  const [status, setStatus] = useState<AudioStreamStatus>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const isMountedRef = useRef(true);
  const statusRef = useRef(status);
  const onAudioChunkRef = useRef(onAudioChunk);
  const onAudioLevelRef = useRef(onAudioLevel);
  const onErrorRef = useRef(onError);

  // Web audio playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Audio recorder from expo-audio-studio
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    analysisData,
  } = useAudioRecorder({
    logger: __DEV__ ? console : undefined,
  });

  // Keep refs in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    onAudioChunkRef.current = onAudioChunk;
  }, [onAudioChunk]);

  useEffect(() => {
    onAudioLevelRef.current = onAudioLevel;
  }, [onAudioLevel]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update audio level from analysis data (RMS)
  useEffect(() => {
    if (analysisData && status === "streaming") {
      // Use energy or calculate from analysis data
      const energy = (analysisData as { energy?: number }).energy;
      if (energy !== undefined) {
        // Energy is typically 0-1, amplify for better visualization
        const normalizedLevel = Math.min(1, energy * 3);
        setAudioLevel(normalizedLevel);
        onAudioLevelRef.current?.(normalizedLevel);
      }
    }
  }, [analysisData, status]);

  // Sync status with recorder state
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (isRecording && !isPaused && status !== "streaming") {
      setStatus("streaming");
    } else if (isPaused && status !== "paused") {
      setStatus("paused");
    }
  }, [isRecording, isPaused, status]);

  /**
   * Handle incoming audio stream data from the recorder.
   * Converts to ArrayBuffer and sends via callback.
   */
  const handleAudioStream = useCallback(async (event: AudioDataEvent) => {
    if (!isMountedRef.current || statusRef.current !== "streaming") {
      return;
    }

    try {
      // event.data contains the PCM audio data
      // On native: base64 encoded string
      // On web: Uint8Array buffer
      let audioBuffer: ArrayBuffer;

      if (typeof event.data === "string") {
        // Native platforms: decode base64 to ArrayBuffer
        const binaryString = atob(event.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBuffer = bytes.buffer;
      } else if (event.data && typeof event.data === "object") {
        // Web: Uint8Array or Float32Array - get the buffer
        const typedArray = event.data as Uint8Array | Float32Array;
        const bufferSlice = typedArray.buffer.slice(
          typedArray.byteOffset,
          typedArray.byteOffset + typedArray.byteLength
        );
        audioBuffer = bufferSlice as ArrayBuffer;
      } else {
        logger.warn("AudioStream", "Unknown audio data format", {
          type: typeof event.data,
        });
        return;
      }

      // Send audio chunk to WebSocket via callback
      onAudioChunkRef.current?.(audioBuffer);

      logger.debug("AudioStream", "Audio chunk processed", {
        size: audioBuffer.byteLength,
        position: event.position,
      });
    } catch (error) {
      logger.error("AudioStream", "Error processing audio chunk", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

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

    try {
      // Request microphone permission
      const permissionResult =
        await ExpoAudioStreamModule.requestPermissionsAsync();

      if (permissionResult.status !== "granted") {
        logger.error("AudioStream", "Microphone permission denied");
        onErrorRef.current?.(new Error("Microphone permission denied"));
        setStatus("error");
        return false;
      }

      // Configure recording for WebSocket streaming
      const recordingConfig: RecordingConfig = {
        sampleRate: sampleRate as 16000 | 44100 | 48000,
        channels: STREAM_CONFIG.CHANNELS,
        encoding: STREAM_CONFIG.ENCODING,
        interval,
        enableProcessing: true, // Enable RMS analysis for visualization
        features: {
          energy: true,
        },
        onAudioStream: handleAudioStream,
      };

      logger.info("AudioStream", "Starting recording with config", {
        sampleRate,
        channels: STREAM_CONFIG.CHANNELS,
        encoding: STREAM_CONFIG.ENCODING,
        interval,
      });

      // Start recording - this will begin streaming audio chunks
      await startRecording(recordingConfig);

      logger.stateTransition("AudioStream", "initializing", "streaming");
      setStatus("streaming");

      return true;
    } catch (error) {
      logger.error("AudioStream", "Failed to start streaming", {
        error: error instanceof Error ? error.message : String(error),
      });
      onErrorRef.current?.(
        error instanceof Error ? error : new Error(String(error))
      );
      setStatus("error");
      return false;
    }
  }, [status, sampleRate, interval, startRecording, handleAudioStream]);

  /**
   * Stop audio streaming and clean up resources
   */
  const stopStreaming = useCallback(async () => {
    logger.info("AudioStream", "Stopping streaming", { platform: Platform.OS });

    try {
      await stopRecording();
    } catch (error) {
      logger.debug("AudioStream", "Stop recording error (expected)", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    setAudioLevel(0);
    setStatus("idle");
    logger.info("AudioStream", "Streaming stopped");
  }, [stopRecording]);

  /**
   * Pause audio streaming
   */
  const handlePauseStreaming = useCallback(async () => {
    if (status !== "streaming") return;

    logger.info("AudioStream", "Pausing");

    try {
      await pauseRecording();
      setStatus("paused");
    } catch (error) {
      logger.error("AudioStream", "Pause error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [status, pauseRecording]);

  /**
   * Resume audio streaming
   */
  const handleResumeStreaming = useCallback(async () => {
    if (status !== "paused") return;

    logger.info("AudioStream", "Resuming");

    try {
      await resumeRecording();
      setStatus("streaming");
    } catch (error) {
      logger.error("AudioStream", "Resume error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [status, resumeRecording]);

  /**
   * Play received audio data (for AI agent responses)
   */
  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      if (Platform.OS === "web") {
        // Web: Use Web Audio API
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
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
      } else {
        // Native: Use expo-audio for playback
        const base64Data = arrayBufferToBase64(audioData);
        const audioUri = `data:audio/wav;base64,${base64Data}`;

        // Configure audio mode for playback
        await setAudioModeAsync({
          playsInSilentMode: true,
        });

        // Create audio player
        const player = createAudioPlayer(audioUri);

        setIsPlaying(true);

        // Listen for playback completion
        player.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            player.remove();
          }
        });

        // Start playback
        player.play();
      }
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
    if (Platform.OS === "web" && playbackSourceRef.current) {
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

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopStreaming]);

  return {
    status,
    startStreaming,
    stopStreaming,
    pauseStreaming: handlePauseStreaming,
    resumeStreaming: handleResumeStreaming,
    audioLevel,
    playAudio,
    stopPlayback,
    isPlaying,
  };
}

/**
 * Convert ArrayBuffer to base64 string for native audio playback
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
