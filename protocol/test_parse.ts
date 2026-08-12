import { hostRpcRegistry } from "./src/host/registry";
const responseSchema = hostRpcRegistry["providers.list"][2].versions[0].contract.responseSchema;
const result = {
  providers: [
    {
      providerId: "hukum",
      enabled: true,
      disabledBy: null,
      selected: { kind: "bundled" },
      candidates: [
        {
          kind: "bundled",
          available: true,
          version: "1.1.11",
          path: process.execPath,
          versionPending: false,
        }
      ],
      authPending: false,
      checkedAt: Date.now(),
      apiKey: { supported: false, configured: false, source: null },
      terminalAgentArgs: "",
      envOverrides: [],
      loginCapability: null,
      availabilityPending: false,
      profiles: [],
      managedInstallState: null,
      versionVisibility: null,
      advisory: null,
      cliBinaryResolved: true,
      auth: { status: "authenticated", badgeText: null, label: null, detail: null },
      nativeCapabilities: {
        supportedTabs: ["general", "env", "usage"],
        mcp: null,
        plugins: null,
        skills: null,
      },
    },
    {
      providerId: "opencode",
      enabled: true,
      disabledBy: null,
      selected: { kind: "bundled" },
      candidates: [
        {
          kind: "bundled",
          available: true,
          version: null,
          path: "",
          versionPending: false,
        }
      ],
      authPending: false,
      checkedAt: Date.now(),
      apiKey: {
        supported: true,
        configured: false,
        source: null
      },
      terminalAgentArgs: "",
      envOverrides: [],
      loginCapability: null,
      availabilityPending: false,
      profiles: [],
      managedInstallState: null,
      versionVisibility: null,
      advisory: null,
      cliBinaryResolved: true,
      auth: {
        status: "unauthenticated",
        badgeText: null,
        label: null,
        detail: null
      },
      nativeCapabilities: {
        supportedTabs: ["general", "env", "usage"],
        mcp: null,
        plugins: null,
        skills: null,
      },
    }
  ],
  native: null
};

const parsed = responseSchema.safeParse(result);
if (!parsed.success) {
  console.log("Error length:", String(parsed.error).length);
  console.log("Error details:", parsed.error);
} else {
  console.log("Success!");
}
