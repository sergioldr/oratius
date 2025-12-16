import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet } from "react-native";
import { Text, XStack } from "tamagui";

import { useColorScheme } from "@/hooks/use-color-scheme";

interface AppleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Native Apple Sign In Button
 * Uses the official Apple Authentication Button component from expo-apple-authentication
 * This ensures 100% compliance with Apple Human Interface Guidelines
 * Adapts to system theme: WHITE style in dark mode, BLACK style in light mode
 *
 * https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
 */
function NativeAppleSignInButton({ onPress }: AppleSignInButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Check if Apple Sign In is available on this device
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  if (!isAvailable) {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        colorScheme === "dark"
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={9999}
      style={styles.button}
      onPress={onPress}
    />
  );
}

/**
 * Fallback Apple Sign In button for platforms where native button is not available
 * (e.g., Android, Web) - still follows Apple guidelines for custom buttons
 * Adapts to system theme: white button in dark mode, black button in light mode
 */
function CustomAppleSignInButton({
  onPress,
  disabled,
}: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Apple branding: invert colors based on theme for better contrast
  const backgroundColor = isDark ? "#FFFFFF" : "#000000";
  const textColor = isDark ? "#000000" : "#FFFFFF";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed || disabled ? 0.7 : 1,
      })}
    >
      <XStack
        backgroundColor={backgroundColor}
        borderRadius={9999}
        height={56}
        paddingHorizontal={16}
        alignItems="center"
        justifyContent="center"
        gap={8}
      >
        {/* Apple Logo using Ionicons */}
        <Ionicons name="logo-apple" size={22} color={textColor} />
        <Text color={textColor} fontSize={16} fontWeight="600">
          {t("login.continueWithApple")}
        </Text>
      </XStack>
    </Pressable>
  );
}

/**
 * Apple Sign In Button
 * Renders native button on iOS, custom fallback on other platforms
 */
export function AppleSignInButton({
  onPress,
  disabled,
}: AppleSignInButtonProps) {
  if (Platform.OS === "ios") {
    return <NativeAppleSignInButton onPress={onPress} disabled={disabled} />;
  }

  return <CustomAppleSignInButton onPress={onPress} disabled={disabled} />;
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
  },
});
