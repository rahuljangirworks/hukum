/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string | undefined;
  readonly VITE_HUKUM_OSS_REPO: string | undefined;
  readonly VITE_POSTHOG_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
