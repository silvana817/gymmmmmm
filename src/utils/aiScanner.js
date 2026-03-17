import { isSupabaseConfigured, supabase } from '../lib/supabase'

function ensureRemoteAnalyzerConfigured() {
    if (!isSupabaseConfigured || !supabase) {
        throw new Error('La integracion de IA del servidor no esta configurada.')
    }
}

function getAnalyzerItems(data) {
    if (!data || !Array.isArray(data.alimentos)) {
        throw new Error('El servicio de analisis devolvio un formato invalido.')
    }

    return data.alimentos
}

async function invokeNutritionAnalyzer(payload, fallbackMessage) {
    ensureRemoteAnalyzerConfigured()

    const { data, error } = await supabase.functions.invoke('nutrition-analyzer', {
        body: payload,
    })

    if (error) {
        const statusHint = error?.context?.status ? ` (HTTP ${error.context.status})` : ''

        let message = String(error?.message || '').trim()
        const response = error?.context

        if (response && typeof response === 'object' && typeof response.clone === 'function') {
            try {
                const payload = await response.clone().json()
                const serverError = String(payload?.error || '').trim()
                if (serverError) {
                    message = serverError
                }
            } catch {
                try {
                    const rawText = String(await response.clone().text() || '').trim()
                    if (rawText) {
                        message = rawText
                    }
                } catch {
                    // ignore parsing failures and preserve the generic SDK message
                }
            }
        }

        const isAuthError = message.toLowerCase().includes('jwt') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('not authenticated')

        if (isAuthError) {
            throw new Error('Tu sesion expiro o no estas autenticado. Volve a iniciar sesion e intenta nuevamente.')
        }

        throw new Error(`${fallbackMessage}${statusHint}${message ? ` Detalle: ${message}` : ''}`)
    }

    return getAnalyzerItems(data)
}

export async function analyzeFoodImageBase64(base64Image, imageMimeType) {
    const imageData = String(base64Image || '').trim()
    const mimeType = String(imageMimeType || '').trim() || 'image/jpeg'

    if (!imageData) {
        throw new Error('No hay imagen para analizar.')
    }

    return invokeNutritionAnalyzer(
        {
            mode: 'image',
            base64Image: imageData,
            imageMimeType: mimeType,
        },
        'No se pudo analizar la imagen. Verifica la configuracion del servicio o intenta con otra foto.',
    )
}

export async function analyzeFoodText(text) {
    const normalizedText = String(text || '').trim()
    if (!normalizedText) {
        throw new Error('Escribe una descripcion antes de analizar el texto.')
    }

    return invokeNutritionAnalyzer(
        {
            mode: 'text',
            text: normalizedText,
        },
        'No se pudo analizar el texto. Intenta describir mejor la comida.',
    )
}
