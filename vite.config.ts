import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["d857c9c7964a.ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    // Dynamically import lovable-tagger only in development so Vite doesn't try to require an ESM-only
    // package when loading the config in environments that use CommonJS/require.
    mode === 'development' ? (await import('lovable-tagger')).componentTagger() : false,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
