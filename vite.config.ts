import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['path', 'os', 'util', 'stream', 'buffer', 'process', 'url', 'https', 'http', 'events'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      alias: [
        { find: /^@napi-rs\/canvas.*$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^ppu-paddle-ocr$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^onnxruntime-node$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^node:fs\/promises$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^fs\/promises$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^node:fs$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: /^fs$/, replacement: path.resolve(__dirname, 'src/utils/empty.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    optimizeDeps: {
      exclude: ['@napi-rs/canvas', 'ppu-paddle-ocr'],
      esbuildOptions: {
        loader: {
          '.node': 'empty' as any,
        },
      },
    },
    build: {
      rollupOptions: {
        external: [/@napi-rs\/canvas/, /\.node$/],
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
