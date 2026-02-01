import { getApiClient } from "@/lib/apiClient";
import type { components } from "@/types/api";

// Export all API types from OpenAPI schema - single source of truth
export type DailyReadingNote =
  components["schemas"]["DailyReadingNoteResponse"];
export type ReadingText = components["schemas"]["ReadingText"];
export type MassReading = components["schemas"]["MassReadingResponse"];

// Helper to extract error message from API response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getErrorMessage(detail: any, defaultMsg: string): string {
  if (!detail) return defaultMsg;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return detail.map((e: any) => e.msg).join(", ");
  }
  return defaultMsg;
}

/**
 * Fetch Mass readings from our backend API for a specific date
 * @param date - Date in YYYYMMDD format
 * @returns MassReading object
 */
export async function getMassReadings(date: string): Promise<MassReading> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/daily-readings/readings/{date}", {
    params: {
      path: {
        date,
      },
    },
  });

  if (error) {
    console.error("Error fetching Mass readings:", error);
    throw new Error("Failed to fetch Mass readings");
  }

  return data!;
}

/**
 * Format a Date object to YYYYMMDD string for Universalis API
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Clean HTML tags from reading text
 */
export function cleanHTML(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: simple regex cleanup
    return html.replace(/<[^>]*>/g, "");
  }
  // Client-side: use DOM parser
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// --- API calls for notes ---

/**
 * Create or update a daily reading note
 */
export async function saveReadingNote(
  userId: number,
  date: string,
  notes: string,
): Promise<DailyReadingNote> {
  const client = await getApiClient();
  const { data, error } = await client.POST("/daily-readings/notes", {
    body: {
      userId,
      date,
      notes,
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to save note"));
  }

  return data!;
}

/**
 * Get a daily reading note for a specific date
 */
export async function getReadingNote(
  userId: number,
  date: string,
): Promise<DailyReadingNote | null> {
  const client = await getApiClient();
  const { data, error, response } = await client.GET(
    "/daily-readings/notes/{user_id}/{date}",
    {
      params: {
        path: {
          user_id: userId,
          date,
        },
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to fetch note"));
  }

  return data!;
}

/**
 * Get all daily reading notes for a user
 */
export async function getAllUserNotes(
  userId: number,
  limit: number = 30,
): Promise<DailyReadingNote[]> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/daily-readings/notes/{user_id}", {
    params: {
      path: {
        user_id: userId,
      },
      query: {
        limit,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to fetch notes"));
  }

  return data || [];
}

/**
 * Delete a daily reading note
 */
export async function deleteReadingNote(noteId: number): Promise<void> {
  const client = await getApiClient();
  const { error } = await client.DELETE("/daily-readings/notes/{note_id}", {
    params: {
      path: {
        note_id: noteId,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.detail, "Failed to delete note"));
  }
}
