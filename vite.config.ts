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
    build: {
      chunkSizeWarningLimit: 1000, // Reduce to 1MB to encourage better splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - split large dependencies
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-slot',
              '@radix-ui/react-label',
              '@radix-ui/react-switch',
            ],
            'chart-vendor': ['recharts'],
            'query-vendor': ['@tanstack/react-query'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
            'icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
