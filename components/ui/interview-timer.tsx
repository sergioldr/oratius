import { useEffect, useState } from "react";
import { Text } from "tamagui";

import { Fonts } from "@/constants/theme";

interface InterviewTimerProps {
  /**
   * Whether the timer is active (counting up)
   * @default true
   */
  isActive?: boolean;
  /**
   * Callback when timer updates
   */
  onTimeUpdate?: (seconds: number) => void;
}

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Interview Timer Component
 * Displays elapsed time in MM:SS format with monospace font
 * Automatically starts counting when mounted
 */
export function InterviewTimer({
  isActive = true,
  onTimeUpdate,
}: InterviewTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer effect - counts up when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 1;
        onTimeUpdate?.(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUpdate]);

  return (
    <Text
      paddingHorizontal="$2"
      fontSize="$2"
      fontWeight="700"
      letterSpacing={1.5}
      color="$primary6"
      fontFamily={Fonts.mono}
    >
      {formatTime(elapsedTime)}
    </Text>
  );
}
