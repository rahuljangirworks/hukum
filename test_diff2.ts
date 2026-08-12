import { hostRpcRegistry } from "./protocol/src/host/registry";
import { HOST_METHOD_POLL_TABLE } from "./clients/gui-app/src/lib/host-rpc-policy/host-method-policy-table";

const registryKeys = new Set(Object.keys(hostRpcRegistry));
const tableKeys = new Set(Object.keys(HOST_METHOD_POLL_TABLE));

console.log("In registry but not table:");
for (const k of registryKeys) {
  if (!tableKeys.has(k)) console.log("  " + k);
}

console.log("In table but not registry:");
for (const k of tableKeys) {
  if (!registryKeys.has(k)) console.log("  " + k);
}
