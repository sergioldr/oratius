import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, useColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { VoiceOrb } from "@/components/voice-orb";
import { getDefaultScreenOptions } from "@/constants/navigation";
import { useAuth } from "@/context/auth-context";
import { useAudioLevel } from "@/hooks/use-audio-level";
import { useCountdown } from "@/hooks/use-countdown";
import { useRecording } from "@/hooks/use-recording";
import {
  deleteLocalFile,
  useRecordingUpload,
} from "@/hooks/use-recording-upload";

const MIN_RECORDING_TIME_SECONDS = 20;

export default function RecordVoiceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode: string; type: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const defaultScreenOptions = getDefaultScreenOptions(colorScheme);

  // Recording hook
  const {
    audioRecorder,
    phase,
    setPhase,
    remainingTime,
    startRecording,
    stopRecording,
    formatTime,
  } = useRecording({
    onTimeExpired: () => router.back(),
    onError: () => {
      Alert.alert(
        t("recordVoice.error.title"),
        t("recordVoice.error.startFailed")
      );
      router.back();
    },
  });

  // Upload hook
  const { uploadRecording } = useRecordingUpload();

  // Audio level hook for visual feedback
  const { animationValues } = useAudioLevel(
    audioRecorder,
    phase === "recording"
  );
  const { amplitude, speed, scale, glowOpacity } = animationValues;

  // Handle recording complete
  const handleRecordingComplete = useCallback(async () => {
    const { uri, duration } = await stopRecording();

    // Check minimum duration requirement
    if (duration < MIN_RECORDING_TIME_SECONDS) {
      // Clean up local file - recording doesn't meet requirements
      if (uri) {
        deleteLocalFile(uri);
      }
      router.push({
        pathname: "/(auth)/recording-error",
        params: {
          errorType: "duration_too_short",
          mode: params.mode,
          type: params.type,
        },
      });
      return;
    }

    setPhase("uploading");

    if (uri && user?.id) {
      // Note: uploadRecording handles cleanup for both success and failure
      const result = await uploadRecording(uri, user.id);

      if (result.success && result.recordingId) {
        router.replace({
          pathname: "/(auth)/processing-recording",
          params: {
            recordingId: result.recordingId,
            mode: params.mode,
            type: params.type,
          },
        });
      } else {
        router.push({
          pathname: "/(auth)/recording-error",
          params: {
            errorType: "upload_failed",
            mode: params.mode,
            type: params.type,
          },
        });
      }
    } else {
      // Handle missing user ID - clean up local file
      if (uri) {
        deleteLocalFile(uri);
      }
      router.push({
        pathname: "/(auth)/recording-error",
        params: {
          errorType: "unknown",
          mode: params.mode,
          type: params.type,
        },
      });
    }
  }, [
    stopRecording,
    setPhase,
    params.mode,
    params.type,
    user?.id,
    uploadRecording,
  ]);

  // Countdown hook
  const {
    countdown,
    isActive: isCountdownActive,
    animatedStyle: countdownAnimatedStyle,
    startCountdown,
    cancelCountdown,
  } = useCountdown({
    initialCount: 3,
    onComplete: startRecording,
  });

  // Start countdown on mount
  useEffect(() => {
    setPhase("countdown");
    startCountdown();
  }, [setPhase, startCountdown]);

  // Handle orb press (stop recording)
  const handleOrbPress = useCallback(() => {
    if (phase === "recording") {
      handleRecordingComplete();
    }
  }, [phase, handleRecordingComplete]);

  // Handle back/cancel
  const handleCancel = useCallback(async () => {
    if (isCountdownActive) {
      cancelCountdown();
    }
    // Stop recording if active and clean up the file before navigating
    if (phase === "recording") {
      try {
        const { uri } = await stopRecording();
        // Clean up local file since user is canceling
        if (uri) {
          deleteLocalFile(uri);
        }
      } catch {
        // Ignore errors - we're canceling anyway
      }
    }
    router.dismissTo("/(auth)/home");
  }, [isCountdownActive, cancelCountdown, phase, stopRecording]);

  // Memoize screen options to prevent infinite re-render loop
  const screenOptions = useMemo(
    () => ({
      headerTitle:
        phase === "countdown"
          ? t("recordVoice.getReady")
          : phase === "recording"
          ? t("recordVoice.recording")
          : phase === "uploading"
          ? t("recordVoice.uploading")
          : "",
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={10}>
          <Ionicons
            name="chevron-back"
            size={32}
            color={defaultScreenOptions.headerTintColor}
            style={{ opacity: 0.8 }}
          />
        </Pressable>
      ),
    }),
    [phase, t, defaultScreenOptions.headerTintColor, handleCancel]
  );

  const isCountdownPhase = phase === "countdown" && isCountdownActive;

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      paddingBottom={insets.bottom}
    >
      <Stack.Screen options={screenOptions} />

      {/* Main content */}
      <YStack flex={1} alignItems="center" justifyContent="center">
        {isCountdownPhase ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={styles.countdownContainer}
          >
            <Animated.View style={countdownAnimatedStyle}>
              <Text
                fontSize={120}
                fontWeight="800"
                color="$color"
                style={styles.countdownText}
              >
                {countdown}
              </Text>
            </Animated.View>
            <Text fontSize="$5" color="$gray11" marginTop="$4">
              {t("recordVoice.getReady")}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={styles.recordingContainer}
          >
            {/* Timer */}
            <YStack alignItems="center" marginBottom="$8">
              <Text
                fontSize={48}
                fontWeight="700"
                color={remainingTime <= 60 ? "$red10" : "$color"}
                fontFamily="$mono"
              >
                {formatTime(remainingTime)}
              </Text>
              <Text fontSize="$3" color="$gray11" marginTop="$2">
                {t("recordVoice.timeRemaining")}
              </Text>
            </YStack>

            {/* Voice Orb */}
            <VoiceOrb
              isRecording={phase === "recording"}
              glowOpacity={glowOpacity}
              scale={scale}
              amplitude={amplitude}
              speed={speed}
              onPress={handleOrbPress}
            />

            {/* Instructions */}
            <YStack alignItems="center" marginTop="$8">
              <Text
                fontSize="$3"
                color="$gray11"
                marginTop="$2"
                textAlign="center"
              >
                {t("recordVoice.tapToStop")}
              </Text>
            </YStack>
          </Animated.View>
        )}
      </YStack>

      {/* Mode indicator at bottom */}
      <YStack alignItems="center" paddingBottom="$6" paddingHorizontal="$5">
        <Text
          fontSize="$2"
          color="$gray10"
          textTransform="uppercase"
          letterSpacing={1}
        >
          {params.mode === "pitch"
            ? t("home.mode.pitch")
            : t("home.mode.interview")}{" "}
          • {params.type}
        </Text>
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  countdownContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    textAlign: "center",
  },
  recordingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
