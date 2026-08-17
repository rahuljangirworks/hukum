import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  cliInstallHomeDir as sharedCliInstallHomeDir,
  cliManifestPath as sharedCliManifestPath,
  hostInstallDir as sharedHostInstallDir,
  hostInstallRecordPath as sharedHostInstallRecordPath,
  hostStagedDir as sharedHostStagedDir,
  hostStagedRecordPath as sharedHostStagedRecordPath,
} from "@hukum/protocol/config/installation";
import type { Environment } from "../runner/environment";
import { devDesktopSlotForEnvironment } from "./dev-desktop-slot";

// ~/.hukum/ is the single Hukum root. Per the Native Packaging
// tech plan, prod and dev *components* are siblings inside it rather
// than under sibling root dirs like ~/.hukum-dev - that way a user
// sees the full install surface in one tree.
//
//   ~/.hukum/cli/                            - shared CLI surface + prod
//   ~/.hukum/cli/config.json                 - shared CLI config
//   ~/.hukum/cli/credentials                 - shared auth
//   ~/.hukum/cli/manifest.json               - prod install manifest
//   ~/.hukum/cli/.lock                       - prod mutation lock
//   ~/.hukum/cli/post-finalize.json          - prod pending-upgrade helper marker
//   ~/.hukum/cli/dev/                        - shared dev CLI home/config scope
//   ~/.hukum/cli/dev/manifest.json           - legacy/no-slot dev install manifest
//   ~/.hukum/cli/dev-runs/<slot>/manifest.json      - multi-run dev install manifest
//   ~/.hukum/cli/dev-runs/<slot>/.lock              - multi-run dev mutation lock
//   ~/.hukum/cli/dev-runs/<slot>/post-finalize.json - multi-run dev upgrade marker
//   ~/.hukum/host/                         - prod host runtime root
//   ~/.hukum/host/host.log               - prod host stdout + bootstrap markers
//   ~/.hukum/host/pid.json                 - prod host pid metadata
//   ~/.hukum/host/update-progress.json     - prod cross-process `host update` outcome marker
//   ~/.hukum/host/install/                 - prod host install dir (atomic-swap target)
//   ~/.hukum/host/install/install.json     - prod host install record
//   ~/.hukum/host/staging/                 - prod host staging root (verify-before-replace)
//   ~/.hukum/host/download-cache/          - prod resumable archive partials (cross-invocation)
//   ~/.hukum/host/dev/                     - legacy/no-slot dev host runtime root
//   ~/.hukum/host/dev-runs/<slot>/         - multi-run dev host runtime root
//   ~/.hukum/host/dev-runs/<slot>/install/install.json - multi-run dev install record
//   ~/.hukum/host/dev-runs/<slot>/install-staging/     - multi-run dev staging root
const HUKUM_HOME = join(homedir(), ".hukum");
const CLI_HOME = join(HUKUM_HOME, "cli");
const HOST_HOME = join(HUKUM_HOME, "host");
// The host install temp/extract area (verify-before-replace), kept distinct
// from the host root. Named "install-staging" for clarity. Also the root
// under which `host download`'s owner-tokened download/extract temp dirs
// live (see `installer/stage-reconcile.ts`'s temp-sweep step) - both are
// transient, verify-before-replace scratch space for the same install
// tree, so they share one root.
const HOST_STAGING_SUBDIR = "install-staging";
// The single-slot staged-download area: a fully extracted, verified host
// tree ready to promote into `install/` (Host Update Layer Redesign Tech
// Plan, "CLI: two-phase split with a staged store"). Distinct from
// `install-staging/`, which is scratch space that never itself becomes the
// final install dir.
// Where a registry archive is streamed to disk while it downloads. Unlike
// `install-staging/`, this area is deliberately NOT per-invocation: the
// archive path is derived from the version + sha256 so a re-spawned CLI
// finds the previous invocation's partial file and resumes it with a Range
// request instead of starting from zero (hukum#585/#588 - a 700MB host
// archive over a throttled link never survives a single process). Contents
// are owner-tokened and swept by `registry/download-cache.ts`, not by the
// `install-staging/` temp sweep.
// Exported so `registry/download-cache.ts` can recognize its own private
// slot directories structurally (`<...>/download-cache/private-*/`) rather
// than by directory name alone - see `claimedPathFor` there.
export const HOST_DOWNLOAD_CACHE_SUBDIR = "download-cache";
const CLI_LOG_FILENAME = "cli.log";
const HOST_LOG_FILENAME = "host.log";
// Single retained generation of the host log. One is enough: it exists so the
// PREVIOUS session's trail survives a restart or a runtime purge, not to build
// an archive (see `host-log-rotation.ts`).
const HOST_LOG_BACKUP_FILENAME = "host.log.1";
const HOST_PID_FILENAME = "pid.json";
const HOST_UPDATE_PROGRESS_FILENAME = "update-progress.json";
const HOST_SUBSTRATE_FILENAME = "substrate.json";
const HOST_TRANSITION_FILENAME = "transition.json";
const HOST_TRANSITION_PROBE_FILENAME = "transition-probe.json";
const HOST_ACTIVATION_FILENAME = "activation.json";
const HOST_PENDING_ACTIVATION_FILENAME = "pending-activation.json";
const HOST_STOP_INTENT_FILENAME = "stop-intent.json";

function environmentSubdir(base: string, environment: Environment): string {
  // production → base; dev → base/dev (the slot dir name is the environment
  // value itself).
  return environment === "production" ? base : join(base, environment);
}

function devRunSubdir(base: string, slot: string): string {
  return join(base, "dev-runs", slot);
}

export const hukumHomeDir = (): string => HUKUM_HOME;
// Shared (non-environment) config surface. `cliConfigPath`
// (~/.hukum/cli/config.json) holds machine-local shell/env config that is
// genuinely environment-agnostic, so it stays at the shared root and is owned
// by `@hukum/protocol/config` (the CLI and the host resolve the exact same
// file); re-exported here for the CLI's existing callers.
export { cliConfigPath } from "@hukum/protocol/config/paths";
export const cliSharedHomeDir = (): string => CLI_HOME;

// Credentials are environment-scoped (production → shared root, dev/staging →
// the slot subdir, matching `cliHomeDir`). The path now lives in
// `@hukum/protocol/config` so the host resolves the exact same file when it
// reads `user.id` to pin its owner (the owner-binding gate); re-exported here
// for the CLI's existing callers.
export { cliCredentialsPath } from "@hukum/protocol/config/paths";

// Environment-aware shared CLI paths.
export function cliHomeDir(environment: Environment | undefined): string {
  // Existing non-environment callers (config-store, credentials) treat the
  // CLI home as a shared root. Environment-aware callers (manifest, lock,
  // log, post-finalize marker) use `cliInstallHomeDir` below so multi-run dev
  // can isolate install surfaces without moving shared auth/config state.
  if (environment === undefined) return CLI_HOME;
  return environmentSubdir(CLI_HOME, environment);
}

export function cliInstallHomeDir(environment: Environment): string {
  return sharedCliInstallHomeDir(environment);
}

/**
 * Content-addressed store for published chat parts.
 *
 * Under the SHARED CLI home rather than the per-install one, and that is the
 * point of it: an entry is named by the sha256 of its own bytes, so it cannot
 * be stale for a newer CLI, a different environment, or a different signed-in
 * user - only absent. Scoping it per install would throw the cache away on
 * every upgrade for no property gained.
 *
 * Nothing here is authoritative and nothing needs backing up: every entry is a
 * copy of bytes the cloud still holds, and losing the directory costs one cold
 * read. See `chat-part-cache.ts` for why deleting it is always safe.
 */
export function cliChatPartCacheDir(): string {
  return join(CLI_HOME, "chat-parts");
}

export function cliManifestPath(environment: Environment): string {
  return sharedCliManifestPath(environment);
}
export function cliLockPath(environment: Environment): string {
  return join(cliInstallHomeDir(environment), ".lock");
}
export function cliLogPath(environment: Environment): string {
  return join(cliInstallHomeDir(environment), CLI_LOG_FILENAME);
}
// Marker the detached pending-CLI-upgrade finalize helper writes after
// it attempts the live-binary swap. The next CLI invocation (Doctor,
// host restart, etc.) reconciles this marker against the CLI install
// manifest and clears `pendingUpgrade` on swap success - see
// upgrade/finalize-helper.ts.
export function cliPostFinalizeMarkerPath(environment: Environment): string {
  return join(cliInstallHomeDir(environment), "post-finalize.json");
}

// Environment-aware host paths. All environments are rooted under
// ~/.hukum/host/; non-production environments nest one level deeper.
// Non-environment callers (bootstrap-log, pid-metadata, host-status) pass
// `undefined` and resolve to the production root - host bootstrap is
// production-only, so environment is not threaded through that flow.
export function hostHomeDir(environment: Environment | undefined): string {
  if (environment === undefined) return HOST_HOME;
  const devSlot = devDesktopSlotForEnvironment(environment, process.env);
  if (devSlot !== null) return devRunSubdir(HOST_HOME, devSlot);
  return environmentSubdir(HOST_HOME, environment);
}

// On-disk contracts written by the host and read here by string path -
// no host-package import. Shape verified at the host writer site
// (the host is the external Hukum Host).
// Bootstrap markers and host stdout share `host.log` - the supervisor
// redirects the host's stdio fd to the same file the markers are
// appended to, so the renderer's failure-card tail is one cohesive log.
export function hostPidMetadataPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_PID_FILENAME);
}
export function hostLogPath(environment: Environment | undefined): string {
  return join(hostHomeDir(environment), HOST_LOG_FILENAME);
}
export function hostLogBackupPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_LOG_BACKUP_FILENAME);
}
/** Durable lifecycle-layer substrate selection (v1, temp+rename writes). */
export function hostSubstratePath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_SUBSTRATE_FILENAME);
}
/** Durable lifecycle transition journal, including the governor snapshot. */
export function hostTransitionJournalPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_TRANSITION_FILENAME);
}
/** Dedicated correlated probe marker; intentionally not appended to host.log. */
export function hostTransitionProbeMarkerPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_TRANSITION_PROBE_FILENAME);
}
/** Durable activation journal; distinct from the substrate transition journal. */
export function hostActivationJournalPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_ACTIVATION_FILENAME);
}
/** Busy activation intent, retained until activation reaches a terminal journal. */
export function hostPendingActivationPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_PENDING_ACTIVATION_FILENAME);
}
/**
 * Deliberate-stop intent, written by whoever is about to stop the host and read
 * by the supervisor before it relaunches a dead child. Cross-process by
 * necessity: the stopper (`hukum host stop`, an installer, Desktop's
 * `host restart`) is never the supervisor process itself, and on Windows the
 * supervisor survives the stop it is being asked not to fight.
 */
export function hostStopIntentPath(
  environment: Environment | undefined,
): string {
  return join(hostHomeDir(environment), HOST_STOP_INTENT_FILENAME);
}
export function bootstrapLogPath(environment: Environment | undefined): string {
  return hostLogPath(environment);
}

// Host install/staging surface - the installer stages a new host
// archive under `hostStagingRoot(environment)/stage-*`, verifies it, and
// then atomically renames into `hostInstallDir(environment)`. The single
// install record is written at `hostInstallRecordPath(environment)` after
// the swap. Both environments stay isolated under the single ~/.hukum/
// root per the Tech Plan; there is no cross-environment sharing.
export function hostInstallDir(environment: Environment): string {
  return sharedHostInstallDir(environment);
}
export function hostStagingRoot(environment: Environment): string {
  return join(hostHomeDir(environment), HOST_STAGING_SUBDIR);
}
export function hostInstallRecordPath(environment: Environment): string {
  return sharedHostInstallRecordPath(environment);
}
// Cross-process handoff marker `hukum host update` writes before it
// touches anything and clears/rewrites on outcome - see
// `host/update-progress-marker.ts`. Deliberately mirrored (by contract, not
// by import) at `hukum-host/src/paths.ts::hostHomeDir` so the daemon
// polls the exact same path this CLI writes.
export function hostUpdateProgressMarkerPath(environment: Environment): string {
  return join(hostHomeDir(environment), HOST_UPDATE_PROGRESS_FILENAME);
}

export function hostDownloadCacheDir(environment: Environment): string {
  return join(hostHomeDir(environment), HOST_DOWNLOAD_CACHE_SUBDIR);
}

// Single-slot staged store - see the installation-layout comment above.
export function hostStagedDir(environment: Environment): string {
  return sharedHostStagedDir(environment);
}
export function hostStagedRecordPath(environment: Environment): string {
  return sharedHostStagedRecordPath(environment);
}

export async function ensureHukumHomeDir(): Promise<void> {
  await mkdir(HUKUM_HOME, { recursive: true });
}

// Environment-aware host home mkdir. Non-environment callers pass undefined to
// get the prod root; environment-aware callers (installer/uninstaller) pass
// the runtime environment.
export async function ensureHostHomeDir(
  environment: Environment | undefined,
): Promise<void> {
  await mkdir(hostHomeDir(environment), { recursive: true });
}

export async function ensureHostInstallDir(
  environment: Environment,
): Promise<void> {
  await mkdir(hostInstallDir(environment), { recursive: true });
}

export async function ensureHostStagingRoot(
  environment: Environment,
): Promise<void> {
  await mkdir(hostStagingRoot(environment), { recursive: true });
}

export async function ensureHostDownloadCacheDir(
  environment: Environment,
): Promise<void> {
  // 0o700: the cache holds a partially-written archive at a PREDICTABLE
  // path (that predictability is the whole point - it is what lets the next
  // invocation resume it). Under ~/.hukum it is already user-owned, and
  // an explicit private mode keeps it that way even if the parent's mode is
  // later relaxed, so no other local account can pre-create or swap the
  // file we are about to append to.
  await mkdir(hostDownloadCacheDir(environment), {
    recursive: true,
    mode: 0o700,
  });
}

export async function ensureHostHomeDirForStaged(
  environment: Environment,
): Promise<void> {
  // The staged dir's PARENT (hostHomeDir) must exist before an atomic
  // rename can place `staged/` there - mirrors `atomicSwap`'s
  // `mkdir(hostHomeDir(...))` call for `install/`. Deliberately does not
  // create `staged/` itself: the promote step renames a temp dir into
  // that exact path, so a pre-created empty dir would collide with the
  // rename.
  await ensureHostHomeDir(environment);
}

// Environment-aware CLI home mkdir. Non-environment callers pass undefined to
// get the shared root; environment-aware callers pass the runtime environment.
export async function ensureCliHomeDir(
  environment: Environment | undefined,
): Promise<void> {
  // 0o700 keeps the credentials file readable only by the current user
  // even if the file's own mode is later relaxed. Environment subdir
  // inherits these permissions.
  await mkdir(cliHomeDir(environment), { recursive: true, mode: 0o700 });
}

export async function ensureCliInstallHomeDir(
  environment: Environment,
): Promise<void> {
  await mkdir(cliInstallHomeDir(environment), { recursive: true, mode: 0o700 });
}
