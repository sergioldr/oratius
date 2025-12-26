import { router } from "expo-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import {
  AboutYouSection,
  CommunicationSection,
  GoalsSection,
  ProfileHeroCard,
  SettingsSection,
  useProfileForm,
} from "@/components/profile";
import {
  AnimatedHeader,
  GhostButton,
  HEADER_HEIGHT,
  PrimaryButton,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Profile screen - User profile and settings
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { isAnonymous, signOut } = useAuth();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const aboutYouRef = useRef<View>(null);
  const insets = useSafeAreaInsets();

  // Use the custom hook for form management
  const {
    formData,
    updateField,
    isSaving,
    saveProfile,
    handleAudioPermissionToggle,
    handleNotificationsToggle,
    fieldErrors,
  } = useProfileForm({
    onValidationError: () => {
      // Scroll to About You section when validation fails
      // Account for safe area and header height
      aboutYouRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          // Subtract header height and safe area to position section at top
          const scrollPosition = y - HEADER_HEIGHT - insets.top - 8;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollPosition),
            animated: true,
          });
        },
        () => {}
      );
    },
  });

  // --- Actions ---
  const handleSignOut = () => {
    Alert.alert(
      t("profile.alerts.signOut.title"),
      t("profile.alerts.signOut.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.alerts.signOut.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/");
            } catch (error) {
              console.error("Sign out error:", error);
              Alert.alert(
                t("profile.alerts.error.title"),
                t("profile.alerts.error.signOutFailed")
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.alerts.deleteAccount.title"),
      t("profile.alerts.deleteAccount.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.alerts.deleteAccount.confirm"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("profile.alerts.finalConfirmation.title"),
              t("profile.alerts.finalConfirmation.message"),
              [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("profile.alerts.finalConfirmation.confirm"),
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { error } = await supabase.rpc("delete_user");
                      if (error) throw error;

                      await signOut();
                      router.replace("/login");
                    } catch (error) {
                      console.error("Delete account error:", error);
                      Alert.alert(
                        t("profile.alerts.error.title"),
                        t("profile.alerts.error.deleteAccountFailed")
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    await saveProfile();
  };

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <YStack flex={1} backgroundColor="$backgroundStrong">
      {/* Fixed Header with Blur */}
      <AnimatedHeader
        title={t("home.tabs.profile")}
        subtitle={t("profile.headerSubtitle")}
        scrollY={scrollY}
      />

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + insets.top,
          paddingBottom: Math.max(insets.bottom, 24) + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$5" paddingTop="$2">
          {/* Hero Card - Guest User */}
          <ProfileHeroCard isAnonymous={isAnonymous} />

          {/* About You Section */}
          <View ref={aboutYouRef}>
            <AboutYouSection
              name={formData.name}
              speakingRole={formData.speakingRole}
              industry={formData.industry}
              seniority={formData.seniority}
              onNameChange={(value) => updateField("name", value)}
              onSpeakingRoleChange={(value) =>
                updateField("speakingRole", value)
              }
              onIndustryChange={(value) => updateField("industry", value)}
              onSeniorityChange={(value) => updateField("seniority", value)}
              errors={fieldErrors}
            />
          </View>

          {/* Communication Style Section */}
          <CommunicationSection
            language={formData.language}
            onLanguageChange={(value) => updateField("language", value)}
          />

          {/* Current Focus Section */}
          <GoalsSection
            goal={formData.goal}
            onGoalChange={(value) => updateField("goal", value)}
          />

          {/* Settings Section */}
          <SettingsSection
            notificationsEnabled={formData.notificationsEnabled}
            audioPermissionGranted={formData.audioPermissionGranted}
            onNotificationsToggle={handleNotificationsToggle}
            onAudioPermissionToggle={handleAudioPermissionToggle}
          />

          {/* Action Buttons */}
          <YStack gap="$3" paddingTop="$4" paddingBottom="$4">
            <PrimaryButton
              size="$5"
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving
                ? t("profile.actions.saving")
                : t("profile.actions.saveSettings")}
            </PrimaryButton>

            <XStack justifyContent="center" paddingTop="$2">
              <GhostButton
                variant="danger"
                onPress={isAnonymous ? handleSignOut : handleDeleteAccount}
              >
                {isAnonymous
                  ? t("profile.actions.signOut")
                  : t("profile.actions.deleteAccount")}
              </GhostButton>
            </XStack>
          </YStack>
        </YStack>
      </Animated.ScrollView>
    </YStack>
  );
}
