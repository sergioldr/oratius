import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Switch, Text, useTheme, XStack, YStack } from "tamagui";

import {
  AnimatedHeader,
  Card,
  GhostButton,
  HEADER_HEIGHT,
  ModeButton,
  PrimaryButton,
  RadioGroup,
  SecondaryButton,
  Select,
  Tag,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

type Role = "ceo" | "executive" | "manager" | "individual";
type SpeakingContext =
  | "executive-meetings"
  | "interviews"
  | "pitches"
  | "daily-team";
type Industry =
  | "technology"
  | "finance"
  | "consulting"
  | "healthcare"
  | "other";
type Seniority = "senior" | "mid-level" | "emerging";
type CommunicationStyle =
  | "direct"
  | "strategic"
  | "inspirational"
  | "analytical";
type Language = "en-us" | "en-uk" | "es" | "fr";
type Goal =
  | "sound-confident"
  | "be-concise"
  | "executive-presence"
  | "tough-questions";

/**
 * Profile screen - User profile and settings
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isAnonymous, signOut } = useAuth();

  // Translated options - must be inside component to access t()
  const ROLES: { value: Role; label: string }[] = [
    { value: "ceo", label: t("profile.currentRole.ceo") },
    { value: "executive", label: t("profile.currentRole.executive") },
    { value: "manager", label: t("profile.currentRole.manager") },
    { value: "individual", label: t("profile.currentRole.individual") },
  ];

  const SPEAKING_CONTEXTS: { value: SpeakingContext; label: string }[] = [
    {
      value: "executive-meetings",
      label: t("profile.speakingContext.executiveMeetings"),
    },
    { value: "interviews", label: t("profile.speakingContext.interviews") },
    { value: "pitches", label: t("profile.speakingContext.pitches") },
    { value: "daily-team", label: t("profile.speakingContext.dailyTeam") },
  ];

  const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: "technology", label: t("profile.industry.technology") },
    { value: "finance", label: t("profile.industry.finance") },
    { value: "consulting", label: t("profile.industry.consulting") },
    { value: "healthcare", label: t("profile.industry.healthcare") },
    { value: "other", label: t("profile.industry.other") },
  ];

  const SENIORITIES: { value: Seniority; label: string }[] = [
    { value: "senior", label: t("profile.seniority.senior") },
    { value: "mid-level", label: t("profile.seniority.midLevel") },
    { value: "emerging", label: t("profile.seniority.emerging") },
  ];

  const COMMUNICATION_STYLES: { value: CommunicationStyle; label: string }[] = [
    { value: "direct", label: t("profile.communication.direct") },
    { value: "strategic", label: t("profile.communication.strategic") },
    { value: "inspirational", label: t("profile.communication.inspirational") },
    { value: "analytical", label: t("profile.communication.analytical") },
  ];

  const LANGUAGES: { value: Language; label: string }[] = [
    { value: "en-us", label: t("profile.language.enUs") },
    { value: "en-uk", label: t("profile.language.enUk") },
    { value: "es", label: t("profile.language.es") },
    { value: "fr", label: t("profile.language.fr") },
  ];

  const GOALS: { value: Goal; label: string }[] = [
    { value: "sound-confident", label: t("profile.goals.soundConfident") },
    { value: "be-concise", label: t("profile.goals.beConcise") },
    {
      value: "executive-presence",
      label: t("profile.goals.executivePresence"),
    },
    { value: "tough-questions", label: t("profile.goals.toughQuestions") },
  ];

  /**
   * Handle sign out with confirmation dialog
   */
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

  /**
   * Handle delete account with confirmation dialog
   */
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
            // Second confirmation for extra safety
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
                      // Delete user account using Supabase Admin API
                      // Note: This requires the user to be authenticated
                      const { error } = await supabase.rpc("delete_user");

                      if (error) {
                        throw error;
                      }

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

  // About you state
  const [selectedRole, setSelectedRole] = useState<Role>("ceo");
  const [selectedContext, setSelectedContext] =
    useState<SpeakingContext>("interviews");
  const [selectedIndustry, setSelectedIndustry] =
    useState<Industry>("technology");
  const [selectedSeniority, setSelectedSeniority] =
    useState<Seniority>("senior");

  // How you communicate state
  const [selectedStyle, setSelectedStyle] =
    useState<CommunicationStyle>("strategic");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en-us");

  // Goals state
  const [selectedGoal, setSelectedGoal] = useState<Goal>("be-concise");

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [audioPermissionsEnabled, setAudioPermissionsEnabled] = useState(true);

  // Sheet open states
  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [senioritySheetOpen, setSenioritySheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

  const secondaryTextColor = theme.gray11?.val || "#9ca3af";
  const borderColor = theme.borderColor?.val || "rgba(55, 65, 81, 0.5)";
  const insets = useSafeAreaInsets();
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
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + insets.top,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$6" paddingBottom="$8">
          {/* Guest User Card */}
          <Card variant="elevated" size="lg">
            <XStack justifyContent="space-between" alignItems="flex-start">
              <YStack>
                <Text fontSize="$6" fontWeight="bold" color="$color">
                  {t("profile.guestUser")}
                </Text>
                <Text fontSize="$3" color="$gray11">
                  {t("profile.unregisteredSession")}
                </Text>
              </YStack>
              <Tag variant="success" label={t("profile.freeTier")} />
            </XStack>
            <XStack
              gap="$3"
              paddingTop="$4"
              marginTop="$4"
              borderTopWidth={1}
              borderTopColor={borderColor}
            >
              <PrimaryButton
                flex={1}
                size="$4"
                onPress={() => router.push("/signup")}
              >
                {t("profile.createFreeAccount")}
              </PrimaryButton>
              <SecondaryButton onPress={() => router.push("/signup")}>
                {t("profile.logIn")}
              </SecondaryButton>
            </XStack>
          </Card>

          {/* About You Section */}
          <YStack gap="$4">
            <YStack gap="$1">
              <Text
                fontSize="$2"
                fontWeight="bold"
                color="$color"
                textTransform="uppercase"
                letterSpacing={1}
              >
                {t("profile.aboutYou.title")}
              </Text>
              <Text fontSize="$2" color="$gray11">
                {t("profile.aboutYou.description")}{" "}
                <Text
                  color="$primary6"
                  fontWeight="500"
                  onPress={() => router.push("/signup")}
                >
                  {t("profile.aboutYou.registerCta")}
                </Text>
              </Text>
            </YStack>

            {/* Current Role */}
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color">
                {t("profile.currentRole.title")}
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {ROLES.map((role) => (
                  <ModeButton
                    key={role.value}
                    label={role.label}
                    selected={selectedRole === role.value}
                    onPress={() => setSelectedRole(role.value)}
                    variant="outlined"
                  />
                ))}
              </XStack>
            </YStack>

            {/* Primary Speaking Context */}
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color">
                {t("profile.speakingContext.title")}
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {SPEAKING_CONTEXTS.map((ctx) => (
                  <ModeButton
                    key={ctx.value}
                    label={ctx.label}
                    selected={selectedContext === ctx.value}
                    onPress={() => setSelectedContext(ctx.value)}
                    variant="outlined"
                  />
                ))}
              </XStack>
            </YStack>

            {/* Industry and Seniority */}
            <XStack gap="$4">
              <YStack flex={1} gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$color">
                  {t("profile.industry.title")}
                </Text>
                <Select
                  value={selectedIndustry}
                  options={INDUSTRIES}
                  onValueChange={setSelectedIndustry}
                  placeholder={t("profile.industry.placeholder")}
                  open={industrySheetOpen}
                  onOpenChange={setIndustrySheetOpen}
                />
              </YStack>
              <YStack flex={1} gap="$2">
                <Text fontSize="$2" fontWeight="600" color="$color">
                  {t("profile.seniority.title")}
                </Text>
                <Select
                  value={selectedSeniority}
                  options={SENIORITIES}
                  onValueChange={setSelectedSeniority}
                  placeholder={t("profile.seniority.placeholder")}
                  open={senioritySheetOpen}
                  onOpenChange={setSenioritySheetOpen}
                />
              </YStack>
            </XStack>
          </YStack>

          {/* How You Communicate Section */}
          <YStack gap="$4">
            <YStack gap="$1">
              <Text
                fontSize="$2"
                fontWeight="bold"
                color="$color"
                textTransform="uppercase"
                letterSpacing={1}
              >
                {t("profile.communication.title")}
              </Text>
              <Text fontSize="$2" color="$gray11">
                {t("profile.communication.description")}
              </Text>
            </YStack>

            {/* Preferred Communication Style */}
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color">
                {t("profile.communication.styleTitle")}
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {COMMUNICATION_STYLES.map((style) => (
                  <ModeButton
                    key={style.value}
                    label={style.label}
                    selected={selectedStyle === style.value}
                    onPress={() => setSelectedStyle(style.value)}
                    variant="outlined"
                  />
                ))}
              </XStack>
            </YStack>

            {/* Primary Language */}
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color">
                {t("profile.language.title")}
              </Text>
              <Select
                value={selectedLanguage}
                options={LANGUAGES}
                onValueChange={setSelectedLanguage}
                placeholder={t("profile.language.placeholder")}
                open={languageSheetOpen}
                onOpenChange={setLanguageSheetOpen}
              />
            </YStack>
          </YStack>

          {/* What Matters Most Section */}
          <YStack gap="$4">
            <YStack gap="$1">
              <Text
                fontSize="$2"
                fontWeight="bold"
                color="$color"
                textTransform="uppercase"
                letterSpacing={1}
              >
                {t("profile.goals.title")}
              </Text>
              <Text fontSize="$2" color="$gray11">
                {t("profile.goals.description")}{" "}
                <Text color="$primary6" fontWeight="500">
                  {t("profile.goals.signUpCta")}
                </Text>
              </Text>
            </YStack>

            <RadioGroup
              options={GOALS}
              value={selectedGoal}
              onValueChange={setSelectedGoal}
            />
          </YStack>

          {/* Settings Section */}
          <YStack gap="$4">
            <Text
              fontSize="$2"
              fontWeight="bold"
              color="$color"
              textTransform="uppercase"
              letterSpacing={1}
            >
              {t("profile.settings.title")}
            </Text>

            <Card variant="elevated" padding={0} overflow="hidden">
              {/* Notifications */}
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding="$4"
                borderBottomWidth={1}
                borderBottomColor={borderColor}
              >
                <Text fontSize="$3" fontWeight="500" color="$color">
                  {t("profile.settings.notifications")}
                </Text>
                <Switch
                  size="$3"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  backgroundColor={
                    notificationsEnabled ? "$primary6" : "$switchBackground"
                  }
                  borderWidth={2}
                  borderColor="$switchBorderColor"
                >
                  <Switch.Thumb animation="quick" backgroundColor="white" />
                </Switch>
              </XStack>

              {/* Audio Permissions */}
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding="$4"
                borderBottomWidth={1}
                borderBottomColor={borderColor}
              >
                <Text fontSize="$3" fontWeight="500" color="$color">
                  {t("profile.settings.audioPermissions")}
                </Text>
                <Switch
                  size="$3"
                  checked={audioPermissionsEnabled}
                  onCheckedChange={setAudioPermissionsEnabled}
                  backgroundColor={
                    audioPermissionsEnabled ? "$primary6" : "$switchBackground"
                  }
                  borderWidth={2}
                  borderColor="$switchBorderColor"
                >
                  <Switch.Thumb animation="quick" backgroundColor="white" />
                </Switch>
              </XStack>

              {/* Reset Onboarding */}
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding="$4"
                borderBottomWidth={1}
                borderBottomColor={borderColor}
                pressStyle={{ backgroundColor: "$buttonBackgroundPress" }}
              >
                <Text fontSize="$3" fontWeight="500" color="$color">
                  {t("profile.settings.resetOnboarding")}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={secondaryTextColor}
                />
              </XStack>

              {/* Data & Privacy */}
              <XStack
                alignItems="center"
                justifyContent="space-between"
                padding="$4"
                pressStyle={{ backgroundColor: "$buttonBackgroundPress" }}
              >
                <Text fontSize="$3" fontWeight="500" color="$color">
                  {t("profile.settings.dataPrivacy")}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={secondaryTextColor}
                />
              </XStack>
            </Card>
          </YStack>

          {/* Action Buttons */}
          <YStack gap="$3" paddingTop="$4" paddingBottom="$4">
            <PrimaryButton size="$5">
              {t("profile.actions.saveSettings")}
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
