import { getRecordingPermissionsAsync } from "expo-audio";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useAuth } from "@/context/auth-context";
import { useAudioPermission } from "@/hooks/use-audio-permission";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { supabase } from "@/lib/supabase";

import type { ProfileFormData } from "./types";

/**
 * Custom hook for managing profile form state with Supabase integration
 */
export function useProfileForm() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requestPermission } = useAudioPermission();
  const {
    permissionGranted: notificationsEnabled,
    togglePermission: toggleNotifications,
  } = useNotificationPermission();

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    // About You
    speakingRole: "leadership",
    industry: "technology",
    seniority: "senior",

    // Communication
    speakingContext: "interviews",
    language: "en-us",

    // Goals
    goal: "be-concise",

    // Settings
    notificationsEnabled: false,
    audioPermissionGranted: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || user.is_anonymous) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows found, which is ok
          throw error;
        }

        if (data) {
          setFormData({
            speakingRole: data.speaking_role,
            industry: data.industry,
            seniority: data.seniority,
            speakingContext: data.speaking_context,
            language: data.language,
            goal: data.goal,
            notificationsEnabled: data.notifications_enabled,
            audioPermissionGranted: data.audio_permission_granted,
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Alert.alert(
          t("profile.alerts.error.title"),
          t("profile.alerts.error.loadFailed")
        );
      }
    };

    loadProfile();
  }, [user, t]);

  // Sync notifications enabled state
  useEffect(() => {
    setFormData((prev) => ({ ...prev, notificationsEnabled }));
  }, [notificationsEnabled]);

  // Check audio permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const { granted } = await getRecordingPermissionsAsync();
      setFormData((prev) => ({ ...prev, audioPermissionGranted: granted }));
    };
    checkPermission();
  }, []);

  // Update form field
  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle audio permission toggle
  const handleAudioPermissionToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      updateField("audioPermissionGranted", granted);
      return granted;
    }
    return false;
  };

  // Handle notifications toggle
  const handleNotificationsToggle = async (value: boolean) => {
    await toggleNotifications(value);
  };

  // Save profile to Supabase
  const saveProfile = async () => {
    if (!user || user.is_anonymous) {
      Alert.alert(
        t("profile.alerts.error.title"),
        t("profile.alerts.error.mustBeSignedIn")
      );
      return false;
    }

    setIsSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        speaking_role: formData.speakingRole,
        industry: formData.industry,
        seniority: formData.seniority,
        speaking_context: formData.speakingContext,
        language: formData.language,
        goal: formData.goal,
        notifications_enabled: formData.notificationsEnabled,
        audio_permission_granted: formData.audioPermissionGranted,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(profileData, {
        onConflict: "user_id",
      });

      if (error) throw error;

      Alert.alert(
        t("profile.alerts.success.title"),
        t("profile.alerts.success.saved")
      );
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert(
        t("profile.alerts.error.title"),
        t("profile.alerts.error.saveFailed")
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    updateField,
    isSaving,
    saveProfile,
    handleAudioPermissionToggle,
    handleNotificationsToggle,
  };
}
