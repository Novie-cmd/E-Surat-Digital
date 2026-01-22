// Fix: Removed problematic vite/client reference to resolve "Cannot find type definition file" error
declare interface Window {
  // Add global window declarations if needed
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}
