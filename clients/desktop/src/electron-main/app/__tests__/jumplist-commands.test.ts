import { describe, expect, it, vi, type Mock } from "vitest";

const electronMock = vi.hoisted(() => ({
  on: vi.fn(),
}));

vi.mock("electron", () => ({
  app: {
    on: electronMock.on,
  },
}));

vi.mock("../logger", () => ({
  log: { info: vi.fn(), warn: vi.fn() },
}));

import {
  findJumplistCommandInArgv,
  registerJumplistCommandHandling,
} from "../jumplist-commands";

describe("findJumplistCommandInArgv", () => {
  it("maps the jump-list task flags to their commands", () => {
    const exe = "C:\\Program Files\\Hukum\\Hukum.exe";
    expect(findJumplistCommandInArgv([exe, "--new-epic"])).toBe(
      "epic.newWindow",
    );
    expect(findJumplistCommandInArgv([exe, "--open-settings"])).toBe(
      "app.openSettings",
    );
  });

  it("ignores argv without a jump-list flag", () => {
    expect(findJumplistCommandInArgv(["Hukum.exe"])).toBeNull();
    expect(
      findJumplistCommandInArgv([
        "Hukum.exe",
        "hukum-staging://auth/callback",
      ]),
    ).toBeNull();
  });
});

describe("registerJumplistCommandHandling", () => {
  function installAndFire(argv: readonly string[]): {
    dispatch: Mock;
    focusMainWindow: Mock;
  } {
    electronMock.on.mockReset();
    const sink = { dispatch: vi.fn(), focusMainWindow: vi.fn() };
    registerJumplistCommandHandling(sink);
    expect(electronMock.on).toHaveBeenCalledWith(
      "second-instance",
      expect.any(Function),
    );
    const listener = electronMock.on.mock.calls[0][1] as (
      event: unknown,
      argv: readonly string[],
    ) => void;
    listener({}, argv);
    return sink;
  }

  it("focuses the main window and dispatches a recognized flag", () => {
    const sink = installAndFire(["Hukum.exe", "--open-settings"]);
    expect(sink.focusMainWindow).toHaveBeenCalledOnce();
    expect(sink.dispatch).toHaveBeenCalledWith("app.openSettings");
  });

  it("still focuses the main window on a plain relaunch", () => {
    const sink = installAndFire(["Hukum.exe"]);
    expect(sink.focusMainWindow).toHaveBeenCalledOnce();
    expect(sink.dispatch).not.toHaveBeenCalled();
  });
});
