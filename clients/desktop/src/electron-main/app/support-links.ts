import type { SupportLinkDescriptor } from "../../ipc-contracts/window-types";

export const HUKUM_WEBSITE_URL = "https://hukum.ai";
export const HUKUM_DOCUMENTATION_URL = "https://docs.hukum.ai";
export const HUKUM_RELEASE_NOTES_URL = "https://docs.hukum.ai/changelog";
export const HUKUM_DISCORD_URL = "https://hukum.ai/discord";
export const HUKUM_SUPPORT_EMAIL = "support@hukum.ai";
export const HUKUM_SUPPORT_CONTACT_URL = `mailto:${HUKUM_SUPPORT_EMAIL}`;

export function buildSupportLinks(): readonly SupportLinkDescriptor[] {
  return [
    {
      id: "website",
      label: "Website",
      url: HUKUM_WEBSITE_URL,
    },
    {
      id: "documentation",
      label: "Documentation",
      url: HUKUM_DOCUMENTATION_URL,
    },
    {
      id: "release-notes",
      label: "Release Notes",
      url: HUKUM_RELEASE_NOTES_URL,
    },
    {
      id: "discord",
      label: "Discord",
      url: HUKUM_DISCORD_URL,
    },
    {
      id: "support",
      label: "Contact Support",
      url: HUKUM_SUPPORT_CONTACT_URL,
    },
  ];
}
