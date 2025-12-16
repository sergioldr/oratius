import type { Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Lazy import Google Sign-In to prevent crash in Expo Go
// The native module is only available in development/production builds
let GoogleSignin:
  | typeof import("@react-native-google-signin/google-signin").GoogleSignin
  | null = null;
let isSuccessResponse:
  | typeof import("@react-native-google-signin/google-signin").isSuccessResponse
  | null = null;
let googleSignInConfigured = false;

// Try to import Google Sign-In, but don't crash if it's not available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const googleSignIn = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSignIn.GoogleSignin;
  isSuccessResponse = googleSignIn.isSuccessResponse;
} catch {
  console.log(
    "Google Sign-In native module not available. This is expected in Expo Go."
  );
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Configure Google Sign-In lazily
 * This is called before each Google sign-in attempt to ensure configuration
 */
function configureGoogleSignIn() {
  if (!GoogleSignin || googleSignInConfigured) return;

  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
      offlineAccess: true,
    });
    googleSignInConfigured = true;
  } catch (error) {
    console.error("Failed to configure Google Sign-In:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from Supabase session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with Apple
   * Uses expo-apple-authentication to get Apple credentials,
   * then exchanges them with Supabase for a session.
   */
  const signInWithApple = useCallback(async () => {
    try {
      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // The identityToken is a JWT that Supabase can verify
      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) {
          throw error;
        }

        // If we got the user's name (only returned on first sign-in),
        // update the user's metadata
        if (credential.fullName && data.user) {
          const { givenName, familyName } = credential.fullName;
          if (givenName || familyName) {
            await supabase.auth.updateUser({
              data: {
                full_name: [givenName, familyName].filter(Boolean).join(" "),
              },
            });
          }
        }
      } else {
        throw new Error("No identity token received from Apple");
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ERR_REQUEST_CANCELED"
      ) {
        // User canceled the sign-in flow - this is not an error
        console.log("Apple Sign-In canceled by user");
        return;
      }
      console.error("Apple Sign-In error:", error);
      throw error;
    }
  }, []);

  /**
   * Sign in with Google
   * Uses @react-native-google-signin/google-signin to get Google credentials,
   * then exchanges them with Supabase for a session.
   */
  const signInWithGoogle = useCallback(async () => {
    // Check if Google Sign-In is available
    if (!GoogleSignin || !isSuccessResponse) {
      throw new Error(
        "Google Sign-In is not available. Please use a development build."
      );
    }

    // Configure Google Sign-In if not already configured
    configureGoogleSignIn();

    try {
      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;

        if (idToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          if (error) {
            throw error;
          }
        } else {
          throw new Error("No ID token received from Google");
        }
      } else {
        // User canceled or sign-in was not successful
        console.log("Google Sign-In was not successful");
      }
    } catch (error: unknown) {
      // Handle specific Google Sign-In errors
      if (error && typeof error === "object" && "code" in error) {
        const errorCode = error.code;
        if (
          errorCode === "SIGN_IN_CANCELLED" ||
          errorCode === "12501" // Android cancel code
        ) {
          console.log("Google Sign-In canceled by user");
          return;
        }
      }
      console.error("Google Sign-In error:", error);
      throw error;
    }
  }, []);

  /**
   * Sign in with Magic Link (email)
   * Sends a magic link to the user's email address.
   * The user clicks the link to complete authentication.
   */
  const signInWithMagicLink = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Use deep linking to return to the app
          emailRedirectTo:
            Platform.OS === "web"
              ? window.location.origin
              : "oratious://auth/callback",
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Magic Link error:", error);
      throw error;
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      // Sign out from Google if signed in with Google (and Google Sign-In is available)
      if (GoogleSignin) {
        try {
          const isGoogleSignedIn = await GoogleSignin.getCurrentUser();
          if (isGoogleSignedIn) {
            await GoogleSignin.signOut();
          }
        } catch {
          // Ignore errors - Google Sign-In might not be properly configured
        }
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signInWithApple,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
