import { constants as fsConstants } from "node:fs";
import { access, stat } from "node:fs/promises";
import { dialog } from "electron";
import { isShellExecutablePathSupported } from "@hukum/protocol/config/shell-executable";
import { RunnerHostInvoke } from "../../ipc-contracts/ipc-channels";
import type { HukumShellProbeResult } from "../../ipc-contracts/hukum-cli-types";
import { runHukumCli, runHukumCliJson } from "../cli/hukum-cli";
import type { RunnerIpcBridge } from "./runner-ipc-bridge";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(raw: unknown, key: string, channel: string): string {
  if (!isPlainObject(raw) || typeof raw[key] !== "string") {
    throw new Error(`${channel}: missing or non-string '${key}'`);
  }
  return raw[key];
}

function requireStringOrNull(
  raw: unknown,
  key: string,
  channel: string,
): string | null {
  if (!isPlainObject(raw)) {
    throw new Error(`${channel}: missing object payload`);
  }
  const value = raw[key];
  if (typeof value === "string" || value === null) return value;
  throw new Error(`${channel}: '${key}' must be a string or null`);
}

function optionalString(raw: unknown, key: string): string | null {
  if (!isPlainObject(raw)) return null;
  const value = raw[key];
  return typeof value === "string" ? value : null;
}

/**
 * Reads a `readonly string[] | null` field off the IPC payload. Returns
 * `null` only when the field is explicitly absent or set to `null`; an empty
 * array is preserved (it's the explicit-empty-args case). Throws on a
 * malformed shape - the renderer types are strict, so anything else is a
 * bug worth surfacing instead of papering over.
 */
function optionalStringArray(
  raw: unknown,
  key: string,
  channel: string,
): readonly string[] | null {
  if (!isPlainObject(raw)) return null;
  const value = raw[key];
  if (value === null || value === undefined) return null;
  if (
    Array.isArray(value) &&
    value.every((entry): entry is string => typeof entry === "string")
  ) {
    return value;
  }
  throw new Error(
    `${channel}: '${key}' must be a string[] or null (got ${JSON.stringify(value)})`,
  );
}

/**
 * IPC handlers that subprocess-invoke the `hukum` CLI. The renderer
 * (via TanStack Query in the future Shell&Environment settings page,
 * and the host-failure card) reaches the on-disk SQLite + bootstrap.log
 * through these. Host-independent - works whether the host is up,
 * starting, or stuck.
 *
 * Each handler maps to a single CLI subcommand. Inputs are validated
 * here at the IPC boundary; the CLI itself re-validates (commander's
 * required-option enforcement, env-key regex, shell-args array shape).
 */
export function registerHukumCliIpc(bridge: RunnerIpcBridge): void {
  // `host status` is now a runner-aware command (Native Packaging
  // cutover): it emits the shared NDJSON envelope and integrates Core
  // Flow 7 auto-bootstrap. Desktop always passes `--no-bootstrap` here
  // because Setup splash and Settings → Host drive the install
  // pipeline explicitly - host-status from Desktop is informational
  // only and must never implicitly install the host.
  bridge.handleInvoke(RunnerHostInvoke.hukumHostStatus, async () => {
    return runHukumCliJson(["host", "status", "--no-bootstrap"]);
  });

  bridge.handleInvoke(RunnerHostInvoke.hukumConfigShellGet, async () => {
    // `config shell get` is now a runner-aware command (Native Packaging
    // legacy-JSON migration). The shared NDJSON envelope means we use
    // `runHukumCliJson` here so the helper unwraps `result.data` for
    // the renderer - no more plain-JSON compatibility path on this
    // surface.
    return runHukumCliJson(["config", "shell", "get"]);
  });

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellSet,
    async (_event, raw: unknown) => {
      const path = optionalString(raw, "path");
      const args = optionalStringArray(raw, "args", "hukumConfigShellSet");
      const cliArgs = ["config", "shell", "set"];
      if (path !== null) cliArgs.push("--path", path);
      if (args !== null) {
        if (args.length === 0) {
          cliArgs.push("--clear-args");
        } else {
          // Pass shell flags as separate argv entries after `--` so any
          // leading-dash flags (e.g. "-i", "-l") aren't interpreted as
          // commander options. No shell quoting required - we're spawning
          // the CLI directly, not through a shell.
          cliArgs.push("--", ...args);
        }
      }
      await runHukumCli({
        args: cliArgs,
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );

  bridge.handleInvoke(RunnerHostInvoke.hukumConfigShellReset, async () => {
    await runHukumCli({
      args: ["config", "shell", "reset"],
      maxBuffer: 64 * 1024,
      timeoutMs: 10_000,
    });
  });

  bridge.handleInvoke(RunnerHostInvoke.hukumConfigShellList, async () => {
    // Best-effort shell enumeration for the Settings shell picker; the shared
    // NDJSON envelope means `runHukumCliJson` unwraps `result.data` (the
    // DetectedShell[] array) for the renderer.
    return runHukumCliJson(["config", "shell", "list"]);
  });

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellAdd,
    async (_event, raw: unknown) => {
      const path = requireString(raw, "path", "hukumConfigShellAdd");
      await runHukumCli({
        args: ["config", "shell", "add", "--path", path],
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellRemove,
    async (_event, raw: unknown) => {
      const path = requireString(raw, "path", "hukumConfigShellRemove");
      await runHukumCli({
        args: ["config", "shell", "remove", "--path", path],
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellRevertArgs,
    async (_event, raw: unknown) => {
      const path = requireString(raw, "path", "hukumConfigShellRevertArgs");
      await runHukumCli({
        args: ["config", "shell", "revert-args", "--path", path],
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );

  // Native existence/executability probe for the "Add a shell" live validation.
  // Runs directly in main (fs access) so it can be debounced per keystroke
  // without paying a CLI subprocess spawn each time; mirrors the protocol's
  // `X_OK` detection check.
  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellProbe,
    async (_event, raw: unknown): Promise<HukumShellProbeResult> => {
      const path = requireString(raw, "path", "hukumConfigShellProbe");
      const fileStat = await stat(path).then(
        (value) => value,
        () => null,
      );
      if (fileStat === null) {
        return { exists: false, executable: false };
      }
      if (
        !fileStat.isFile() ||
        !isShellExecutablePathSupported(path, process.platform)
      ) {
        return { exists: true, executable: false };
      }
      const executable = await access(path, fsConstants.X_OK).then(
        () => true,
        () => false,
      );
      return {
        exists: true,
        executable,
      };
    },
  );

  // Native "choose a program file" dialog for the picker's Browse affordance.
  // Returns the chosen absolute path, or null on cancel.
  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigShellPickProgramFile,
    async (): Promise<string | null> => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"],
      });
      return result.canceled || result.filePaths.length === 0
        ? null
        : result.filePaths[0];
    },
  );

  bridge.handleInvoke(RunnerHostInvoke.hukumConfigEnvList, async () => {
    // `config env list` is now a runner-aware command (Native Packaging
    // legacy-JSON migration). See hukumConfigShellGet above for the
    // rationale - same migration, same call shape.
    return runHukumCliJson(["config", "env", "list"]);
  });

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigEnvSet,
    async (_event, raw: unknown) => {
      const key = requireString(raw, "key", "hukumConfigEnvSet");
      const value = requireStringOrNull(raw, "value", "hukumConfigEnvSet");
      const args =
        value === null
          ? ["config", "env", "unset", "--key", key]
          : ["config", "env", "set", "--key", key, "--value", value];
      await runHukumCli({
        args,
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );

  bridge.handleInvoke(
    RunnerHostInvoke.hukumConfigEnvDelete,
    async (_event, raw: unknown) => {
      const key = requireString(raw, "key", "hukumConfigEnvDelete");
      const args = ["config", "env", "delete", "--key", key];
      await runHukumCli({
        args,
        maxBuffer: 64 * 1024,
        timeoutMs: 10_000,
      });
    },
  );
}
