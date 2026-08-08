import { describe, expect, it } from "vitest";
import { serviceLabelFor, windowsTaskName } from "../label";
import { withDevDesktopSlot } from "@hukum-clients/shared/test-fixtures/dev-desktop-slot";

describe("serviceLabelFor", () => {
  it("uses the production service label for production", () => {
    const label = serviceLabelFor("production");

    expect(label).toEqual({
      id: "ai.hukum.host",
      displayName: "Hukum Host",
      environment: "production",
      devSlot: null,
    });
    expect(windowsTaskName(label)).toBe("\\Hukum\\Host");
  });

  it("gives the dev environment its own service slot", () => {
    const label = serviceLabelFor("dev");

    expect(label).toEqual({
      id: "ai.hukum.host.dev",
      displayName: "Hukum Host (Dev)",
      environment: "dev",
      devSlot: null,
    });
    expect(windowsTaskName(label)).toBe("\\Hukum\\Host-Dev");
  });

  it("uses a slot-specific label for dev-desktop runs", () => {
    withDevDesktopSlot("Worktree Slot", () => {
      const label = serviceLabelFor("dev");

      expect(label).toEqual({
        id: "ai.hukum.host.dev.worktree-slot",
        displayName: "Hukum Host (Dev worktree-slot)",
        environment: "dev",
        devSlot: "worktree-slot",
      });
      expect(windowsTaskName(label)).toBe("\\Hukum\\Host-Dev-Worktree-slot");
    });
  });

  it("gives each non-production environment its own isolated slot", () => {
    const label = serviceLabelFor("staging");

    expect(label).toEqual({
      id: "ai.hukum.host.staging",
      displayName: "Hukum Host (Staging)",
      environment: "staging",
      devSlot: null,
    });
    expect(windowsTaskName(label)).toBe("\\Hukum\\Host-Staging");
  });
});
