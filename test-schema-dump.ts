import { authenticatedUserSchema } from "./protocol/src/auth/_internal/schemas.ts";
import { authRecordRegistry } from "./protocol/src/auth/registry.ts";
import { getRecordSchema } from "./protocol/src/framework/index.ts";

const schema = getRecordSchema(
  authRecordRegistry,
  "authenticated-user-response",
  "latest",
);

console.log(Object.keys(schema.shape));
