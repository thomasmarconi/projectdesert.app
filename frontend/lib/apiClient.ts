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
 * Get the JWT token for API authentication.
 * This creates a JWT token with the session data that the backend can verify.
 *
 * @param userEmail - Optional user email for server-side validation
 * @returns The JWT token or null if not authenticated
 */
async function getJWTToken(userEmail?: string): Promise<string | null> {
  if (typeof window === "undefined") {
    // Server-side: Get session and create a JWT token for the backend
    const { auth } = await import("@/auth");
    const jwt = await import("jsonwebtoken");

    const session = await auth();
    console.log("Session:", session ? "exists" : "null", session?.user?.email);

    if (!session || !session.user) {
      console.log("No session found - user not authenticated");
      return null;
    }

    // Verify the user if email is provided
    if (userEmail && session.user.email !== userEmail) {
      console.log("User email mismatch");
      return null;
    }

    // Get the NEXTAUTH_SECRET from environment
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET is not set");
      return null;
    }

    // Create a JWT token that the backend can verify with the same secret
    // The backend expects a token with at least the email field
    const token = jwt.sign(
      {
        email: session.user.email,
        id: session.user.id,
        role: session.user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      secret,
      { algorithm: "HS256" },
    );

    console.log("JWT token created successfully for", session.user.email);
    return token;
  } else {
    // Client-side: This should not be called directly from client components
    // Use server actions instead
    console.warn("JWT token retrieval should be done server-side");
    return null;
  }
}

/**
 * Create an authenticated API client with JWT Bearer token.
 * This is the primary client - use it for all API requests.
 * It will automatically include auth headers when a session exists.
 * Endpoints that don't require auth will simply ignore the header.
 *
 * @param userEmail - Optional user email for server-side validation
 * @returns A configured API client with authentication headers when available
 *
 * Example usage:
 * ```typescript
 * const client = await getApiClient();
 * const { data, error } = await client.GET("/asceticisms/");
 * ```
 */
export async function getApiClient(userEmail?: string) {
  const token = await getJWTToken(userEmail);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authorization header added to API client");
  } else {
    console.log("No token available - API client will be unauthenticated");
  }

  return createClient<paths>({
    baseUrl: API_URL,
    headers,
  });
}

/**
 * Legacy alias for getApiClient - prefer using getApiClient
 * @deprecated Use getApiClient instead
 */
export const createAuthClient = getApiClient;

/**
 * Unauthenticated client for public endpoints only.
 * For most use cases, use getApiClient() instead which handles both auth and non-auth endpoints.
 */
export const client = createClient<paths>({ baseUrl: API_URL });

/**
 * Default export - use getApiClient() for authenticated requests
 */
export default getApiClient;
