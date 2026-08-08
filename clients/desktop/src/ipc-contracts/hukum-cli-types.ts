/**
 * Desktop IPC re-exports of the shared Hukum CLI contract. Preload modules
 * import through this plain-data contract layer so Electron's CommonJS bridge
 * does not depend directly on the shared package.
 */
export type {
  HukumDetectedShell,
  HukumEnvOverride,
  HukumHostStatusSnapshot,
  HukumShellConfig,
  HukumShellConfigSetInput,
  HukumShellProbeResult,
} from "@hukum-clients/shared/platform/runner-host";
