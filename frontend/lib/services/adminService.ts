"use server";

import { auth } from "@/auth";
import { getApiClient } from "@/lib/apiClient";
import { UserRole } from "@/types/enums";
import { revalidatePath } from "next/cache";
import type { components } from "@/types/api";

/**
 * User data type from the API
 */
export type UserData = components["schemas"]["UserResponse"];

/**
 * Get the authenticated API client for the current session
 */
async function getAuthClient() {
  const session = await auth();
  return getApiClient(session?.user?.email || undefined);
}

/**
 * Get all users with their details
 */
export async function getAllUsers(): Promise<UserData[]> {
  const client = await getAuthClient();

  const { data, error } = await client.GET("/admin/users");

  if (error) {
    const errorMessage =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail);
    throw new Error(errorMessage || "Failed to fetch users");
  }

  return data || [];
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: number, newRole: UserRole) {
  const client = await getAuthClient();

  const { data, error } = await client.POST("/admin/users/role", {
    body: {
      userId,
      newRole,
    },
  });

  if (error) {
    const errorMessage =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail);
    throw new Error(errorMessage || "Failed to update role");
  }

  revalidatePath("/admin");
  return data;
}

/**
 * Ban or unban a user
 */
export async function toggleUserBan(userId: number, isBanned: boolean) {
  const client = await getAuthClient();

  const { data, error } = await client.POST("/admin/users/ban", {
    body: {
      userId,
      isBanned,
    },
  });

  if (error) {
    const errorMessage =
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail);
    throw new Error(errorMessage || "Failed to update ban status");
  }

  revalidatePath("/admin");
  return data;
}
