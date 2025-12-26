import { getRecordingPermissionsAsync } from "expo-audio";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { useAuth } from "@/context/auth-context";
import { useAudioPermission } from "@/hooks/use-audio-permission";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { supabase } from "@/lib/supabase";
import { useProfileStore } from "@/store/profile-store";

import type { ProfileFormData } from "./types";

/**
 * Custom hook for managing profile form state with Supabase integration
 */
export function useProfileForm(callbacks?: { onValidationError?: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requestPermission } = useAudioPermission();
  const {
    permissionGranted: notificationsEnabled,
    togglePermission: toggleNotifications,
  } = useNotificationPermission();
  const { profile: storeProfile, setProfile: setStoreProfile } =
    useProfileStore();

  // Initialize form state from the store
  const [formData, setFormData] = useState<ProfileFormData>({
    name: storeProfile.name,
    speakingRole: storeProfile.speakingRole,
    industry: storeProfile.industry,
    seniority: storeProfile.seniority,
    language: storeProfile.language,
    goal: storeProfile.goal,
    notificationsEnabled: false,
    audioPermissionGranted: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name: boolean;
    speakingRole: boolean;
    industry: boolean;
    seniority: boolean;
    nameCharacterLimit: boolean;
  }>({
    name: false,
    speakingRole: false,
    industry: false,
    seniority: false,
    nameCharacterLimit: false,
  });

  // Sync form data with store when store changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: storeProfile.name,
      speakingRole: storeProfile.speakingRole,
      industry: storeProfile.industry,
      seniority: storeProfile.seniority,
      language: storeProfile.language,
      goal: storeProfile.goal,
    }));
  }, [storeProfile]);

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

    // Check for name character limit
    if (field === "name" && typeof value === "string") {
      const exceedsLimit = value.length > 50;
      setFieldErrors((prev) => ({
        ...prev,
        name: false,
        nameCharacterLimit: exceedsLimit,
      }));
    } else if (field in fieldErrors) {
      // Clear error for this field if it exists
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }
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
    if (!user) {
      Alert.alert(
        t("profile.alerts.error.title"),
        t("profile.alerts.error.mustBeSignedIn")
      );
      return false;
    }

    // Validate required fields
    const errors = {
      name: formData.name.trim() === "",
      speakingRole: formData.speakingRole === "",
      industry: formData.industry === "",
      seniority: formData.seniority === "",
      nameCharacterLimit: formData.name.length > 50,
    };

    const hasErrors = Object.values(errors).some((error) => error);

    if (hasErrors) {
      setFieldErrors(errors);
      callbacks?.onValidationError?.();

      // Show appropriate error message
      const errorMessage = errors.nameCharacterLimit
        ? t("profile.alerts.error.nameCharacterLimit")
        : t("profile.alerts.error.requiredFields");

      Alert.alert(t("profile.alerts.error.title"), errorMessage);
      return false;
    }

    setIsSaving(true);
    try {
      const profileData = {
        user_id: user.id,
        display_name: formData.name.trim().slice(0, 50),
        speaking_role: formData.speakingRole,
        industry: formData.industry,
        seniority: formData.seniority,
        language: formData.language,
        goal: formData.goal,
      };

      console.log("Saving profile data:", profileData);

      const { error } = await supabase.from("profiles").upsert(profileData, {
        onConflict: "user_id",
      });

      if (error) throw error;

      // Update the store with the saved data
      setStoreProfile({
        name: profileData.display_name,
        speakingRole: profileData.speaking_role,
        industry: profileData.industry,
        seniority: profileData.seniority,
        language: profileData.language,
        goal: profileData.goal,
      });

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
    fieldErrors,
  };
}
