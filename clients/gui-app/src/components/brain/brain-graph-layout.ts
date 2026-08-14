export interface BrainGraphLayoutNode {
  readonly id: string;
  readonly folder: string;
  readonly isRoot: boolean;
}

export interface BrainGraphPosition {
  readonly x: number;
  readonly y: number;
}

const CENTER_X = 420;
const CENTER_Y = 300;

export function layoutBrainGraphNodes(
  nodes: ReadonlyArray<BrainGraphLayoutNode>,
  rootPath: string | null,
): ReadonlyMap<string, BrainGraphPosition> {
  const positions = new Map<string, BrainGraphPosition>();
  if (nodes.length === 0) return positions;

  if (rootPath !== null) {
    const root = nodes.find((node) => node.id === rootPath) ?? nodes[0];
    positions.set(root.id, { x: CENTER_X, y: CENTER_Y });
    const neighbors = nodes.filter((node) => node.id !== root.id);
    const radius = Math.max(220, neighbors.length * 24);
    neighbors.forEach((node, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(1, neighbors.length);
      positions.set(node.id, {
        x: CENTER_X + Math.cos(angle) * radius,
        y: CENTER_Y + Math.sin(angle) * radius,
      });
    });
    return positions;
  }

  const groups = new Map<string, BrainGraphLayoutNode[]>();
  for (const node of nodes) {
    const group = groups.get(node.folder) ?? [];
    group.push(node);
    groups.set(node.folder, group);
  }
  const orderedGroups = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  orderedGroups.forEach(([, group], groupIndex) => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(group.length)));
    const groupX = (groupIndex % 3) * 480;
    const groupY = Math.floor(groupIndex / 3) * 360;
    group.sort((left, right) => left.id.localeCompare(right.id)).forEach((node, index) => {
      positions.set(node.id, {
        x: groupX + (index % columns) * 180,
        y: groupY + Math.floor(index / columns) * 110,
      });
    });
  });
  return positions;
}
