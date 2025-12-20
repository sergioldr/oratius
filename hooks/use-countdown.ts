import { useCallback, useEffect, useRef, useState } from "react";
import { ViewStyle } from "react-native";
import {
  AnimatedStyle,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface UseCountdownConfig {
  initialCount?: number;
  onComplete?: () => void;
}

interface UseCountdownResult {
  countdown: number;
  isActive: boolean;
  animatedStyle: AnimatedStyle<ViewStyle>;
  startCountdown: () => void;
  cancelCountdown: () => void;
}

/**
 * Custom hook for managing a countdown timer with animation.
 * Provides countdown state and animated scale style for visual feedback.
 */
export function useCountdown(config?: UseCountdownConfig): UseCountdownResult {
  const { initialCount = 3, onComplete } = config ?? {};

  const [countdown, setCountdown] = useState(initialCount);
  const [isActive, setIsActive] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  // Clear timeout helper
  const clearCountdownTimer = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Start countdown
  const startCountdown = useCallback(() => {
    setCountdown(initialCount);
    setIsActive(true);
  }, [initialCount]);

  // Cancel countdown
  const cancelCountdown = useCallback(() => {
    clearCountdownTimer();
    setIsActive(false);
    setCountdown(initialCount);
  }, [clearCountdownTimer, initialCount]);

  // Handle countdown tick
  useEffect(() => {
    if (!isActive) return;

    // Animate countdown number
    countdownScale.value = withSpring(1.2, { damping: 8 });
    setTimeout(() => {
      countdownScale.value = withSpring(1, { damping: 8 });
    }, 300);

    countdownRef.current = setTimeout(() => {
      if (countdown > 1) {
        setCountdown((prev) => prev - 1);
      } else {
        setIsActive(false);
        onComplete?.();
      }
    }, 1000);

    return () => {
      clearCountdownTimer();
    };
  }, [isActive, countdown, onComplete, countdownScale, clearCountdownTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdownTimer();
    };
  }, [clearCountdownTimer]);

  return {
    countdown,
    isActive,
    animatedStyle,
    startCountdown,
    cancelCountdown,
  };
}
