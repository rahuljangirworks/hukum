/**
 * Import surface for `clients/*` workspaces: same-package relatives,
 * `@hukum-clients/*`, `@hukum/protocol/*` (and TS path aliases to those),
 * or third-party packages. Blocks other monorepo scopes such as
 * `packages/common` (`@hukumai/*`) and non-protocol `@hukum/*` paths.
 *
 * Wire via `@typescript-eslint/no-restricted-imports`:
 * `["error", hukumClientsImportBoundaryRestrictions]`.
 */
import { protocolBoundaryRestrictions } from "./protocol-boundary-rules.mjs";

export const hukumClientsImportBoundaryRestrictions = {
  patterns: [
    ...protocolBoundaryRestrictions.patterns,
    {
      group: ["@hukumai/**"],
      message:
        "Client packages must not import `@hukumai/*` (for example packages/common). " +
        "Use `@hukum/protocol/*` or `@hukum-clients/*` instead.",
    },
    {
      group: ["@hukum/**", "!@hukum/protocol", "!@hukum/protocol/**"],
      message:
        "Client packages may only import `@hukum` through `@hukum/protocol/*`. " +
        "Use the protocol path alias or `@hukum-clients/*` for other shared code.",
    },
  ],
};
