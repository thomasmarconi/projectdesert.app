"use client";

import { useAsceticismStore } from "@/lib/stores/asceticismStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GoogleSignIn from "@/components/auth/google-sign-in";

export default function SignInPromptDialog() {
  const { signInDialogOpen, closeSignInDialog } = useAsceticismStore();

  return (
    <Dialog open={signInDialogOpen} onOpenChange={closeSignInDialog}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">Sign In Required</DialogTitle>
          <DialogDescription className="text-base">
            Please sign in to start tracking your ascetic practices.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => closeSignInDialog()}
            className="h-10 px-6 mr-2"
          >
            Cancel
          </Button>
          <GoogleSignIn />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
