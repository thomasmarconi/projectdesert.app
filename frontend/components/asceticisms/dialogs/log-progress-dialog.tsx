"use client";

import { useState, useEffect } from "react";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import {
  useLogProgress,
  useUpdateUserAsceticism,
} from "@/hooks/use-asceticisms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronDown, Settings } from "lucide-react";

export default function LogProgressDialog() {
  const {
    logDialogOpen,
    closeLogDialog,
    loggingAsceticism,
    viewingDate,
    logValue,
    setLogValue,
    logNotes,
    setLogNotes,
  } = useAsceticismStore();

  const logMutation = useLogProgress();
  const updateMutation = useUpdateUserAsceticism();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Initialize dates when dialog opens
  useEffect(() => {
    if (loggingAsceticism) {
      setStartDate(
        loggingAsceticism.startDate
          ? new Date(loggingAsceticism.startDate).toISOString().split("T")[0]
          : "",
      );
      setEndDate(
        loggingAsceticism.endDate
          ? new Date(loggingAsceticism.endDate).toISOString().split("T")[0]
          : "",
      );
      setSettingsOpen(false);
    }
  }, [loggingAsceticism]);

  async function handleConfirm() {
    if (!loggingAsceticism) return;

    const type = loggingAsceticism.asceticism?.type || "BOOLEAN";
    const date = viewingDate.toISOString().split("T")[0];

    const logData: { completed: boolean; value?: number; notes?: string } = {
      completed: true,
    };

    if (type === "NUMERIC") {
      const numValue = parseFloat(logValue);
      if (isNaN(numValue)) {
        toast.error("Please enter a valid number");
        return;
      }
      logData.value = numValue;
    }

    if (logNotes.trim()) {
      logData.notes = logNotes.trim();
    }

    // Check if dates changed
    const originalStartDate = loggingAsceticism.startDate
      ? new Date(loggingAsceticism.startDate).toISOString().split("T")[0]
      : "";
    const originalEndDate = loggingAsceticism.endDate
      ? new Date(loggingAsceticism.endDate).toISOString().split("T")[0]
      : "";

    const datesChanged =
      startDate !== originalStartDate || endDate !== originalEndDate;

    // Validate dates
    if (startDate && endDate && endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    try {
      // Update dates if changed
      if (datesChanged) {
        await updateMutation.mutateAsync({
          userAsceticismId: loggingAsceticism.id,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      }

      await logMutation.mutateAsync({
        userAsceticismId: loggingAsceticism.id,
        date,
        completed: true,
        value: logData.value,
        notes: logData.notes,
      });

      // Check if this was an existing log
      const existingLog = loggingAsceticism.logs?.find((log) => {
        const logDate = new Date(log.date).toISOString().split("T")[0];
        return logDate === date;
      });

      toast.success(existingLog ? "Progress updated!" : "Progress logged!");
      closeLogDialog();
    } catch {
      // Error already handled by mutation
    }
  }

  return (
    <Dialog open={logDialogOpen} onOpenChange={closeLogDialog}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            {loggingAsceticism?.asceticism?.title} -{" "}
            {format(viewingDate, "MMM d, yyyy")}
          </DialogTitle>
          <DialogDescription className="text-base">
            {loggingAsceticism?.asceticism?.description ||
              "Log your progress for this day."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {loggingAsceticism?.asceticism?.type === "NUMERIC" && (
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
          <div className="space-y-3">
            <Label htmlFor="log-notes" className="text-sm font-medium">
              Notes{" "}
              {loggingAsceticism?.asceticism?.type !== "TEXT" && "(Optional)"}
            </Label>
            <Textarea
              id="log-notes"
              placeholder={
                loggingAsceticism?.asceticism?.type === "TEXT"
                  ? "Write your journal entry or reflections..."
                  : "Any additional notes for this day..."
              }
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              rows={loggingAsceticism?.asceticism?.type === "TEXT" ? 6 : 4}
              className="resize-none"
              autoFocus={loggingAsceticism?.asceticism?.type === "TEXT"}
            />
          </div>

          {/* Settings Section */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  Date Settings
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setStartDate(newStartDate);
                      // Clear end date if it's now before start date
                      if (endDate && endDate < newStartDate) {
                        setEndDate("");
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => closeLogDialog()}
            className="h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-10 px-6"
            disabled={logMutation.isPending || updateMutation.isPending}
          >
            {logMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
