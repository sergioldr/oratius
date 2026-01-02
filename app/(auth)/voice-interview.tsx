import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  useColorScheme,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { InterviewTimer, SecondaryButton, Tag } from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";
import { getDefaultScreenOptions } from "@/constants/navigation";
import { useAudioStream } from "@/hooks/use-audio-stream";
import { useWebSocketInterview } from "@/hooks/use-websocket-interview";
import { logger } from "@/lib/logger";
import {
  useInterviewAgentStatus,
  useInterviewConnection,
  useInterviewConversation,
  useInterviewStore,
  type AgentStatus,
} from "@/store/interview-store";
import { useProfileStore } from "@/store/profile-store";

/**
 * Status messages for different connection states
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
 * Get status indicator config based on agent status
 */
function getStatusIndicator(
  agentStatus: AgentStatus,
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
 * Voice Interview Practice Screen
 * Real-time AI interview session with WebSocket voice connection
 */
export default function VoiceInterviewScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const defaultScreenOptions = getDefaultScreenOptions(colorScheme);
  const params = useLocalSearchParams<{
    candidate_name?: string;
    job_role?: string;
    sector?: string;
    seniority?: string;
    language?: string;
  }>();

  // Profile store state
  const { profile } = useProfileStore();

  // Interview store state
  const { connectionStatus, lastError } = useInterviewConnection();
  const { currentQuestion, questionCount } = useInterviewConversation();
  const { agentStatus, audioLevel: storeAudioLevel } =
    useInterviewAgentStatus();
  const { incrementElapsedSeconds, reset: resetStore } = useInterviewStore();

  // Local state
  const [isInitialized, setIsInitialized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio streaming hook
  const {
    status: audioStatus,
    startStreaming,
    stopStreaming,
    audioLevel: streamAudioLevel,
    playAudio,
  } = useAudioStream({
    onAudioLevel: (level) => {
      useInterviewStore.getState().setAudioLevel(level);
    },
  });

  // WebSocket interview hook
  const { startInterview, endInterview, disconnect, sendAudioChunk, isReady } =
    useWebSocketInterview({
      onReady: useCallback(async () => {
        logger.info(
          "VoiceInterview",
          "WebSocket ready - starting audio stream"
        );
        await startStreaming();
        logger.debug("VoiceInterview", "Audio stream started");
      }, [startStreaming]),
      onAudioData: useCallback(
        (data: ArrayBuffer) => {
          logger.debug("VoiceInterview", "Playing received audio", {
            sizeBytes: data.byteLength,
            sizeKB: (data.byteLength / 1024).toFixed(2),
          });
          playAudio(data);
        },
        [playAudio]
      ),
      onInterviewEnd: useCallback(() => {
        logger.info("VoiceInterview", "Interview ended - navigating to home");
        stopStreaming();
        router.replace("/(auth)/(tabs)/home");
      }, [stopStreaming]),
    });

  // Derive audio level from stream or store
  const audioLevel =
    audioStatus === "streaming" ? streamAudioLevel : storeAudioLevel;

  /**
   * Handle connection errors - disconnect and navigate home
   */
  useEffect(() => {
    if (connectionStatus === "error") {
      logger.error("VoiceInterview", "Connection error - ending session", {
        error: lastError,
      });
      stopStreaming();
      disconnect();
      router.replace("/(auth)/(tabs)/home");
    }
  }, [connectionStatus, lastError, stopStreaming, disconnect]);

  // Voice orb animation values based on audio level and agent status
  const orbValues = useMemo(() => {
    const level = agentStatus === "speaking" ? 0.6 : audioLevel;
    return {
      amplitude: 0.3 + level * 0.4,
      speed: 0.5 + level * 0.5,
      scale: 1 + level * 0.15,
      glowOpacity: 0.6 + level * 0.4,
    };
  }, [audioLevel, agentStatus]);

  // Display question (from WebSocket or placeholder)
  const displayQuestion =
    currentQuestion ?? "Preparing your interview question...";

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
   * Initialize interview session on mount
   */
  useEffect(() => {
    const initializeInterview = async () => {
      if (isInitialized) return;

      logger.info("VoiceInterview", "Initializing interview session");
      logger.debug("VoiceInterview", "URL params", { params });
      logger.debug("VoiceInterview", "Profile data", {
        name: profile.name,
        role: profile.jobRole,
        industry: profile.industry,
        seniority: profile.seniority,
        language: profile.language,
      });

      setIsInitialized(true);

      // Map language locale to language name (e.g., "en-US" -> "English")
      const languageMap: Record<string, string> = {
        "en-US": "English",
        "es-ES": "Spanish",
        // Add more mappings as needed
      };

      const interviewParams = {
        candidate_name: params.candidate_name ?? (profile.name || "Candidate"),
        job_role: params.job_role ?? (profile.jobRole || "Professional"),
        sector: params.sector ?? (profile.industry || "Technology"),
        seniority: params.seniority ?? (profile.seniority || "Mid-Level"),
        language: params.language ?? languageMap[profile.language] ?? "English",
      };

      logger.info(
        "VoiceInterview",
        "Starting interview with params",
        interviewParams
      );
      const success = await startInterview(interviewParams);

      if (!success) {
        logger.error("VoiceInterview", "Failed to start interview session");
        Alert.alert(
          "Connection Error",
          "Failed to start the interview session. Please try again.",
          [
            {
              text: "Go Back",
              onPress: () => {
                logger.info(
                  "VoiceInterview",
                  "User cancelled after connection error"
                );
                router.back();
              },
            },
          ]
        );
      } else {
        logger.info("VoiceInterview", "Interview session started successfully");
      }
    };

    initializeInterview();
  }, [isInitialized, params, profile, startInterview]);

  /**
   * Start elapsed time timer when ready
   */
  useEffect(() => {
    if (isReady && !timerRef.current) {
      logger.info("VoiceInterview", "Starting interview timer");
      timerRef.current = setInterval(() => {
        incrementElapsedSeconds();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        logger.debug("VoiceInterview", "Stopping interview timer");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isReady, incrementElapsedSeconds]);

  /**
   * Send audio chunks to WebSocket when streaming
   */
  useEffect(() => {
    // Audio chunks are sent via the onAudioChunk callback in useAudioStream
    // which is connected to sendAudioChunk via the WebSocket hook
  }, [sendAudioChunk]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      logger.info("VoiceInterview", "Component unmounting - cleaning up");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      resetStore();
    };
  }, [resetStore]);

  /**
   * Handle end interview with confirmation
   */
  const handleEnd = useCallback(() => {
    logger.info("VoiceInterview", "User requested to end interview");
    Alert.alert(
      "End Interview",
      "Are you sure you want to end this interview session?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () =>
            logger.debug("VoiceInterview", "User cancelled end interview"),
        },
        {
          text: "End",
          style: "destructive",
          onPress: async () => {
            logger.info("VoiceInterview", "User confirmed end interview");
            await stopStreaming();
            logger.debug("VoiceInterview", "Audio streaming stopped");
            await endInterview();
            logger.info("VoiceInterview", "Interview ended");
          },
        },
      ]
    );
  }, [stopStreaming, endInterview]);

  /**
   * Handle close button (same as end)
   */
  const handleClose = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  /**
   * Toggle audio streaming (pause/resume)
   */
  const handleToggleStreaming = useCallback(async () => {
    logger.info("VoiceInterview", "User toggled audio streaming", {
      currentStatus: audioStatus,
    });

    if (audioStatus === "streaming") {
      logger.debug("VoiceInterview", "Stopping audio stream");
      await stopStreaming();
      logger.info("VoiceInterview", "Audio stream paused");
    } else if (audioStatus === "idle" || audioStatus === "paused") {
      logger.debug("VoiceInterview", "Starting audio stream");
      await startStreaming();
      logger.info("VoiceInterview", "Audio stream resumed");
    }
  }, [audioStatus, startStreaming, stopStreaming]);

  // Status indicator configuration
  const statusIndicator = getStatusIndicator(
    agentStatus,
    audioStatus === "streaming"
  );

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

  // Loading state while connecting
  const isLoading =
    connectionStatus === "disconnected" ||
    connectionStatus === "connecting" ||
    connectionStatus === "connected";

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
        {/* Question Text or Loading State */}
        <Animated.View
          key={currentQuestion ?? "loading"}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(200)}
        >
          {isLoading ? (
            <YStack alignItems="center" marginTop="$6" gap="$4">
              <ActivityIndicator size="large" color="#2547f4" />
              <Text
                fontSize={20}
                fontWeight="500"
                textAlign="center"
                color="$gray11"
              >
                {STATUS_MESSAGES[connectionStatus]}
              </Text>
              {lastError && (
                <Text fontSize={14} textAlign="center" color="$red10">
                  {lastError}
                </Text>
              )}
            </YStack>
          ) : (
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
          )}
        </Animated.View>

        {/* Voice Orb Container */}
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          marginVertical="$8"
        >
          <VoiceOrb
            isRecording={isReady && audioStatus === "streaming"}
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
                {audioStatus === "streaming" ? "Pause" : "Resume"}
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
