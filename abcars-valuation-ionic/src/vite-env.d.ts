/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_API_BASE_URL?: string;
  readonly VITE_GEMINI_USE_DEV_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'axios/lib/adapters/xhr.js' {
  import type { AxiosAdapter } from 'axios';
  const xhrAdapter: AxiosAdapter;
  export default xhrAdapter;
}
