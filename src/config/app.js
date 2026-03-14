const sanitizeEnvValue = (value) => String(value ?? '').trim()

function parseBooleanEnv(value, fallback = false) {
    const normalized = sanitizeEnvValue(value).toLowerCase()

    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true
    }

    if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false
    }

    return fallback
}

function parseThemeEnv(value) {
    const normalized = sanitizeEnvValue(value).toLowerCase()
    return normalized === 'dark' ? 'dark' : 'light'
}

export const appConfig = Object.freeze({
    appName: sanitizeEnvValue(import.meta.env.VITE_APP_NAME) || 'GymPro',
    appTagline: sanitizeEnvValue(import.meta.env.VITE_APP_TAGLINE) || 'Panel de control',
    trainerName: sanitizeEnvValue(import.meta.env.VITE_TRAINER_NAME) || 'Entrenador',
    trainerInitials: sanitizeEnvValue(import.meta.env.VITE_TRAINER_INITIALS) || 'TR',
    enableDemoData: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEMO_DATA, false),
    exerciseMediaBaseUrl: sanitizeEnvValue(import.meta.env.VITE_EXERCISE_MEDIA_BASE_URL)
        || 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises',
    stateStorageKey: sanitizeEnvValue(import.meta.env.VITE_LOCAL_STATE_KEY) || 'gym-pro-state-v1',
    themeStorageKey: sanitizeEnvValue(import.meta.env.VITE_THEME_STORAGE_KEY) || 'gym-pro-theme',
    defaultTheme: parseThemeEnv(import.meta.env.VITE_DEFAULT_THEME),
})
