/**
 * Typed API client for the FastAPI backend using openapi-fetch.
 *
 * This client is generated from the OpenAPI spec and provides full type safety
 * for all API requests and responses.
 */

import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Create a typed API client instance.
 * This client provides methods for all API endpoints with full type safety.
 *
 * Example usage:
 * ```typescript
 * const { data, error } = await client.GET("/asceticisms/");
 * ```
 */
export const client = createClient<paths>({ baseUrl: API_URL });

/**
 * Get the session token for API authentication.
 * This retrieves the JWT token from NextAuth cookies.
 *
 * @returns The session token or null if not authenticated
 */
async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    // Server-side: Use next-auth to get token
    const { auth } = await import("@/auth");
    const session = await auth();

    if (!session) return null;

    // Get the token from the session
    // NextAuth stores tokens in the session object
    return (session as any).token?.sub || null;
  } else {
    // Client-side: Get token from cookie
    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find(
      (c) =>
        c.trim().startsWith("next-auth.session-token=") ||
        c.trim().startsWith("__Secure-next-auth.session-token="),
    );

    if (!sessionCookie) return null;

    const token = sessionCookie.split("=")[1];
    return token || null;
  }
}

/**
 * Create an authenticated API client with JWT Bearer token.
 * Use this for endpoints that require authentication.
 *
 * @returns A configured API client with authentication headers
 *
 * Example usage:
 * ```typescript
 * const authClient = await createAuthClient();
 * const { data, error } = await authClient.GET("/admin/users");
 * ```
 */
export async function createAuthClient() {
  const token = await getSessionToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return createClient<paths>({
    baseUrl: API_URL,
    headers,
  });
}

/**
 * Default export for convenience
 */
export default client;
