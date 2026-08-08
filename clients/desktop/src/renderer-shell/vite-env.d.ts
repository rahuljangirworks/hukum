/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUKUM_SIGN_IN_URL: string | undefined;
  readonly VITE_HUKUM_OSS_REPO: string | undefined;
  readonly VITE_DEV_CLOUD_UI_BASE_URL: string | undefined;
  readonly VITE_DEV_DESKTOP_SLOT: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
