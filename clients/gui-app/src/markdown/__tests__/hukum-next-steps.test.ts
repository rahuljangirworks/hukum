import { describe, expect, it } from "vitest";
import {
  parseHukumNextStepsMarkdown,
  repairHukumNextStepsMarkdown,
} from "@/markdown/hukum-next-steps";

describe("parseHukumNextStepsMarkdown", () => {
  it("parses a complete next steps block into prose and prompt options", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "Before",
        "",
        "<HUKUM_NEXT_STEPS>",
        "Implementation is complete.",
        "",
        "- [] Use /implementation-validation to validate the work",
        "- [ ] Review the changed files with /review-files",
        "</HUKUM_NEXT_STEPS>",
        "",
        "After",
      ].join("\n"),
      false,
    );

    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatchObject({
      kind: "markdown",
      markdown: "Before\n\n",
    });
    expect(parts[1]).toMatchObject({
      kind: "next_steps",
      prose: "Implementation is complete.",
      complete: true,
      options: [
        {
          prompt: "Use /implementation-validation to validate the work",
        },
        {
          prompt: "Review the changed files with /review-files",
        },
      ],
    });
    expect(parts[2]).toMatchObject({ kind: "markdown", markdown: "\nAfter" });
  });

  it("accepts an opening tag token followed by prose on the same line", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "<HUKUM_NEXT_STEPS> Implementation is complete.",
        "",
        "- [] Use /implementation-validation to validate the work",
        "</HUKUM_NEXT_STEPS>",
      ].join("\n"),
      false,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      kind: "next_steps",
      prose: "Implementation is complete.",
      complete: true,
    });
  });

  it("repairs a completed unmatched final block", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "<HUKUM_NEXT_STEPS>",
        "Pick the validation pass.",
        "",
        "- [] Use /implementation-validation to validate the work",
      ].join("\n"),
      false,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      kind: "next_steps",
      complete: true,
    });
  });

  it("keeps streaming unmatched blocks incomplete", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "<HUKUM_NEXT_STEPS>",
        "Pick the validation pass.",
        "",
        "- [] Use /implementation-validation to validate the work",
      ].join("\n"),
      true,
    );

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      kind: "next_steps",
      complete: false,
    });
  });

  it("keeps part and settled-option ids stable while a block streams", () => {
    // Three frames of one streaming turn: the open block grows by a few
    // tokens, then the close tag lands and streaming ends. The part id and
    // the settled first option's id are React keys - if either changed
    // between frames, the prose markdown and the option buttons would
    // remount on every streamed token.
    const earlierFrame = [
      "Before",
      "",
      "<HUKUM_NEXT_STEPS>",
      "Pick one.",
      "",
      "- [] Use /implementation-validation to validate the work",
      "- [] Review the cha",
    ].join("\n");
    const laterFrame = [
      "Before",
      "",
      "<HUKUM_NEXT_STEPS>",
      "Pick one.",
      "",
      "- [] Use /implementation-validation to validate the work",
      "- [] Review the changed files with /review-files",
    ].join("\n");
    const completedFrame = `${laterFrame}\n</HUKUM_NEXT_STEPS>`;

    const nextStepsParts = [
      parseHukumNextStepsMarkdown(earlierFrame, true),
      parseHukumNextStepsMarkdown(laterFrame, true),
      parseHukumNextStepsMarkdown(completedFrame, false),
    ].map((parts) => {
      const part = parts.at(1);
      if (part === undefined || part.kind !== "next_steps") {
        throw new Error("expected next steps part");
      }
      return part;
    });

    const [earlier, later, completed] = nextStepsParts;
    expect(later.id).toBe(earlier.id);
    expect(completed.id).toBe(earlier.id);
    expect(later.options[0]?.id).toBe(earlier.options[0]?.id);
    expect(completed.options[0]?.id).toBe(earlier.options[0]?.id);
  });

  it("preserves multiple next steps blocks in order", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "A",
        "<HUKUM_NEXT_STEPS>",
        "First",
        "- [] First follow-up prompt",
        "</HUKUM_NEXT_STEPS>",
        "B",
        "<HUKUM_NEXT_STEPS>",
        "Second",
        "- [] Second follow-up prompt",
        "</HUKUM_NEXT_STEPS>",
        "C",
      ].join("\n"),
      false,
    );

    expect(parts.map((part) => part.kind)).toEqual([
      "markdown",
      "next_steps",
      "markdown",
      "next_steps",
      "markdown",
    ]);
  });

  it("ignores tags inside fenced code", () => {
    const markdown = [
      "```xml",
      "<HUKUM_NEXT_STEPS>",
      "- [] Follow up",
      "</HUKUM_NEXT_STEPS>",
      "```",
    ].join("\n");

    expect(parseHukumNextStepsMarkdown(markdown, false)).toEqual([
      { kind: "markdown", id: "markdown:0", markdown },
    ]);
  });

  it("falls back to tag-stripped markdown for blocks without prompt options", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "<HUKUM_NEXT_STEPS>",
        "Readable prose survives.",
        "",
        "- []",
        "</HUKUM_NEXT_STEPS>",
      ].join("\n"),
      false,
    );

    expect(parts).toEqual([
      {
        kind: "markdown",
        id: "markdown:0",
        markdown: "Readable prose survives.\n\n- []",
      },
    ]);
  });

  it("treats only trailing checkbox prompt options as actions", () => {
    const parts = parseHukumNextStepsMarkdown(
      [
        "<HUKUM_NEXT_STEPS>",
        "- [] This stays in prose because it is not trailing",
        "",
        "Then do the final step.",
        "",
        "- [] Use /action for the next step",
        "</HUKUM_NEXT_STEPS>",
      ].join("\n"),
      false,
    );

    const nextSteps = parts[0];
    expect(nextSteps.kind).toBe("next_steps");
    if (nextSteps.kind !== "next_steps") {
      throw new Error("expected next steps part");
    }
    expect(nextSteps.prose).toBe(
      "- [] This stays in prose because it is not trailing\n\nThen do the final step.",
    );
    expect(nextSteps.options).toHaveLength(1);
    expect(nextSteps.options[0]?.prompt).toBe("Use /action for the next step");
  });
});

describe("repairHukumNextStepsMarkdown", () => {
  it("leaves ordinary markdown untouched", () => {
    const markdown = "Normal markdown without custom next steps.";

    expect(repairHukumNextStepsMarkdown(markdown)).toBe(markdown);
  });

  it("adds a closing tag for unmatched final blocks", () => {
    const repaired = repairHukumNextStepsMarkdown(
      ["<HUKUM_NEXT_STEPS>", "Text"].join("\n"),
    );

    expect(repaired).toBe(
      ["<HUKUM_NEXT_STEPS>", "Text", "</HUKUM_NEXT_STEPS>"].join("\n"),
    );
  });

  // Intentionally not wired into Tailmark `repairs`: custom repairs force the
  // full-document repair path. TextSegment peels next-steps before render.
});
