import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, useTheme, XStack, YStack } from "tamagui";

import {
  AnimatedHeader,
  Card,
  GhostButton,
  HEADER_HEIGHT,
  PrimaryButton,
  RadioGroup,
  Select,
} from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Broad, inclusive “speaking role” taxonomy:
 * Targets people whose work depends on talking, while keeping an “Other” + “Prefer not” option.
 */
type SpeakingRole =
  | "leadership"
  | "sales"
  | "customer-success"
  | "support"
  | "marketing-pr"
  | "hr-recruiting"
  | "product-project"
  | "consulting"
  | "education-training"
  | "healthcare"
  | "legal"
  | "creator"
  | "other"
  | "prefer-not";

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

  // --- Options (translated) ---
  const SPEAKING_ROLES: { value: SpeakingRole; label: string }[] = [
    { value: "leadership", label: t("profile.speakingRole.leadership") },
    { value: "sales", label: t("profile.speakingRole.sales") },
    {
      value: "customer-success",
      label: t("profile.speakingRole.customerSuccess"),
    },
    { value: "support", label: t("profile.speakingRole.support") },
    { value: "marketing-pr", label: t("profile.speakingRole.marketingPr") },
    { value: "hr-recruiting", label: t("profile.speakingRole.hrRecruiting") },
    {
      value: "product-project",
      label: t("profile.speakingRole.productProject"),
    },
    { value: "consulting", label: t("profile.speakingRole.consulting") },
    {
      value: "education-training",
      label: t("profile.speakingRole.educationTraining"),
    },
    { value: "healthcare", label: t("profile.speakingRole.healthcare") },
    { value: "legal", label: t("profile.speakingRole.legal") },
    { value: "creator", label: t("profile.speakingRole.creator") },
    { value: "other", label: t("profile.speakingRole.other") },
    { value: "prefer-not", label: t("profile.speakingRole.preferNot") },
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

  const handleWhyNeeded = () => {
    Alert.alert(
      t("profile.alerts.whyNeeded.title"),
      t("profile.alerts.whyNeeded.message"),
      [{ text: t("common.ok"), style: "default" }]
    );
  };

  // --- State (About you) ---
  const [selectedSpeakingRole, setSelectedSpeakingRole] =
    useState<SpeakingRole>("leadership");
  const [selectedContext, setSelectedContext] =
    useState<SpeakingContext>("interviews");
  const [selectedIndustry, setSelectedIndustry] =
    useState<Industry>("technology");
  const [selectedSeniority, setSelectedSeniority] =
    useState<Seniority>("senior");

  // --- State (How you communicate) ---
  const [selectedStyle, setSelectedStyle] =
    useState<CommunicationStyle>("strategic");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en-us");

  // --- State (Goals) ---
  const [selectedGoal, setSelectedGoal] = useState<Goal>("be-concise");

  // --- Select open states (sheets) ---
  const [speakingRoleSheetOpen, setSpeakingRoleSheetOpen] = useState(false);
  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [senioritySheetOpen, setSenioritySheetOpen] = useState(false);
  const [styleSheetOpen, setStyleSheetOpen] = useState(false);
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false);

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
          paddingBottom: Math.max(insets.bottom, 24) + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$5" paddingTop="$2">
          {/* Hero Card - Guest User */}
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
                  <Text
                    fontSize="$2"
                    color="rgba(255,255,255,0.8)"
                    lineHeight={18}
                  >
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

          {/* About You Section */}
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" fontWeight="bold" color="$color">
                {t("profile.aboutYou.title")}
              </Text>
              <Pressable onPress={handleWhyNeeded}>
                <Text fontSize={10} color="$primary6" fontWeight="500">
                  {t("profile.whyNeeded")}
                </Text>
              </Pressable>
            </XStack>

            <Card variant="elevated" padding="$4" gap="$4">
              {/* Speaking Role (replaces “Current Role” chips) */}
              <YStack gap="$2">
                <Text
                  fontSize={11}
                  fontWeight="600"
                  color="$gray11"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  {t("profile.speakingRole.title")}
                </Text>

                <Select
                  value={selectedSpeakingRole}
                  options={SPEAKING_ROLES}
                  onValueChange={setSelectedSpeakingRole}
                  placeholder={t("profile.speakingRole.placeholder")}
                  open={speakingRoleSheetOpen}
                  onOpenChange={setSpeakingRoleSheetOpen}
                />
              </YStack>

              {/* Industry and Seniority */}
              <XStack gap="$3">
                <YStack flex={1} gap="$2">
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
            </Card>
          </YStack>

          {/* Communication Style Section */}
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="bold" color="$color">
              {t("profile.communication.title")}
            </Text>

            <Card variant="elevated" padding="$4" gap="$4">
              {/* Preferred Style (replaces ModeButtons) */}
              <YStack gap="$2">
                <Text
                  fontSize={11}
                  fontWeight="600"
                  color="$gray11"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  {t("profile.communication.styleTitle")}
                </Text>

                <Select
                  value={selectedStyle}
                  options={COMMUNICATION_STYLES}
                  onValueChange={setSelectedStyle}
                  placeholder={t("profile.communication.stylePlaceholder")}
                  open={styleSheetOpen}
                  onOpenChange={setStyleSheetOpen}
                />
              </YStack>

              {/* Speaking Context (chips kept; not ModeButtons) */}
              <YStack gap="$2">
                <Text
                  fontSize={11}
                  fontWeight="600"
                  color="$gray11"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
                  {t("profile.speakingContext.title")}
                </Text>

                <XStack flexWrap="wrap" gap="$2">
                  {SPEAKING_CONTEXTS.map((ctx) => (
                    <Pressable
                      key={ctx.value}
                      onPress={() => setSelectedContext(ctx.value)}
                      style={({ pressed }) => ({
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor:
                          selectedContext === ctx.value
                            ? "rgba(37, 71, 244, 0.1)"
                            : theme.gray3?.val || "#f3f4f6",
                        borderWidth: 1,
                        borderColor:
                          selectedContext === ctx.value
                            ? "rgba(37, 71, 244, 0.2)"
                            : theme.gray6?.val || "#e5e7eb",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text
                        fontSize={11}
                        fontWeight={
                          selectedContext === ctx.value ? "600" : "500"
                        }
                        color={
                          selectedContext === ctx.value
                            ? "$primary6"
                            : "$gray11"
                        }
                      >
                        {ctx.label}
                      </Text>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Language */}
              <YStack gap="$2">
                <Text
                  fontSize={11}
                  fontWeight="600"
                  color="$gray11"
                  textTransform="uppercase"
                  letterSpacing={0.5}
                >
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
            </Card>
          </YStack>

          {/* Current Focus Section */}
          <YStack gap="$3">
            <YStack gap="$0.5">
              <Text fontSize="$4" fontWeight="bold" color="$color">
                {t("profile.goals.title")}
              </Text>
              <Text fontSize={10} color="$gray11">
                {t("profile.goals.description")}
              </Text>
            </YStack>

            <RadioGroup
              options={GOALS}
              value={selectedGoal}
              onValueChange={setSelectedGoal}
            />
          </YStack>

          {/* Settings Row */}
          <Pressable
            onPress={() => {
              /* Navigate to settings */
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Card variant="elevated" padding="$3.5">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2.5">
                  <Ionicons
                    name="settings-outline"
                    size={18}
                    color={theme.gray11?.val || "#9ca3af"}
                  />
                  <Text fontSize="$3" fontWeight="500" color="$gray11">
                    {t("profile.settings.title")}
                  </Text>
                </XStack>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.gray11?.val || "#9ca3af"}
                />
              </XStack>
            </Card>
          </Pressable>

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
