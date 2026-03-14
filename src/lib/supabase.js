import { createClient } from '@supabase/supabase-js'
import { runtimeConfig } from '../config/runtime'

export const isSupabaseConfigured = Boolean(
    runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey,
)

export const supabase = isSupabaseConfigured
    ? createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey)
    : null
