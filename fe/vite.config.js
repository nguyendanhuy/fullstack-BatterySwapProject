import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://batteryswap-be-production.up.railway.app', // API backend
        changeOrigin: true, // đổi origin sang target
        secure: true,       // true nếu target dùng https
      },
    },
  },
}));
