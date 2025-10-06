import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "development" ? [componentTagger()] : [])],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,              // hoặc '0.0.0.0' (thay cho '::' bị ghi đè trước đó)
    port: 5173,              // sẽ thật sự áp dụng
    proxy: {
      "/api": {
        target: "https://batteryswap-be-production.up.railway.app",
        changeOrigin: true,
        secure: true,
        // Nếu backend KHÔNG có prefix /api thì bật dòng dưới:
        // rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
}));