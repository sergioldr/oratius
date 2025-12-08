import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, type YStackProps } from "tamagui";

interface ScreenContainerProps extends YStackProps {
  centered?: boolean;
}

export function ScreenContainer({
  children,
  centered = false,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
      style={styles.gradient}
    >
      <YStack
        flex={1}
        paddingTop={insets.top}
        paddingBottom={insets.bottom}
        paddingHorizontal="$4"
        {...(centered && {
          justifyContent: "center",
          alignItems: "center",
        })}
        {...props}
      >
        {children}
      </YStack>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
