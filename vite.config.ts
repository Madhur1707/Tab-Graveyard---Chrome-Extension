import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'background.js', dest: '.' },
        // Bundle the ONNX Runtime WASM backend locally. Manifest V3 forbids
        // loading remote scripts, so transformers.js cannot fetch these from a
        // CDN — they must ship inside the extension and be pointed at via
        // env.backends.onnx.wasm.wasmPaths (see src/lib/embeddings.ts).
        { src: 'node_modules/onnxruntime-web/dist/ort-wasm-*.{wasm,mjs}', dest: 'ort', rename: { stripBase: true } },
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})