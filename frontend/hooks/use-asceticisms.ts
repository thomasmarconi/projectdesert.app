import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAsceticisms,
  getUserAsceticisms,
  joinAsceticism,
  logProgress,
  leaveAsceticism,
  updateUserAsceticism,
} from "@/lib/services/asceticismService";
import { toast } from "sonner";
import { AsceticismStatus } from "@/types/enums";

// Query keys
export const asceticismKeys = {
  all: ["asceticisms"] as const,
  templates: () => [...asceticismKeys.all, "templates"] as const,
  userAsceticisms: (
    userId: string,
    startDate?: string,
    endDate?: string,
    showArchived?: boolean,
  ) =>
    [
      ...asceticismKeys.all,
      "user",
      userId,
      startDate,
      endDate,
      showArchived,
    ] as const,
};

// Fetch all asceticism templates
export function useAsceticismTemplates() {
  return useQuery({
    queryKey: asceticismKeys.templates(),
    queryFn: () => getAsceticisms(),
  });
}

// Fetch user's asceticisms with optional date range
export function useUserAsceticisms(
  userId: string | undefined,
  startDate?: string,
  endDate?: string,
  showArchived?: boolean,
) {
  return useQuery({
    queryKey: asceticismKeys.userAsceticisms(
      userId || "",
      startDate,
      endDate,
      showArchived,
    ),
    queryFn: () =>
      getUserAsceticisms(parseInt(userId!), startDate, endDate, showArchived),
    enabled: !!userId,
  });
}

// Join an asceticism
export function useJoinAsceticism() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      asceticismId,
      targetValue,
      startDate,
      endDate,
    }: {
      userId: string;
      asceticismId: number;
      targetValue?: number;
      startDate?: string;
      endDate?: string;
    }) =>
      joinAsceticism(
        parseInt(userId),
        asceticismId,
        targetValue,
        startDate,
        endDate,
      ),
    onSuccess: (newUserAsceticism, variables) => {
      // Invalidate all user asceticism queries for this user
      queryClient.invalidateQueries({
        queryKey: [...asceticismKeys.all, "user", variables.userId],
      });

      toast.success(
        `Started tracking "${newUserAsceticism.asceticism?.title}"!`,
      );
    },
    onError: (error) => {
      console.error("Failed to join asceticism:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join.");
    },
  });
}

// Log progress
export function useLogProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userAsceticismId,
      date,
      completed,
      value,
      notes,
    }: {
      userAsceticismId: number;
      date: string;
      completed: boolean;
      value?: number;
      notes?: string;
    }) => logProgress({ userAsceticismId, date, completed, value, notes }),
    onSuccess: () => {
      // Invalidate all user asceticism queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: [...asceticismKeys.all, "user"],
      });
    },
    onError: (error) => {
      console.error("Failed to log progress:", error);
      toast.error("Failed to log progress.");
    },
  });
}

// Leave an asceticism
export function useLeaveAsceticism() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userAsceticismId: number) => leaveAsceticism(userAsceticismId),
    onSuccess: () => {
      // Invalidate all user asceticism queries
      queryClient.invalidateQueries({
        queryKey: [...asceticismKeys.all, "user"],
      });
    },
    onError: (error) => {
      console.error("Error leaving asceticism:", error);
      toast.error("Failed to remove commitment.");
    },
  });
}

// Update user asceticism settings
export function useUpdateUserAsceticism() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userAsceticismId,
      startDate,
      endDate,
      targetValue,
      status,
    }: {
      userAsceticismId: number;
      startDate?: string;
      endDate?: string;
      targetValue?: number;
      status?: AsceticismStatus;
    }) =>
      updateUserAsceticism(userAsceticismId, {
        startDate,
        endDate,
        targetValue,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...asceticismKeys.all, "user"],
      });
      toast.success("Settings updated!");
    },
    onError: (error) => {
      console.error("Failed to update asceticism:", error);
      toast.error("Failed to update settings.");
    },
  });
}
