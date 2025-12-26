/**
 * Profile form types and interfaces
 */

export type SpeakingRole =
  | ""
  | "leadership"
  | "people-management"
  | "engineering"
  | "product-project"
  | "sales"
  | "marketing-pr"
  | "customer-success"
  | "support"
  | "operations"
  | "finance-accounting"
  | "consulting"
  | "founder"
  | "hr-recruiting"
  | "education-training"
  | "research-academia"
  | "healthcare"
  | "legal"
  | "public-sector"
  | "creator"
  | "other"
  | "prefer-not";

export type Industry =
  | ""
  | "technology"
  | "finance"
  | "consulting"
  | "healthcare"
  | "education"
  | "government"
  | "manufacturing"
  | "retail"
  | "media"
  | "nonprofit"
  | "other";

export type Seniority =
  | ""
  | "junior"
  | "emerging"
  | "mid-level"
  | "senior"
  | "manager"
  | "director"
  | "executive";

export type Language = "en-US" | "en-GB" | "es-ES";

export type Goal = "sound-confident" | "be-concise" | "tough-questions";

/**
 * Complete profile form data structure
 */
export interface ProfileFormData {
  // About You
  name: string;
  speakingRole: SpeakingRole;
  industry: Industry;
  seniority: Seniority;

  // Communication
  language: Language;

  // Goals
  goal: Goal;

  // Settings
  notificationsEnabled: boolean;
  audioPermissionGranted: boolean;
}

/**
 * Profile data from Supabase (including metadata)
 */
export interface ProfileData extends ProfileFormData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
