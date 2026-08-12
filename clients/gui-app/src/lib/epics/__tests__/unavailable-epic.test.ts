import { describe, expect, it } from "vitest";
import { isUnavailableEpicReason } from "@/lib/epics/unavailable-epic";

describe("isUnavailableEpicReason", () => {
  it.each([
    "Epic 2d720be6-ca21-4ead-94c2-26720e3202cd was not found",
    "Epic 'legacy-epic-id' was not found",
    "getTaskRoomInfo returned null",
    "null roomInfo",
    "returned null task",
  ])("recognizes an unavailable Epic: %s", (message) => {
    expect(isUnavailableEpicReason(message)).toBe(true);
  });

  it.each([
    "Artifact artifact-1 was not found",
    "The Epic epic-1 was not found while loading",
    "Network request failed",
  ])("does not classify an unrelated failure: %s", (message) => {
    expect(isUnavailableEpicReason(message)).toBe(false);
  });
});
