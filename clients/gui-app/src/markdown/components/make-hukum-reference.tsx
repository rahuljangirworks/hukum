import { type ReactNode } from "react";
import { HukumReferenceChip } from "./hukum-reference-chip";
import { useHukumReferenceOpenHandler } from "./use-hukum-reference-open";

interface HukumReferenceProps {
  "data-epic-id"?: string;
  "data-title"?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Builds a legacy `<hukum-*>` reference component. The four reference tags
 * (`spec` / `ticket` / `chat` / `epic`) are byte-identical apart from the icon,
 * the embedded node-id attribute, and the `refKind`, so they share one
 * config-driven body.
 *
 * - `idAttr` is the `data-*-id` attribute holding the embedded node id, or
 *   `null` for `<hukum-epic>`, which references no node.
 * - `requiresNode` mirrors the open hook: `true` for node refs (a missing id
 *   degrades to plain text), `false` for the epic ref.
 *
 * Every component renders a clickable chip that opens by its embedded id
 * (render-time only - no migration); without a resolvable id / epic context the
 * chip degrades to the plain label text.
 */
export function makeHukumReference(config: {
  readonly icon: ReactNode;
  readonly idAttr: string | null;
  readonly refKind: "spec" | "ticket" | "chat" | "epic";
  readonly requiresNode: boolean;
}) {
  return function HukumReference(props: HukumReferenceProps) {
    const rawNodeId = config.idAttr === null ? undefined : props[config.idAttr];
    const { onOpen, sameEpicNodeRef } = useHukumReferenceOpenHandler({
      epicId: props["data-epic-id"],
      nodeId: typeof rawNodeId === "string" ? rawNodeId : undefined,
      requiresNode: config.requiresNode,
    });
    return (
      <HukumReferenceChip
        icon={config.icon}
        title={props["data-title"]}
        refKind={config.refKind}
        onOpen={onOpen}
        sameEpicNodeRef={sameEpicNodeRef}
        epicId={props["data-epic-id"]}
      >
        {props.children}
      </HukumReferenceChip>
    );
  };
}
