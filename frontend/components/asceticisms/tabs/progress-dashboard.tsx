"use client";

import { useEffect, useState, useMemo } from "react";
import { AsceticismProgress } from "@/lib/services/asceticismService";
import { getUserProgressAction } from "@/lib/actions/asceticismActions";
import { Input } from "@/components/ui/input";
import {
  format,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  addDays,
  isToday,
  isFuture,
} from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Calendar,
  TrendingUp,
  Flame,
  Target,
  BarChart3,
  CheckCircle2,
  Award,
  Activity,
  CalendarDays,
  Clock,
  LineChart,
  Sparkles,
  Zap,
  Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";

type TimePeriod = "7d" | "30d" | "90d" | "180d" | "1y" | "all";

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  days: number | null;
}

const TIME_PERIODS: TimePeriodOption[] = [
  { value: "7d", label: "Last 7 Days", days: 7 },
  { value: "30d", label: "Last 30 Days", days: 30 },
  { value: "90d", label: "Last 90 Days", days: 90 },
  { value: "180d", label: "Last 6 Months", days: 180 },
  { value: "1y", label: "Last Year", days: 365 },
  { value: "all", label: "All Time", days: null },
];

export default function ProgressDashboard() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [progressData, setProgressData] = useState<AsceticismProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("7d");
  const [searchQuery, setSearchQuery] = useState("");

  const openSignInDialog = useAsceticismStore(
    (state) => state.openSignInDialog,
  );

  useEffect(() => {
    async function fetchProgress() {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange(timePeriod);
        const data = await getUserProgressAction(userId, startDate, endDate);
        setProgressData(data);
      } catch (e) {
        console.error("Error fetching progress:", e);
        toast.error("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [timePeriod, userId]);

  function getDateRange(period: TimePeriod): {
    startDate: string;
    endDate: string;
  } {
    const end = new Date();
    const start = new Date();

    const periodConfig = TIME_PERIODS.find((p) => p.value === period);
    if (periodConfig?.days) {
      start.setDate(end.getDate() - periodConfig.days);
    } else {
      start.setFullYear(2020, 0, 1);
    }

    return {
      startDate: startOfDay(start).toISOString(),
      endDate: endOfDay(end).toISOString(),
    };
  }

  // Filter progress data by search query
  const filteredProgressData = useMemo(() => {
    if (!searchQuery.trim()) return progressData;

    const query = searchQuery.toLowerCase();
    return progressData.filter((p) =>
      p.asceticism.title.toLowerCase().includes(query),
    );
  }, [progressData, searchQuery]);

  // Calculate overall statistics across all asceticisms
  const overallStats = useMemo(() => {
    if (!filteredProgressData.length) return null;

    const totalCompletedDays = filteredProgressData.reduce(
      (sum, p) => sum + p.stats.completedDays,
      0,
    );
    const totalPossibleDays = filteredProgressData.reduce(
      (sum, p) => sum + p.stats.totalDays,
      0,
    );
    const avgCompletionRate =
      filteredProgressData.reduce((sum, p) => sum + p.stats.completionRate, 0) /
      filteredProgressData.length;
    const maxStreak = Math.max(
      ...filteredProgressData.map((p) => p.stats.longestStreak),
    );
    const activePractices = filteredProgressData.filter(
      (p) => p.stats.currentStreak > 0,
    ).length;

    return {
      totalCompletedDays,
      totalPossibleDays,
      avgCompletionRate: Math.round(avgCompletionRate),
      maxStreak,
      activePractices,
      totalPractices: filteredProgressData.length,
    };
  }, [filteredProgressData]);

  // Render enhanced heatmap with weekly layout and hover tooltips
  function renderHeatmap(logs: AsceticismProgress["logs"]) {
    const { startDate, endDate } = getDateRange(timePeriod);
    const start = startOfDay(new Date(startDate));
    const end = startOfDay(new Date(endDate));

    // Limit heatmap to prevent performance issues
    if (differenceInDays(end, start) > 366) {
      return (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md border border-dashed">
          <CalendarDays className="inline mr-2 h-4 w-4" />
          Heatmap view is available for periods up to 1 year.
        </div>
      );
    }

    // Start from the beginning of the week
    const weekStart = startOfWeek(start, { weekStartsOn: 0 }); // Sunday
    const daysToShow = differenceInDays(end, weekStart) + 1;
    const allDays = Array.from({ length: daysToShow }, (_, i) =>
      addDays(weekStart, i),
    );

    // Create a map of date strings to log entries
    // Extract date directly from ISO string to avoid timezone conversion
    const logMap = new Map(
      (logs || []).map((log) => {
        const dateKey = log.date.split("T")[0]; // "2026-01-30T00:00:00Z" -> "2026-01-30"
        return [dateKey, log];
      }),
    );

    // Group days into weeks
    const weeks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    // Calculate intensity for better visualization
    const getIntensity = (completed: boolean, hasNotes: boolean): string => {
      if (!completed) return "bg-muted/40 border-muted";
      if (hasNotes)
        return "bg-green-700 dark:bg-green-600 border-green-800 dark:border-green-700";
      return "bg-green-400 dark:bg-green-500 border-green-500 dark:border-green-600";
    };

    if (allDays.length === 0) {
      return (
        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
          No dates in range
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={100}>
        <div className="space-y-2">
          {/* Day labels */}
          <div className="flex gap-1">
            <div className="w-8 text-[10px] text-muted-foreground" />
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 flex items-center justify-center text-[9px] text-muted-foreground font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1 items-center">
                {/* Week label */}
                <div className="w-8 text-[9px] text-muted-foreground font-medium">
                  {weekIdx === 0 || week[0].getDate() <= 7
                    ? format(week[0], "MMM")
                    : ""}
                </div>

                {week.map((day, dayIdx) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const log = logMap.get(dateKey);
                  const isFutureDay = isFuture(day) && !isToday(day);
                  const isOutOfRange = day < start || day > end;

                  if (isOutOfRange || isFutureDay) {
                    return (
                      <div
                        key={dayIdx}
                        className="w-3.5 h-3.5 bg-transparent"
                      />
                    );
                  }

                  const completed = log?.completed || false;
                  const hasNotes = !!log?.notes;

                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3.5 h-3.5 rounded-sm cursor-pointer transition-all duration-200 border ${getIntensity(
                            completed,
                            hasNotes,
                          )} ${
                            isToday(day)
                              ? "ring-2 ring-blue-500 ring-offset-1"
                              : ""
                          } hover:scale-125 hover:z-10`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">
                            {format(day, "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {completed ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Not completed
                              </span>
                            )}
                          </p>
                          {log?.notes && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs font-medium mb-1">Notes:</p>
                              <p className="text-xs text-muted-foreground italic">
                                {log.notes}
                              </p>
                            </div>
                          )}
                          {log?.value !== undefined && log?.value !== null && (
                            <p className="text-xs">
                              <span className="font-medium">Value:</span>{" "}
                              {log.value}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/40 border border-muted" />
              <span>Incomplete</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-500 border border-green-600" />
              <span>Complete</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-600 border border-green-700" />
              <span>With Notes</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Calculate recent momentum (last 7 days vs previous 7 days)
  function calculateMomentum(progress: AsceticismProgress): {
    trend: "up" | "down" | "stable";
    percentage: number;
  } {
    const today = new Date();
    const last7Days = progress.logs.filter((log) => {
      const logDate = new Date(log.date);
      const daysDiff = differenceInDays(today, logDate);
      return daysDiff >= 0 && daysDiff < 7;
    });
    const previous7Days = progress.logs.filter((log) => {
      const logDate = new Date(log.date);
      const daysDiff = differenceInDays(today, logDate);
      return daysDiff >= 7 && daysDiff < 14;
    });

    const recentComplete = last7Days.filter((l) => l.completed).length;
    const previousComplete = previous7Days.filter((l) => l.completed).length;

    const recentRate =
      last7Days.length > 0 ? (recentComplete / last7Days.length) * 100 : 0;
    const previousRate =
      previous7Days.length > 0
        ? (previousComplete / previous7Days.length) * 100
        : 0;

    const diff = recentRate - previousRate;

    if (Math.abs(diff) < 5) return { trend: "stable", percentage: 0 };
    if (diff > 0) return { trend: "up", percentage: Math.round(diff) };
    return { trend: "down", percentage: Math.round(Math.abs(diff)) };
  }

  // Calculate achievement level based on performance
  function getAchievementLevel(stats: AsceticismProgress["stats"]): {
    level: string;
    icon: React.ElementType;
    color: string;
    description: string;
  } {
    const { completionRate, longestStreak } = stats;

    if (completionRate >= 90 && longestStreak >= 30) {
      return {
        level: "Elite",
        icon: Trophy,
        color: "text-yellow-600 dark:text-yellow-400",
        description: "Outstanding commitment!",
      };
    } else if (completionRate >= 75 && longestStreak >= 14) {
      return {
        level: "Champion",
        icon: Award,
        color: "text-purple-600 dark:text-purple-400",
        description: "Excellent progress!",
      };
    } else if (completionRate >= 60 && longestStreak >= 7) {
      return {
        level: "Rising",
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
        description: "Building momentum!",
      };
    } else {
      return {
        level: "Beginner",
        icon: Sparkles,
        color: "text-green-600 dark:text-green-400",
        description: "Starting your journey!",
      };
    }
  }

  if (!session || !userId) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
        <BarChart3 size={64} className="mb-6 text-blue-300 opacity-80" />
        <p className="text-lg font-medium mb-2">Visualize Your Progress</p>
        <p className="text-sm text-center max-w-md mb-4">
          View detailed analytics, completion streaks, and heatmaps of your
          ascetic practices. Sign in to access your personal dashboard.
        </p>
        <Button onClick={openSignInDialog} size="lg" className="mt-2">
          Sign In to View Progress
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-150 w-full" />
          <Skeleton className="h-150 w-full" />
        </div>
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">No progress data yet</p>
        <p className="text-sm text-center max-w-md mt-2">
          Start logging your daily practices to unlock insights, track streaks,
          and visualize your growth journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with time period selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Progress Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your consistency, growth, and achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select
            value={timePeriod}
            onValueChange={(v) => setTimePeriod(v as TimePeriod)}
          >
            <SelectTrigger className="w-45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      {overallStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-green-500 border-t-4 border-t-green-500">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {overallStats.avgCompletionRate}%
              </div>
              <Progress
                value={overallStats.avgCompletionRate}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 border-t-4 border-t-orange-500">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Best Streak
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {overallStats.maxStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                days in a row
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 border-t-4 border-t-blue-500">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {overallStats.totalCompletedDays}
              </div>
              <p className="text-xs text-muted-foreground mt-1">completed</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 border-t-4 border-t-purple-500">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {overallStats.activePractices}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {overallStats.totalPractices} total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 border-t-4 border-t-amber-500">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {TIME_PERIODS.find((p) => p.value === timePeriod)?.label}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                viewing range
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Practice Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProgressData.length === 0 && searchQuery ? (
          <div className="col-span-2 flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
            <BarChart3 size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-semibold">No matches found</p>
            <p className="text-sm text-center max-w-md mt-2">
              No asceticisms match &ldquo;{searchQuery}&rdquo;. Try a different
              search term.
            </p>
          </div>
        ) : null}
        {filteredProgressData.map((progress) => {
          const momentum = calculateMomentum(progress);
          const achievement = getAchievementLevel(progress.stats);
          const AchievementIcon = achievement.icon;

          return (
            <Card
              key={progress.userAsceticismId}
              className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-t-primary"
            >
              <CardHeader className="space-y-3">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 font-semibold"
                    >
                      {progress.asceticism.category
                        .split("-")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                        )
                        .join(" ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${achievement.color} border-current/20 bg-current/10`}
                    >
                      <AchievementIcon className="h-3 w-3 mr-1" />
                      {achievement.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      Since{" "}
                      {format(new Date(progress.startDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Title and Description */}
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {progress.asceticism.title}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <span>
                      {progress.stats.completedDays} of{" "}
                      {progress.stats.totalDays} days completed
                    </span>
                    {momentum.trend !== "stable" && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          momentum.trend === "up"
                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
                        }`}
                      >
                        <LineChart className="h-3 w-3 mr-1" />
                        {momentum.trend === "up" ? "↑" : "↓"}{" "}
                        {momentum.percentage}%
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/50">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {progress.stats.completionRate}%
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-500 font-medium">
                            Completion
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                          <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                            {progress.stats.currentStreak}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-500 font-medium">
                            Current Streak
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {progress.stats.longestStreak}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">
                            Best Streak
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {progress.stats.completedDays}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-500 font-medium">
                            Days Done
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      Overall Progress
                    </span>
                    <span className="font-semibold">
                      {progress.stats.completionRate}%
                    </span>
                  </div>
                  <Progress
                    value={progress.stats.completionRate}
                    className="h-3"
                  />
                </div>

                {/* Achievement Message */}
                <div className="bg-muted/30 rounded-lg p-3 border border-muted">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AchievementIcon
                      className={`h-4 w-4 ${achievement.color}`}
                    />
                    {achievement.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.stats.currentStreak > 0
                      ? `Keep it up! You're on a ${progress.stats.currentStreak}-day streak.`
                      : "Start a new streak today!"}
                  </p>
                </div>

                {/* Heatmap */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Activity Heatmap
                    <Badge variant="outline" className="text-xs ml-auto">
                      Hover for details
                    </Badge>
                  </h4>
                  {renderHeatmap(progress.logs)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
