import { createFileRoute } from "@tanstack/react-router";
import { VoiceSettingsPanel } from "@/components/settings/panels/voice-settings-panel";

export const Route = createFileRoute("/settings/voice")({
  component: VoiceSettingsPanel,
});
