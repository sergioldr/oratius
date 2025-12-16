import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Custom storage adapter using expo-secure-store for secure session persistence.
 * Falls back to localStorage on web where SecureStore is not available.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Get these from your Supabase project settings
// Settings -> API -> Project URL and Project API keys (anon/public)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/**
 * Create Supabase client with proper error handling
 * Returns a configured client or throws a clear error if env vars are missing
 */
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Supabase environment variables not set. Please create a .env file with:\n" +
        "EXPO_PUBLIC_SUPABASE_URL=your-supabase-url\n" +
        "EXPO_PUBLIC_SUPABASE_KEY=your-supabase-anon-key"
    );
    // Return a client with placeholder values - it won't work but won't crash
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
