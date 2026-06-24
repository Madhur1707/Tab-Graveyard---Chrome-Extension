import { createClient } from '@supabase/supabase-js'

// Declare chrome for TypeScript (provided by the extension/runtime)
declare const chrome: any

// Add ImportMeta env typing for Vite env vars used in this file
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEV_MODE: string
}


declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

// Dev/test mode: enables the in-app "Activate Pro (test)" toggle so we can
// exercise the full Pro experience (DB sync, gated features) without Stripe.
// Set VITE_DEV_MODE=true in .env. Leave it off for production builds.
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const chromeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const result = await chrome.storage.local.get(key)
      return result[key] ?? null
    } catch {
      return localStorage.getItem(key)
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await chrome.storage.local.set({ [key]: value })
    } catch {
      localStorage.setItem(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await chrome.storage.local.remove(key)
    } catch {
      localStorage.removeItem(key)
    }
  },
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: chromeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null

export type User = {
  id: string
  email: string
  is_pro: boolean
}
