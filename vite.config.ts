import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  
  // Try to import lovable-tagger only in development mode
  if (mode === 'development') {
    try {
      const { componentTagger } = await import('lovable-tagger');
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('lovable-tagger not available:', (error as Error).message);
    }
  }

  return {
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
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
