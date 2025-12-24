import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/fetcher";

interface UserMeResponse {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface UseAuthMeResult {
  user: UserMeResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchCurrentUser: () => Promise<void>;
}

/**
 * Custom hook for fetching the current authenticated user from the API.
 * Handles authentication via Bearer token from Supabase session.
 * Automatically fetches current user on mount when authenticated.
 */
export function useAuthMe(): UseAuthMeResult {
  const { session } = useAuth();
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the current authenticated user from the API.
   * Uses the Supabase session access token for Bearer authentication.
   */
  const fetchCurrentUser = useCallback(async () => {
    if (!session?.access_token) {
      console.log("[useAuthMe] No access token available, skipping fetch");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: apiError } = await api.get<UserMeResponse>("/auth/me");

    if (apiError) {
      setError(apiError);
      setUser(null);
    } else {
      console.log("[useAuthMe] auth/me response:", data);
      setUser(data);
    }

    setIsLoading(false);
  }, [session?.access_token]);

  // Automatically fetch current user when session is available
  useEffect(() => {
    if (session?.access_token) {
      fetchCurrentUser();
    }
  }, [session?.access_token, fetchCurrentUser]);

  return {
    user,
    isLoading,
    error,
    fetchCurrentUser,
  };
}
