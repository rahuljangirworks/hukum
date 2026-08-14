import { v4 as uuidv4 } from "uuid";
import type { DesktopJsonValue } from "@/lib/windows/types";
import { TILE_KIND_BRAIN_GRAPH } from "../tile-kinds";
import type { BrainGraphTileRef } from "../types";
import type { TileSchema } from "./index";
import { readTileInstanceId } from "./instance-id";

export const BRAIN_GRAPH_TILE_NAME = "Brain graph";

export function brainGraphTileId(hostId: string, brainId: string): string {
  return `brain-graph:${encodeURIComponent(hostId)}:${encodeURIComponent(brainId)}`;
}

export function makeBrainGraphTileRef(args: {
  hostId: string;
  brainId: string;
  vaultPath: string;
  rootPath?: string | null;
}): BrainGraphTileRef {
  return {
    id: brainGraphTileId(args.hostId, args.brainId),
    instanceId: uuidv4(),
    type: TILE_KIND_BRAIN_GRAPH,
    name: BRAIN_GRAPH_TILE_NAME,
    hostId: args.hostId,
    brainId: args.brainId,
    vaultPath: args.vaultPath,
    rootPath: args.rootPath ?? null,
    depth: 1,
    folder: null,
    query: "",
    includeOrphans: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseBrainGraphTileRef(value: unknown): BrainGraphTileRef | null {
  if (!isRecord(value) || value.type !== TILE_KIND_BRAIN_GRAPH) return null;
  if (
    typeof value.hostId !== "string" || value.hostId.length === 0 ||
    typeof value.brainId !== "string" || value.brainId.length === 0 ||
    typeof value.vaultPath !== "string" || value.vaultPath.length === 0
  ) return null;
  return {
    id: brainGraphTileId(value.hostId, value.brainId),
    instanceId: readTileInstanceId(value.instanceId),
    type: TILE_KIND_BRAIN_GRAPH,
    name: typeof value.name === "string" ? value.name : BRAIN_GRAPH_TILE_NAME,
    hostId: value.hostId,
    brainId: value.brainId,
    vaultPath: value.vaultPath,
    rootPath: optionalString(value.rootPath),
    depth: value.depth === 2 ? 2 : 1,
    folder: optionalString(value.folder),
    query: typeof value.query === "string" ? value.query : "",
    includeOrphans: value.includeOrphans === true,
  };
}

function serializeBrainGraphTileRef(ref: BrainGraphTileRef): DesktopJsonValue {
  return {
    id: ref.id,
    instanceId: ref.instanceId,
    type: ref.type,
    name: ref.name,
    hostId: ref.hostId,
    brainId: ref.brainId,
    vaultPath: ref.vaultPath,
    rootPath: ref.rootPath,
    depth: ref.depth,
    folder: ref.folder,
    query: ref.query,
    includeOrphans: ref.includeOrphans,
  };
}

export const brainGraphTileSchema: TileSchema<BrainGraphTileRef> = {
  parse: parseBrainGraphTileRef,
  serialize: serializeBrainGraphTileRef,
  isRecordBacked: false,
};
