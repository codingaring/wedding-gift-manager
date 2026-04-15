import { create } from "zustand";

interface BackupState {
  isSetup: boolean;
  lastSaved: string | null;
  saving: boolean;
  error: string | null;

  setSetup: (v: boolean) => void;
  setSaved: (time: string) => void;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useBackupStore = create<BackupState>((set) => ({
  isSetup: false,
  lastSaved: null,
  saving: false,
  error: null,

  setSetup: (v) => set({ isSetup: v }),
  setSaved: (time) => set({ lastSaved: time, saving: false, error: null }),
  setSaving: (v) => set({ saving: v }),
  setError: (e) => set({ error: e, saving: false }),
}));
