import { AudioRecorder } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface AudioLevelConfig {
  /** Minimum dB threshold to consider as speech (default: -35) */
  noiseThreshold?: number;
  /** Maximum dB level for normalization (default: -5) */
  maxLevel?: number;
  /** Polling interval in milliseconds (default: 50) */
  pollInterval?: number;
}

interface AudioLevelAnimationValues {
  amplitude: number;
  speed: number;
  scale: number;
  glowOpacity: number;
}

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
 * @param audioRecorder - The expo-audio AudioRecorder instance
 * @param isRecording - Whether recording is currently active
 * @param config - Optional configuration for thresholds and polling
 */
export function useAudioLevel(
  audioRecorder: AudioRecorder,
  isRecording: boolean,
  config?: AudioLevelConfig
): UseAudioLevelResult {
  const {
    noiseThreshold = -35,
    maxLevel = -5,
    pollInterval = 50,
  } = config ?? {};

  const [audioLevel, setAudioLevel] = useState(0);
  const meteringRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe getStatus wrapper to handle native object deallocation
  const safeGetStatus = useCallback(() => {
    try {
      if (!isMountedRef.current || !audioRecorder.isRecording) {
        return null;
      }
      return audioRecorder.getStatus();
    } catch {
      // Native object may have been deallocated
      return null;
    }
  }, [audioRecorder]);

  // Poll metering values when recording
  useEffect(() => {
    if (isRecording && audioRecorder.isRecording) {
      meteringRef.current = setInterval(() => {
        const state = safeGetStatus();
        if (state?.metering !== undefined && state?.metering !== null) {
          const meteringDb = state.metering;

          // Threshold: ignore audio below noiseThreshold (background noise)
          // Only respond to actual speech which is typically louder
          if (meteringDb < noiseThreshold) {
            setAudioLevel(0);
          } else {
            // Map noiseThreshold to 0, and maxLevel to 1
            const range = maxLevel - noiseThreshold;
            const normalizedLevel = Math.max(
              0,
              Math.min(1, (meteringDb - noiseThreshold) / range)
            );
            setAudioLevel(normalizedLevel);
          }
        }
      }, pollInterval);
    } else {
      if (meteringRef.current) {
        clearInterval(meteringRef.current);
        meteringRef.current = null;
      }
      setAudioLevel(0);
    }

    return () => {
      if (meteringRef.current) {
        clearInterval(meteringRef.current);
        meteringRef.current = null;
      }
    };
  }, [
    isRecording,
    audioRecorder,
    noiseThreshold,
    maxLevel,
    pollInterval,
    safeGetStatus,
  ]);

  // Calculate animation values based on audio level
  const animationValues = useMemo<AudioLevelAnimationValues>(() => {
    const level = Math.min(audioLevel, 1);

    return {
      amplitude: 0.18 + level * 1.7,
      speed: 0.75 + level * 0.2,
      scale: 1 + level * 0.12,
      glowOpacity: 0.25 + level * 0.75,
    };
  }, [audioLevel]);

  return {
    audioLevel,
    animationValues,
  };
}
