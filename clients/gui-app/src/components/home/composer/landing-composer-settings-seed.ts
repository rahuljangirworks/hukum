import type { ChatRunSettings } from "@hukum/protocol/host/agent/gui/subscribe";

export function landingComposerSettingsSeedForDraft(
  draftId: string | null,
  draftSettings: ChatRunSettings | null,
  globalLastRunSettings: ChatRunSettings | null,
): ChatRunSettings | null {
  return draftId === null ? globalLastRunSettings : draftSettings;
}
