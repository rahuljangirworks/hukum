import { MessageSquare } from "lucide-react";
import { makeHukumReference } from "./make-hukum-reference";

/**
 * Migrated `<hukum-chat>` tag - opens the chat by its embedded id. Same-epic
 * opens a chat preview tile; cross-epic navigates and focuses the chat via
 * `focusArtifactId` (D1 - no `focusChatId`).
 */
export const HukumChatReference = makeHukumReference({
  icon: <MessageSquare className="size-3.5" aria-hidden />,
  idAttr: "data-chat-id",
  refKind: "chat",
  requiresNode: true,
});
