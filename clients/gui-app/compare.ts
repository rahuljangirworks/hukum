import { hostRpcRegistry } from "@hukum/protocol/host/index";
import { HOST_METHOD_POLL_TABLE } from "./src/lib/host-rpc-policy/host-method-policy-table";

const registryKeys = Object.keys(hostRpcRegistry).sort();
const tableKeys = Object.keys(HOST_METHOD_POLL_TABLE).sort();

const missingInTable = registryKeys.filter(k => !tableKeys.includes(k));
const missingInRegistry = tableKeys.filter(k => !registryKeys.includes(k));

console.log("Missing in Table:", missingInTable);
console.log("Missing in Registry:", missingInRegistry);
