// `~/.hukum/cli/config.json` is now owned by `@hukum/protocol/config`,
// the single source of truth shared by the CLI and the host (which reads
// the same file for terminal PTY spawns). This module re-exports that
// surface so the existing `hukum config …` command imports keep working
// unchanged.
export type {
  CliConfig,
  DetectedShell,
  EnvOverrideEntry,
  EnvOverrideValue,
  EffectiveShellConfig,
  ShellEntry,
} from "@hukum/protocol/config/schema";
export {
  addShell,
  applyEnvOverrides,
  deleteEnvOverride,
  detectShells,
  getEnvOverride,
  listEnvOverrides,
  listShells,
  loadEffectiveShellConfig,
  probeShellPath,
  readCliConfig,
  removeShell,
  resetShell,
  revertShellArgs,
  setEnvOverride,
  setShell,
  writeCliConfig,
} from "@hukum/protocol/config/store";
