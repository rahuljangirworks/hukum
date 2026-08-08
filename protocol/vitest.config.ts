import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@hukum\/protocol\/utils\/(.*)$/,
        replacement: path.resolve(__dirname, "./utils/$1"),
      },
      {
        find: /^@hukum\/protocol\/(.*)$/,
        replacement: path.resolve(__dirname, "./src/$1"),
      },
    ],
  },
  test: {
    include: ["**/__tests__/**/*.test.ts"],
    globals: false,
  },
});
