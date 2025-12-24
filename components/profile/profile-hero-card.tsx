import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { Text, XStack, YStack } from "tamagui";

interface ProfileHeroCardProps {
  isAnonymous: boolean;
}

/**
 * Hero card component for guest users
 * Prompts users to create an account or login
 */
export function ProfileHeroCard({ isAnonymous }: ProfileHeroCardProps) {
  const { t } = useTranslation();

  if (!isAnonymous) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#2547f4", "#1e3ed4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, overflow: "hidden" }}
    >
      <YStack padding="$5" gap="$4">
        {/* Header row */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack gap="$1" flex={1} paddingRight="$4">
            <Text fontSize="$5" fontWeight="bold" color="white">
              {t("profile.guestUser")}
            </Text>
            <Text fontSize="$2" color="rgba(255,255,255,0.8)" lineHeight={18}>
              {t("profile.heroDescription")}
            </Text>
          </YStack>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$3">
          <Pressable
            onPress={() => router.push("/signup")}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: "white",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text fontSize="$3" fontWeight="bold" color="#2547f4">
              {t("profile.createFreeAccount")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => ({
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.4)",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text fontSize="$3" fontWeight="600" color="white">
              {t("profile.logIn")}
            </Text>
          </Pressable>
        </XStack>
      </YStack>
    </LinearGradient>
  );
}
