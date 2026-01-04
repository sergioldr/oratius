import {
  AudioDataEvent,
  ExpoAudioStreamModule,
  RecordingConfig,
  useAudioRecorder,
} from "@siteed/expo-audio-studio";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { logger } from "@/lib/logger";

export type AudioStreamStatus =
  | "idle"
  | "initializing"
  | "streaming"
  | "paused"
  | "error";

interface UseAudioStreamConfig {
  sampleRate?: 16000 | 44100 | 48000;
  interval?: number;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;

  /**
   * If you want reliable Android background recording, set true AND showNotification=true.
   * For fixing the crash, leave allowBackgroundAndroid=false.
   */
  allowBackgroundAndroid?: boolean;

  /**
   * If true, the native recorder shows a notification and can run as a real foreground service.
   * For your crash fix path, keep false.
   */
  showNotification?: boolean;
}

interface UseAudioStreamResult {
  status: AudioStreamStatus;
  startStreaming: () => Promise<boolean>;
  stopStreaming: () => Promise<void>;
  pauseStreaming: () => Promise<void>;
  resumeStreaming: () => Promise<void>;
  audioLevel: number;
  playAudio: (audioData: ArrayBuffer) => Promise<void>;
  stopPlayback: () => void;
  isPlaying: boolean;
}

const DEFAULTS = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  ENCODING: "pcm_16bit",
  INTERVAL: 100,
};

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/** Serialize start/stop so you can't overlap calls and confuse native state */
function useAsyncLock() {
  const chainRef = useRef(Promise.resolve());
  return useCallback(async <T>(fn: () => Promise<T>) => {
    const run = chainRef.current.then(fn, fn);
    chainRef.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);
}

export function useAudioStream(
  config?: UseAudioStreamConfig
): UseAudioStreamResult {
  const {
    sampleRate = DEFAULTS.SAMPLE_RATE,
    interval = DEFAULTS.INTERVAL,
    onAudioChunk,
    onAudioLevel,
    onError,
    allowBackgroundAndroid = false,
    showNotification = false,
  } = config ?? {};

  const [status, setStatus] = useState<AudioStreamStatus>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const statusRef = useLatest(status);
  const onAudioChunkRef = useLatest(onAudioChunk);
  const onAudioLevelRef = useLatest(onAudioLevel);
  const onErrorRef = useLatest(onError);

  const runLocked = useAsyncLock();

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

  const audioPlayer = useAudioPlayer(null);
  const audioPlayerRef = useLatest(audioPlayer);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingAudioRef = useRef(false);

  // Initialize audio mode on mount
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch((e) =>
      logger.error("AudioStream", "Failed to set audio mode", {
        error: e instanceof Error ? e.message : String(e),
      })
    );
  }, []);

  // Keep status in sync with recorder
  useEffect(() => {
    if (isRecording && !isPaused) {
      if (statusRef.current !== "streaming") setStatus("streaming");
    } else if (isPaused) {
      if (statusRef.current !== "paused") setStatus("paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, isPaused]);

  // Update audio level (energy)
  useEffect(() => {
    if (statusRef.current !== "streaming") return;
    const energy = (analysisData as { energy?: number } | null)?.energy;
    if (energy == null) return;
    const level = Math.min(1, energy * 3);
    setAudioLevel(level);
    onAudioLevelRef.current?.(level);
  }, [analysisData, onAudioLevelRef, statusRef]);

  // ✅ CRASH FIX: if NOT using an Android foreground notification, stop on background
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (allowBackgroundAndroid) return;
    if (showNotification) return;

    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        // Best effort; don't await inside listener
        runLocked(async () => {
          if (
            statusRef.current === "streaming" ||
            statusRef.current === "paused" ||
            statusRef.current === "initializing"
          ) {
            try {
              await stopRecording();
            } catch {}
            setAudioLevel(0);
            setStatus("idle");
          }
        });
      }
    });

    return () => sub.remove();
  }, [
    allowBackgroundAndroid,
    showNotification,
    runLocked,
    stopRecording,
    statusRef,
  ]);

  const handleAudioStream = useCallback(
    async (event: AudioDataEvent) => {
      if (statusRef.current !== "streaming") return;

      try {
        let audioBuffer: ArrayBuffer | null = null;

        if (typeof event.data === "string") {
          // base64 -> ArrayBuffer
          const binary = globalThis.atob(event.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);
          audioBuffer = bytes.buffer;
        } else if (event.data && typeof event.data === "object") {
          const ta = event.data as Uint8Array | Float32Array;
          if (ta.buffer instanceof ArrayBuffer) {
            audioBuffer = ta.buffer.slice(
              ta.byteOffset,
              ta.byteOffset + ta.byteLength
            );
          }
        }

        if (!audioBuffer) return;
        onAudioChunkRef.current?.(audioBuffer);
      } catch (e) {
        logger.error("AudioStream", "Error processing audio chunk", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [onAudioChunkRef, statusRef]
  );

  const recordingConfig: RecordingConfig = useMemo(
    () => ({
      sampleRate: sampleRate as 16000 | 44100 | 48000,
      channels: DEFAULTS.CHANNELS as 1 | 2,
      encoding: DEFAULTS.ENCODING as "pcm_16bit" | "pcm_8bit",
      interval,
      enableProcessing: true,
      features: { energy: true },
      onAudioStream: handleAudioStream,

      // Your original: disabling notifications.
      // Keep false to avoid foreground service timing issues.
      showNotification,
    }),
    [sampleRate, interval, handleAudioStream, showNotification]
  );

  const startStreaming = useCallback(async (): Promise<boolean> => {
    return runLocked(async () => {
      if (statusRef.current === "streaming") return true;
      if (statusRef.current === "initializing") return false;

      setStatus("initializing");
      logger.info("AudioStream", "Starting audio stream");

      try {
        const perm = await ExpoAudioStreamModule.requestPermissionsAsync();
        if (perm.status !== "granted") {
          const err = new Error("Microphone permission denied");
          onErrorRef.current?.(err);
          setStatus("error");
          return false;
        }

        // ✅ CRASH FIX: don't start in background if no foreground notification
        if (Platform.OS === "android" && !showNotification) {
          if (AppState.currentState !== "active") {
            const err = new Error(
              "Cannot start recording while app is backgrounded when showNotification=false."
            );
            onErrorRef.current?.(err);
            setStatus("error");
            return false;
          }
        }

        await startRecording(recordingConfig);
        setStatus("streaming");
        return true;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        onErrorRef.current?.(err);
        setStatus("error");
        return false;
      }
    });
  }, [
    runLocked,
    startRecording,
    recordingConfig,
    onErrorRef,
    statusRef,
    showNotification,
  ]);

  const stopStreaming = useCallback(async () => {
    return runLocked(async () => {
      if (statusRef.current === "idle") return;
      try {
        await stopRecording();
      } catch {}
      setAudioLevel(0);
      setStatus("idle");
    });
  }, [runLocked, stopRecording, statusRef]);

  const pauseStreaming = useCallback(async () => {
    return runLocked(async () => {
      if (statusRef.current !== "streaming") return;
      try {
        await pauseRecording();
        setStatus("paused");
      } catch (e) {
        logger.error("AudioStream", "Pause failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });
  }, [runLocked, pauseRecording, statusRef]);

  const resumeStreaming = useCallback(async () => {
    return runLocked(async () => {
      if (statusRef.current !== "paused") return;
      try {
        await resumeRecording();
        setStatus("streaming");
      } catch (e) {
        logger.error("AudioStream", "Resume failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });
  }, [runLocked, resumeRecording, statusRef]);

  // Playback helpers (same idea as yours, just tightened)
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return globalThis.btoa(binary);
  };

  const pcmToWav = (
    pcmData: ArrayBuffer,
    sr: number,
    ch: number
  ): ArrayBuffer => {
    const pcmArray = new Int16Array(pcmData);
    const wavBuffer = new ArrayBuffer(44 + pcmArray.length * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + pcmArray.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, ch, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * ch * 2, true);
    view.setUint16(32, ch * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, pcmArray.length * 2, true);

    let o = 44;
    for (let i = 0; i < pcmArray.length; i++, o += 2)
      view.setInt16(o, pcmArray[i], true);
    return wavBuffer;
  };

  // Process audio queue and play next chunk
  const processAudioQueue = useCallback(async () => {
    if (isPlayingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    const audioData = audioQueueRef.current.shift();
    if (!audioData) return;

    isPlayingAudioRef.current = true;
    setIsPlaying(true);

    try {
      const header = new Uint8Array(audioData.slice(0, 4));
      const isWav =
        header[0] === 0x52 &&
        header[1] === 0x49 &&
        header[2] === 0x46 &&
        header[3] === 0x46;
      const isMp3 = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;

      const audioUri = (() => {
        if (isWav || isMp3) {
          const base64Data = arrayBufferToBase64(audioData);
          return `data:audio/${isWav ? "wav" : "mp3"};base64,${base64Data}`;
        }
        const wavBuffer = pcmToWav(
          audioData,
          DEFAULTS.SAMPLE_RATE,
          DEFAULTS.CHANNELS
        );
        const base64Data = arrayBufferToBase64(wavBuffer);
        return `data:audio/wav;base64,${base64Data}`;
      })();

      // Ensure audio mode is set
      await setAudioModeAsync({ playsInSilentMode: true });

      logger.debug("AudioStream", "Playing audio chunk", {
        queueLength: audioQueueRef.current.length,
        audioSize: audioData.byteLength,
      });

      audioPlayerRef.current.replace(audioUri);
      audioPlayerRef.current.play();
    } catch (e) {
      logger.error("AudioStream", "Playback error", {
        error: e instanceof Error ? e.message : String(e),
        errorStack: e instanceof Error ? e.stack : undefined,
      });
      isPlayingAudioRef.current = false;
      setIsPlaying(false);
      // Try to play next chunk
      setTimeout(() => processAudioQueue(), 50);
    }
  }, [audioPlayerRef]);

  const playAudio = useCallback(
    async (audioData: ArrayBuffer) => {
      if (!audioData || audioData.byteLength === 0) {
        logger.warn("AudioStream", "Received empty audio data");
        return;
      }

      logger.debug("AudioStream", "Queueing audio chunk", {
        size: audioData.byteLength,
        currentQueueLength: audioQueueRef.current.length,
      });

      // Add to queue
      audioQueueRef.current.push(audioData);

      // Start processing if not already playing
      await processAudioQueue();
    },
    [processAudioQueue]
  );

  const stopPlayback = useCallback(() => {
    try {
      audioPlayerRef.current.pause();
      audioQueueRef.current = [];
      isPlayingAudioRef.current = false;
    } finally {
      setIsPlaying(false);
    }
  }, [audioPlayerRef]);

  useEffect(() => {
    if (!audioPlayer.playing && isPlaying) {
      setIsPlaying(false);
      isPlayingAudioRef.current = false;
      // Process next chunk in queue
      setTimeout(() => processAudioQueue(), 10);
    }
  }, [audioPlayer.playing, isPlaying, processAudioQueue]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      runLocked(async () => {
        try {
          await stopRecording();
        } catch {}
        try {
          audioPlayerRef.current.pause();
        } catch {}
      });
    };
  }, [runLocked, stopRecording, audioPlayerRef]);

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
