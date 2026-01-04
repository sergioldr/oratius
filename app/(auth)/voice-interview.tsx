import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Alert, Pressable, useColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { InterviewTimer, SecondaryButton, Tag } from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";
import { getDefaultScreenOptions } from "@/constants/navigation";

// Mock data
const MOCK_CONNECTION_STATUS = "ready";
const MOCK_AGENT_STATUS = "listening";
const MOCK_QUESTION_COUNT = 3;
const MOCK_CURRENT_QUESTION =
  "Tell me about a time when you had to overcome a significant challenge in your career.";
const MOCK_IS_STREAMING = false;
const MOCK_AUDIO_LEVEL = 0.3;

/**
 * Status messages for different connection states (mock)
 */
const STATUS_MESSAGES: Record<string, string> = {
  disconnected: "Connecting to interview...",
  connecting: "Establishing connection...",
  connected: "Initializing AI interviewer...",
  ready: "Speak clearly, the AI is analyzing your response.",
  error: "Connection error. Please try again.",
  reconnecting: "Reconnecting...",
};

/**
 * Get status indicator config based on agent status (mock)
 */
function getStatusIndicator(
  agentStatus: string,
  isStreaming: boolean
): {
  variant: "primary" | "error";
  label: string;
  icon: "volume-high" | "ellipsis-horizontal" | "mic" | "mic-off";
  color: string;
} {
  switch (agentStatus) {
    case "speaking":
      return {
        variant: "primary",
        label: "AI Speaking",
        icon: "volume-high",
        color: "#2547f4",
      };
    case "thinking":
      return {
        variant: "primary",
        label: "Processing...",
        icon: "ellipsis-horizontal",
        color: "#2547f4",
      };
    case "listening":
      return {
        variant: isStreaming ? "error" : "primary",
        label: isStreaming ? "Listening" : "Paused",
        icon: isStreaming ? "mic" : "mic-off",
        color: isStreaming ? "#f43f5e" : "#2547f4",
      };
    default:
      return {
        variant: "primary",
        label: "Ready",
        icon: "mic",
        color: "#2547f4",
      };
  }
}

/**
 * Voice Interview Practice Screen (UI Only - No Logic)
 * Mock implementation showing interview UI structure
 */
export default function VoiceInterviewScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const defaultScreenOptions = getDefaultScreenOptions(colorScheme);

  // Mock state values
  const connectionStatus = MOCK_CONNECTION_STATUS;
  const agentStatus = MOCK_AGENT_STATUS;
  const currentQuestion = MOCK_CURRENT_QUESTION;
  const questionCount = MOCK_QUESTION_COUNT;
  const audioLevel = MOCK_AUDIO_LEVEL;
  const isStreaming = MOCK_IS_STREAMING;
  const isReady = connectionStatus === "ready";
  const isLoading = false; // Mock loading state

  // Voice orb animation values based on mock audio level and agent status
  const orbValues = useMemo(() => {
    // Use audioLevel directly since agentStatus is 'listening' in mock
    const level = audioLevel;
    return {
      amplitude: 0.3 + level * 0.4,
      speed: 0.5 + level * 0.5,
      scale: 1 + level * 0.15,
      glowOpacity: 0.6 + level * 0.4,
    };
  }, [audioLevel]);

  // Display question
  const displayQuestion = currentQuestion;

  /**
   * Calculate adaptive font size based on question length
   */
  const adaptiveFontSize = useMemo(() => {
    const questionLength = displayQuestion.length;
    if (questionLength < 80) return 28;
    if (questionLength < 100) return 24;
    return 20;
  }, [displayQuestion]);

  const adaptiveLineHeight = adaptiveFontSize * 1.3;

  /**
   * Handle end interview with confirmation (mock)
   */
  const handleEnd = useCallback(() => {
    Alert.alert(
      "End Interview",
      "Are you sure you want to end this interview session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End",
          style: "destructive",
          onPress: () => {
            router.replace("/(auth)/(tabs)/home");
          },
        },
      ]
    );
  }, []);

  /**
   * Handle close button (same as end)
   */
  const handleClose = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  /**
   * Toggle audio streaming (mock - does nothing)
   */
  const handleToggleStreaming = useCallback(() => {
    Alert.alert("Mock Action", "Toggle streaming - Not implemented");
  }, []);

  // Status indicator configuration
  const statusIndicator = getStatusIndicator(agentStatus, isStreaming);

  // Screen options
  const screenOptions = useMemo(
    () => ({
      headerTitle: "Practice Session",
      headerTitleStyle: {
        color:
          colorScheme === "dark"
            ? "rgba(255, 255, 255, 0.8)"
            : "rgba(0, 0, 0, 0.8)",
      },
      headerLeft: () => (
        <Pressable onPress={handleClose} hitSlop={10}>
          <Ionicons
            name="close"
            size={28}
            color={defaultScreenOptions.headerTintColor}
            style={{ opacity: 0.8, paddingLeft: 4 }}
          />
        </Pressable>
      ),
      headerRight: () => <InterviewTimer />,
    }),
    [defaultScreenOptions.headerTintColor, colorScheme, handleClose]
  );

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundStrong"
      paddingBottom={insets.bottom}
      paddingTop={insets.top}
    >
      <Stack.Screen options={screenOptions} />

      {/* Progress Section */}
      <YStack gap="$2" paddingHorizontal="$6" paddingTop={80}>
        <XStack justifyContent="space-between" alignItems="flex-end">
          <Text
            fontSize="$1"
            fontWeight="600"
            letterSpacing={1.5}
            textTransform="uppercase"
            color="$gray10"
          >
            {questionCount > 0 ? `Question ${questionCount}` : "Starting..."}
          </Text>
        </XStack>

        {/* Progress Bar - shows connection status or question progress */}
        <YStack
          height={6}
          width="100%"
          backgroundColor="$sliderTrackBackground"
          borderRadius={9999}
          overflow="hidden"
        >
          <YStack
            height="100%"
            width={isReady ? "100%" : "30%"}
            backgroundColor={isReady ? "$primary6" : "$gray8"}
            opacity={isLoading ? 0.5 : 1}
          />
        </YStack>
      </YStack>

      {/* Main Content */}
      <YStack flex={1} paddingHorizontal="$6">
        {/* Question Text */}
        <Animated.View
          key={currentQuestion}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(200)}
        >
          <Text
            fontSize={adaptiveFontSize}
            fontWeight="700"
            lineHeight={adaptiveLineHeight}
            textAlign="center"
            color="$color"
            marginTop="$6"
          >
            {displayQuestion}
          </Text>
        </Animated.View>

        {/* Voice Orb Container */}
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          marginVertical="$8"
        >
          <VoiceOrb
            isRecording={isReady && isStreaming}
            glowOpacity={orbValues.glowOpacity}
            scale={orbValues.scale}
            amplitude={orbValues.amplitude}
            speed={orbValues.speed}
            onPress={isReady ? handleToggleStreaming : undefined}
          />
        </YStack>

        {/* Bottom Actions */}
        <YStack gap="$8" alignItems="center">
          {/* Status Indicator */}
          <YStack gap="$2" alignItems="center">
            <Tag
              variant={statusIndicator.variant}
              size="lg"
              label={statusIndicator.label}
              icon={
                <Ionicons
                  name={statusIndicator.icon}
                  size={20}
                  color={statusIndicator.color}
                />
              }
            />

            <Text fontSize="$1" color="$gray10">
              {STATUS_MESSAGES[connectionStatus] ?? STATUS_MESSAGES.ready}
            </Text>
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$4" width="100%">
            <YStack flex={1}>
              <SecondaryButton
                onPress={handleToggleStreaming}
                disabled={!isReady}
              >
                {isStreaming ? "Pause" : "Resume"}
              </SecondaryButton>
            </YStack>

            <YStack flex={1}>
              <SecondaryButton textColor="$red11" onPress={handleEnd}>
                End
              </SecondaryButton>
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
