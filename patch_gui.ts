import * as fs from "fs";

const file = "/home/rahul/work/personal-projacts/traycer/clients/shared/host-transport/ws-rpc-client.ts";
let content = fs.readFileSync(file, "utf-8");
content = content.replace(
  'throw new HostRpcError({',
  'console.error("CLIENT PARSE FAILED", errorMessage(parsed.error));\n      throw new HostRpcError({'
);
fs.writeFileSync(file, content);
