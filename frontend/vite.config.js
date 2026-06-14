import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_TARGET ?? "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/docs": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/openapi.json": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/health": {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/health/, "/api/health"),
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/docs": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/openapi.json": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/health": {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/health/, "/api/health"),
        },
      },
    },
  };
});
