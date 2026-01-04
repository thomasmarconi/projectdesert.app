const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Asceticism {
  id: number;
  title: string;
  description?: string;
  category: string;
  icon?: string;
  type: "BOOLEAN" | "NUMERIC" | "TEXT";
  isTemplate: boolean;
}

export interface UserAsceticism {
  id: number;
  userId: number;
  asceticismId: number;
  asceticism?: Asceticism;
  status: string;
  startDate: string;
  targetValue?: number;
}

export interface LogEntry {
  userAsceticismId: number;
  date: string; // ISO
  completed: boolean;
  value?: number;
  notes?: string;
}

export async function getAsceticisms(category?: string): Promise<Asceticism[]> {
  const url = new URL(`${API_URL}/asceticisms/`);
  if (category) url.searchParams.append("category", category);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch asceticisms");
  return res.json();
}

export async function getUserAsceticisms(
  userId: number
): Promise<UserAsceticism[]> {
  const res = await fetch(`${API_URL}/asceticisms/my?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user asceticisms");
  return res.json();
}

export async function createAsceticism(
  data: Partial<Asceticism> & { creatorId?: number }
): Promise<Asceticism> {
  const res = await fetch(`${API_URL}/asceticisms/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create asceticism");
  return res.json();
}

export async function joinAsceticism(
  userId: number,
  asceticismId: number,
  targetValue?: number
): Promise<UserAsceticism> {
  const res = await fetch(`${API_URL}/asceticisms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, asceticismId, targetValue }),
  });
  if (!res.ok) throw new Error("Failed to join asceticism");
  return res.json();
}

export async function logProgress(entry: LogEntry): Promise<any> {
  const res = await fetch(`${API_URL}/asceticisms/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error("Failed to log progress");
  return res.json();
}
