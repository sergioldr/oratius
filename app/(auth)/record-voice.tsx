import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { VoiceOrb } from "@/components/voice-orb";

type RecordingPhase = "countdown" | "recording" | "stopped";

const MAX_RECORDING_TIME_SECONDS = 10 * 60; // 10 minutes in seconds

export default function RecordVoiceScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode: string; type: string }>();

  const [phase, setPhase] = useState<RecordingPhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [remainingTime, setRemainingTime] = useState(
    MAX_RECORDING_TIME_SECONDS
  );

  // Use the new expo-audio recorder hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values for the orb
  const glowOpacity = useSharedValue(0.3);
  const orbScale = useSharedValue(1);

  // Countdown animation scale
  const countdownScale = useSharedValue(1);

  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setPhase("recording");

      // Start the recording animations
      glowOpacity.value = withRepeat(
        withTiming(0.8, { duration: 1000 }),
        -1,
        true
      );
      orbScale.value = withRepeat(withSpring(1.05, { damping: 10 }), -1, true);

      // Start the countdown timer
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            // Timer ran out - stop recording
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            audioRecorder.stop().catch(console.error);
            router.back();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert(
        t("recordVoice.error.title"),
        t("recordVoice.error.startFailed")
      );
      router.back();
    }
  }, [t, glowOpacity, orbScale, audioRecorder]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = audioRecorder.uri;
      console.log("Recording saved at:", uri);

      // Reset animations
      glowOpacity.value = withTiming(0.3, { duration: 300 });
      orbScale.value = withTiming(1, { duration: 300 });

      setPhase("stopped");

      // TODO: Navigate to feedback/analysis screen with the recording URI
      // For now, go back to home
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }, [glowOpacity, orbScale, audioRecorder]);

  // Handle countdown
  useEffect(() => {
    if (phase === "countdown") {
      // Animate countdown number
      countdownScale.value = withSpring(1.2, { damping: 8 });
      setTimeout(() => {
        countdownScale.value = withSpring(1, { damping: 8 });
      }, 300);

      countdownRef.current = setTimeout(() => {
        if (countdown > 1) {
          setCountdown(countdown - 1);
        } else {
          startRecording();
        }
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [phase, countdown, startRecording, countdownScale]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(console.error);
      }
    };
  }, [audioRecorder]);

  // Handle orb press (stop recording)
  const handleOrbPress = () => {
    if (phase === "recording") {
      stopRecording();
    }
  };

  // Handle back/cancel
  const handleCancel = async () => {
    if (phase === "countdown") {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
      router.back();
    } else if (phase === "recording") {
      await stopRecording();
    }
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
    >
      {/* Header with cancel button */}
      <YStack paddingHorizontal="$5" paddingVertical="$4">
        <TouchableOpacity onPress={handleCancel}>
          <Text fontSize="$4" color="$gray11" fontWeight="600">
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
      </YStack>

      {/* Main content */}
      <YStack flex={1} alignItems="center" justifyContent="center">
        {phase === "countdown" ? (
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
              glowOpacity={glowOpacity.value}
              scale={orbScale.value}
              amplitude={0.6}
              speed={1.5}
              orbColor={[1.0, 0.25, 0.37]} // Reddish color while recording
              onPress={handleOrbPress}
            />

            {/* Instructions */}
            <YStack alignItems="center" marginTop="$8">
              <Text fontSize="$5" fontWeight="600" color="$color">
                {t("recordVoice.recording")}
              </Text>
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
