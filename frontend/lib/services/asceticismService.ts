import type { TrackingType, AsceticismStatus } from "@/lib/prisma/enums";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// API response types (these are different from Prisma models as they come from the backend)
export interface Asceticism {
  id: number;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  type: TrackingType;
  isTemplate: boolean;
}

export interface UserAsceticism {
  id: number;
  userId: number;
  asceticismId: number;
  asceticism?: Asceticism;
  status: string;
  startDate: string;
  endDate?: string;
  targetValue?: number;
  logs?: Array<{
    id: number;
    date: string;
    completed: boolean;
    value?: number;
    notes?: string;
  }>;
}

export interface LogEntry {
  userAsceticismId: number;
  date: string; // ISO
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface ProgressLog {
  date: string; // ISO
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface ProgressStats {
  totalDays: number;
  completedDays: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface AsceticismProgress {
  userAsceticismId: number;
  asceticism: Asceticism;
  startDate: string;
  stats: ProgressStats;
  logs: ProgressLog[];
}

export async function getAsceticisms(category?: string): Promise<Asceticism[]> {
  const url = new URL(`${API_URL}/asceticisms/`);
  if (category) url.searchParams.append("category", category);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch asceticisms");
  return res.json();
}

export async function getActiveAsceticismIds(
  userId: number,
): Promise<Set<number>> {
  const userAsceticisms = await getUserAsceticisms(
    userId,
    undefined,
    undefined,
    false,
  ); // Only get active asceticisms
  const ids = new Set<number>();
  userAsceticisms.forEach((ua) => {
    if (ua.asceticismId) {
      ids.add(ua.asceticismId);
    }
  });
  return ids;
}

export async function getUserAsceticisms(
  userId: number,
  startDate?: string,
  endDate?: string,
  includeArchived: boolean = true,
): Promise<UserAsceticism[]> {
  const url = new URL(`${API_URL}/asceticisms/my`);
  url.searchParams.append("userId", userId.toString());

  if (startDate) {
    url.searchParams.append("startDate", startDate);
  }
  if (endDate) {
    url.searchParams.append("endDate", endDate);
  }
  url.searchParams.append("includeArchived", includeArchived.toString());

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch user asceticisms");
  return res.json();
}

export async function getUserProgress(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<AsceticismProgress[]> {
  const url = new URL(`${API_URL}/asceticisms/progress`);
  url.searchParams.append("userId", userId.toString());
  url.searchParams.append("startDate", startDate);
  url.searchParams.append("endDate", endDate);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch progress data");
  return res.json();
}

export async function createAsceticism(
  data: Partial<Asceticism> & { creatorId?: number },
): Promise<Asceticism> {
  const res = await fetch(`${API_URL}/asceticisms/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || errorData.message || "Failed to create asceticism";
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function joinAsceticism(
  userId: number,
  asceticismId: number,
  targetValue?: number,
  startDate?: string,
  endDate?: string,
): Promise<UserAsceticism> {
  const res = await fetch(`${API_URL}/asceticisms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      asceticismId,
      targetValue,
      startDate,
      endDate,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || errorData.message || "Failed to join asceticism";
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function logProgress(entry: LogEntry): Promise<any> {
  const res = await fetch(`${API_URL}/asceticisms/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || errorData.message || "Failed to log progress";
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function updateAsceticism(
  id: number,
  data: Partial<Asceticism> & { creatorId?: number },
): Promise<Asceticism> {
  const res = await fetch(`${API_URL}/asceticisms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update asceticism");
  return res.json();
}

export async function deleteAsceticism(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/asceticisms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to delete asceticism");
  }
}

export async function leaveAsceticism(userAsceticismId: number): Promise<void> {
  const res = await fetch(`${API_URL}/asceticisms/leave/${userAsceticismId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("Leave asceticism error:", res.status, errorText);
    throw new Error(`Failed to leave asceticism: ${errorText}`);
  }
}

export async function updateUserAsceticism(
  userAsceticismId: number,
  data: { startDate?: string; endDate?: string; targetValue?: number },
): Promise<UserAsceticism> {
  const res = await fetch(`${API_URL}/asceticisms/my/${userAsceticismId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update user asceticism");
  return res.json();
}
