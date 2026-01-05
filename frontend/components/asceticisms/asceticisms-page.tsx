"use client";

// Updated with improved styling and spacing
import { useEffect, useState } from "react";
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

const TEST_USER_ID = 1;
// TODO: Replace with actual user role check from authentication
const IS_ADMIN = false; // Set to true for testing admin features

export default function AsceticismsPage() {
  const [templates, setTemplates] = useState<Asceticism[]>([]);
  const [myAsceticisms, setMyAsceticisms] = useState<UserAsceticism[]>([]);
  const [loading, setLoading] = useState(true);

  // Join dialog state
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null
  );
  const [joinStartDate, setJoinStartDate] = useState<Date | undefined>(
    new Date()
  );
  const [joinEndDate, setJoinEndDate] = useState<Date | undefined>(undefined);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAsceticism, setEditingAsceticism] =
    useState<UserAsceticism | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(
    undefined
  );
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);

  // Log dialog state for numeric and text types
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logUserAsceticismId, setLogUserAsceticismId] = useState<number | null>(
    null
  );
  const [logValue, setLogValue] = useState<string>("");
  const [logNotes, setLogNotes] = useState<string>("");
  const [logType, setLogType] = useState<"BOOLEAN" | "NUMERIC" | "TEXT">(
    "BOOLEAN"
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAsceticismId, setDeleteAsceticismId] = useState<number | null>(
    null
  );
  const [deleteAsceticismTitle, setDeleteAsceticismTitle] =
    useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        getAsceticisms(),
        getUserAsceticisms(TEST_USER_ID),
      ]);
      setTemplates(all);
      setMyAsceticisms(mine);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load asceticisms");
    } finally {
      setLoading(false);
    }
  }

  function handleJoinClick(id: number) {
    setSelectedTemplateId(id);
    setJoinStartDate(new Date());
    setJoinEndDate(undefined);
    setJoinDialogOpen(true);
  }

  async function handleJoinConfirm() {
    if (!selectedTemplateId) return;

    try {
      await joinAsceticism(
        TEST_USER_ID,
        selectedTemplateId,
        undefined,
        joinStartDate?.toISOString(),
        joinEndDate?.toISOString()
      );
      toast.success("Joined asceticism!");
      setJoinDialogOpen(false);
      fetchData();
    } catch (e) {
      toast.error("Failed to join.");
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
    type: "BOOLEAN" | "NUMERIC" | "TEXT"
  ) {
    if (type === "NUMERIC" || type === "TEXT") {
      // Open dialog for numeric/text input
      setLogUserAsceticismId(userAsceticismId);
      setLogType(type);
      setLogValue("");
      setLogNotes("");
      setLogDialogOpen(true);
    } else {
      // Boolean type - log directly
      const date = new Date().toISOString();
      try {
        await logProgress({
          userAsceticismId,
          date,
          completed: true,
        });
        toast.success("Progress logged for today!");
        fetchData();
      } catch (e) {
        toast.error("Failed to log progress.");
      }
    }
  }

  async function handleLogConfirm() {
    if (!logUserAsceticismId) return;

    const date = new Date().toISOString();
    try {
      const logData: any = {
        userAsceticismId: logUserAsceticismId,
        date,
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

      await logProgress(logData);
      toast.success("Progress logged for today!");
      setLogDialogOpen(false);
      fetchData();
    } catch (e) {
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

  // Helper function to check if an asceticism has been logged today
  function hasLoggedToday(ua: UserAsceticism): boolean {
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Check if there's a log entry for today
    const logs = ua.logs || [];
    return logs.some((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === todayStr && log.completed;
    });
  }

  // Get the icon component for a category
  function getCategoryIcon(category: string, className?: string) {
    const iconMap: Record<string, any> = {
      fasting: Utensils,
      prayer: Heart,
      meditation: Brain,
      sleep: Moon,
      study: Book,
      exercise: Dumbbell,
      abstinence: Droplet,
      nature: Leaf,
      energy: Zap,
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

  if (loading)
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
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-linear-to-r from-amber-700 to-orange-500 bg-clip-text text-transparent">
          Asceticism
        </h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {myAsceticisms.map((ua) => (
              <Card
                key={ua.id}
                className="relative overflow-hidden border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all flex flex-col"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  {getCategoryIcon(
                    ua.asceticism?.category || "custom",
                    "w-20 h-20"
                  )}
                </div>
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 px-3 py-1"
                      >
                        {getCategoryIcon(
                          ua.asceticism?.category || "custom",
                          "w-3 h-3 mr-1.5 inline"
                        )}
                        {ua.asceticism?.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
                      >
                        {getTypeIcon(
                          ua.asceticism?.type || "BOOLEAN",
                          "w-3 h-3 mr-1.5 inline"
                        )}
                        {ua.asceticism?.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(ua);
                        }}
                        title="Edit dates"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveClick(
                            ua.id,
                            ua.asceticism?.title || "this practice"
                          );
                        }}
                        title="Remove commitment"
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    {ua.asceticism?.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Started: {new Date(ua.startDate).toLocaleDateString()}
                    {ua.endDate &&
                      ` • Ends: ${new Date(ua.endDate).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pb-4 flex-1">
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {ua.asceticism?.description || "Daily practice."}
                  </div>
                  {ua.asceticism?.type === "NUMERIC" && ua.targetValue && (
                    <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                      <span className="font-medium">Target:</span>{" "}
                      {ua.targetValue}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4">
                  {(() => {
                    const loggedToday = hasLoggedToday(ua);
                    const type = ua.asceticism?.type || "BOOLEAN";

                    return (
                      <Button
                        onClick={() => handleLog(ua.id, type)}
                        className="w-full gap-2 shadow-sm h-11 text-base font-medium"
                        disabled={loggedToday}
                        variant={loggedToday ? "secondary" : "default"}
                      >
                        {getTypeIcon(type, "w-5 h-5")}
                        {loggedToday
                          ? type === "BOOLEAN"
                            ? "Completed Today"
                            : type === "NUMERIC"
                            ? "Value Logged Today"
                            : "Entry Logged Today"
                          : type === "BOOLEAN"
                          ? "Log Complete"
                          : type === "NUMERIC"
                          ? "Log Value"
                          : "Add Entry"}
                      </Button>
                    );
                  })()}
                </CardFooter>
              </Card>
            ))}
            {myAsceticisms.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                <Flame size={64} className="mb-6 text-orange-300 opacity-80" />
                <p className="text-lg font-medium mb-2">
                  You haven't committed to any practices yet.
                </p>
                <p className="text-sm">
                  Switch to "Browse Practices" to get started.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="mt-8">
          <ProgressDashboard />
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
                      {t.category}
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
                  No templates found. Create one via API!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="mt-8">
          <CreateAsceticismForm onSuccess={fetchData} isAdmin={IS_ADMIN} />
        </TabsContent>
      </Tabs>

      {/* Join Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                      !joinStartDate && "text-muted-foreground"
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
                      !joinEndDate && "text-muted-foreground"
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
        <DialogContent className="sm:max-w-[500px]">
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
                      !editStartDate && "text-muted-foreground"
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
                      !editEndDate && "text-muted-foreground"
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

      {/* Log Dialog for Numeric and Text types */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">
              Log Progress -{" "}
              {logType === "NUMERIC" ? "Enter Value" : "Add Entry"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {logType === "NUMERIC"
                ? "Enter the numeric value for today's progress."
                : "Write your journal entry or notes for today."}
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
              <Label
                htmlFor="log-additional-notes"
                className="text-sm font-medium"
              >
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="log-additional-notes"
                placeholder="Any additional context or notes..."
                value={logType === "NUMERIC" ? logNotes : ""}
                onChange={(e) =>
                  logType === "NUMERIC" && setLogNotes(e.target.value)
                }
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLogDialogOpen(false)}
              className="h-10 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleLogConfirm} className="h-10 px-6">
              Log Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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
    </div>
  );
}
