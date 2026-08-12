import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TerminalLaunchPanel } from "@/components/home/composer/terminal-launch-panel";
import { createComposerToolbarStore } from "@/stores/composer/composer-toolbar-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TerminalAgentLaunch } from "@/components/home/hooks/use-landing-composer-actions";
import { modLabel } from "@/lib/keybindings/platform";

const panelMocks = vi.hoisted(() => ({
  providers: [
    { providerId: "claude-code", terminalAgentArgs: "--from-settings" },
  ],
}));

vi.mock("@/components/home/pickers/harness-model-picker", () => ({
  HarnessModelPicker: () => (
    <button type="button" aria-label="Harness picker">
      Claude
    </button>
  ),
}));

vi.mock("@/components/home/pickers/agent-mode-toggle", () => ({
  AgentModeToggle: () => (
    <button type="button" aria-label="Agent mode">
      Regular
    </button>
  ),
}));

vi.mock("@/hooks/providers/use-providers-list-query", () => ({
  useProvidersList: () => ({
    data: { providers: panelMocks.providers },
  }),
}));

type TestedTuiHarness = "claude" | "opencode" | "antigravity" | "gemini";

function makeToolbarStore(harnessId: TestedTuiHarness) {
  const store = createComposerToolbarStore({
    seedKey: "test",
    values: {
      permission: "supervised",
      selection: { harnessId, modelSlug: "", profileId: null },
      reasoning: "",
      serviceTier: "",
    },
    onSettingsChange: null,
    tuiOnly: true,
  });
  // The Start gate reads the selected harness's runtime `modes` from the
  // catalog, so seed a loaded catalog where the harness is TUI-capable - otherwise
  // Start stays disabled.
  store.getState().setCatalog({
    harnesses: [
      {
        id: harnessId,
        label: harnessId,
        enabled: true,
        available: true,
        error: null,
        modes: ["gui", "tui"],
        requiresApiKey: false,
        supportedPermissionModes: [
          "supervised",
          "auto_accept_edits",
          "full_access",
        ],
        availabilityPending: false,
      },
    ],
    modelsHarnessId: harnessId,
    models: [],
    modelsLoaded: true,
    tuiOnly: true,
  });
  return store;
}

function makeGuiOnlyToolbarStore() {
  const store = createComposerToolbarStore({
    seedKey: "test",
    values: {
      permission: "supervised",
      selection: { harnessId: "hukum", modelSlug: "", profileId: null },
      reasoning: "",
      serviceTier: "",
    },
    onSettingsChange: null,
    tuiOnly: true,
  });
  // A GUI-only harness cannot back a terminal agent. The Start gate follows
  // the runtime `modes` advertised by the host.
  store.getState().setCatalog({
    harnesses: [
      {
        id: "hukum",
        label: "Hukum",
        enabled: true,
        available: true,
        error: null,
        modes: ["gui"],
        requiresApiKey: false,
        supportedPermissionModes: ["supervised", "full_access"],
        availabilityPending: false,
      },
    ],
    modelsHarnessId: "hukum",
    models: [],
    modelsLoaded: true,
    tuiOnly: true,
  });
  return store;
}

function renderPanel(
  onStart: (launch: TerminalAgentLaunch) => void,
  harnessId: TestedTuiHarness,
) {
  return render(
    <TerminalLaunchPanel
      store={makeToolbarStore(harnessId)}
      pending={false}
      disabledHint={null}
      onStart={onStart}
    />,
  );
}

describe("<TerminalLaunchPanel /> initial prompt handoff", () => {
  beforeEach(() => {
    panelMocks.providers = [
      { providerId: "claude-code", terminalAgentArgs: "--from-settings" },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the Start button visibly filled inside dialogs", () => {
    renderPanel(vi.fn(), "claude");

    const start = screen.getByRole("button", { name: "Start agent" });
    expect(start.getAttribute("data-variant")).toBe("secondary");
    expect(start.className).toContain(
      "in-data-[slot=dialog-content]:bg-input/60",
    );
  });

  it("keeps advanced Settings args out of the prompt field", () => {
    const onStart = vi.fn();
    renderPanel(onStart, "claude");

    const input = screen.getByLabelText<HTMLInputElement>(
      "Initial terminal agent prompt",
    );
    expect(input.value).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Start agent" }));

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        harnessId: "claude",
        initialPrompt: null,
        terminalAgentArgs: null,
      }),
    );
  });

  it("sends typed text as an initial prompt, never as CLI args", () => {
    const onStart = vi.fn();
    renderPanel(onStart, "claude");

    fireEvent.change(
      screen.getByLabelText("Initial terminal agent prompt"),
      {
        target: { value: "Fix the terminal reliably" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Start agent" }));

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPrompt: "Fix the terminal reliably",
        terminalAgentArgs: null,
      }),
    );
  });

  it("treats whitespace-only input as no initial prompt", () => {
    const onStart = vi.fn();
    renderPanel(onStart, "claude");

    fireEvent.change(
      screen.getByLabelText("Initial terminal agent prompt"),
      {
        target: { value: "   " },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Start agent" }));

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPrompt: null,
        terminalAgentArgs: null,
      }),
    );
  });

  it("accepts plain OpenCode prompt text without treating it as a path", () => {
    const onStart = vi.fn();
    renderPanel(onStart, "opencode");

    const input = screen.getByLabelText("Initial terminal agent prompt");
    fireEvent.change(input, { target: { value: "hello" } });

    const start = screen.getByRole("button", { name: "Start agent" });
    fireEvent.click(start);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPrompt: "hello",
        terminalAgentArgs: null,
      }),
    );
  });

  it.each(["antigravity", "gemini"] as const)(
    "dispatches the selected %s Terminal harness instead of silently returning",
    (harnessId) => {
      const onStart = vi.fn();
      renderPanel(onStart, harnessId);

      fireEvent.change(
        screen.getByLabelText("Initial terminal agent prompt"),
        { target: { value: "Inspect this workspace" } },
      );
      fireEvent.click(screen.getByRole("button", { name: "Start agent" }));

      expect(onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          harnessId,
          initialPrompt: "Inspect this workspace",
        }),
      );
    },
  );

  it("starts the agent with Cmd+Enter from anywhere on the surface", () => {
    const onStart = vi.fn();
    renderPanel(onStart, "claude");

    const startButton = screen.getByRole("button", { name: "Start agent" });
    expect(startButton.textContent).toContain(modLabel());
    expect(startButton.textContent).toContain("↵");

    fireEvent.keyDown(window, { key: "Enter", metaKey: true });

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ harnessId: "claude" }),
    );
  });

  it("blocks Start for a GUI-only harness", () => {
    const onStart = vi.fn();
    render(
      <TooltipProvider>
        <TerminalLaunchPanel
          store={makeGuiOnlyToolbarStore()}
          pending={false}
          disabledHint={null}
          onStart={onStart}
        />
      </TooltipProvider>,
    );

    const start = screen.getByRole("button", { name: "Start agent" });
    expect(start.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(start);
    expect(onStart).not.toHaveBeenCalled();
  });
});
