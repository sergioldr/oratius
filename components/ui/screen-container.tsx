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
    <YStack
      flex={1}
      backgroundColor="$background"
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
  );
}
