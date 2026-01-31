"use client";

import { useSession } from "next-auth/react";
import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { useJoinAsceticism } from "@/hooks/use-asceticisms";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function JoinAsceticismDialog() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    joinDialogOpen,
    closeJoinDialog,
    selectedTemplate,
    joinStartDate,
    setJoinStartDate,
    joinEndDate,
    setJoinEndDate,
  } = useAsceticismStore();

  const joinMutation = useJoinAsceticism();

  async function handleConfirm() {
    if (!selectedTemplate || !userId) return;

    try {
      await joinMutation.mutateAsync({
        userId,
        asceticismId: selectedTemplate.id,
        startDate: joinStartDate?.toISOString().split("T")[0],
        endDate: joinEndDate?.toISOString().split("T")[0],
      });
      closeJoinDialog();
    } catch {
      // Error already handled by mutation
    }
  }

  return (
    <Dialog open={joinDialogOpen} onOpenChange={closeJoinDialog}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">Start Tracking</DialogTitle>
          <DialogDescription className="text-base">
            {selectedTemplate?.title}
            {selectedTemplate?.description && (
              <span className="block mt-2 text-sm">
                {selectedTemplate.description}
              </span>
            )}
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
                  {joinStartDate ? format(joinStartDate, "PPP") : "Pick a date"}
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
            <p className="text-xs text-muted-foreground">
              Defaults to today. Pick an earlier date to backfill.
            </p>
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
                  {joinEndDate
                    ? format(joinEndDate, "PPP")
                    : "No end date (indefinite)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={joinEndDate}
                  onSelect={setJoinEndDate}
                  disabled={joinStartDate ? { before: joinStartDate } : undefined}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {joinEndDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJoinEndDate(undefined)}
                className="w-full h-9"
              >
                Clear End Date
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => closeJoinDialog()}
            className="h-10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="h-10 px-6"
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? "Starting..." : "Start Practice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
