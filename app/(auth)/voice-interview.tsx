import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, useColorScheme } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { InterviewTimer, SecondaryButton, Tag } from "@/components/ui";
import { VoiceOrb } from "@/components/voice-orb";
import { getDefaultScreenOptions } from "@/constants/navigation";

/**
 * Mock interview questions
 */
const MOCK_QUESTIONS = [
  "Tell me about yourself and your background in this field.",
  "What are your greatest strengths and how do they apply to this role?",
  "Tell me about a time you had to manage a conflict within your team.",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "Where do you see yourself in five years?",
  "Why are you interested in this position and our company?",
];

/**
 * Voice Interview Practice Screen
 * Mock interview session with 6 questions and voice orb visualization
 */
export default function VoiceInterviewScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const defaultScreenOptions = getDefaultScreenOptions(colorScheme);

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(true);
  const [mockAudioLevel, setMockAudioLevel] = useState(0.5);

  // Mock audio level fluctuation for visual effect
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(() => {
      // Random fluctuation between 0.3 and 0.9
      setMockAudioLevel(0.3 + Math.random() * 0.6);
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  // Calculate progress
  const totalQuestions = MOCK_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];

  // Voice orb animation values based on mock audio level
  const amplitude = 0.3 + mockAudioLevel * 0.4;
  const speed = 0.5 + mockAudioLevel * 0.5;
  const scale = 1 + mockAudioLevel * 0.15;
  const glowOpacity = 0.6 + mockAudioLevel * 0.4;

  /**
   * Calculate adaptive font size based on question length
   * Shorter questions: larger text (up to 32px)
   * Longer questions: smaller text (down to 20px)
   */
  const getAdaptiveFontSize = () => {
    const questionLength = currentQuestion.length;
    if (questionLength < 80) return 28;
    if (questionLength < 100) return 24;
    return 20;
  };

  const adaptiveFontSize = getAdaptiveFontSize();
  const adaptiveLineHeight = adaptiveFontSize * 1.3;

  /**
   * Handle skip to next question
   */
  const handleSkip = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsListening(true);
    } else {
      // Last question - complete interview
      handleComplete();
    }
  };

  /**
   * Handle end interview with confirmation
   */
  const handleEnd = () => {
    // In a real implementation, show a confirmation dialog
    router.back();
  };

  /**
   * Handle interview completion
   */
  const handleComplete = () => {
    // Navigate to home after completing all questions
    router.replace("/(auth)/(tabs)/home");
  };

  /**
   * Handle close button
   */
  const handleClose = () => {
    router.back();
  };

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
    [defaultScreenOptions.headerTintColor, colorScheme]
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
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </XStack>

        {/* Progress Bar */}
        <YStack
          height={6}
          width="100%"
          backgroundColor="$sliderTrackBackground"
          borderRadius={9999}
          overflow="hidden"
        >
          <YStack
            height="100%"
            width={`${progress}%`}
            backgroundColor="$primary6"
          />
        </YStack>
      </YStack>

      {/* Main Content */}
      <YStack flex={1} paddingHorizontal="$6">
        {/* Question Text */}
        <Animated.View
          key={currentQuestionIndex}
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
            {currentQuestion}
          </Text>
        </Animated.View>

        {/* Voice Orb Container */}
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          marginVertical="$8"
        >
          {/* Voice Orb */}
          <VoiceOrb
            isRecording={isListening}
            glowOpacity={glowOpacity}
            scale={scale}
            amplitude={amplitude}
            speed={speed}
            onPress={() => setIsListening(!isListening)}
          />
        </YStack>

        {/* Bottom Actions */}
        <YStack gap="$8" alignItems="center">
          {/* Status Indicator */}
          <YStack gap="$2" alignItems="center">
            <Tag
              variant={isListening ? "error" : "primary"}
              size="lg"
              label={isListening ? "Listening" : "Paused"}
              icon={
                <Ionicons
                  name={isListening ? "mic" : "mic-off"}
                  size={20}
                  color={isListening ? "#f43f5e" : "#2547f4"}
                />
              }
            />

            <Text fontSize="$1" color="$gray10">
              Speak clearly, the AI is analyzing your tone.
            </Text>
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$4" width="100%">
            <YStack flex={1}>
              <SecondaryButton onPress={handleSkip}>
                {currentQuestionIndex < totalQuestions - 1 ? "Skip" : "Finish"}
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
