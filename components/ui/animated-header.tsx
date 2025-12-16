import { BlurView } from "expo-blur";
import { StyleSheet, useColorScheme } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

const HEADER_HEIGHT = 80;

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  scrollY: SharedValue<number>;
}

export function AnimatedHeader({
  title,
  subtitle,
  scrollY,
}: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 50], [0, 1], "clamp");
    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: HEADER_HEIGHT + insets.top,
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          headerAnimatedStyle,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(16, 19, 34, 0.9)"
                : "rgba(245, 246, 248, 0.9)",
          },
        ]}
      >
        <BlurView
          intensity={10}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <YStack
        paddingHorizontal="$4"
        paddingBottom="$6"
        paddingTop="$3"
        gap="$1"
      >
        <Text fontSize="$8" fontWeight="bold" color="$color">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="$2" color="$gray11" fontWeight="500">
            {subtitle}
          </Text>
        )}
      </YStack>
    </Animated.View>
  );
}

export { HEADER_HEIGHT };

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
