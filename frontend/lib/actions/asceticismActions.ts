"use server";

import {
  getAsceticisms,
  getUserAsceticisms,
  getUserProgress,
  createAsceticism,
  joinAsceticism,
  logProgress,
  updateAsceticism,
  deleteAsceticism,
  leaveAsceticism,
  updateUserAsceticism,
  type Asceticism,
  type UserAsceticism,
  type AsceticismProgress,
  type AsceticismCreate,
  type LogEntry,
  type LogResponse,
} from "@/lib/services/asceticismService";
import type { AsceticismStatus } from "@/types/enums";

export async function getAsceticismsAction(
  category?: string,
): Promise<Asceticism[]> {
  return getAsceticisms(category);
}

export async function getUserAsceticismsAction(
  userId: number,
  startDate?: string,
  endDate?: string,
  includeArchived: boolean = true,
): Promise<UserAsceticism[]> {
  return getUserAsceticisms(userId, startDate, endDate, includeArchived);
}

export async function getUserProgressAction(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<AsceticismProgress[]> {
  return getUserProgress(userId, startDate, endDate);
}

export async function createAsceticismAction(
  asceticismData: AsceticismCreate,
): Promise<Asceticism> {
  return createAsceticism(asceticismData);
}

export async function joinAsceticismAction(
  userId: number,
  asceticismId: number,
  targetValue?: number,
  startDate?: string,
  endDate?: string,
): Promise<UserAsceticism> {
  return joinAsceticism(userId, asceticismId, targetValue, startDate, endDate);
}

export async function logProgressAction(entry: LogEntry): Promise<LogResponse> {
  return logProgress(entry);
}

export async function updateAsceticismAction(
  id: number,
  asceticismData: AsceticismCreate,
): Promise<Asceticism> {
  return updateAsceticism(id, asceticismData);
}

export async function deleteAsceticismAction(id: number): Promise<void> {
  return deleteAsceticism(id);
}

export async function leaveAsceticismAction(
  userAsceticismId: number,
): Promise<void> {
  return leaveAsceticism(userAsceticismId);
}

export async function updateUserAsceticismAction(
  userAsceticismId: number,
  updateData: {
    startDate?: string;
    endDate?: string;
    targetValue?: number;
    status?: AsceticismStatus;
  },
): Promise<UserAsceticism> {
  return updateUserAsceticism(userAsceticismId, updateData);
}
