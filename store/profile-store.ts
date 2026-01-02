import { create } from "zustand";

import type {
  Goal,
  Industry,
  Language,
  Seniority,
  jobRole,
} from "@/components/profile/types";

/**
 * Profile data stored in Zustand
 */
export interface ProfileData {
  // About You
  name: string;
  jobRole: jobRole;
  industry: Industry;
  seniority: Seniority;

  // Communication
  language: Language;

  // Goals
  goal: Goal;
}

/**
 * Profile store state and actions
 */
interface ProfileStore {
  profile: ProfileData;
  isLoaded: boolean;
  setProfile: (profile: Partial<ProfileData>) => void;
  updateField: <K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K]
  ) => void;
  resetProfile: () => void;
  markAsLoaded: () => void;
}

/**
 * Default profile data
 */
const defaultProfile: ProfileData = {
  name: "",
  jobRole: "",
  industry: "",
  seniority: "",
  language: "en-US",
  goal: "sound-confident",
};

/**
 * Zustand store for managing user profile data across the application
 */
export const useProfileStore = create<ProfileStore>((set) => ({
  profile: defaultProfile,
  isLoaded: false,

  setProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),

  updateField: (field, value) =>
    set((state) => ({
      profile: { ...state.profile, [field]: value },
    })),

  resetProfile: () =>
    set({
      profile: defaultProfile,
      isLoaded: false,
    }),

  markAsLoaded: () =>
    set({
      isLoaded: true,
    }),
}));
