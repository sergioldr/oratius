import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking } from "react-native";

/**
 * Custom hook for handling push notification permissions
 * Provides state and functions to check and request notification access
 */
export function useNotificationPermission() {
  const { t } = useTranslation();
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check current permission status
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      const granted = existingStatus === "granted";
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error("Error checking notification permission:", error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === "granted";
      setPermissionGranted(granted);

      if (!granted && existingStatus !== "undetermined") {
        // Permission was previously denied, direct to settings
        Alert.alert(
          t("profile.settings.notifications"),
          "To enable notifications, please allow them in your device settings.",
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("recordVoice.permission.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [t]);

  // Toggle notification permission
  const togglePermission = useCallback(
    async (value: boolean): Promise<void> => {
      if (value) {
        await requestPermission();
      } else {
        // Direct user to settings to disable
        Alert.alert(
          t("profile.settings.notifications"),
          "To disable notifications, please go to your device settings.",
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("recordVoice.permission.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    },
    [requestPermission, t]
  );

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permissionGranted,
    checkPermission,
    requestPermission,
    togglePermission,
  };
}
