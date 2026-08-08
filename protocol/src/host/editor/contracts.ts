import { defineRpcContract } from "@hukum/protocol/framework/index";
import {
  openPathsRequestSchema,
  openPathsResponseSchema,
} from "@hukum/protocol/host/editor/unary-schemas";

export const editorOpenPathsV10 = defineRpcContract({
  method: "editor.openPaths",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: openPathsRequestSchema,
  responseSchema: openPathsResponseSchema,
});
