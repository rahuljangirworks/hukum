import { create } from "zustand";

interface HostRemovalState {
  readonly removedInSession: boolean;
  markRemovedInSession(): void;
}

export const useHostRemovalStore = create<HostRemovalState>()((set) => ({
  removedInSession: false,
  markRemovedInSession: () => {
    set({ removedInSession: true });
  },
}));
