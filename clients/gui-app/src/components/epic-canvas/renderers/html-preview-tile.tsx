import { useEffect, useState, useMemo } from "react";
import type { TileRenderArgs } from "./tile-render";
import { useEpicArtifactFragment } from "@/lib/epic-selectors";
import type { EpicNodeRef } from "@/stores/epics/canvas/types";

/**
 * Reconstruct the original text content from a Y.XmlFragment by walking the
 * tree. For html-preview artifacts, the host stores the entire HTML inside a
 * single codeBlock node (language="html"). We extract its text content
 * directly. If the structure is different (legacy or mixed), we fall back to
 * concatenating all text from all nodes.
 */
function renderFragmentToText(fragment: any): string {
  const children = fragment.toArray();

  // Primary path: single codeBlock with the full HTML
  if (children.length === 1 && children[0].nodeName === "codeBlock") {
    return extractInlineText(children[0]);
  }

  // Fallback: multiple nodes (legacy data before the fix) — join all text
  const blocks: string[] = [];
  for (const node of children) {
    const name = node.nodeName;
    const text = extractInlineText(node);

    if (name === "codeBlock") {
      // Code blocks hold verbatim content
      blocks.push(text);
    } else if (name === "heading") {
      // Skip heading markers for html reconstruction
      blocks.push(text);
    } else {
      blocks.push(text);
    }
  }

  return blocks.join("\n");
}

function extractInlineText(node: any): string {
  if (!node.toArray) {
    // Y.XmlText
    const delta = node.toDelta?.();
    if (delta) return delta.map((d: any) => String(d.insert ?? "")).join("");
    return node.toString?.() ?? "";
  }
  return node.toArray().map((child: any) => {
    const delta = child.toDelta?.();
    if (delta) return delta.map((d: any) => String(d.insert ?? "")).join("");
    if (child.toArray) return extractInlineText(child);
    return child.toString?.() ?? "";
  }).join("");
}

export function HtmlPreviewTile({ node }: TileRenderArgs<EpicNodeRef>) {
  const fragment = useEpicArtifactFragment(node.id);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!fragment) return;

    const updateContent = () => {
      setContent(renderFragmentToText(fragment));
    };

    updateContent();
    fragment.observeDeep(updateContent);
    return () => fragment.unobserveDeep(updateContent);
  }, [fragment]);

  const blobUrl = useMemo(() => {
    const html = content.trim() ? content : "<html><body><p style=\"color:#888;font-family:sans-serif;padding:2em\">Loading preview…</p></body></html>";
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [content]);

  useEffect(() => () => URL.revokeObjectURL(blobUrl), [blobUrl]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <iframe
        src={blobUrl}
        sandbox="allow-scripts allow-same-origin"
        className="h-full w-full border-none"
        title={node.name}
      />
    </div>
  );
}
