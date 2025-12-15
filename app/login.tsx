import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Keyboard,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import {
  PrimaryButton,
  TextInput,
  ThemedScreenContainer,
} from "@/components/ui";

/**
 * Sign in with Apple button following Apple Human Interface Guidelines
 * - Black background with white text (light mode)
 * - Apple logo on the left
 * - "Continue with Apple" text
 * https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
 */
function AppleSignInButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <XStack
        backgroundColor="#000000"
        borderRadius={9999}
        height={56}
        paddingHorizontal={20}
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        <XStack position="absolute" left={24}>
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        </XStack>
        <Text
          color="#FFFFFF"
          fontSize={16}
          fontWeight="600"
          letterSpacing={0.3}
        >
          {t("login.continueWithApple")}
        </Text>
      </XStack>
    </Pressable>
  );
}

/**
 * Sign in with Google button following Google Branding Guidelines
 * - White/light gray background
 * - Google "G" logo on the left
 * - "Continue with Google" text
 * - Neutral gray text color
 * https://developers.google.com/identity/branding-guidelines
 */
function GoogleSignInButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <XStack
        backgroundColor="$buttonBackground"
        borderRadius={9999}
        height={56}
        paddingHorizontal={20}
        alignItems="center"
        justifyContent="center"
        position="relative"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack position="absolute" left={24}>
          <FontAwesome name="google" size={18} color="#4285F4" />
        </XStack>
        <Text color="$color" fontSize={16} fontWeight="600" letterSpacing={0.3}>
          {t("login.continueWithGoogle")}
        </Text>
      </XStack>
    </Pressable>
  );
}

/**
 * Divider component with "or" text
 */
function OrDivider() {
  const { t } = useTranslation();

  return (
    <XStack
      width="100%"
      alignItems="center"
      justifyContent="center"
      paddingVertical={8}
    >
      <YStack flex={1} height={1} backgroundColor="$borderColor" />
      <Text
        paddingHorizontal={12}
        fontSize={14}
        color="$gray11"
        fontWeight="500"
      >
        {t("login.or")}
      </Text>
      <YStack flex={1} height={1} backgroundColor="$borderColor" />
    </XStack>
  );
}

/**
 * Login Screen Component
 * Provides authentication options: Apple Sign In, Google Sign In, and Magic Link email
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");

  const handleAppleSignIn = () => {
    // TODO: Implement Apple Sign In using expo-apple-authentication
    console.log("Apple Sign In pressed");
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign In using expo-auth-session
    console.log("Google Sign In pressed");
  };

  const handleEmailContinue = () => {
    if (!email.trim()) return;
    // TODO: Implement magic link email authentication
    console.log("Continue with email:", email);
  };

  const handleTermsPress = () => {
    // TODO: Navigate to Terms of Service
    console.log("Terms pressed");
  };

  const handlePrivacyPress = () => {
    // TODO: Navigate to Privacy Policy
    console.log("Privacy pressed");
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ThemedScreenContainer scrollable>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="flex-start"
          paddingTop={Platform.OS === "ios" ? insets.top + 56 : insets.top + 8}
          paddingBottom="$4"
          width="100%"
          maxWidth={448}
          alignSelf="center"
        >
          {/* Header Section */}
          <YStack alignItems="center" marginTop="$2" marginBottom={40}>
            <Text
              fontSize={32}
              fontWeight="700"
              textAlign="center"
              color="$color"
              paddingBottom={12}
              letterSpacing={-0.5}
            >
              {t("login.title")}
            </Text>
            <Text
              fontSize={16}
              textAlign="center"
              color="$gray11"
              lineHeight={24}
              maxWidth={320}
            >
              {t("login.subtitle")}
            </Text>
          </YStack>

          {/* Auth Buttons Section */}
          <YStack width="100%" gap={16} marginBottom={24}>
            {/* Apple Sign In - Only show on iOS or if user might use Apple ID */}
            {Platform.OS === "ios" ? (
              <AppleSignInButton onPress={handleAppleSignIn} />
            ) : null}

            {/* Google Sign In */}
            <GoogleSignInButton onPress={handleGoogleSignIn} />

            {/* Apple Sign In for Android/Web users who have Apple ID */}
            {Platform.OS !== "ios" ? (
              <AppleSignInButton onPress={handleAppleSignIn} />
            ) : null}

            {/* Divider */}
            <OrDivider />

            {/* Email Magic Link Section */}
            <YStack gap={12} width="100%">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t("login.emailPlaceholder")}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />

              <PrimaryButton onPress={handleEmailContinue}>
                <Text
                  color="white"
                  fontSize={16}
                  fontWeight="700"
                  letterSpacing={0.3}
                >
                  {t("login.continueWithEmail")}
                </Text>
              </PrimaryButton>

              <Text
                textAlign="center"
                fontSize={12}
                color="$gray11"
                marginTop={4}
              >
                {t("login.magicLinkHint")}
              </Text>
            </YStack>
          </YStack>

          {/* Spacer to push footer to bottom */}
          <YStack flex={1} />

          {/* Footer - Terms and Privacy */}
          <YStack paddingBottom={8} marginTop="auto">
            <Text
              textAlign="center"
              fontSize={11}
              color="$gray11"
              lineHeight={16}
            >
              {t("login.termsPrefix")}{" "}
              <Text
                fontSize={11}
                color="$gray11"
                textDecorationLine="underline"
                onPress={handleTermsPress}
              >
                {t("login.termsOfService")}
              </Text>{" "}
              {t("login.termsAnd")}{" "}
              <Text
                fontSize={11}
                color="$gray11"
                textDecorationLine="underline"
                onPress={handlePrivacyPress}
              >
                {t("login.privacyPolicy")}
              </Text>
              .
            </Text>
          </YStack>
        </YStack>
      </TouchableWithoutFeedback>
    </ThemedScreenContainer>
  );
}
