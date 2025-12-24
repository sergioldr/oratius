import { supabase } from "./supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_DILO_SERVER_API_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetcherOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
}

interface FetcherResponse<TData> {
  data: TData | null;
  error: string | null;
  status: number;
}

/**
 * API Fetcher with Supabase authentication.
 * Automatically attaches the Bearer token from the current Supabase session.
 *
 * @param endpoint - The API endpoint (e.g., "/auth/me")
 * @param options - Request options (method, body, headers)
 * @returns Promise with data, error, and status
 *
 * @example
 * // GET request
 * const { data, error } = await fetcher<User>("/auth/me");
 *
 * @example
 * // POST request with body
 * const { data, error } = await fetcher<CreateResponse>("/recordings", {
 *   method: "POST",
 *   body: { title: "My Recording" },
 * });
 */
export async function fetcher<TData, TBody = unknown>(
  endpoint: string,
  options: FetcherOptions<TBody> = {}
): Promise<FetcherResponse<TData>> {
  const { method = "GET", body, headers: customHeaders = {} } = options;

  if (!API_BASE_URL) {
    console.error(
      "[fetcher] EXPO_PUBLIC_DILO_SERVER_API_URL is not configured"
    );
    return {
      data: null,
      error: "API URL not configured",
      status: 0,
    };
  }

  // Get current session from Supabase
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[fetcher] Failed to get session:", sessionError.message);
    return {
      data: null,
      error: "Failed to get authentication session",
      status: 0,
    };
  }

  if (!session?.access_token) {
    console.warn("[fetcher] No active session, request may be unauthorized");
  }

  // Build headers with auth token
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  // Build request config
  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== "GET") {
    config.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[fetcher] ${method} ${endpoint} failed:`, {
          status: response.status,
          body: errorText,
        });
        return {
          data: null,
          error: errorText || `Request failed with status ${response.status}`,
          status: response.status,
        };
      }
      // Success but no JSON body
      return {
        data: null,
        error: null,
        status: response.status,
      };
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`[fetcher] ${method} ${endpoint} failed:`, {
        status: response.status,
        body: data,
      });
      return {
        data: null,
        error:
          data.message ||
          data.error ||
          `Request failed with status ${response.status}`,
        status: response.status,
      };
    }

    return {
      data: data as TData,
      error: null,
      status: response.status,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown network error";
    console.error(
      `[fetcher] ${method} ${endpoint} network error:`,
      errorMessage
    );
    return {
      data: null,
      error: errorMessage,
      status: 0,
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <TData>(endpoint: string, headers?: Record<string, string>) =>
    fetcher<TData>(endpoint, { method: "GET", headers }),

  post: <TData, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    headers?: Record<string, string>
  ) => fetcher<TData, TBody>(endpoint, { method: "POST", body, headers }),

  put: <TData, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    headers?: Record<string, string>
  ) => fetcher<TData, TBody>(endpoint, { method: "PUT", body, headers }),

  patch: <TData, TBody = unknown>(
    endpoint: string,
    body?: TBody,
    headers?: Record<string, string>
  ) => fetcher<TData, TBody>(endpoint, { method: "PATCH", body, headers }),

  delete: <TData>(endpoint: string, headers?: Record<string, string>) =>
    fetcher<TData>(endpoint, { method: "DELETE", headers }),
};
