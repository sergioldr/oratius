import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text, XStack } from "tamagui";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Conditionally import GoogleSigninButton only when native module is available
// This prevents crashes in Expo Go where the native module doesn't exist
let NativeGoogleSigninButton:
  | typeof import("@react-native-google-signin/google-signin").GoogleSigninButton
  | null = null;
let isGoogleSignInNativeAvailable = false;

try {
  // Try to require the module - this will throw if native module isn't available
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleSignIn = require("@react-native-google-signin/google-signin");
  NativeGoogleSigninButton = googleSignIn.GoogleSigninButton;
  isGoogleSignInNativeAvailable = true;
} catch {
  // Native module not available (Expo Go), will use custom button fallback
  isGoogleSignInNativeAvailable = false;
}

interface GoogleSignInButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

/**
 * Google "G" Logo SVG Component
 * Official multi-color Google logo following branding guidelines
 */
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/**
 * Custom Google Sign In button for Expo Go fallback
 * Follows Google Branding Guidelines:
 * - Light theme: White background (#FFFFFF), dark text (#1F1F1F)
 * - Dark theme: Dark background (#131314), light text (#E3E3E3)
 * - Official Google "G" logo (multi-color)
 *
 * https://developers.google.com/identity/branding-guidelines
 */
function CustomGoogleSignInButton({
  onPress,
  disabled,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Google branding colors
  const backgroundColor = isDark ? "#131314" : "#FFFFFF";
  const textColor = isDark ? "#E3E3E3" : "#1F1F1F";
  const borderColor = isDark ? "#8E918F" : "#DADCE0";

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
        borderWidth={1}
        borderColor={borderColor}
        gap={12}
      >
        <GoogleLogo size={20} />
        <Text color={textColor} fontSize={15} fontWeight="500">
          {t("login.continueWithGoogle")}
        </Text>
      </XStack>
    </Pressable>
  );
}

/**
 * Google Sign In Button
 * Renders native button when available (development builds), custom fallback in Expo Go
 */
export function GoogleSignInButton({
  onPress,
  disabled,
}: GoogleSignInButtonProps) {
  const colorScheme = useColorScheme();

  if (isGoogleSignInNativeAvailable && NativeGoogleSigninButton) {
    return (
      <NativeGoogleSigninButton
        size={NativeGoogleSigninButton.Size.Wide}
        color={
          colorScheme === "dark"
            ? NativeGoogleSigninButton.Color.Light
            : NativeGoogleSigninButton.Color.Dark
        }
        onPress={onPress}
        disabled={disabled}
        style={styles.button}
      />
    );
  }

  return <CustomGoogleSignInButton onPress={onPress} disabled={disabled} />;
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
  },
});
