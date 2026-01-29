"use client";

// Updated with improved styling and spacing
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getAsceticisms,
  getUserAsceticisms,
  joinAsceticism,
  logProgress,
  leaveAsceticism,
  updateUserAsceticism,
  Asceticism,
  UserAsceticism,
} from "@/lib/services/asceticismService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Check,
  Plus,
  Flame,
  Activity,
  Sparkles,
  BarChart3,
  X,
  Edit,
  Calendar as CalendarIcon,
  Utensils,
  Heart,
  Brain,
  Moon,
  Book,
  Dumbbell,
  Droplet,
  Leaf,
  Zap,
  Hash,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import CreateAsceticismForm from "./create-asceticism-form";
import ProgressDashboard from "./progress-dashboard";
import { Textarea } from "@/components/ui/textarea";
import GoogleSignIn from "@/components/auth/google-sign-in";

export default function AsceticismsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isAdmin = session?.user?.role === "ADMIN";

  const [templates, setTemplates] = useState<Asceticism[]>([]);
  const [myAsceticisms, setMyAsceticisms] = useState<UserAsceticism[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDate, setViewingDate] = useState<Date>(new Date());
  const [completingAll, setCompletingAll] = useState(false);

  // Join dialog state
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [joinStartDate, setJoinStartDate] = useState<Date | undefined>(
    new Date(),
  );
  const [joinEndDate, setJoinEndDate] = useState<Date | undefined>(undefined);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAsceticism, setEditingAsceticism] =
    useState<UserAsceticism | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);

  // Log dialog state for numeric and text types
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logUserAsceticismId, setLogUserAsceticismId] = useState<number | null>(
    null,
  );
  const [logValue, setLogValue] = useState<string>("");
  const [logNotes, setLogNotes] = useState<string>("");
  const [logType, setLogType] = useState<"BOOLEAN" | "NUMERIC" | "TEXT">(
    "BOOLEAN",
  );
  const [isEditingLog, setIsEditingLog] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAsceticismId, setDeleteAsceticismId] = useState<number | null>(
    null,
  );
  const [deleteAsceticismTitle, setDeleteAsceticismTitle] =
    useState<string>("");

  // Sign-in prompt dialog state
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  // View details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingAsceticism, setViewingAsceticism] =
    useState<UserAsceticism | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    try {
      // Always fetch templates (for browse tab)
      const all = await getAsceticisms();
      setTemplates(all);

      // Only fetch user asceticisms if authenticated
      if (userId) {
        // Fetch logs for 90 days before and 1 day after (to cover today)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const mine = await getUserAsceticisms(
          userId,
          startDate.toISOString(),
          endDate.toISOString(),
        );
        setMyAsceticisms(mine);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load asceticisms");
    } finally {
      setLoading(false);
    }
  }

  function handleJoinClick(id: number) {
    if (!session || !userId) {
      setSignInDialogOpen(true);
      return;
    }
    setSelectedTemplateId(id);
    setJoinStartDate(new Date());
    setJoinEndDate(undefined);
    setJoinDialogOpen(true);
  }

  async function handleJoinConfirm() {
    if (!selectedTemplateId || !userId) return;

    try {
      await joinAsceticism(
        userId,
        selectedTemplateId,
        undefined,
        joinStartDate?.toISOString(),
        joinEndDate?.toISOString(),
      );
      toast.success("Joined asceticism!");
      setJoinDialogOpen(false);
      fetchData();
    } catch (e: any) {
      console.error("Failed to join asceticism:", e);
      toast.error(e.message || "Failed to join.");
    }
  }

  function handleEditClick(ua: UserAsceticism) {
    setEditingAsceticism(ua);
    setEditStartDate(new Date(ua.startDate));
    setEditEndDate(ua.endDate ? new Date(ua.endDate) : undefined);
    setEditDialogOpen(true);
  }

  async function handleEditConfirm() {
    if (!editingAsceticism) return;

    try {
      await updateUserAsceticism(editingAsceticism.id, {
        startDate: editStartDate?.toISOString(),
        endDate: editEndDate?.toISOString(),
      });
      toast.success("Commitment dates updated!");
      setEditDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error("Failed to update commitment.");
    }
  }

  async function handleLog(
    userAsceticismId: number,
    type: "BOOLEAN" | "NUMERIC" | "TEXT",
  ) {
    // Check if already logged for this date
    const ua = myAsceticisms.find((a) => a.id === userAsceticismId);
    const existingLog = ua ? getLogForDate(ua) : null;

    if (existingLog) {
      // User is editing an existing log
      setIsEditingLog(true);
      setLogUserAsceticismId(userAsceticismId);
      setLogType(type);
      setLogValue(existingLog.value?.toString() || "");
      setLogNotes(existingLog.notes || "");
    } else {
      // User is creating a new log
      setIsEditingLog(false);
      setLogUserAsceticismId(userAsceticismId);
      setLogType(type);
      setLogValue("");
      setLogNotes("");
    }
    setLogDialogOpen(true);
  }

  async function handleLogConfirm() {
    if (!logUserAsceticismId) return;

    // Use date-only format to match backend expectations (YYYY-MM-DD)
    const date = viewingDate.toISOString().split("T")[0];
    try {
      const logData: any = {
        completed: true,
      };

      if (logType === "NUMERIC") {
        const numValue = parseFloat(logValue);
        if (isNaN(numValue)) {
          toast.error("Please enter a valid number");
          return;
        }
        logData.value = numValue;
      } else if (logType === "TEXT") {
        if (!logNotes.trim()) {
          toast.error("Please enter some text");
          return;
        }
        logData.notes = logNotes;
      }

      // Add notes for all types if provided
      if (logNotes.trim()) {
        logData.notes = logNotes;
      }

      // Always use upsert endpoint - it handles both create and update
      await logProgress({
        userAsceticismId: logUserAsceticismId,
        date,
        completed: true,
        value: logData.value,
        notes: logData.notes,
      });

      toast.success(isEditingLog ? "Progress updated!" : "Progress logged!");

      setLogDialogOpen(false);
      setIsEditingLog(false);
      fetchData();
    } catch (e) {
      console.error("Failed to log progress:", e);
      toast.error("Failed to log progress.");
    }
  }

  function handleLeaveClick(userAsceticismId: number, title: string) {
    setDeleteAsceticismId(userAsceticismId);
    setDeleteAsceticismTitle(title);
    setDeleteDialogOpen(true);
  }

  async function handleLeaveConfirm() {
    if (!deleteAsceticismId) return;

    try {
      await leaveAsceticism(deleteAsceticismId);
      toast.success(`Removed "${deleteAsceticismTitle}" from your commitments`);
      setDeleteDialogOpen(false);
      await fetchData();
    } catch (e) {
      console.error("Error leaving asceticism:", e);
      toast.error("Failed to remove commitment.");
    }
  }

  // Helper function to check if an asceticism has been logged on viewing date
  function hasLoggedOnDate(ua: UserAsceticism): boolean {
    const dateStr = viewingDate.toISOString().split("T")[0];
    const logs = ua.logs || [];
    return logs.some((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr && log.completed;
    });
  }

  // Helper to get the log for the viewing date
  function getLogForDate(ua: UserAsceticism) {
    const dateStr = viewingDate.toISOString().split("T")[0];
    const logs = ua.logs || [];
    return logs.find((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr;
    });
  }

  // Check if viewing date is today
  function isViewingToday(): boolean {
    const today = new Date();
    return (
      viewingDate.toISOString().split("T")[0] ===
      today.toISOString().split("T")[0]
    );
  }

  // Check if viewing date is in the future
  function isViewingFuture(): boolean {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const viewingStr = viewingDate.toISOString().split("T")[0];
    return viewingStr > todayStr;
  }

  // Navigate to previous day
  function goToPreviousDay() {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() - 1);
    setViewingDate(newDate);
  }

  // Navigate to next day
  function goToNextDay() {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() + 1);
    setViewingDate(newDate);
  }

  // Go to today
  function goToToday() {
    setViewingDate(new Date());
  }

  // View details of an asceticism
  function handleViewDetails(ua: UserAsceticism) {
    setViewingAsceticism(ua);
    setDetailsDialogOpen(true);
  }

  // Complete all boolean asceticisms for today
  async function handleCompleteAll() {
    if (!isViewingToday()) {
      toast.error("You can only complete asceticisms for today");
      return;
    }

    setCompletingAll(true);
    try {
      const booleanAsceticisms = myAsceticisms.filter(
        (ua) => ua.asceticism?.type === "BOOLEAN" && !hasLoggedOnDate(ua),
      );

      if (booleanAsceticisms.length === 0) {
        toast.info("All boolean practices already completed for today!");
        return;
      }

      const date = new Date().toISOString();
      await Promise.all(
        booleanAsceticisms.map((ua) =>
          logProgress({
            userAsceticismId: ua.id,
            date,
            completed: true,
          }),
        ),
      );

      toast.success(`Completed ${booleanAsceticisms.length} practices!`);
      fetchData();
    } catch (e) {
      toast.error("Failed to complete all practices.");
    } finally {
      setCompletingAll(false);
    }
  }

  // Helper to convert category to title case
  function toTitleCase(str: string): string {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Get the icon component for a category
  function getCategoryIcon(category: string, className?: string) {
    const iconMap: Record<string, any> = {
      fasting: Utensils,
      prayer: Heart,
      meditation: Brain,
      sleep: Moon,
      reading: Book,
      exercise: Dumbbell,
      "cold-exposure": Droplet,
      nature: Leaf,
      energy: Zap,
      other: Sparkles,
    };

    const IconComponent = iconMap[category.toLowerCase()] || Sparkles;
    return <IconComponent className={className} />;
  }

  // Get the icon for asceticism type
  function getTypeIcon(type: string, className?: string) {
    const iconMap: Record<string, any> = {
      BOOLEAN: Check,
      NUMERIC: Hash,
      TEXT: FileText,
    };

    const IconComponent = iconMap[type] || Check;
    return <IconComponent className={className} />;
  }

  if (loading && userId)
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

        <TabsContent value="my-commitments" className="mt-8 space-y-6">
          {!session || !userId ? (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
              <Flame size={64} className="mb-6 text-orange-300 opacity-80" />
              <p className="text-lg font-medium mb-2">
                Track Your Daily Practices
              </p>
              <p className="text-sm text-center max-w-md mb-4">
                View your active commitments, log daily progress, and track
                completion history. Sign in to start your ascetic journey.
              </p>
              <Button
                onClick={() => setSignInDialogOpen(true)}
                size="lg"
                className="mt-2"
              >
                Sign In to Get Started
              </Button>
            </div>
          ) : (
            <>
              {/* Date Navigation */}
              <div className="flex items-center justify-between bg-card border rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousDay}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "min-w-45 justify-start text-left font-normal h-8 text-sm",
                          !viewingDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {viewingDate
                          ? format(viewingDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={viewingDate}
                        onSelect={(date) => date && setViewingDate(date)}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextDay}
                    disabled={isViewingToday() || isViewingFuture()}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {!isViewingToday() && (
                    <Button
                      variant="secondary"
                      onClick={goToToday}
                      size="sm"
                      className="h-8"
                    >
                      Today
                    </Button>
                  )}
                </div>

                {isViewingToday() &&
                  myAsceticisms.some(
                    (ua) =>
                      ua.asceticism?.type === "BOOLEAN" && !hasLoggedOnDate(ua),
                  ) && (
                    <Button
                      onClick={handleCompleteAll}
                      disabled={completingAll}
                      variant="default"
                      size="sm"
                      className="gap-2 h-8"
                    >
                      {completingAll ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Complete All
                        </>
                      )}
                    </Button>
                  )}
              </div>

              {/* Compact List View */}
              <div className="space-y-1.5">
                {myAsceticisms.map((ua) => {
                  const logged = hasLoggedOnDate(ua);
                  const logEntry = getLogForDate(ua);
                  const type = ua.asceticism?.type || "BOOLEAN";
                  const isToday = isViewingToday();

                  return (
                    <div
                      key={ua.id}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                        logged && "bg-muted/30",
                      )}
                    >
                      {/* Left: Icon + Title + Description */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                          {getCategoryIcon(
                            ua.asceticism?.category || "custom",
                            "w-4 h-4 text-muted-foreground",
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-medium text-sm truncate">
                              {ua.asceticism?.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-xs shrink-0"
                            >
                              {type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {ua.asceticism?.description || "Daily practice."}
                          </p>
                          {logEntry && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                              {type === "NUMERIC" &&
                                logEntry.value !== undefined && (
                                  <span className="font-medium text-blue-600 dark:text-blue-400">
                                    {logEntry.value}
                                    {ua.targetValue && ` / ${ua.targetValue}`}
                                  </span>
                                )}
                              {logEntry.notes && (
                                <span className="line-clamp-1 italic text-purple-600 dark:text-purple-400">
                                  "{logEntry.notes}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Action Button + Menu */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => handleLog(ua.id, type)}
                          size="sm"
                          variant={logged ? "secondary" : "default"}
                          disabled={isViewingFuture()}
                          className={cn(
                            "h-8 px-3 gap-1.5",
                            logged && "opacity-70",
                          )}
                        >
                          {type === "BOOLEAN" ? (
                            logged ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <div className="h-3.5 w-3.5 rounded border-2 border-current" />
                            )
                          ) : (
                            getTypeIcon(type, "h-3.5 w-3.5")
                          )}
                          <span className="text-xs">
                            {logged
                              ? type === "BOOLEAN"
                                ? "Done"
                                : "Logged"
                              : type === "BOOLEAN"
                                ? "Log"
                                : "Add"}
                          </span>
                        </Button>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(ua);
                            }}
                            title="View details and notes"
                          >
                            <Activity className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(ua);
                            }}
                            title="Edit dates"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveClick(
                                ua.id,
                                ua.asceticism?.title || "this practice",
                              );
                            }}
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {myAsceticisms.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                    <Flame
                      size={64}
                      className="mb-6 text-orange-300 opacity-80"
                    />
                    <p className="text-lg font-medium mb-2">
                      You haven't committed to any practices yet.
                    </p>
                    <p className="text-sm">
                      Switch to "Browse Practices" to get started.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>

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
              <Button
                onClick={() => setSignInDialogOpen(true)}
                size="lg"
                className="mt-2"
              >
                Sign In to View Progress
              </Button>
            </div>
          ) : (
            <ProgressDashboard />
          )}
        </TabsContent>

        <TabsContent value="browse" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map((t) => (
              <Card
                key={t.id}
                className="hover:border-primary/50 transition-all hover:shadow-lg relative overflow-hidden shadow-md flex flex-col"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  {getCategoryIcon(t.category, "w-20 h-20")}
                </div>
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <Badge variant="secondary" className="px-3 py-1">
                      {getCategoryIcon(t.category, "w-3 h-3 mr-1.5 inline")}
                      {toTitleCase(t.category)}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      {getTypeIcon(t.type, "w-3 h-3 mr-1.5 inline")}
                      {t.type}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    {t.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {t.description || "No description available."}
                  </p>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    onClick={() => handleJoinClick(t.id)}
                    variant="default"
                    className="w-full gap-2 h-11 text-base font-medium"
                  >
                    <Plus size={18} /> Start Practice
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full text-center p-16 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-lg font-medium">
                  No templates found. Contact an admin about creating some.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-8">
          <CreateAsceticismForm
            onSuccess={fetchData}
            isAdmin={isAdmin}
            userId={userId ?? undefined}
            disabled={!session || !userId}
            onSignInClick={() => setSignInDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Join Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Set Commitment Dates</DialogTitle>
            <DialogDescription className="text-base">
              Choose when you want to start and optionally end this practice.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !joinStartDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joinStartDate
                      ? format(joinStartDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={joinStartDate}
                    onSelect={setJoinStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !joinEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joinEndDate ? format(joinEndDate, "PPP") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={joinEndDate}
                    onSelect={setJoinEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {joinEndDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setJoinEndDate(undefined)}
                  className="w-full h-9 mt-2"
                >
                  Clear End Date
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setJoinDialogOpen(false)}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleJoinConfirm} className="h-10 px-6">
              Start Practice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Edit Commitment Dates</DialogTitle>
            <DialogDescription className="text-base">
              Update the start and end dates for{" "}
              {editingAsceticism?.asceticism?.title}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !editStartDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editStartDate
                      ? format(editStartDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editStartDate}
                    onSelect={setEditStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !editEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editEndDate ? format(editEndDate, "PPP") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editEndDate}
                    onSelect={setEditEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {editEndDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditEndDate(undefined)}
                  className="w-full h-9 mt-2"
                >
                  Clear End Date
                </Button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleEditConfirm} className="h-10 px-6">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Dialog for all types */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">
              {isEditingLog ? "Edit" : "Log"} Progress{" "}
              {logType === "NUMERIC"
                ? "- Enter Value"
                : logType === "TEXT"
                  ? "- Add Entry"
                  : ""}
            </DialogTitle>
            <DialogDescription className="text-base">
              {isEditingLog
                ? "Update the notes or value for today's entry."
                : logType === "NUMERIC"
                  ? "Enter the numeric value for today's progress."
                  : logType === "TEXT"
                    ? "Write your journal entry or notes for today."
                    : "Mark as complete and optionally add notes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {logType === "NUMERIC" && (
              <div className="space-y-3">
                <Label htmlFor="log-value" className="text-sm font-medium">
                  Value
                </Label>
                <Input
                  id="log-value"
                  type="number"
                  placeholder="e.g., 30 (minutes), 5 (reps), etc."
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>
            )}
            {logType === "TEXT" && (
              <div className="space-y-3">
                <Label htmlFor="log-notes" className="text-sm font-medium">
                  Your Entry
                </Label>
                <Textarea
                  id="log-notes"
                  placeholder="Write your thoughts, reflections, or notes..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={6}
                  className="resize-none"
                  autoFocus
                />
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="log-notes-input" className="text-sm font-medium">
                {logType === "TEXT"
                  ? "Additional Notes (Optional)"
                  : "Notes (Optional)"}
              </Label>
              <Textarea
                id="log-notes-input"
                placeholder="Any additional context or notes..."
                value={logType === "TEXT" ? "" : logNotes}
                onChange={(e) =>
                  logType !== "TEXT" && setLogNotes(e.target.value)
                }
                rows={logType === "BOOLEAN" ? 4 : 3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLogDialogOpen(false);
                setIsEditingLog(false);
              }}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleLogConfirm} className="h-10 px-6">
              {isEditingLog ? "Update Progress" : "Log Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Remove Commitment?</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to remove "{deleteAsceticismTitle}" from
              your commitments? This action will archive the commitment and its
              progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveConfirm}
              className="h-10 px-6"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign In Dialog */}
      <Dialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Sign In Required</DialogTitle>
            <DialogDescription className="text-base">
              Please sign in to start tracking your ascetic practices. Create an
              account or sign in to access all features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setSignInDialogOpen(false)}
              className="h-10 px-6 mr-2"
            >
              Cancel
            </Button>
            <GoogleSignIn />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-175 max-h-[80vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">
              {viewingAsceticism?.asceticism?.title}
            </DialogTitle>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="px-3 py-1">
                {getCategoryIcon(
                  viewingAsceticism?.asceticism?.category || "custom",
                  "w-3 h-3 mr-1.5 inline",
                )}
                {toTitleCase(
                  viewingAsceticism?.asceticism?.category || "custom",
                )}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {getTypeIcon(
                  viewingAsceticism?.asceticism?.type || "BOOLEAN",
                  "w-3 h-3 mr-1.5 inline",
                )}
                {viewingAsceticism?.asceticism?.type}
              </Badge>
            </div>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm leading-relaxed">
                {viewingAsceticism?.asceticism?.description ||
                  "Daily practice."}
              </p>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Timeline
              </h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Started:</span>{" "}
                  {viewingAsceticism?.startDate &&
                    new Date(viewingAsceticism.startDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                </div>
                {viewingAsceticism?.endDate && (
                  <div>
                    <span className="font-medium">Ends:</span>{" "}
                    {new Date(viewingAsceticism.endDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Target Value for Numeric */}
            {viewingAsceticism?.asceticism?.type === "NUMERIC" &&
              viewingAsceticism?.targetValue && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Target
                  </h3>
                  <p className="text-sm font-medium">
                    {viewingAsceticism.targetValue}
                  </p>
                </div>
              )}

            {/* Recent Notes/Logs */}
            {viewingAsceticism?.logs && viewingAsceticism.logs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Recent Activity
                </h3>
                <div className="space-y-2 max-h-75 overflow-y-auto">
                  {viewingAsceticism.logs
                    .filter((log) => log.notes || log.value !== undefined)
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .slice(0, 10)
                    .map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-muted-foreground">
                            {new Date(log.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {log.value !== undefined && (
                            <Badge variant="secondary" className="h-5 text-xs">
                              Value: {log.value}
                            </Badge>
                          )}
                        </div>
                        {log.notes && (
                          <p className="text-sm leading-relaxed pt-1">
                            {log.notes}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
              className="h-10 px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
