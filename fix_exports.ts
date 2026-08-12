import fs from 'fs';
const file = 'protocol/src/host/registry.ts';
let code = fs.readFileSync(file, 'utf8');

const exportsMatch = code.match(/\n\nexport const brainScaffoldV10 = [\s\S]*?(?=\n*$)/);
if (exportsMatch) {
  const exportsStr = exportsMatch[0];
  code = code.replace(exportsStr, '');
  code = code.replace('const HOST_RPC_REGISTRY_BASE_DEFINITION = {', exportsStr + '\n\nconst HOST_RPC_REGISTRY_BASE_DEFINITION = {');
  fs.writeFileSync(file, code);
  console.log("Moved exports up!");
} else {
  console.log("Could not find exports at bottom");
}
