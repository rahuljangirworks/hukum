import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "@tailmark/react";
import { useMemo, type ComponentType } from "react";
import type { Components } from "react-markdown";
import type { PluggableList } from "unified";
import { CodeBlock, PreBlock } from "./components/code-block";
import { MarkdownAnchor } from "./components/markdown-anchor";
import { MermaidBlock } from "./components/mermaid-block";
import { HukumChatReference } from "./components/hukum-chat-reference";
import { HukumEpicReference } from "./components/hukum-epic-reference";
import { HukumSpecReference } from "./components/hukum-spec-reference";
import { HukumTicketReference } from "./components/hukum-ticket-reference";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "./components/table-wrapper";
import {
  assistantMarkdownUrlTransform,
  markdownUrlTransform,
} from "./links/markdown-url-transform";
import {
  HUKUM_CHAT_TAG,
  HUKUM_EPIC_TAG,
  HUKUM_MERMAID_TAG,
  HUKUM_SPEC_TAG,
  HUKUM_TICKET_TAG,
} from "./plugins/const";
import { rehypeCustomMermaid } from "./plugins/rehype-custom-mermaid";
import { rehypeHukumChat } from "./plugins/rehype-hukum-chat";
import { rehypeHukumEpic } from "./plugins/rehype-hukum-epic";
import { rehypeHukumSpec } from "./plugins/rehype-hukum-spec";
import { rehypeHukumTicket } from "./plugins/rehype-hukum-ticket";
import {
  extendAssistantImageSanitizeSchema,
  extendHukumSanitizeSchema,
} from "./plugins/rehype-sanitize-schema";
import { getHukumStreamingHighlighter } from "./hukum-streaming-highlighter";

const HUKUM_STREAMING_HIGHLIGHTER = getHukumStreamingHighlighter();

// Product rehype plugins only. Tailmark already runs rehype-raw, sanitize, and
// its marker policy; do not re-register GFM / disable-indented-code (built-in).
// Intentionally no Tailmark `repairs` for next-steps - custom repairs force the
// full-document repair path, and TextSegment peels next-steps before render.
const PRODUCT_REHYPE_PLUGINS: PluggableList = [
  rehypeCustomMermaid,
  rehypeHukumChat,
  rehypeHukumEpic,
  rehypeHukumSpec,
  rehypeHukumTicket,
];

// Product custom tags (mermaid + hukum references) are not on react-markdown's
// `Components` keyof surface; cast after building the map so StreamingMarkdown
// still receives a single stable components object.
const DEFAULT_COMPONENTS = {
  a: MarkdownAnchor as Components["a"],
  code: CodeBlock as Components["code"],
  pre: PreBlock as Components["pre"],
  table: TableWrapper as Components["table"],
  thead: TableHead as Components["thead"],
  th: TableHeader as Components["th"],
  td: TableCell as Components["td"],
  tr: TableRow as Components["tr"],
  [HUKUM_MERMAID_TAG]: MermaidBlock as ComponentType<Record<string, unknown>>,
  [HUKUM_SPEC_TAG]: HukumSpecReference as ComponentType<
    Record<string, unknown>
  >,
  [HUKUM_TICKET_TAG]: HukumTicketReference as ComponentType<
    Record<string, unknown>
  >,
  [HUKUM_CHAT_TAG]: HukumChatReference as ComponentType<
    Record<string, unknown>
  >,
  [HUKUM_EPIC_TAG]: HukumEpicReference as ComponentType<
    Record<string, unknown>
  >,
} as Components;

export interface HukumMarkdownProps {
  children: string;
  className: string | null;
  proseSize: "compact" | "normal";
  components: Record<string, ComponentType<Record<string, unknown>>> | null;
  /** Relaxed image sources are reserved for assistant-owned markdown. */
  imageRendering?: "assistant" | "standard";
  remarkPlugins: PluggableList | null;
  rehypePlugins: PluggableList | null;
  quotable: boolean;
  /**
   * Whether `children` is still growing (a streaming turn). Forwarded to
   * Tailmark's `StreamingMarkdown`, which drives open-tail memo and the
   * streaming code-highlight path via `useIsMarkdownStreaming`.
   */
  isStreaming: boolean;
}

export function HukumMarkdown({
  children,
  className,
  proseSize,
  components,
  imageRendering = "standard",
  remarkPlugins,
  rehypePlugins,
  quotable,
  isStreaming,
}: HukumMarkdownProps) {
  const mergedComponents = useMemo((): Components => {
    if (!components) return DEFAULT_COMPONENTS;
    return {
      ...DEFAULT_COMPONENTS,
      ...(components as Components),
    };
  }, [components]);

  // Only caller extras - Tailmark already ships GFM + disable-indented-code.
  const effectiveRemarkPlugins = useMemo<PluggableList | undefined>(
    () =>
      remarkPlugins && remarkPlugins.length > 0 ? remarkPlugins : undefined,
    [remarkPlugins],
  );

  const effectiveRehypePlugins = useMemo<PluggableList>(() => {
    if (!rehypePlugins || rehypePlugins.length === 0) {
      return PRODUCT_REHYPE_PLUGINS;
    }
    return [...PRODUCT_REHYPE_PLUGINS, ...rehypePlugins];
  }, [rehypePlugins]);

  return (
    <div
      data-quotable={quotable ? "true" : undefined}
      className={cn(
        "prose dark:prose-invert md-prose max-w-none",
        proseSize === "normal" ? "prose-base" : "prose-sm",
        className,
      )}
    >
      <StreamingMarkdown
        isStreaming={isStreaming}
        highlighter={HUKUM_STREAMING_HIGHLIGHTER}
        sanitizeSchema={
          imageRendering === "assistant"
            ? extendAssistantImageSanitizeSchema
            : extendHukumSanitizeSchema
        }
        urlTransform={
          imageRendering === "assistant"
            ? assistantMarkdownUrlTransform
            : markdownUrlTransform
        }
        remarkPlugins={effectiveRemarkPlugins}
        rehypePlugins={effectiveRehypePlugins}
        components={mergedComponents}
      >
        {String(children || "")}
      </StreamingMarkdown>
    </div>
  );
}
