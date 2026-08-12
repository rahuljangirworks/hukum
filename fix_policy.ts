import fs from 'fs';
const file = './clients/gui-app/src/lib/host-rpc-policy/host-method-policy-table.ts';
let code = fs.readFileSync(file, 'utf8');

const toAdd = [
  "agentQuestions.list",
  "agentQuestions.answer",
  "agentQuestions.dismiss",
  "backgroundJobs.list",
  "backgroundJobs.status",
  "backgroundJobs.cancel",
  "agent.spawn",
  "providers.updateBundled",
  "providers.addApiKey",
  "providers.removeApiKey",
  "providers.listApiKeys",
  "brain.scaffold",
  "brain.connect",
  "brain.getRegistry",
  "brain.switch",
  "brain.remove"
];

const newEntries = toAdd.map(key => 
  '\n  "' + key + '": {\n    mode: "fifo",\n    joinResponseTimeoutMs: null,\n    poll: null,\n  },'
).join("");

code = code.replace(
  "export const HOST_METHOD_POLL_TABLE: HostMethodPolicyTable = {",
  "export const HOST_METHOD_POLL_TABLE: HostMethodPolicyTable = {" + newEntries
);

fs.writeFileSync(file, code);
console.log("Added missing keys to policy table");
