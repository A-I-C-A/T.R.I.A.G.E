/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  readonly VITE_VLY_APP_ID?: string
  readonly VITE_VLY_MONITORING_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
