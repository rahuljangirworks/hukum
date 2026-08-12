const fs = require('fs');
let code = fs.readFileSync('protocol/src/host/registry.ts', 'utf8');

const brainEntries = `
  "brain.scaffold": {
    degrade: { kind: "unsupported" },
    1: { latestMinor: 0, versions: { 0: { contract: brainScaffoldV10, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  },
  "brain.connect": {
    degrade: { kind: "unsupported" },
    1: { latestMinor: 0, versions: { 0: { contract: brainConnectV10, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  },
  "brain.getRegistry": {
    degrade: { kind: "unsupported" },
    1: { latestMinor: 0, versions: { 0: { contract: brainGetRegistryV10, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  },
  "brain.switch": {
    degrade: { kind: "unsupported" },
    1: { latestMinor: 0, versions: { 0: { contract: brainSwitchV10, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  },
  "brain.remove": {
    degrade: { kind: "unsupported" },
    1: { latestMinor: 0, versions: { 0: { contract: brainRemoveV10, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  },
`;

const matchStr = `  "pr.getLocalDiff": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: {
          contract: prGetLocalDiffV10,
          upgradeFromPreviousVersion: null,
        },
      },
      downgradePathsFromLatest: {},
    },
  },
} as const;`;

if (code.includes(matchStr)) {
  code = code.replace(matchStr, matchStr.replace("} as const;", brainEntries + "} as const;"));
  fs.writeFileSync('protocol/src/host/registry.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find exact string!");
}
