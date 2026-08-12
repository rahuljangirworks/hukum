/**
 * Tile schema for brain notes opened from the Brain sidebar.
 * Brain notes are NOT Y.Doc-backed (isRecordBacked: false) —
 * they read from the local vault filesystem via the brain service.
 */

import type { DesktopJsonValue } from "@/lib/windows/types";
import type { TileSchema } from "./index";

export interface BrainNoteTileRef {
  readonly type: "brain-note";
  readonly id: string;
  readonly instanceId: string;
  readonly notePath: string;
  readonly name: string;
  readonly hostId: string;
}

function parseBrainNoteTileRef(value: unknown): BrainNoteTileRef | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.type !== "brain-note") return null;
  if (typeof v.notePath !== "string" || v.notePath.length === 0) return null;
  return {
    type: "brain-note",
    id: typeof v.id === "string" ? v.id : String(v.notePath),
    instanceId: typeof v.instanceId === "string" ? v.instanceId : "",
    notePath: v.notePath,
    name: typeof v.name === "string" ? v.name : v.notePath.replace(/\.md$/, ""),
    hostId: typeof v.hostId === "string" ? v.hostId : "",
  };
}

function serializeBrainNoteTileRef(ref: BrainNoteTileRef): DesktopJsonValue {
  return {
    type: ref.type,
    id: ref.id,
    instanceId: ref.instanceId,
    notePath: ref.notePath,
    name: ref.name,
    hostId: ref.hostId,
  };
}

export const brainNoteTileSchema: TileSchema<BrainNoteTileRef> = {
  parse: parseBrainNoteTileRef,
  serialize: serializeBrainNoteTileRef,
  isRecordBacked: false,
};
