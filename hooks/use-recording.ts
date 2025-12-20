import {
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export type RecordingPhase =
  | "idle"
  | "countdown"
  | "recording"
  | "stopped"
  | "uploading";

const MAX_RECORDING_TIME_SECONDS = 10 * 60; // 10 minutes in seconds

// Recording options with metering enabled for audio level visualization
const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

interface UseRecordingConfig {
  maxRecordingTime?: number;
  onTimeExpired?: () => void;
  onError?: (error: Error) => void;
}

interface UseRecordingResult {
  audioRecorder: ReturnType<typeof useAudioRecorder>;
  phase: RecordingPhase;
  setPhase: (phase: RecordingPhase) => void;
  remainingTime: number;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ uri: string | null; duration: number }>;
  formatTime: (seconds: number) => string;
}

/**
 * Custom hook for managing audio recording state and operations.
 * Handles recording lifecycle, timer management, and audio mode configuration.
 */
export function useRecording(config?: UseRecordingConfig): UseRecordingResult {
  const {
    maxRecordingTime = MAX_RECORDING_TIME_SECONDS,
    onTimeExpired,
    onError,
  } = config ?? {};

  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [remainingTime, setRemainingTime] = useState(maxRecordingTime);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setPhase("recording");
      setRecordingDuration(0);
      setRemainingTime(maxRecordingTime);

      // Start the countdown timer
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearTimer();
            audioRecorder.stop().catch(console.error);
            onTimeExpired?.();
            return 0;
          }
          return prev - 1;
        });
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [audioRecorder, maxRecordingTime, onTimeExpired, onError, clearTimer]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    clearTimer();

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = audioRecorder.uri;
      console.log("Recording saved at:", uri);

      return { uri, duration: recordingDuration };
    } catch (error) {
      console.error("Failed to stop recording:", error);
      return { uri: null, duration: recordingDuration };
    }
  }, [audioRecorder, recordingDuration, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      // Wrap in try-catch to handle native object deallocation
      try {
        if (audioRecorder.isRecording) {
          audioRecorder.stop().catch(() => {
            // Ignore errors during cleanup - native object may be deallocated
          });
        }
      } catch {
        // Native object may have been deallocated
      }
    };
  }, [audioRecorder, clearTimer]);

  return {
    audioRecorder,
    phase,
    setPhase,
    remainingTime,
    recordingDuration,
    startRecording,
    stopRecording,
    formatTime,
  };
}
