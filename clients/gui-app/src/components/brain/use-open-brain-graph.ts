import { useCallback } from "react";
import { useEpicTileNavigation } from "@/hooks/epic/use-epic-tile-navigation";
import { useReactiveActiveHostId } from "@/hooks/host/use-reactive-active-host-id";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";
import { makeBrainGraphTileRef } from "@/stores/epics/canvas/tile-schema/brain-graph-tile";

export function useOpenBrainGraph(epicId: string): () => void {
  const tileNavigation = useEpicTileNavigation();
  const hostId = useReactiveActiveHostId();
  const activeBrainId = useBrainConfigStore((state) => state.activeBrainId);
  const vaultPath = useBrainConfigStore((state) => state.config?.vaultPath ?? null);
  return useCallback(() => {
    if (hostId === null || activeBrainId === null || vaultPath === null) return;
    tileNavigation.openTileInEpic(epicId, makeBrainGraphTileRef({ hostId, brainId: activeBrainId, vaultPath }));
  }, [activeBrainId, epicId, hostId, tileNavigation, vaultPath]);
}
