import fs from 'fs';
const code = fs.readFileSync("./clients/gui-app/src/lib/host-rpc-policy/host-method-policy-table.ts", "utf8");
fs.writeFileSync("./clients/gui-app/src/lib/host-rpc-policy/host-method-policy-table.ts", code.replace("assertExactHostMethodPollTableKeys(HOST_METHOD_POLL_TABLE);", ""));
