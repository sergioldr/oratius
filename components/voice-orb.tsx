import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Iridescence } from "./iridescence";

interface VoiceOrbProps {
  isRecording: boolean;
  glowOpacity: number;
  scale: number;
  amplitude: number;
  speed: number;
  orbColor?: number[]; // expecting [r, g, b]
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function VoiceOrb({
  isRecording,
  glowOpacity,
  scale,
  amplitude,
  speed,
  orbColor,
  style,
  onPress,
}: VoiceOrbProps) {
  const orbColorValues =
    orbColor ?? (isRecording ? [1, 0.1, 0.6] : [0.35, 0.6, 1.0]);
  const glowColor = isRecording ? "rgb(244, 63, 94)" : "rgb(37, 71, 244)";
  const shadowColor = isRecording
    ? "rgba(255, 182, 193, 0.45)"
    : "rgba(37, 71, 244, 0.45)";

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(glowOpacity, { duration: isRecording ? 0 : 300 }),
    shadowColor: withTiming(glowColor, { duration: isRecording ? 0 : 700 }),
    backgroundColor: withTiming(glowColor, { duration: isRecording ? 0 : 700 }),
  }));

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale, { duration: 50 }) }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.button, style]}
    >
      {/* Glow effect using shadow - creates diffused light behind orb */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glowShadow, glowAnimatedStyle]}
      />

      {/* Orb container */}
      <Animated.View
        style={[
          styles.orbContainer,
          orbAnimatedStyle,
          {
            shadowColor,
          },
        ]}
      >
        {/* Iridescent shader background */}
        <Iridescence
          amplitude={amplitude}
          speed={speed}
          color={orbColorValues}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const ORB_SIZE = 256; // ~ w-64 / h-64; adjust as needed

const styles = StyleSheet.create({
  button: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderWidth: 0,
    backgroundColor: "transparent",
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  // Single glow element with background color and large shadow
  glowShadow: {
    position: "absolute",
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    // Large shadow creates the diffused glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 10,
  },
  orbContainer: {
    width: "100%",
    height: "100%",
    borderRadius: ORB_SIZE,
    overflow: "hidden",

    // approximate "big soft glow" shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 45,
    elevation: 24,
  },
});
