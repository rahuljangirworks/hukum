import {
  tseslint,
  globals,
  commonIgnores,
  linterOptionsConfig,
} from "../../eslint/flat-base.mjs";
import { hukumTypeSafetyRestrictions } from "../../eslint/hukum-type-safety-rules.mjs";
import { hukumClientsImportBoundaryRestrictions } from "../../eslint/hukum-clients-import-boundary-rules.mjs";

export default tseslint.config(
  {
    ignores: [
      ...commonIgnores,
      "release/**",
      "resources/**",
      "scripts/**",
      "vitest.config.ts",
      "vite.renderer.config.ts",
    ],
  },
  linterOptionsConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2021 },
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "no-restricted-syntax": ["error", ...hukumTypeSafetyRestrictions],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        hukumClientsImportBoundaryRestrictions,
      ],
    },
  },
);
