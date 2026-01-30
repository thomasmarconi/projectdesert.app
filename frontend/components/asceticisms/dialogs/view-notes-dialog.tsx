"use client";

import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { UserAsceticism } from "@/lib/services/asceticismService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

interface ViewNotesDialogProps {
  getLogForDate: (
    ua: UserAsceticism,
  ) => NonNullable<UserAsceticism["logs"]>[number] | undefined;
  onEdit: (ua: UserAsceticism) => void;
}

export default function ViewNotesDialog({
  getLogForDate,
  onEdit,
}: ViewNotesDialogProps) {
  const {
    notesDialogOpen,
    closeNotesDialog,
    viewingNotesAsceticism,
    viewingDate,
  } = useAsceticismStore();

  const log = viewingNotesAsceticism
    ? getLogForDate(viewingNotesAsceticism)
    : null;

  function isViewingFuture(): boolean {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const viewingStr = viewingDate.toISOString().split("T")[0];
    return viewingStr > todayStr;
  }

  return (
    <Dialog open={notesDialogOpen} onOpenChange={closeNotesDialog}>
      <DialogContent className="sm:max-w-137.5">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">
            {viewingNotesAsceticism?.asceticism?.title} - Notes for{" "}
            {format(viewingDate, "MMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {!log ? (
            <p className="text-muted-foreground text-sm">
              No notes for this day yet.
            </p>
          ) : (
            <div className="space-y-4">
              {viewingNotesAsceticism?.asceticism?.type === "NUMERIC" &&
                log.value !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Value
                    </Label>
                    <p className="text-lg font-semibold">{log.value}</p>
                  </div>
                )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Notes
                </Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {log.notes || "No notes recorded."}
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => closeNotesDialog()}
            className="h-10 px-6"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              closeNotesDialog();
              if (viewingNotesAsceticism) {
                onEdit(viewingNotesAsceticism);
              }
            }}
            className="h-10 px-6"
            disabled={isViewingFuture()}
          >
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
