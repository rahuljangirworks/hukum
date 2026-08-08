import { Ticket } from "lucide-react";
import { makeHukumReference } from "./make-hukum-reference";

/**
 * Migrated `<hukum-ticket>` tag - opens the ticket artifact by its embedded
 * id. Same-epic opens a preview tile; cross-epic navigates and focuses the
 * artifact.
 */
export const HukumTicketReference = makeHukumReference({
  icon: <Ticket className="size-3.5" aria-hidden />,
  idAttr: "data-ticket-id",
  refKind: "ticket",
  requiresNode: true,
});
