// Local, in-browser text embeddings via transformers.js.
// The heavy library is loaded with a dynamic import so it (and the model) are
// only fetched the first time an embedding is actually needed — free-tier users
// who never use AI search never download any of it.
//
// Model: Xenova/all-MiniLM-L6-v2 → 384-dim vectors, matching closed_tabs.embedding.
// The model file (~25MB) is downloaded once from the Hugging Face CDN and then
// cached by the browser; subsequent loads are instant. No API key, no server.

declare const chrome: any

const MODEL = 'Xenova/all-MiniLM-L6-v2'

let embedderPromise: Promise<any> | null = null

async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers')
      // We always fetch the model from the CDN (no local model files bundled).
      env.allowLocalModels = false
      // Run on the main thread (no proxy Worker) to avoid extension CSP issues.
      env.backends.onnx.wasm.proxy = false
      // Extension pages are NOT cross-origin isolated, so SharedArrayBuffer (and
      // therefore multi-threaded WASM) is unavailable. Force a single thread,
      // otherwise ONNX fails to initialize and every embedding throws.
      env.backends.onnx.wasm.numThreads = 1
      // Manifest V3 blocks loading remote scripts, so ONNX cannot fetch its WASM
      // backend (.mjs/.wasm) from the jsDelivr CDN. Point it at our local copy,
      // shipped inside the extension at /ort (see vite.config.ts static copy).
      env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('ort/')
      console.log('[TabGraveyard] loading embedding model…')
      const p = await pipeline('feature-extraction', MODEL)
      console.log('[TabGraveyard] embedding model ready ✓')
      // Remember that the model has been downloaded+cached at least once, so the
      // UI can stop showing the one-time "downloading…" notice on later runs.
      try { await chrome.storage.local.set({ aiModelReady: true }) } catch { /* ignore */ }
      return p
    })()
    // If loading fails, clear the cached promise so the next attempt can retry,
    // and surface the real reason in the console.
    embedderPromise.catch((e) => {
      console.error('[TabGraveyard] embedding model FAILED to load:', e)
      embedderPromise = null
    })
  }
  return embedderPromise
}

/** True once the model has finished loading at least once. */
export async function warmUpEmbedder(): Promise<void> {
  await getEmbedder()
}

/** Turn a single string into a 384-number embedding. */
export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder()
  const output = await embedder(text || '', { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}
