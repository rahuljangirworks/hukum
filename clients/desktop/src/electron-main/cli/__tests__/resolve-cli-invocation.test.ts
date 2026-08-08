import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sandboxHome } from "../../__tests__/sandbox-home";

// Native-packaging ticket - `resolveHukumCliInvocation` in packaged
// mode must use the CLI discovery model (Tech Plan Decision 6):
//   1. CLI manifest (~/.hukum/cli/manifest.json)
//   2. PATH fallback (`hukum` / `hukum.exe`)
//   3. Bundled CLI in extraResources, arch-scoped first, flat fallback
// It must NOT hardcode `<resourcesPath>/cli/hukum` - that broke
// Windows (`.exe`) packaging and ignored package-manager / PATH installs.
//
// The tests below stub the user home + electron resourcesPath onto a
// throwaway directory so we can stage manifests / bundled binaries and
// observe which one `resolveHukumCliInvocation` picks.

let work: string;
let homeDir: string;
let cliBinDir: string;
let manifestPath: string;
let resourcesDir: string;

function writeManifest(binaryPath: string, version: string): void {
  mkdirSync(join(homeDir, ".hukum", "cli"), { recursive: true });
  writeFileSync(
    manifestPath,
    JSON.stringify({
      version,
      installedAt: new Date().toISOString(),
      binaryPath,
      source: "homebrew",
      pendingUpgrade: null,
    }),
    "utf8",
  );
}

function stageBundledCli(opts: {
  archScoped: boolean;
  flat: boolean;
  binaryName: string;
}): void {
  const archDirName = `${process.platform}-${process.arch}`;
  if (opts.archScoped) {
    const archDir = join(resourcesDir, "cli", archDirName);
    mkdirSync(archDir, { recursive: true });
    const p = join(archDir, opts.binaryName);
    writeFileSync(p, "#!/bin/sh\nexit 0\n");
    if (process.platform !== "win32") chmodSync(p, 0o755);
  }
  if (opts.flat) {
    const flatDir = join(resourcesDir, "cli");
    mkdirSync(flatDir, { recursive: true });
    const p = join(flatDir, opts.binaryName);
    writeFileSync(p, "#!/bin/sh\nexit 0\n");
    if (process.platform !== "win32") chmodSync(p, 0o755);
  }
}

function writeExecutable(path: string): void {
  writeFileSync(path, "#!/bin/sh\nexit 0\n");
  if (process.platform !== "win32") chmodSync(path, 0o755);
}

vi.mock("electron-log", () => ({
  default: {
    transports: {
      file: { level: "info" },
      console: { level: "info" },
    },
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("electron", () => ({
  app: {
    getAppPath: (): string => "/tmp/desktop-app",
  },
}));

// CLI discovery is environment-scoped (`config.environment`). These cases
// cover the shipped resolution order on the production slot, where the CLI
// home has no suffix (`~/.hukum/cli/...`), matching the manifest/bundled
// paths the helpers below stage.
vi.mock("../../../config", async (importActual) => {
  const actual = await importActual<typeof import("../../../config")>();
  return {
    ...actual,
    isDevBuild: false,
    config: { ...actual.config, environment: "production" },
  };
});

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "hukum-cli-discovery-"));
  homeDir = join(work, "home");
  resourcesDir = join(work, "resources");
  mkdirSync(homeDir, { recursive: true });
  mkdirSync(resourcesDir, { recursive: true });
  cliBinDir = join(homeDir, ".hukum", "cli", "bin");
  manifestPath = join(homeDir, ".hukum", "cli", "manifest.json");
  sandboxHome(homeDir);
  Object.defineProperty(process, "resourcesPath", {
    value: resourcesDir,
    configurable: true,
  });
  vi.resetModules();
});

afterEach(() => {
  rmSync(work, { recursive: true, force: true });
  vi.resetModules();
});

describe("resolveHukumCliInvocation (shipped / non-dev) - CLI discovery model", () => {
  it("uses the manifest binary when ~/.hukum/cli/manifest.json points at a real executable", async () => {
    mkdirSync(cliBinDir, { recursive: true });
    const cliBinaryName =
      process.platform === "win32" ? "hukum.exe" : "hukum";
    const installed = join(cliBinDir, cliBinaryName);
    writeExecutable(installed);
    writeManifest(installed, "2.0.0");

    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    const inv = await resolveHukumCliInvocation();
    expect(inv.command).toBe(installed);
    expect(inv.args).toEqual([]);
  });

  it("trusts a manifest binary outside the Desktop-owned cli/bin (e.g. Homebrew at /opt/homebrew/bin/hukum) without falling back to bundled", async () => {
    const externalDir = join(work, "homebrew", "bin");
    mkdirSync(externalDir, { recursive: true });
    const externalBin = join(
      externalDir,
      process.platform === "win32" ? "hukum.exe" : "hukum",
    );
    writeExecutable(externalBin);
    writeManifest(externalBin, "2.1.0");
    // Also stage a bundled CLI to verify discovery PREFERS the manifest:
    stageBundledCli({
      archScoped: true,
      flat: false,
      binaryName: process.platform === "win32" ? "hukum.exe" : "hukum",
    });

    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    const inv = await resolveHukumCliInvocation();
    expect(inv.command).toBe(externalBin);
  });

  it("falls back to the bundled CLI under the arch-scoped resources directory when no manifest / PATH CLI is present", async () => {
    // Wipe PATH so PATH discovery returns null.
    process.env.PATH = "";
    const binaryName = process.platform === "win32" ? "hukum.exe" : "hukum";
    stageBundledCli({ archScoped: true, flat: false, binaryName });

    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    const inv = await resolveHukumCliInvocation();
    expect(inv.command).toBe(
      join(
        resourcesDir,
        "cli",
        `${process.platform}-${process.arch}`,
        binaryName,
      ),
    );
  });

  it("falls back to the flat bundled CLI when arch-scoped is absent (legacy `make install-desktop` layout)", async () => {
    process.env.PATH = "";
    const binaryName = process.platform === "win32" ? "hukum.exe" : "hukum";
    stageBundledCli({ archScoped: false, flat: true, binaryName });

    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    const inv = await resolveHukumCliInvocation();
    expect(inv.command).toBe(join(resourcesDir, "cli", binaryName));
  });

  it("resolves the Windows .exe binary name when running on win32", async () => {
    // Skip on non-win32 hosts - the cliBinaryName() helper keys off
    // platform() so we can't fake the platform without monkey-patching
    // node:os. Instead, run this assertion only on the matching platform.
    if (process.platform !== "win32") {
      return;
    }
    process.env.PATH = "";
    stageBundledCli({
      archScoped: true,
      flat: false,
      binaryName: "hukum.exe",
    });

    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    const inv = await resolveHukumCliInvocation();
    expect(inv.command.toLowerCase().endsWith("hukum.exe")).toBe(true);
  });

  it("throws a packaging-error when no manifest, PATH CLI, or bundled CLI is reachable", async () => {
    process.env.PATH = "";
    // No manifest, no PATH, no bundled.
    const { resolveHukumCliInvocation } = await import("../hukum-cli");
    await expect(resolveHukumCliInvocation()).rejects.toThrow(/no CLI found/);
  });
});

// The dev-slot path (resolveBundledCliPath → the dev CLI wrapper at the
// cli/dev-wrapper-paths.json layout) is covered by
// `resolve-cli-invocation-dev.test.ts` (which pins `isDevBuild` true) and
// end-to-end via `make dev-desktop`; the mock here is shipped
// (`isDevBuild === false`).
