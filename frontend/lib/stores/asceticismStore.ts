import { create } from "zustand";
import { Asceticism, UserAsceticism } from "@/lib/services/asceticismService";

interface DialogState {
  // Join dialog
  joinDialogOpen: boolean;
  selectedTemplate: Asceticism | null;
  joinStartDate: Date | undefined;
  joinEndDate: Date | undefined;

  // Log/Edit dialog
  logDialogOpen: boolean;
  loggingAsceticism: UserAsceticism | null;
  logValue: string;
  logNotes: string;

  // View notes dialog
  notesDialogOpen: boolean;
  viewingNotesAsceticism: UserAsceticism | null;

  // Remove dialog
  removeDialogOpen: boolean;
  removingAsceticism: { id: number; title: string } | null;

  // Sign-in prompt dialog
  signInDialogOpen: boolean;

  // Viewing state
  viewingDate: Date;
  showArchived: boolean;
}

interface DialogActions {
  // Join dialog actions
  openJoinDialog: (template: Asceticism) => void;
  closeJoinDialog: () => void;
  setJoinStartDate: (date: Date | undefined) => void;
  setJoinEndDate: (date: Date | undefined) => void;

  // Log dialog actions
  openLogDialog: (
    ua: UserAsceticism,
    existingValue?: string,
    existingNotes?: string,
  ) => void;
  closeLogDialog: () => void;
  setLogValue: (value: string) => void;
  setLogNotes: (notes: string) => void;

  // View notes dialog actions
  openNotesDialog: (ua: UserAsceticism) => void;
  closeNotesDialog: () => void;

  // Remove dialog actions
  openRemoveDialog: (id: number, title: string) => void;
  closeRemoveDialog: () => void;

  // Sign-in dialog actions
  openSignInDialog: () => void;
  closeSignInDialog: () => void;

  // Viewing state actions
  setViewingDate: (date: Date) => void;
  setShowArchived: (show: boolean) => void;
}

type AsceticismStore = DialogState & DialogActions;

export const useAsceticismStore = create<AsceticismStore>((set) => ({
  // Initial state
  joinDialogOpen: false,
  selectedTemplate: null,
  joinStartDate: new Date(),
  joinEndDate: undefined,

  logDialogOpen: false,
  loggingAsceticism: null,
  logValue: "",
  logNotes: "",

  notesDialogOpen: false,
  viewingNotesAsceticism: null,

  removeDialogOpen: false,
  removingAsceticism: null,

  signInDialogOpen: false,

  viewingDate: new Date(),
  showArchived: true,

  // Actions
  openJoinDialog: (template) =>
    set({
      joinDialogOpen: true,
      selectedTemplate: template,
      joinStartDate: new Date(),
      joinEndDate: undefined,
    }),
  closeJoinDialog: () =>
    set({
      joinDialogOpen: false,
      selectedTemplate: null,
    }),
  setJoinStartDate: (date) => set({ joinStartDate: date }),
  setJoinEndDate: (date) => set({ joinEndDate: date }),

  openLogDialog: (ua, existingValue = "", existingNotes = "") =>
    set({
      logDialogOpen: true,
      loggingAsceticism: ua,
      logValue: existingValue,
      logNotes: existingNotes,
    }),
  closeLogDialog: () =>
    set({
      logDialogOpen: false,
      loggingAsceticism: null,
      logValue: "",
      logNotes: "",
    }),
  setLogValue: (value) => set({ logValue: value }),
  setLogNotes: (notes) => set({ logNotes: notes }),

  openNotesDialog: (ua) =>
    set({
      notesDialogOpen: true,
      viewingNotesAsceticism: ua,
    }),
  closeNotesDialog: () =>
    set({
      notesDialogOpen: false,
      viewingNotesAsceticism: null,
    }),

  openRemoveDialog: (id, title) =>
    set({
      removeDialogOpen: true,
      removingAsceticism: { id, title },
    }),
  closeRemoveDialog: () =>
    set({
      removeDialogOpen: false,
      removingAsceticism: null,
    }),

  openSignInDialog: () => set({ signInDialogOpen: true }),
  closeSignInDialog: () => set({ signInDialogOpen: false }),

  setViewingDate: (date) => set({ viewingDate: date }),
  setShowArchived: (show) => set({ showArchived: show }),
}));
