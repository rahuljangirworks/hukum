# Brain Note Canvas Implementation

## Goal
When a user clicks a note in the Brain sidebar tree, it opens in the canvas panel
(the same way clicking an artifact opens it in the editor pane).

## Files to Create/Modify

### 1. New: `src/stores/epics/canvas/tile-schema/brain-note-tile.ts`
```typescript
import type { TileSchema } from "./index";

export interface BrainNoteTileRef {
  readonly type: "brain-note";
  readonly id: string;        // unique instance id
  readonly instanceId: string;
  readonly notePath: string;  // vault-relative path
  readonly name: string;      // display title
  readonly hostId: string;
}

export const brainNoteTileSchema: TileSchema<BrainNoteTileRef> = {
  parse(value) {
    if (!value || typeof value !== "object") return null;
    const v = value as Record<string, unknown>;
    if (v.type !== "brain-note") return null;
    if (typeof v.notePath !== "string") return null;
    return {
      type: "brain-note",
      id: String(v.id ?? ""),
      instanceId: String(v.instanceId ?? ""),
      notePath: v.notePath,
      name: String(v.name ?? v.notePath),
      hostId: String(v.hostId ?? ""),
    } as BrainNoteTileRef;
  },
  serialize(ref) {
    return { type: ref.type, id: ref.id, instanceId: ref.instanceId, notePath: ref.notePath, name: ref.name, hostId: ref.hostId };
  },
  isRecordBacked: false,  // brain notes are NOT Y.Doc backed
};
```

### 2. Modify: `src/stores/epics/canvas/tile-kinds.ts`
Add:
```typescript
const TILE_KIND_BRAIN_NOTE = "brain-note";
```
Add to `TileKindId` type union.
Add to `isTileKind` guard.

### 3. Modify: `src/stores/epics/canvas/tile-kind-types.ts`
Add to `TileKindToRefMap`:
```typescript
readonly "brain-note": BrainNoteTileRef;
```

### 4. Modify: `src/stores/epics/canvas/tile-schema/index.ts`
Add import + entry:
```typescript
import { brainNoteTileSchema } from "./brain-note-tile";
// In TILE_SCHEMAS:
"brain-note": brainNoteTileSchema,
```

### 5. New: `src/components/epic-canvas/renderers/brain-note-tile.tsx`
```tsx
export function BrainNoteTile({ node }: TileRenderArgs<BrainNoteTileRef>) {
  // Render markdown content of the note
  // Read from brain store or fetch via RPC
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/40 px-4 py-2">
        <h2 className="text-sm font-medium">{node.name}</h2>
        <p className="text-xs text-muted-foreground font-mono">{node.notePath}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 prose prose-sm dark:prose-invert">
        {/* Rendered markdown content */}
      </div>
    </div>
  );
}
```

### 6. Modify: `src/components/epic-canvas/renderers/tile-render.tsx`
Add import + entry in TILE_RENDERERS:
```typescript
import { BrainNoteTile } from "./brain-note-tile";
// In TILE_RENDERERS:
"brain-note": ({ node, viewTabId, tileId }) => (
  <BrainNoteTile node={node} viewTabId={viewTabId} tileId={tileId} isActive={false} />
),
```

### 7. Modify: `src/stores/epics/canvas/types.ts`
Add `"brain-note"` to `OpenableEpicNodeKind` type.
Add to `isOpenableEpicNodeKind` guard.
Note: brain-note is NOT `RecordBackedEpicNodeKind` (it reads from local files, not Y.Doc).

### 8. Modify: Brain folder tree click handler
In `brain-folder-tree.tsx`, when a note is clicked, open it as a canvas tile:
```typescript
// Use the existing tile navigation mechanism:
import { useEpicCanvasStore } from "@/stores/epics/canvas/store";

const handleClick = () => {
  // Open the brain note in the canvas
  const ref: BrainNoteTileRef = {
    type: "brain-note",
    id: entry.path,
    instanceId: uuidv4(),
    notePath: entry.path,
    name: entry.title ?? entry.name,
    hostId: activeHostId,
  };
  tileNavigation.openTilePreviewInTab(viewTabId, ref);
};
```

## Brain Panel Header Actions

### Modify: `epic-sidebar.tsx` (the panel slots)
Change:
```typescript
brain: {
  live: {
    Body: BrainPanelBody,
    Actions: BrainPanelActions,  // ← add this
    Subtitle: null,
  },
  loading: emptyLoadingSlots(BrainLoadingPanelBody),
},
```

### New: `BrainPanelActions` component
```tsx
function BrainPanelActions({ collapsed }: LeftPanelHeaderSlotProps) {
  if (collapsed) return null;
  return (
    <div className="flex items-center gap-0.5">
      <TooltipWrapper content="New note">
        <Button variant="ghost" size="icon-xs" onClick={handleNewNote}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </TooltipWrapper>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleRebuildIndex}>Rebuild index</DropdownMenuItem>
          <DropdownMenuItem onClick={openBrainSettings}>Brain settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

## Warning: 6-Registry Pattern
All 6 places MUST be updated together or you get the `isRecordBacked` crash:
1. tile-kinds.ts (TileKindId + isTileKind)
2. tile-kind-types.ts (TileKindToRefMap)
3. types.ts (OpenableEpicNodeKind + isOpenableEpicNodeKind)
4. tile-schema/brain-note-tile.ts (new file)
5. tile-schema/index.ts (TILE_SCHEMAS entry)
6. tile-render.tsx (TILE_RENDERERS entry)
