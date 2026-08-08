import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@hukum-clients/shared",
        replacement: path.resolve(__dirname, "."),
      },
      {
        find: /^@hukum\/protocol\/utils\/(.*)$/,
        replacement: path.resolve(__dirname, "../../protocol/utils/$1"),
      },
      {
        find: /^@hukum\/protocol\/(.*)$/,
        replacement: path.resolve(__dirname, "../../protocol/src/$1"),
      },
    ],
  },
  test: {
    include: ["**/__tests__/**/*.test.ts"],
    globals: false,
    env: {
      VITE_HUKUM_OSS_REPO: "https://github.com/hukumai/hukum",
    },
  },
});
