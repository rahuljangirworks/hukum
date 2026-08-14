import { createFileRoute } from "@tanstack/react-router";
import { BrainCapabilitiesPanel } from "@/components/brain/brain-capabilities-panel";

export const Route = createFileRoute("/settings/brain")({
  component: BrainCapabilitiesPanel,
});
