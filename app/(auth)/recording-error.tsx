import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { PrimaryButton, SecondaryButton } from "@/components/ui";

type RecordingErrorType =
  | "duration_too_short"
  | "upload_failed"
  | "processing_failed"
  | "subscription_error"
  | "unknown";

interface ErrorConfig {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const ERROR_CONFIGS: Record<RecordingErrorType, ErrorConfig> = {
  duration_too_short: {
    icon: "time-outline",
    iconColor: "#f59e0b",
  },
  upload_failed: {
    icon: "cloud-offline-outline",
    iconColor: "#ef4444",
  },
  processing_failed: {
    icon: "server-outline",
    iconColor: "#ef4444",
  },
  subscription_error: {
    icon: "sync-outline",
    iconColor: "#ef4444",
  },
  unknown: {
    icon: "alert-circle-outline",
    iconColor: "#ef4444",
  },
};

export default function RecordingErrorScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    errorType?: RecordingErrorType;
    error?: string;
    mode?: string;
    type?: string;
  }>();

  // Map error messages to user-friendly error types
  const getErrorType = (): RecordingErrorType => {
    if (params.errorType) return params.errorType;

    const errorMessage = params.error?.toLowerCase() || "";

    // Map error messages to types for user-friendly display
    if (errorMessage.includes("processing")) {
      return "processing_failed";
    }
    if (
      errorMessage.includes("connect") ||
      errorMessage.includes("subscription") ||
      errorMessage.includes("monitor")
    ) {
      return "subscription_error";
    }
    if (errorMessage.includes("upload")) {
      return "upload_failed";
    }
    if (errorMessage.includes("duration") || errorMessage.includes("short")) {
      return "duration_too_short";
    }

    return "unknown";
  };

  const errorType = getErrorType();
  const errorConfig = ERROR_CONFIGS[errorType];

  const handleTryAgain = () => {
    router.replace({
      pathname: "/(auth)/record-voice",
      params: {
        mode: params.mode,
        type: params.type,
      },
    });
  };

  const handleGoHome = () => {
    router.dismissTo("/(auth)/(tabs)/home");
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal="$5"
    >
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.iconContainer}
        >
          <YStack
            width={100}
            height={100}
            borderRadius={50}
            backgroundColor="$card"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons
              name={errorConfig.icon}
              size={48}
              color={errorConfig.iconColor}
            />
          </YStack>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.textContainer}
        >
          <Text
            fontSize={24}
            fontWeight="700"
            color="$color"
            textAlign="center"
            marginTop="$6"
          >
            {t(`recordingError.${errorType}.title`)}
          </Text>

          <Text
            fontSize="$4"
            color="$gray11"
            textAlign="center"
            marginTop="$3"
            lineHeight={24}
          >
            {t(`recordingError.${errorType}.message`)}
          </Text>
        </Animated.View>
      </YStack>

      <Animated.View
        entering={FadeInDown.duration(400).delay(400)}
        style={styles.buttonContainer}
      >
        <YStack gap="$3" marginBottom="$4">
          <PrimaryButton onPress={handleTryAgain}>
            {t("recordingError.tryAgain")}
          </PrimaryButton>
          <SecondaryButton onPress={handleGoHome}>
            {t("recordingError.goHome")}
          </SecondaryButton>
        </YStack>
      </Animated.View>
    </YStack>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
  },
});
