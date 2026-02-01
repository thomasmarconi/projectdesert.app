import { getApiClient } from "@/lib/apiClient";
import type { AsceticismStatus } from "@/types/enums";
import type { components } from "@/types/api";

// Export all API types from OpenAPI schema - single source of truth
export type Asceticism = components["schemas"]["AsceticismResponse"];
export type AsceticismCreate = components["schemas"]["AsceticismCreate"];
export type LogEntry = components["schemas"]["LogCreate"];
export type LogResponse = components["schemas"]["LogResponse"];
export type UserAsceticismLink = components["schemas"]["UserAsceticismLink"];
export type UserAsceticismUpdate =
  components["schemas"]["UserAsceticismUpdate"];
export type UserAsceticism = components["schemas"]["UserAsceticismWithDetails"];
export type ProgressLog = components["schemas"]["ProgressLog"];
export type ProgressStats = components["schemas"]["ProgressStats"];
export type AsceticismProgress =
  components["schemas"]["AsceticismProgressResponse"];

export async function getAsceticisms(category?: string): Promise<Asceticism[]> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/asceticisms/", {
    params: category ? { query: { category } } : undefined,
  });

  if (error) {
    throw new Error("Failed to fetch asceticisms");
  }

  return data || [];
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
  const client = await getApiClient();
  const { data, error } = await client.GET("/asceticisms/my", {
    params: {
      query: {
        userId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeArchived,
      },
    },
  });

  if (error) {
    throw new Error("Failed to fetch user asceticisms");
  }

  return data || [];
}

export async function getUserProgress(
  userId: number,
  startDate: string,
  endDate: string,
): Promise<AsceticismProgress[]> {
  const client = await getApiClient();
  const { data, error } = await client.GET("/asceticisms/progress", {
    params: {
      query: {
        userId,
        startDate,
        endDate,
      },
    },
  });

  if (error) {
    throw new Error("Failed to fetch progress data");
  }

  return data || [];
}

export async function createAsceticism(
  asceticismData: AsceticismCreate,
): Promise<Asceticism> {
  const client = await getApiClient();
  const { data, error } = await client.POST("/asceticisms/", {
    body: asceticismData,
  });

  if (error) {
    const detail = error.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : (detail as unknown as string) || "Failed to create asceticism";
    throw new Error(errorMessage);
  }

  return data!;
}

export async function joinAsceticism(
  userId: number,
  asceticismId: number,
  targetValue?: number,
  startDate?: string,
  endDate?: string,
): Promise<UserAsceticism> {
  const client = await getApiClient();
  const { data, error } = await client.POST("/asceticisms/join", {
    body: {
      userId,
      asceticismId,
      targetValue: targetValue || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      custom_metadata: undefined,
    },
  });

  if (error) {
    const detail = error.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : (detail as unknown as string) || "Failed to join asceticism";
    throw new Error(errorMessage);
  }

  return data!;
}

export async function logProgress(entry: LogEntry): Promise<LogResponse> {
  const client = await getApiClient();
  const { data, error } = await client.POST("/asceticisms/log", {
    body: entry,
  });

  if (error) {
    const detail = error.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : (detail as unknown as string) || "Failed to log progress";
    throw new Error(errorMessage);
  }

  return data!;
}

export async function updateAsceticism(
  id: number,
  asceticismData: AsceticismCreate,
): Promise<Asceticism> {
  const client = await getApiClient();
  const { data, error } = await client.PUT("/asceticisms/{asceticism_id}", {
    params: {
      path: {
        asceticism_id: id,
      },
    },
    body: asceticismData,
  });

  if (error) {
    throw new Error("Failed to update asceticism");
  }

  return data!;
}

export async function deleteAsceticism(id: number): Promise<void> {
  const client = await getApiClient();
  const { error } = await client.DELETE("/asceticisms/{asceticism_id}", {
    params: {
      path: {
        asceticism_id: id,
      },
    },
  });

  if (error) {
    const detail = error.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : (detail as unknown as string) || "Failed to delete asceticism";
    throw new Error(errorMessage);
  }
}

export async function leaveAsceticism(userAsceticismId: number): Promise<void> {
  const client = await getApiClient();
  const { error } = await client.DELETE(
    "/asceticisms/leave/{user_asceticism_id}",
    {
      params: {
        path: {
          user_asceticism_id: userAsceticismId,
        },
      },
    },
  );

  if (error) {
    console.error("Leave asceticism error:", error);
    const detail = error.detail;
    const errorMessage = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(", ")
      : (detail as unknown as string) || "Unknown error";
    throw new Error(`Failed to leave asceticism: ${errorMessage}`);
  }
}

export async function updateUserAsceticism(
  userAsceticismId: number,
  updateData: {
    startDate?: string;
    endDate?: string;
    targetValue?: number;
    status?: AsceticismStatus;
  },
): Promise<UserAsceticism> {
  const client = await getApiClient();
  const { data, error } = await client.PATCH(
    "/asceticisms/my/{user_asceticism_id}",
    {
      params: {
        path: {
          user_asceticism_id: userAsceticismId,
        },
      },
      body: updateData,
    },
  );

  if (error) {
    throw new Error("Failed to update user asceticism");
  }

  return data!;
}
