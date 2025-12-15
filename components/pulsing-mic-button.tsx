import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Button, YStack } from "tamagui";

interface PulsingMicButtonProps {
  onPress: () => void;
}

export function PulsingMicButton({ onPress }: PulsingMicButtonProps) {
  const { width, height } = useWindowDimensions();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);

  // Calculate button size based on screen dimensions
  // Use smaller dimension to ensure it fits, scale up on larger screens
  const minDimension = Math.min(width, height);
  const baseSize = minDimension > 500 ? 144 : minDimension > 400 ? 128 : 96;
  const borderSize = baseSize + 10;
  const iconSize = Math.round(baseSize * 0.32);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0.3, { duration: 0 })
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <YStack alignItems="center" justifyContent="center">
      {/* Pulse ring */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: baseSize,
            height: baseSize,
            borderRadius: baseSize / 2,
            backgroundColor: "#2547f4",
          },
          pulseStyle,
        ]}
      />
      {/* Border ring */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: borderSize,
            height: borderSize,
            borderRadius: borderSize / 2,
            borderWidth: 1,
            borderColor: "rgba(37, 71, 244, 0.2)",
          },
          pulseStyle,
        ]}
      />
      {/* Main button */}
      <Button
        width={baseSize}
        height={baseSize}
        borderRadius={baseSize / 2}
        backgroundColor="$primary6"
        pressStyle={{ scale: 0.95, backgroundColor: "$primary6" }}
        onPress={onPress}
        shadowColor="$primary6"
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={0.4}
        shadowRadius={16}
        elevation={8}
      >
        <MaterialIcons name="mic" size={iconSize} color="white" />
      </Button>
    </YStack>
  );
}
