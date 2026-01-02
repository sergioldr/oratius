import type { AudioRecorder } from "expo-audio";
import { useAudioRecorderState } from "expo-audio";
import { useMemo } from "react";

import {
  type AudioLevelAnimationValues,
  type AudioLevelConfig,
  AUDIO_STREAM_CONFIG,
  calculateAnimationValues,
  normalizeMeteringDb,
} from "@/lib/audio-utils";

interface UseAudioLevelResult {
  /** Normalized audio level from 0 to 1 */
  audioLevel: number;
  /** Pre-calculated animation values based on audio level */
  animationValues: AudioLevelAnimationValues;
}

/**
 * Custom hook for monitoring audio levels from an AudioRecorder
 * and calculating animation values for visual feedback.
 *
 * Uses expo-audio's useAudioRecorderState for efficient polling.
 *
 * @param audioRecorder - The expo-audio AudioRecorder instance
 * @param isRecording - Whether recording is currently active
 * @param config - Optional configuration for thresholds and polling
 */
export function useAudioLevel(
  audioRecorder: AudioRecorder,
  isRecording: boolean,
  config?: AudioLevelConfig & { pollInterval?: number }
): UseAudioLevelResult {
  const {
    pollInterval = AUDIO_STREAM_CONFIG.METERING_INTERVAL,
    ...levelConfig
  } = config ?? {};

  // Use expo-audio's built-in state polling hook
  const recorderState = useAudioRecorderState(audioRecorder, pollInterval);

  // Calculate normalized audio level from metering
  const audioLevel = useMemo(() => {
    if (!isRecording || !audioRecorder.isRecording) {
      return 0;
    }

    if (recorderState?.metering != null) {
      return normalizeMeteringDb(recorderState.metering, levelConfig);
    }

    return 0;
  }, [
    isRecording,
    audioRecorder.isRecording,
    recorderState?.metering,
    levelConfig,
  ]);

  // Calculate animation values based on audio level
  const animationValues = useMemo(
    () => calculateAnimationValues(audioLevel),
    [audioLevel]
  );

  return {
    audioLevel,
    animationValues,
  };
}
