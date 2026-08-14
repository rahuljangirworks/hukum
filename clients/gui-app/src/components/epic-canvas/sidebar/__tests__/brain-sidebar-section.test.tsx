import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrainSidebarSection } from "@/components/epic-canvas/sidebar/brain-sidebar-section";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";

const openSettingsMock = vi.fn();
const openGraphMock = vi.fn();

vi.mock("@/hooks/brain", () => ({
  useBrainRegistry: () => ({
    data: {
      brains: [
        {
          id: "brain-two",
          name: "Research",
          vaultPath: "/vaults/research",
          template: "existing",
          createdAt: "2026-08-13T00:00:00.000Z",
        },
      ],
      activeBrainId: "brain-two",
    },
  }),
}));

vi.mock("@/components/epic-canvas/sidebar/brain-search-input", () => ({
  BrainSearchInput: () => <div>Brain search</div>,
}));
vi.mock("@/components/epic-canvas/sidebar/brain-folder-tree", () => ({
  BrainFolderTree: () => <div>Brain folders</div>,
}));
vi.mock("@/components/epic-canvas/sidebar/brain-skill-list", () => ({
  ConnectedBrainSkillList: () => <div>Brain skills</div>,
}));
vi.mock("@/components/epic-canvas/sidebar/brain-picker-dropdown", () => ({
  BrainPickerDropdown: () => <div>Brain picker</div>,
}));
vi.mock("@/components/brain/brain-add-folder-dialog", () => ({
  BrainAddFolderDialog: () => null,
}));
vi.mock("@/stores/tabs/use-system-tab-modal", () => ({
  useSystemTabModalActions: () => ({ openSettings: openSettingsMock }),
}));
vi.mock("@/components/brain/use-open-brain-graph", () => ({
  useOpenBrainGraph: () => openGraphMock,
}));

describe("BrainSidebarSection", () => {
  beforeEach(() => {
    openSettingsMock.mockClear();
    openGraphMock.mockClear();
    useBrainConfigStore.setState({
      brains: [],
      activeBrainId: null,
      config: null,
      isConfigured: false,
      isLoading: true,
    });
  });

  it("projects the authoritative registry query into the sidebar store", async () => {
    render(<BrainSidebarSection epicId="epic-one" tabId="tab-one" />);

    await waitFor(() => {
      expect(useBrainConfigStore.getState().activeBrainId).toBe("brain-two");
    });
    expect(useBrainConfigStore.getState().brains).toHaveLength(1);
    expect(screen.getByText("Brain picker")).not.toBeNull();
    expect(screen.getByText("Brain folders")).not.toBeNull();
  });

  it("opens Brain in the promotable Settings surface from the configured header", async () => {
    render(<BrainSidebarSection epicId="epic-one" tabId="tab-one" />);
    await waitFor(() =>
      expect(
        screen.getAllByLabelText("Manage Brain capabilities").length,
      ).toBeGreaterThan(0),
    );
    const buttons = screen.getAllByLabelText("Manage Brain capabilities");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(openSettingsMock).toHaveBeenCalledWith({
      section: "brain",
      resetToGeneral: false,
    });
  });

  it("opens the active Brain knowledge graph from the configured header", async () => {
    render(<BrainSidebarSection epicId="epic-one" tabId="tab-one" />);
    await waitFor(() =>
      expect(screen.getAllByLabelText("Open knowledge graph").length).toBeGreaterThan(0),
    );
    const buttons = screen.getAllByLabelText("Open knowledge graph");
    fireEvent.click(buttons[buttons.length - 1]);
    expect(openGraphMock).toHaveBeenCalledTimes(1);
  });
});
