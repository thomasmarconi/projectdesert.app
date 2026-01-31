"use client";

import { useState } from "react";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { useLogProgress } from "@/hooks/use-asceticisms";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Check,
  Flame,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Utensils,
  Heart,
  Brain,
  Moon,
  Book,
  Dumbbell,
  Droplet,
  Leaf,
  Zap,
  Sparkles,
  Hash,
  FileText,
} from "lucide-react";
import { UserAsceticism } from "@/lib/services/asceticismService";
import type { Session } from "next-auth";

interface MyCommitmentsProps {
  session: Session | null;
  userId?: string;
  myAsceticisms: UserAsceticism[];
  handleLogClick: (ua: UserAsceticism) => void;
  getLogForDate: (
    ua: UserAsceticism,
  ) => NonNullable<UserAsceticism["logs"]>[number] | undefined;
}

export default function MyCommitments({
  session,
  userId,
  myAsceticisms,
  handleLogClick,
  getLogForDate,
}: MyCommitmentsProps) {
  const [completingAll, setCompletingAll] = useState(false);

  const {
    viewingDate,
    setViewingDate,
    showArchived,
    setShowArchived,
    openSignInDialog,
    openRemoveDialog,
  } = useAsceticismStore();

  const logMutation = useLogProgress();

  function hasLoggedOnDate(ua: UserAsceticism): boolean {
    const dateStr = viewingDate.toISOString().split("T")[0];
    const logs = ua.logs || [];
    return logs.some((log) => {
      const logDate = new Date(log.date).toISOString().split("T")[0];
      return logDate === dateStr && log.completed;
    });
  }

  function handleRemoveClick(userAsceticismId: number, title: string) {
    openRemoveDialog(userAsceticismId, title);
  }

  async function handleQuickLog(ua: UserAsceticism) {
    const date = viewingDate.toISOString().split("T")[0];
    try {
      await logMutation.mutateAsync({
        userAsceticismId: ua.id,
        date,
        completed: true,
      });
      toast.success("Completed!");
    } catch {
      // Error already handled by mutation
    }
  }

  function isViewingToday(): boolean {
    const today = new Date();
    return (
      viewingDate.toISOString().split("T")[0] ===
      today.toISOString().split("T")[0]
    );
  }

  function isViewingFuture(): boolean {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const viewingStr = viewingDate.toISOString().split("T")[0];
    return viewingStr > todayStr;
  }

  async function handleCompleteAll() {
    if (isViewingFuture()) {
      toast.error("Cannot log progress for future dates");
      return;
    }

    setCompletingAll(true);
    try {
      const booleanAsceticisms = myAsceticisms.filter(
        (ua) => ua.asceticism?.type === "BOOLEAN" && !hasLoggedOnDate(ua),
      );

      if (booleanAsceticisms.length === 0) {
        toast.info("All boolean practices already completed!");
        return;
      }

      const date = viewingDate.toISOString().split("T")[0];
      await Promise.all(
        booleanAsceticisms.map((ua) =>
          logMutation.mutateAsync({
            userAsceticismId: ua.id,
            date,
            completed: true,
          }),
        ),
      );

      toast.success(`Completed ${booleanAsceticisms.length} practices!`);
    } catch {
      toast.error("Failed to complete all practices.");
    } finally {
      setCompletingAll(false);
    }
  }
  function goToPreviousDay() {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() - 1);
    setViewingDate(newDate);
  }

  function goToNextDay() {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() + 1);
    setViewingDate(newDate);
  }

  function goToToday() {
    setViewingDate(new Date());
  }

  function getCategoryIcon(category: string, className?: string) {
    const iconMap: Record<string, React.ElementType> = {
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

  function getTypeIcon(type: string, className?: string) {
    const iconMap: Record<string, React.ElementType> = {
      BOOLEAN: Check,
      NUMERIC: Hash,
      TEXT: FileText,
    };
    const IconComponent = iconMap[type] || Check;
    return <IconComponent className={className} />;
  }

  if (!session || !userId) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
        <Flame size={64} className="mb-6 text-orange-300 opacity-80" />
        <p className="text-lg font-medium mb-2">Track Your Daily Practices</p>
        <p className="text-sm text-center max-w-md mb-4">
          View your active commitments, log daily progress, and track completion
          history. Sign in to start your ascetic journey.
        </p>
        <Button onClick={() => openSignInDialog()} size="lg" className="mt-2">
          Sign In to Get Started
        </Button>
      </div>
    );
  }

  return (
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
                {viewingDate ? format(viewingDate, "PPP") : "Pick a date"}
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

          <div className="flex items-center gap-2 ml-2 pl-2 border-l">
            <Label htmlFor="show-archived" className="text-sm cursor-pointer">
              Show archived
            </Label>
            <input
              id="show-archived"
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 cursor-pointer"
            />
          </div>
        </div>

        {!isViewingFuture() &&
          myAsceticisms.some(
            (ua) => ua.asceticism?.type === "BOOLEAN" && !hasLoggedOnDate(ua),
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

      {/* Asceticism List */}
      <div className="space-y-1.5">
        {myAsceticisms.map((ua) => {
          const logged = hasLoggedOnDate(ua);
          const logEntry = getLogForDate(ua);
          const type = ua.asceticism?.type || "BOOLEAN";

          return (
            <div
              key={ua.id}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
                logged && "bg-muted/30",
              )}
            >
              {/* Icon */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                {getCategoryIcon(
                  ua.asceticism?.category || "custom",
                  "w-4 h-4 text-muted-foreground",
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-medium text-sm truncate">
                    {ua.asceticism?.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {ua.asceticism?.description || "Daily practice."}
                </p>
                {logEntry && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                    {type === "NUMERIC" && logEntry.value !== undefined && (
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        Value: {logEntry.value}
                      </span>
                    )}
                    {logEntry.notes && (
                      <span className="line-clamp-1 italic text-purple-600 dark:text-purple-400">
                        &quot;{logEntry.notes}&quot;
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Log Button */}
                {type === "BOOLEAN" ? (
                  logged ? (
                    <Button
                      onClick={() => handleLogClick(ua)}
                      size="sm"
                      variant="secondary"
                      disabled={isViewingFuture()}
                      className="h-8 px-3 gap-1.5 opacity-70"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">Done</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleQuickLog(ua)}
                      size="sm"
                      variant="default"
                      disabled={isViewingFuture()}
                      className="h-8 px-3 gap-1.5"
                    >
                      <div className="h-3.5 w-3.5 rounded border-2 border-current" />
                      <span className="text-xs">Log</span>
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => handleLogClick(ua)}
                    size="sm"
                    variant={logged ? "secondary" : "default"}
                    disabled={isViewingFuture()}
                    className={cn("h-8 px-3 gap-1.5", logged && "opacity-70")}
                  >
                    {getTypeIcon(type, "h-3.5 w-3.5")}
                    <span className="text-xs">{logged ? "Edit" : "Log"}</span>
                  </Button>
                )}

                {/* Remove Button (visible on hover, only for active) */}
                {ua.status !== "ARCHIVED" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      handleRemoveClick(
                        ua.id,
                        ua.asceticism?.title || "this practice",
                      )
                    }
                    title="Remove from commitments"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {myAsceticisms.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
            <Flame size={64} className="mb-6 text-orange-300 opacity-80" />
            <p className="text-lg font-medium mb-2">
              No practices for this date.
            </p>
            <p className="text-sm">
              {isViewingToday()
                ? 'Switch to "Browse Practices" to add some.'
                : "You had no active practices on this date."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
