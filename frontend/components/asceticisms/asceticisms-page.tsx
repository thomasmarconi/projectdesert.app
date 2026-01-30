"use client";

import { useSession } from "next-auth/react";
import { useUserAsceticisms } from "@/hooks/use-asceticisms";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { UserAsceticism } from "@/lib/services/asceticismService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, BarChart3 } from "lucide-react";
import CreateAsceticismForm from "./tabs/create-asceticism-form";
import ProgressDashboard from "./tabs/progress-dashboard";
import BrowseAsceticismTemplates from "./tabs/browse-asceticism-templates";
import MyCommitments from "./tabs/my-commitments";
import JoinAsceticismDialog from "./dialogs/join-asceticism-dialog";
import LogProgressDialog from "./dialogs/log-progress-dialog";
import ViewNotesDialog from "./dialogs/view-notes-dialog";
import RemoveAsceticismDialog from "./dialogs/remove-asceticism-dialog";
import SignInPromptDialog from "./dialogs/sign-in-prompt-dialog";

export default function AsceticismsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "ADMIN";

  // Zustand store
  const { viewingDate, showArchived, openLogDialog, openSignInDialog } =
    useAsceticismStore();

  // TanStack Query hooks
  const dateStr = viewingDate.toISOString().split("T")[0];
  const { data: myAsceticisms = [], isLoading: myAsceticismsLoading } =
    useUserAsceticisms(userId, dateStr, dateStr, showArchived);

  const loading = userId && myAsceticismsLoading;

  // === Log Handlers ===
  function handleLogClick(ua: UserAsceticism) {
    const existingLog = getLogForDate(ua);
    openLogDialog(
      ua,
      existingLog?.value?.toString() || "",
      existingLog?.notes || "",
    );
  }

  // === Helper Functions ===
  function getLogForDate(ua: UserAsceticism) {
    const dateStr = viewingDate.toISOString().split("T")[0];
    const logs = ua.logs || [];
    return logs.find((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr;
    });
  }

  if (loading && userId) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-10 max-w-7xl">
      <div className="flex flex-col gap-3 mb-10">
        <h1 className="text-4xl font-bold lg:text-5xl">Asceticism</h1>
        <p className="text-muted-foreground text-lg">
          Discipline your body and soul through daily practices.
        </p>
      </div>

      <Tabs defaultValue="my-commitments" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4 h-auto p-1">
          <TabsTrigger value="my-commitments" className="py-3 px-6">
            My Commitments
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2 py-3 px-6">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="browse" className="py-3 px-6">
            Browse Practices
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2 py-3 px-6">
            <Sparkles className="h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* My Commitments Tab */}
        <TabsContent value="my-commitments" className="mt-8 space-y-6">
          <MyCommitments
            session={session}
            userId={userId}
            myAsceticisms={myAsceticisms}
            handleLogClick={handleLogClick}
            getLogForDate={getLogForDate}
          />
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-8">
          {!session || !userId ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
              <BarChart3 size={64} className="mb-6 text-blue-300 opacity-80" />
              <p className="text-lg font-medium mb-2">
                Visualize Your Progress
              </p>
              <p className="text-sm text-center max-w-md mb-4">
                View detailed analytics, completion streaks, and heatmaps of
                your ascetic practices. Sign in to access your personal
                dashboard.
              </p>
              <Button onClick={openSignInDialog} size="lg" className="mt-2">
                Sign In to View Progress
              </Button>
            </div>
          ) : (
            <ProgressDashboard />
          )}
        </TabsContent>

        {/* Browse Tab */}
        <TabsContent value="browse" className="mt-8">
          <BrowseAsceticismTemplates />
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="mt-8">
          <CreateAsceticismForm
            isAdmin={isAdmin}
            userId={userId ?? undefined}
            disabled={!session || !userId}
          />
        </TabsContent>
      </Tabs>

      <JoinAsceticismDialog />
      <LogProgressDialog />
      <ViewNotesDialog getLogForDate={getLogForDate} onEdit={handleLogClick} />
      <RemoveAsceticismDialog />
      <SignInPromptDialog />
    </div>
  );
}
