const sanitizeEnvValue = (value) => String(value ?? '').trim()

export const runtimeConfig = Object.freeze({
    supabaseUrl: sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKey: sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
})
