import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Pressable, Switch } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";

import { Card } from "@/components/ui";

interface SettingsSectionProps {
  notificationsEnabled: boolean;
  audioPermissionGranted: boolean;
  onNotificationsToggle: (value: boolean) => void;
  onAudioPermissionToggle: (value: boolean) => void;
}

/**
 * Settings section with toggles for notifications and audio permissions
 */
export function SettingsSection({
  notificationsEnabled,
  audioPermissionGranted,
  onNotificationsToggle,
  onAudioPermissionToggle,
}: SettingsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleAudioToggle = async (value: boolean) => {
    if (value) {
      await onAudioPermissionToggle(value);
    } else {
      // Open settings to disable permission
      Alert.alert(
        t("profile.settings.audioPermissions"),
        "To disable microphone access, please go to your device settings.",
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("recordVoice.permission.openSettings"),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    }
  };

  return (
    <YStack gap="$3">
      <Text fontSize="$4" fontWeight="bold" color="$color">
        {t("profile.settings.title")}
      </Text>

      <Card variant="elevated" padding="$0" overflow="hidden">
        {/* Notifications Toggle */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$3.5"
          borderBottomWidth={1}
          borderBottomColor="$cardBorder"
        >
          <XStack alignItems="center" gap="$3">
            <YStack
              padding="$1.5"
              borderRadius={6}
              backgroundColor="rgba(239, 68, 68, 0.1)"
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#ef4444"
              />
            </YStack>
            <Text fontSize="$2" fontWeight="500" color="$color">
              {t("profile.settings.notifications")}
            </Text>
          </XStack>
          <Switch
            value={notificationsEnabled}
            onValueChange={onNotificationsToggle}
          />
        </XStack>

        {/* Audio Permissions */}
        <XStack
          alignItems="center"
          justifyContent="space-between"
          padding="$3.5"
          borderBottomWidth={1}
          borderBottomColor="$cardBorder"
        >
          <XStack alignItems="center" gap="$3">
            <YStack
              padding="$1.5"
              borderRadius={6}
              backgroundColor="rgba(59, 130, 246, 0.1)"
            >
              <Ionicons name="mic-outline" size={18} color="#3b82f6" />
            </YStack>
            <Text fontSize="$2" fontWeight="500" color="$color">
              {t("profile.settings.audioPermissions")}
            </Text>
          </XStack>
          <Switch
            value={audioPermissionGranted}
            onValueChange={handleAudioToggle}
          />
        </XStack>

        {/* Data & Privacy */}
        <Pressable
          onPress={() => {
            /* Handle data & privacy */
          }}
        >
          <XStack
            alignItems="center"
            justifyContent="space-between"
            padding="$3.5"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                padding="$1.5"
                borderRadius={6}
                backgroundColor="rgba(139, 92, 246, 0.1)"
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#8b5cf6"
                />
              </YStack>
              <Text fontSize="$2" fontWeight="500" color="$color">
                {t("profile.settings.dataPrivacy")}
              </Text>
            </XStack>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.gray10?.val || "#9ca3af"}
            />
          </XStack>
        </Pressable>
      </Card>
    </YStack>
  );
}
