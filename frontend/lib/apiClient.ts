/**
 * Typed API client for the FastAPI backend using openapi-fetch.
 *
 * This client is generated from the OpenAPI spec and provides full type safety
 * for all API requests and responses.
 */

import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

const API_URL = process.env.API_URL || "http://localhost:8000";

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
 * Create an authenticated API client with user email header.
 * Use this for endpoints that require authentication.
 *
 * @param userEmail - The user's email for authentication
 * @returns A configured API client with authentication headers
 *
 * Example usage:
 * ```typescript
 * const authClient = createAuthClient(session.user.email);
 * const { data, error } = await authClient.GET("/admin/users");
 * ```
 */
export function createAuthClient(userEmail: string | null | undefined) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (userEmail) {
    headers["x-user-email"] = userEmail;
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
