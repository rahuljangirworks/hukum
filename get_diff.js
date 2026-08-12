const fs = require('fs');

const registryText = fs.readFileSync('protocol/src/host/registry.ts', 'utf8');
const registryMatches = [...registryText.matchAll(/"([^"]+)": \{/g)].map(m => m[1]).filter(k => k.includes('.'));
const registryKeys = new Set(registryMatches);

const policyText = fs.readFileSync('clients/gui-app/src/lib/host-rpc-policy/host-method-policy-table.ts', 'utf8');
const policyMatches = [...policyText.matchAll(/"([^"]+)": \{/g)].map(m => m[1]).filter(k => k.includes('.'));
const policyKeys = new Set(policyMatches);

console.log("In Registry, not in Policy:");
for (let key of registryKeys) {
    if (!policyKeys.has(key)) console.log("-", key);
}

console.log("In Policy, not in Registry:");
for (let key of policyKeys) {
    if (!registryKeys.has(key)) console.log("-", key);
}
