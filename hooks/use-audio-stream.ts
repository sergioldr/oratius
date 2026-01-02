import {
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { logger } from "@/lib/logger";
import { useAudioPermission } from "./use-audio-permission";

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
  /** Chunk duration in milliseconds (default: 100ms) */
  chunkDuration?: number;
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
  /** Play received audio data */
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  /** Stop audio playback */
  stopPlayback: () => void;
  /** Whether audio is currently playing */
  isPlaying: boolean;
}

/**
 * Recording options optimized for voice streaming
 * Uses LINEAR_PCM for raw audio data at 16kHz (as per WebSocket spec)
 */
const STREAMING_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  // Override with streaming-optimized settings
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    sampleRate: 16000,
  },
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

/**
 * Custom hook for streaming audio to WebSocket.
 *
 * Due to expo-audio limitations, this hook provides:
 * 1. Audio metering for visualization
 * 2. Platform-specific audio capture for streaming
 * 3. Audio playback for received AI responses
 *
 * For web: Uses Web Audio API with AudioWorklet/ScriptProcessor
 * For native: Uses expo-audio recorder with periodic file reads
 */
export function useAudioStream(
  config?: UseAudioStreamConfig
): UseAudioStreamResult {
  const {
    sampleRate = 16000,
    enableMetering = true,
    onAudioChunk,
    onAudioLevel,
    onError,
  } = config ?? {};

  const { requestPermission } = useAudioPermission();

  // State
  const [status, setStatus] = useState<AudioStreamStatus>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const audioRecorder = useAudioRecorder(STREAMING_RECORDING_OPTIONS);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isMountedRef = useRef(true);

  // Audio player for playback
  const player = useAudioPlayer(null);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Convert Float32Array to Int16Array for WebSocket transmission
   * Audio format: linear16 (16-bit signed integer PCM)
   */
  const float32ToInt16 = useCallback(
    (float32Array: Float32Array): Int16Array => {
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        // Clamp and convert to 16-bit signed integer
        const sample = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }
      return int16Array;
    },
    []
  );

  /**
   * Start audio streaming for Web platform using Web Audio API
   */
  const startWebStreaming = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("AudioStream", "Starting web audio streaming", {
        sampleRate,
        platform: "web",
      });

      // Request microphone access
      logger.debug("AudioStream", "Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      logger.debug("AudioStream", "Microphone access granted", {
        tracks: stream.getTracks().length,
      });
      mediaStreamRef.current = stream;

      // Create audio context
      logger.debug("AudioStream", "Creating audio context", { sampleRate });
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for audio chunks
      // Buffer size: sampleRate * (chunkDuration / 1000) rounded to power of 2
      const bufferSize = 4096; // ~256ms at 16kHz
      logger.debug("AudioStream", "Creating audio processor", { bufferSize });
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      let chunkCount = 0;
      processor.onaudioprocess = (event) => {
        if (!isMountedRef.current || status !== "streaming") return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Calculate audio level for visualization
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const level = Math.min(1, rms * 3); // Amplify for better visualization

        if (isMountedRef.current) {
          setAudioLevel(level);
          onAudioLevel?.(level);
        }

        // Convert to Int16 and send via callback
        const int16Data = float32ToInt16(inputData);
        onAudioChunk?.(int16Data.buffer as ArrayBuffer);

        // Log every 50th chunk to avoid spam
        if (chunkCount % 50 === 0) {
          logger.debug("AudioStream", "Processing audio chunk", {
            chunkNumber: chunkCount,
            audioLevel: level.toFixed(3),
            bufferSize: inputData.length,
          });
        }
        chunkCount++;
      };

      // Connect the audio graph
      source.connect(processor);
      processor.connect(audioContext.destination);

      logger.info("AudioStream", "Web audio streaming started successfully");
      return true;
    } catch (error) {
      logger.error("AudioStream", "Web streaming error", {
        error: error instanceof Error ? error.message : String(error),
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [sampleRate, status, float32ToInt16, onAudioChunk, onAudioLevel, onError]);

  /**
   * Start audio streaming for native platforms using expo-audio
   * Note: expo-audio doesn't expose raw audio chunks, so we use metering
   * and let the native WebSocket handle audio transmission
   */
  const startNativeStreaming = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("AudioStream", "Starting native audio streaming", {
        platform: Platform.OS,
      });

      // Request permission
      logger.debug("AudioStream", "Requesting audio permission");
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        logger.error("AudioStream", "Audio permission denied");
        setStatus("error");
        return false;
      }
      logger.debug("AudioStream", "Audio permission granted");

      // Configure audio mode for recording
      logger.debug("AudioStream", "Configuring audio mode for recording");
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      logger.debug("AudioStream", "Preparing audio recorder");
      await audioRecorder.prepareToRecordAsync();
      logger.debug("AudioStream", "Starting audio recording");
      audioRecorder.record();

      // Start metering for visualization
      if (enableMetering) {
        logger.debug("AudioStream", "Starting audio metering");
        meteringIntervalRef.current = setInterval(() => {
          if (!isMountedRef.current) return;

          try {
            const state = audioRecorder.getStatus();
            if (state?.metering !== undefined && state?.metering !== null) {
              // Normalize metering from dB to 0-1
              const meteringDb = state.metering;
              const noiseThreshold = -35;
              const maxLevel = -5;

              if (meteringDb < noiseThreshold) {
                setAudioLevel(0);
                onAudioLevel?.(0);
              } else {
                const range = maxLevel - noiseThreshold;
                const level = Math.max(
                  0,
                  Math.min(1, (meteringDb - noiseThreshold) / range)
                );
                setAudioLevel(level);
                onAudioLevel?.(level);
              }
            }
          } catch {
            // Recorder may have been deallocated
          }
        }, 50);
      }

      logger.info("AudioStream", "Native audio streaming started successfully");
      return true;
    } catch (error) {
      logger.error("AudioStream", "Native streaming error", {
        error: error instanceof Error ? error.message : String(error),
      });
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [audioRecorder, enableMetering, requestPermission, onAudioLevel, onError]);

  /**
   * Start audio streaming
   */
  const startStreaming = useCallback(async (): Promise<boolean> => {
    if (status === "streaming") {
      logger.warn("AudioStream", "Already streaming - ignoring start request");
      return true;
    }

    logger.info("AudioStream", "Starting audio streaming", {
      currentStatus: status,
      platform: Platform.OS,
    });
    logger.stateTransition("AudioStream", status, "initializing");
    setStatus("initializing");

    let success: boolean;

    if (Platform.OS === "web") {
      success = await startWebStreaming();
    } else {
      success = await startNativeStreaming();
    }

    if (success) {
      logger.stateTransition("AudioStream", "initializing", "streaming");
      setStatus("streaming");
    } else {
      logger.stateTransition(
        "AudioStream",
        "initializing",
        "error",
        "failed to start"
      );
      setStatus("error");
    }

    return success;
  }, [status, startWebStreaming, startNativeStreaming]);

  /**
   * Stop audio streaming
   */
  const stopStreaming = useCallback(async () => {
    logger.info("AudioStream", "Stopping audio streaming", {
      currentStatus: status,
      platform: Platform.OS,
    });

    // Clear metering interval
    if (meteringIntervalRef.current) {
      logger.debug("AudioStream", "Clearing metering interval");
      clearInterval(meteringIntervalRef.current);
      meteringIntervalRef.current = null;
    }

    // Web cleanup
    if (Platform.OS === "web") {
      logger.debug("AudioStream", "Cleaning up web audio resources");
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } else {
      // Native cleanup
      logger.debug("AudioStream", "Cleaning up native audio resources");
      try {
        if (audioRecorder.isRecording) {
          await audioRecorder.stop();
        }
        await setAudioModeAsync({
          allowsRecording: false,
        });
      } catch (error) {
        logger.debug("AudioStream", "Error during cleanup (may be expected)", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setAudioLevel(0);
    logger.stateTransition("AudioStream", status, "idle", "stopped");
    setStatus("idle");
    logger.info("AudioStream", "Audio streaming stopped");
  }, [audioRecorder, status]);

  /**
   * Pause audio streaming
   */
  const pauseStreaming = useCallback(() => {
    if (status !== "streaming") return;

    logger.info("AudioStream", "Pausing audio streaming", {
      platform: Platform.OS,
    });

    if (Platform.OS === "web") {
      audioContextRef.current?.suspend();
    } else {
      try {
        audioRecorder.pause();
      } catch (error) {
        logger.debug("AudioStream", "Error pausing recorder", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.stateTransition("AudioStream", "streaming", "paused");
    setStatus("paused");
  }, [status, audioRecorder]);

  /**
   * Resume audio streaming
   */
  const resumeStreaming = useCallback(() => {
    if (status !== "paused") return;

    logger.info("AudioStream", "Resuming audio streaming", {
      platform: Platform.OS,
    });

    if (Platform.OS === "web") {
      audioContextRef.current?.resume();
    } else {
      try {
        audioRecorder.record();
      } catch (error) {
        logger.debug("AudioStream", "Error resuming recorder", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.stateTransition("AudioStream", "paused", "streaming");
    setStatus("streaming");
  }, [status, audioRecorder]);

  /**
   * Play received audio data from WebSocket
   */
  const playAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      logger.debug("AudioStream", "Playing audio", {
        sizeBytes: audioData.byteLength,
        sizeKB: (audioData.byteLength / 1024).toFixed(2),
        platform: Platform.OS,
      });

      // For web, use Web Audio API
      if (Platform.OS === "web" && audioContextRef.current) {
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          audioData.slice(0) // Clone the buffer
        );
        logger.debug("AudioStream", "Audio buffer decoded", {
          duration: audioBuffer.duration.toFixed(2),
          sampleRate: audioBuffer.sampleRate,
        });
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          logger.debug("AudioStream", "Audio playback finished");
          setIsPlaying(false);
        };
        source.start();
        setIsPlaying(true);
        logger.info("AudioStream", "Audio playback started");
        return;
      }

      // For native, we need to save to file and play
      // This is a limitation - expo-audio player needs a URI
      logger.warn(
        "AudioStream",
        "Native audio playback from buffer not implemented",
        {
          platform: Platform.OS,
        }
      );
      // TODO: Implement native audio playback from buffer
    } catch (error) {
      logger.error("AudioStream", "Audio playback error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  /**
   * Stop audio playback
   */
  const stopPlayback = useCallback(() => {
    if (player.playing) {
      player.pause();
    }
    setIsPlaying(false);
  }, [player]);

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
