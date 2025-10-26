import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");


  return ({
    plugins: [react(), ...(mode === "development" ? [componentTagger()] : [])],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    define: {
    global: 'globalThis', 
  },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: true,

        },
      },
    },
  });
});