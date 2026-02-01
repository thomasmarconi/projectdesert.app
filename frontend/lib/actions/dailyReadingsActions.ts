"use server";

import {
  getMassReadings,
  saveReadingNote,
  getReadingNote,
  getAllUserNotes,
  deleteReadingNote,
  type MassReading,
  type DailyReadingNote,
} from "@/lib/services/dailyReadingsService";

export async function getMassReadingsAction(
  date: string,
): Promise<MassReading> {
  return getMassReadings(date);
}

export async function saveReadingNoteAction(
  userId: number,
  date: string,
  notes: string,
): Promise<DailyReadingNote> {
  return saveReadingNote(userId, date, notes);
}

export async function getReadingNoteAction(
  userId: number,
  date: string,
): Promise<DailyReadingNote | null> {
  return getReadingNote(userId, date);
}

export async function getAllUserNotesAction(
  userId: number,
  limit: number = 30,
): Promise<DailyReadingNote[]> {
  return getAllUserNotes(userId, limit);
}

export async function deleteReadingNoteAction(noteId: number): Promise<void> {
  return deleteReadingNote(noteId);
}
