import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, YStack, type YStackProps } from "tamagui";

interface ThemedScreenContainerProps extends YStackProps {
  centered?: boolean;
  scrollable?: boolean;
}

export function ThemedScreenContainer({
  children,
  centered = false,
  scrollable = false,
  ...props
}: ThemedScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <YStack
      flex={1}
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal="$4"
      backgroundColor="$backgroundStrong"
      {...(centered && {
        justifyContent: "center",
        alignItems: "center",
      })}
      {...props}
    >
      {children}
    </YStack>
  );

  if (scrollable) {
    return (
      <ScrollView
        flex={1}
        backgroundColor="$backgroundStrong"
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}
