/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_AI_MODEL_PRIMARY: string
  readonly VITE_AI_MODEL_SECONDARY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

