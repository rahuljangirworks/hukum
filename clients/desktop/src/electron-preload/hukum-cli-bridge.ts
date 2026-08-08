import { ipcRenderer } from "electron";
import { RunnerHostInvoke } from "../ipc-contracts/ipc-channels";
import type {
  HukumDetectedShell,
  HukumEnvOverride,
  HukumHostStatusSnapshot,
  HukumShellConfig,
  HukumShellConfigSetInput,
  HukumShellProbeResult,
} from "../ipc-contracts/hukum-cli-types";

/**
 * Surface exposed under `runnerHost.hukumCli` in the preload bridge.
 * Each method maps to one `runnerHost:hukum:*` invoke channel handled by
 * `hukum-cli-ipc.ts` in main, which subprocess-invokes the `hukum` CLI.
 *
 * Kept browser-safe: no Electron types leak across `contextBridge`. The
 * renderer-side `DesktopRunnerHost` wraps this as `IHukumCli`.
 */
export interface HukumCliBridgeSurface {
  hostStatus(): Promise<HukumHostStatusSnapshot>;
  shellConfigGet(): Promise<HukumShellConfig>;
  shellConfigSet(input: HukumShellConfigSetInput): Promise<void>;
  shellConfigReset(): Promise<void>;
  shellConfigAdd(input: { readonly path: string }): Promise<void>;
  shellConfigRemove(input: { readonly path: string }): Promise<void>;
  shellRevertArgs(input: { readonly path: string }): Promise<void>;
  shellProbe(input: {
    readonly path: string;
  }): Promise<HukumShellProbeResult>;
  pickShellProgramFile(): Promise<string | null>;
  shellListDetected(): Promise<readonly HukumDetectedShell[]>;
  envOverrideList(): Promise<readonly HukumEnvOverride[]>;
  envOverrideSet(input: {
    readonly key: string;
    readonly value: string | null;
  }): Promise<void>;
  envOverrideDelete(input: { readonly key: string }): Promise<void>;
}

export function buildHukumCliBridge(): HukumCliBridgeSurface {
  return {
    hostStatus: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostStatus,
      ) as Promise<HukumHostStatusSnapshot>,
    shellConfigGet: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellGet,
      ) as Promise<HukumShellConfig>,
    shellConfigSet: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellSet,
        input,
      ) as Promise<void>,
    shellConfigReset: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellReset,
      ) as Promise<void>,
    shellConfigAdd: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellAdd,
        input,
      ) as Promise<void>,
    shellConfigRemove: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellRemove,
        input,
      ) as Promise<void>,
    shellRevertArgs: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellRevertArgs,
        input,
      ) as Promise<void>,
    shellProbe: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellProbe,
        input,
      ) as Promise<HukumShellProbeResult>,
    pickShellProgramFile: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigShellPickProgramFile,
      ) as Promise<string | null>,
    shellListDetected: () =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumConfigShellList) as Promise<
        readonly HukumDetectedShell[]
      >,
    envOverrideList: () =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumConfigEnvList) as Promise<
        readonly HukumEnvOverride[]
      >,
    envOverrideSet: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigEnvSet,
        input,
      ) as Promise<void>,
    envOverrideDelete: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumConfigEnvDelete,
        input,
      ) as Promise<void>,
  };
}
