import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { AppleSignInButton, GoogleSignInButton } from "@/components/auth";
import {
  PrimaryButton,
  TextInput,
  ThemedScreenContainer,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";

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
 * Signup Screen Component (Modal)
 * Prompts users to save their progress by creating an account.
 * Used from the profile screen for guest users.
 *
 * Uses Supabase Auth with:
 * - Native Apple Sign In (expo-apple-authentication)
 * - Native Google Sign In (@react-native-google-signin/google-signin)
 * - Magic Link email authentication
 */
export default function SignupScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    signInWithApple,
    signInWithGoogle,
    signInWithMagicLink,
    session,
    isAnonymous,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect only if user has a real (non-anonymous) account
  // Anonymous users should stay to upgrade their session
  useEffect(() => {
    if (session && !isAnonymous) {
      router.back();
    }
  }, [session, isAnonymous]);

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithApple();
    } catch (error) {
      console.error("Apple Sign-In failed:", error);
      Alert.alert(t("login.error"), t("login.appleSignInError"), [
        { text: t("common.ok") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      Alert.alert(t("login.error"), t("login.googleSignInError"), [
        { text: t("common.ok") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert(t("login.error"), t("login.invalidEmail"), [
        { text: t("common.ok") },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      await signInWithMagicLink(trimmedEmail);
      setMagicLinkSent(true);
      Alert.alert(t("login.magicLinkSentTitle"), t("login.magicLinkSentBody"), [
        { text: t("common.ok") },
      ]);
    } catch (error) {
      console.error("Magic Link failed:", error);
      Alert.alert(t("login.error"), t("login.magicLinkError"), [
        { text: t("common.ok") },
      ]);
    } finally {
      setIsLoading(false);
    }
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
          paddingTop={Platform.OS === "ios" ? 24 : insets.top + 8}
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
              {t("signup.title")}
            </Text>
            <Text
              fontSize={16}
              textAlign="center"
              color="$gray11"
              lineHeight={24}
              maxWidth={320}
            >
              {t("signup.subtitle")}
            </Text>
          </YStack>

          {/* Auth Buttons Section */}
          <YStack width="100%" gap={16} marginBottom={24}>
            {/* Apple Sign In */}
            <AppleSignInButton
              onPress={handleAppleSignIn}
              disabled={isLoading}
            />

            {/* Google Sign In */}
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            />

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
                editable={!isLoading}
              />

              <PrimaryButton
                onPress={handleEmailContinue}
                disabled={isLoading || !email.trim()}
              >
                {magicLinkSent
                  ? t("login.resendMagicLink")
                  : t("login.continueWithEmail")}
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
