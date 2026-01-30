"use client";

import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { useLeaveAsceticism } from "@/hooks/use-asceticisms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface RemoveAsceticismDialogProps {
  onConfirm?: () => void;
}

export default function RemoveAsceticismDialog({
  onConfirm,
}: RemoveAsceticismDialogProps) {
  const { removeDialogOpen, closeRemoveDialog, removingAsceticism } =
    useAsceticismStore();

  const leaveMutation = useLeaveAsceticism();

  async function handleConfirm() {
    if (!removingAsceticism) return;

    try {
      await leaveMutation.mutateAsync(removingAsceticism.id);
      toast.success(
        `Removed "${removingAsceticism.title}" from your commitments`,
      );
      closeRemoveDialog();
      onConfirm?.();
    } catch {
      // Error already handled by mutation
    }
  }

  return (
    <Dialog open={removeDialogOpen} onOpenChange={closeRemoveDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Practice?</DialogTitle>
          <DialogDescription>
            This will stop tracking <strong>{removingAsceticism?.title}</strong>{" "}
            from today onwards. Your historical progress will be preserved, and
            you can rejoin anytime.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => closeRemoveDialog()}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
