import { describe, expect, it, vi } from "vitest";

const electronMock = vi.hoisted(() => ({
  setAboutPanelOptions: vi.fn(),
}));

vi.mock("electron", () => ({
  app: {
    getVersion: (): string => "1.2.3",
    setAboutPanelOptions: electronMock.setAboutPanelOptions,
  },
}));

import { configureNativeAboutPanel } from "../about";

describe("configureNativeAboutPanel", () => {
  it("includes the native macOS metadata available to this slice", () => {
    configureNativeAboutPanel("Hukum", "/tmp/hukum-icon.png");

    expect(electronMock.setAboutPanelOptions).toHaveBeenCalledWith({
      applicationName: "Hukum",
      applicationVersion: "1.2.3",
      version: "1.2.3",
      copyright: `Copyright ${new Date().getFullYear()} Hukum AI`,
      credits: "Hukum AI",
      website: "https://hukum.ai",
      iconPath: "/tmp/hukum-icon.png",
    });
  });
});
