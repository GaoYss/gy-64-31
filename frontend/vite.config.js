import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const FRONTEND_VERSION = "1.0.0";
const FRONTEND_COMPONENT = "frontend";

function frontendHealthJson(extraChecks = {}) {
  return JSON.stringify({
    status: "ok",
    component: FRONTEND_COMPONENT,
    version: FRONTEND_VERSION,
    timestamp: new Date().toISOString(),
    checks: {
      self: "ok",
      ...extraChecks,
    },
  });
}

async function fetchBackendHealth(backendTarget) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${backendTarget}/api/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function healthEndpointsPlugin(backendTarget) {
  function registerEndpoints(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = req.url || "/";

      if (url === "/health" || url.startsWith("/health?")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.statusCode = 200;
        res.end(frontendHealthJson());
        return;
      }

      if (url === "/health/full" || url.startsWith("/health/full?")) {
        const backendResult = await fetchBackendHealth(backendTarget);
        const backendStatus = backendResult.ok ? "ok" : "unreachable";
        const overallStatus = backendResult.ok ? "ok" : "degraded";
        const body = JSON.stringify({
          status: overallStatus,
          component: FRONTEND_COMPONENT,
          version: FRONTEND_VERSION,
          timestamp: new Date().toISOString(),
          checks: {
            self: "ok",
            backend: backendStatus,
          },
          backend: backendResult.ok ? backendResult.data : { error: backendResult.error },
        });
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.statusCode = overallStatus === "ok" ? 200 : 200;
        res.end(body);
        return;
      }

      next();
    });
  }

  return {
    name: "health-endpoints",
    configureServer(server) {
      registerEndpoints(server);
    },
    configurePreviewServer(server) {
      registerEndpoints(server);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_TARGET ?? "http://127.0.0.1:8000";

  return {
    plugins: [react(), healthEndpointsPlugin(backendTarget)],
    define: {
      __APP_VERSION__: JSON.stringify(FRONTEND_VERSION),
      __APP_COMPONENT__: JSON.stringify(FRONTEND_COMPONENT),
    },
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
      },
    },
  };
});
