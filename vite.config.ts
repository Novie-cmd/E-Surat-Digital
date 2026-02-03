
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // Ekspos variabel env Supabase ke sisi client
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    port: 3000
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
});
