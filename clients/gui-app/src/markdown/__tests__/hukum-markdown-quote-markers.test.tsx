import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HukumMarkdown } from "@/markdown/hukum-markdown";

const STREAMING_CONTENT = [
  "# Title",
  "",
  "Stable paragraph.",
  "",
  "Tail paragraph.",
].join("\n");

// Tailmark marks the open streaming tail with `data-md-streaming` (empty
// attribute) on a `display: contents` wrapper. Settled blocks omit the attr.
const STREAMING_TAIL_SELECTOR = "[data-md-streaming]";

function renderMarkdown(content: string, isStreaming: boolean) {
  return render(
    <HukumMarkdown
      className={null}
      proseSize="normal"
      components={null}
      remarkPlugins={null}
      rehypePlugins={null}
      quotable={false}
      isStreaming={isStreaming}
    >
      {content}
    </HukumMarkdown>,
  );
}

describe("<HukumMarkdown /> streaming tail markers", () => {
  afterEach(() => {
    cleanup();
  });

  it("wraps only blocks at or after the frozen-prefix boundary while streaming", () => {
    const { container } = renderMarkdown(STREAMING_CONTENT, true);

    expect(container.querySelectorAll(STREAMING_TAIL_SELECTOR)).toHaveLength(1);
    expect(
      screen
        .getByRole("heading", { name: "Title" })
        .closest(STREAMING_TAIL_SELECTOR),
    ).toBeNull();
    expect(
      screen.getByText("Stable paragraph.").closest(STREAMING_TAIL_SELECTOR),
    ).toBeNull();

    const tailWrapper = screen
      .getByText("Tail paragraph.")
      .closest<HTMLElement>(STREAMING_TAIL_SELECTOR);
    expect(tailWrapper).not.toBeNull();
    expect(tailWrapper?.style.display).toBe("contents");
  });

  it("removes every streaming-tail marker after streaming completes", () => {
    const { container, rerender } = renderMarkdown(STREAMING_CONTENT, true);

    expect(container.querySelectorAll(STREAMING_TAIL_SELECTOR)).toHaveLength(1);

    rerender(
      <HukumMarkdown
        className={null}
        proseSize="normal"
        components={null}
        remarkPlugins={null}
        rehypePlugins={null}
        quotable={false}
        isStreaming={false}
      >
        {STREAMING_CONTENT}
      </HukumMarkdown>,
    );

    expect(container.querySelectorAll(STREAMING_TAIL_SELECTOR)).toHaveLength(0);
  });
});
