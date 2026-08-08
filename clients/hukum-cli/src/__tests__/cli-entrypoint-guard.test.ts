import { describe, expect, it } from "vitest";
import { isHukumCliEntrypoint } from "../index";

// Native-packaging fixup: the script-entry guard at the bottom of
// `hukum-cli/src/index.ts` is what gates the auto `parseAsync` so
// `import { buildProgram }` from a test never triggers commander
// against `process.argv`. Before this fixup the regex only matched
// `hukum` (no extension) so a Windows SEA binary
// (`bun build --compile --target=bun-windows-x64` → `hukum.exe`)
// was treated as "this module was imported, do nothing" and the CLI
// silently no-op'd in production.
//
// These tests pin the matrix that the script-entry guard cares about:
// POSIX dev path, POSIX prod path, Windows prod path (`hukum.exe`),
// plus the negative cases (undefined / unrelated paths) so importing
// the module from tests stays safe.

describe("isHukumCliEntrypoint", () => {
  it("accepts the tsx dev path (POSIX)", () => {
    expect(
      isHukumCliEntrypoint("/repo/clients/hukum-cli/src/index.ts"),
    ).toBe(true);
  });

  it("accepts the tsx dev path (Windows backslashes)", () => {
    expect(
      isHukumCliEntrypoint(
        "C:\\repo\\hukum-clients\\hukum-cli\\src\\index.ts",
      ),
    ).toBe(true);
  });

  it("accepts the compiled SEA binary on POSIX", () => {
    expect(isHukumCliEntrypoint("/usr/local/bin/hukum")).toBe(true);
    expect(
      isHukumCliEntrypoint(
        "/Applications/Hukum.app/Contents/Resources/cli/hukum",
      ),
    ).toBe(true);
  });

  it("accepts the compiled SEA binary on Windows (hukum.exe)", () => {
    // The actual argv[1] the Electron main process feeds into the
    // packaged Windows shell: `<resourcesPath>\cli\hukum.exe`.
    expect(
      isHukumCliEntrypoint(
        "C:\\Program Files\\Hukum\\resources\\cli\\hukum.exe",
      ),
    ).toBe(true);
    // Forward-slash variant (some Windows toolchains normalise to /).
    expect(
      isHukumCliEntrypoint("C:/Program Files/Hukum/cli/hukum.exe"),
    ).toBe(true);
    // Bare basename.
    expect(isHukumCliEntrypoint("hukum.exe")).toBe(true);
    // Case-insensitive - Windows filesystems are case-preserving but
    // not case-sensitive, and PowerShell / cmd may upcase the suffix.
    expect(isHukumCliEntrypoint("C:\\bin\\Hukum.EXE")).toBe(true);
  });

  it("rejects undefined / empty argv[1] so importing the module is safe", () => {
    expect(isHukumCliEntrypoint(undefined)).toBe(false);
    expect(isHukumCliEntrypoint("")).toBe(false);
  });

  it("rejects unrelated executables and substring near-matches", () => {
    expect(isHukumCliEntrypoint("/usr/local/bin/node")).toBe(false);
    expect(isHukumCliEntrypoint("/repo/node_modules/.bin/vitest")).toBe(
      false,
    );
    // Substring match guard: a path that *contains* "hukum" but the
    // basename is something else (e.g. a wrapper) should not match.
    expect(isHukumCliEntrypoint("/repo/clients/cli/wrapper.sh")).toBe(false);
    // `.exe` on a non-hukum binary must not match either.
    expect(isHukumCliEntrypoint("C:\\bin\\not-hukum.exe")).toBe(false);
  });
});
