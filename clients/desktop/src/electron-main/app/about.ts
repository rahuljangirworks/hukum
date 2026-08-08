import { app } from "electron";
import { HUKUM_WEBSITE_URL } from "./support-links";

export function configureNativeAboutPanel(
  appName: string,
  iconPath: string | null,
): void {
  app.setAboutPanelOptions({
    applicationName: appName,
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    copyright: `Copyright ${new Date().getFullYear()} Hukum AI`,
    credits: "Hukum AI",
    website: HUKUM_WEBSITE_URL,
    ...(iconPath === null ? {} : { iconPath }),
  });
}
