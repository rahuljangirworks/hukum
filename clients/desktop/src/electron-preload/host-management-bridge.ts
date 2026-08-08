import { ipcRenderer, type IpcRendererEvent } from "electron";
import {
  RunnerHostEvent,
  RunnerHostInvoke,
} from "../ipc-contracts/ipc-channels";
import type {
  ActivateInstalledOk,
  ApplyStagedOk,
  ApplyStagedTrigger,
  CliInstallManifestSnapshot,
  ConvergeReadyOk,
  HostAvailableSnapshot,
  HostAvailableVersionsInput,
  HostControllerStatus,
  HostDoctorReport,
  HostInstalledRecord,
  HostLogsTailResult,
  HostNameSettings,
  HostRegistryUpdateState,
  HostRemovalState,
  HostRestartRequestResult,
  HostTrayCommand,
  HostUninstallResult,
  InstallVersionOk,
  MutationOutcome,
  ServiceRegistrationOk,
  HukumUninstallResult,
  FreePortAndRestartInput,
} from "../ipc-contracts/host-management-types";

/**
 * Browser-safe surface for the host gate, update banner, Settings → Host,
 * and the Doctor failure card. Query commands resolve once with the CLI's
 * final NDJSON `result` data payload; mutation intents resolve a
 * `MutationOutcome` (the mutation lane never rejects - "wait-never-reject",
 * Host Update Layer Redesign Tech Plan). Live status (both lanes) is
 * consumed via `getHostControllerStatus` + the desktop-only
 * `hostControllerStatus` push bridge (see `desktop-runner-host.ts`).
 *
 * The renderer never spawns the CLI directly; this bridge is the only seam.
 */
export interface HostManagementBridgeSurface {
  getHostControllerStatus(): Promise<HostControllerStatus>;
  convergeReady(force: boolean): Promise<MutationOutcome<ConvergeReadyOk>>;
  applyStaged(
    trigger: ApplyStagedTrigger,
    force: boolean,
  ): Promise<MutationOutcome<ApplyStagedOk>>;
  activateInstalled(
    force: boolean,
  ): Promise<MutationOutcome<ActivateInstalledOk>>;
  installVersion(
    pin: string,
    force: boolean,
  ): Promise<MutationOutcome<InstallVersionOk>>;
  uninstallHost(input: { readonly all: boolean }): Promise<HostUninstallResult>;
  uninstallHukum(): Promise<HukumUninstallResult>;
  getRemovalState(): Promise<HostRemovalState>;
  clearRemoval(): Promise<void>;
  restartHost(): Promise<HostRestartRequestResult>;
  getHostLogs(input: {
    readonly tailLines: number;
  }): Promise<HostLogsTailResult>;
  runDoctor(): Promise<HostDoctorReport>;
  availableVersions(
    input: HostAvailableVersionsInput,
  ): Promise<HostAvailableSnapshot>;
  installedRecord(): Promise<HostInstalledRecord | null>;
  registerService(): Promise<MutationOutcome<ServiceRegistrationOk>>;
  deregisterService(): Promise<void>;
  registryCheck(input: {
    readonly force: boolean;
  }): Promise<HostRegistryUpdateState>;
  freePortAndRestart(
    input: FreePortAndRestartInput,
  ): Promise<FreePortAndRestartInput>;
  cliManifest(): Promise<CliInstallManifestSnapshot | null>;
  getHostName(): Promise<HostNameSettings>;
  setHostName(input: {
    readonly customName: string | null;
  }): Promise<HostNameSettings>;
}

export function buildHostManagementBridge(): HostManagementBridgeSurface {
  return {
    getHostControllerStatus: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostControllerStatusGet,
      ) as Promise<HostControllerStatus>,
    convergeReady: (force) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostConvergeReady, {
        force,
      }) as Promise<MutationOutcome<ConvergeReadyOk>>,
    applyStaged: (trigger, force) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostApplyStaged, {
        trigger,
        force,
      }) as Promise<MutationOutcome<ApplyStagedOk>>,
    activateInstalled: (force) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostActivateInstalled, {
        force,
      }) as Promise<MutationOutcome<ActivateInstalledOk>>,
    installVersion: (pin, force) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostInstallVersion, {
        pin,
        force,
      }) as Promise<MutationOutcome<InstallVersionOk>>,
    uninstallHost: ({ all }) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostUninstall, {
        all,
      }) as Promise<HostUninstallResult>,
    uninstallHukum: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumAppUninstall,
      ) as Promise<HukumUninstallResult>,
    getRemovalState: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostRemovalGet,
      ) as Promise<HostRemovalState>,
    clearRemoval: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostRemovalClear,
      ) as Promise<void>,
    restartHost: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostRestart,
      ) as Promise<HostRestartRequestResult>,
    getHostLogs: ({ tailLines }) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostLogs, {
        tailLines,
      }) as Promise<HostLogsTailResult>,
    runDoctor: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostDoctor,
      ) as Promise<HostDoctorReport>,
    availableVersions: ({ includePreReleases }) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostAvailable, {
        includePreReleases,
      }) as Promise<HostAvailableSnapshot>,
    installedRecord: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostInstalled,
      ) as Promise<HostInstalledRecord | null>,
    registerService: () =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumServiceRegister) as Promise<
        MutationOutcome<ServiceRegistrationOk>
      >,
    deregisterService: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumServiceDeregister,
      ) as Promise<void>,
    registryCheck: ({ force }) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumRegistryCheck, {
        force,
      }) as Promise<HostRegistryUpdateState>,
    freePortAndRestart: (input) =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumFreePortAndRestart,
        input,
      ) as Promise<FreePortAndRestartInput>,
    cliManifest: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumCliManifestRead,
      ) as Promise<CliInstallManifestSnapshot | null>,
    getHostName: () =>
      ipcRenderer.invoke(
        RunnerHostInvoke.hukumHostNameGet,
      ) as Promise<HostNameSettings>,
    setHostName: ({ customName }) =>
      ipcRenderer.invoke(RunnerHostInvoke.hukumHostNameSet, {
        customName,
      }) as Promise<HostNameSettings>,
  };
}

/**
 * Push subscription for the two-lane `HostControllerStatus`. Desktop-only
 * (mirrors the `hostRegistryUpdates`/`hostOperationStatus` duck-typed
 * bridges it replaces) - not part of the cross-shell `IHostManagement`.
 */
export interface HostControllerStatusBridgeSurface {
  onChange(handler: (status: HostControllerStatus) => void): {
    dispose: () => void;
  };
}

export function buildHostControllerStatusSubscriber(): HostControllerStatusBridgeSurface {
  return {
    onChange(handler) {
      const listener = (_event: IpcRendererEvent, payload: unknown): void => {
        if (!isHostControllerStatus(payload)) return;
        handler(payload);
      };
      ipcRenderer.on(RunnerHostEvent.hostControllerStatusChange, listener);
      return {
        dispose: () =>
          ipcRenderer.removeListener(
            RunnerHostEvent.hostControllerStatusChange,
            listener,
          ),
      };
    },
  };
}

function isHostControllerStatus(value: unknown): value is HostControllerStatus {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.updateReady === "boolean" &&
    typeof candidate.reachable === "boolean" &&
    typeof candidate.removedByUser === "boolean" &&
    typeof candidate.checkedAt === "string" &&
    (candidate.activation === "activated" ||
      candidate.activation === "pendingActivation" ||
      candidate.activation === "activationUnknown" ||
      candidate.activation === "unavailable")
  );
}

/**
 * Subscribes to tray-side host commands forwarded from main.
 * Renderer wires this to the Doctor / Settings router so a tray click
 * deep-links into the right surface.
 */
export interface HostTrayBridgeSurface {
  onCommand(handler: (command: HostTrayCommand) => void): {
    dispose: () => void;
  };
}

export function buildHostTrayCommandSubscriber(): HostTrayBridgeSurface {
  return {
    onCommand(handler: (command: HostTrayCommand) => void): {
      dispose: () => void;
    } {
      const listener = (_event: IpcRendererEvent, payload: unknown): void => {
        if (!isHostTrayCommand(payload)) return;
        handler(payload);
      };
      ipcRenderer.on(RunnerHostEvent.hostTrayCommand, listener);
      return {
        dispose: () =>
          ipcRenderer.removeListener(RunnerHostEvent.hostTrayCommand, listener),
      };
    },
  };
}

function isHostTrayCommand(value: unknown): value is HostTrayCommand {
  if (value === null || typeof value !== "object") return false;
  const kind = (value as { kind?: unknown }).kind;
  if (kind === "openSettingsHost") return true;
  if (kind === "restartHost") return true;
  if (kind === "openLogs") return true;
  if (kind === "installUpdate") {
    return typeof (value as { version?: unknown }).version === "string";
  }
  return false;
}
