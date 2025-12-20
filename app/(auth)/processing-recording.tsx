import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

export default function ProcessingRecordingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    recordingId: string;
    mode?: string;
    type?: string;
  }>();

  // Pulsing animation for the processing indicator
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // TODO: Implement actual processing logic here
  // This is a mock loading state for now

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal="$5"
    >
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
          <Animated.View style={[styles.indicatorContainer, pulseStyle]}>
            <ActivityIndicator size="large" color="#6366f1" />
          </Animated.View>

          <Text
            fontSize={24}
            fontWeight="700"
            color="$color"
            textAlign="center"
            marginTop="$6"
          >
            {t("processingRecording.title")}
          </Text>

          <Text
            fontSize="$4"
            color="$gray11"
            textAlign="center"
            marginTop="$3"
            lineHeight={24}
          >
            {t("processingRecording.message")}
          </Text>

          <YStack marginTop="$8" alignItems="center">
            <Text fontSize="$2" color="$gray10" textAlign="center">
              {t("processingRecording.hint")}
            </Text>
          </YStack>
        </Animated.View>
      </YStack>

      {/* Mode indicator at bottom */}
      {params.mode && params.type && (
        <YStack alignItems="center" paddingBottom="$6">
          <Text
            fontSize="$2"
            color="$gray10"
            textTransform="uppercase"
            letterSpacing={1}
          >
            {params.mode} • {params.type}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
