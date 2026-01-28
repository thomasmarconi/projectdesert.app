"use server";

import { auth } from "@/auth";
import { UserRole } from "@/lib/prisma/enums";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * User data type returned from the API
 */
export interface UserData {
  id: number;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  isBanned: boolean;
  emailVerified: string | null;
  userAsceticismsCount: number;
  groupMembersCount: number;
}

/**
 * Get headers with user email for authentication
 */
async function getAuthHeaders() {
  const session = await auth();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (session?.user?.email) {
    headers["x-user-email"] = session.user.email;
  }

  return headers;
}

/**
 * Get all users with their details
 */
export async function getAllUsers(): Promise<UserData[]> {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/admin/users`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch users" }));
    throw new Error(error.detail || "Failed to fetch users");
  }

  return res.json();
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: number, newRole: UserRole) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/admin/users/role`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      userId,
      newRole,
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to update role" }));
    throw new Error(error.detail || "Failed to update role");
  }

  revalidatePath("/admin");
  return res.json();
}

/**
 * Ban or unban a user
 */
export async function toggleUserBan(userId: number, isBanned: boolean) {
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/admin/users/ban`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      userId,
      isBanned,
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to update ban status" }));
    throw new Error(error.detail || "Failed to update ban status");
  }

  revalidatePath("/admin");
  return res.json();
}
