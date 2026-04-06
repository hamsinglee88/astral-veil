/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import { horoscopeApiPlugin } from './server/horoscope-api-plugin';

export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root, '');
  const proxyTarget =
    env.VITE_API_PROXY_TARGET?.trim() || env.VITE_DOTNET_API_URL?.trim();
  const useDotnetProxy =
    env.VITE_USE_DOTNET_API === 'true' ||
    env.VITE_USE_DOTNET_API === '1' ||
    Boolean(proxyTarget);
  const apiTarget = proxyTarget || 'http://localhost:5020';

  const plugins: PluginOption[] = [react(), tailwindcss()];
  // 启用 .NET 联调时由 Vite 转发 /api，避免与 Express 中间件重复挂载
  if (!useDotnetProxy) {
    plugins.push(horoscopeApiPlugin());
  }

  return {
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      ...(useDotnetProxy
        ? {
            proxy: {
              '/api': {
                target: apiTarget,
                changeOrigin: true,
              },
              // SignalR WebSocket / negotiate，与 .NET 同站点开发联调
              '/hubs': {
                target: apiTarget,
                changeOrigin: true,
                ws: true,
              },
            },
          }
        : {}),
    },
  };
});
