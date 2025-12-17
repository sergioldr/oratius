import { Audio } from "expo-av";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking } from "react-native";

/**
 * Custom hook for handling audio recording permissions
 * Provides a function to request microphone access with user-friendly alerts
 */
export function useAudioPermission() {
  const { t } = useTranslation();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Audio.getPermissionsAsync();

      if (existingStatus === "granted") {
        return true;
      }

      const { status } = await Audio.requestPermissionsAsync();

      if (status === "granted") {
        return true;
      }

      // Permission denied - show alert to open settings
      Alert.alert(
        t("recordVoice.permission.title"),
        t("recordVoice.permission.message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("recordVoice.permission.openSettings"),
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      return false;
    }
  }, [t]);

  return { requestPermission };
}
