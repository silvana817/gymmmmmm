import { GoogleGenAI, Type } from 'npm:@google/genai'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function buildNutritionSchema() {
    return {
        type: Type.OBJECT,
        properties: {
            alimentos: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        nombre: { type: Type.STRING },
                        calorias: { type: Type.INTEGER },
                        proteinas: { type: Type.INTEGER },
                        carbos: { type: Type.INTEGER },
                        grasas: { type: Type.INTEGER },
                    },
                    required: ['nombre', 'calorias', 'proteinas', 'carbos', 'grasas'],
                },
            },
        },
        required: ['alimentos'],
    }
}

function getGeminiClient() {
    const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim()

    if (!apiKey) {
        throw new Error('El secreto GEMINI_API_KEY no esta configurado en Supabase.')
    }

    return new GoogleGenAI({ apiKey })
}

function getGeminiModel() {
    return Deno.env.get('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash'
}

function sanitizeAlimentos(rawAlimentos: unknown[]) {
    return rawAlimentos
        .map((item) => {
            const nombre = String((item as { nombre?: unknown })?.nombre ?? '').trim()
            if (!nombre) return null

            const toNonNegativeInt = (value: unknown) => {
                const parsed = Number(value)
                if (!Number.isFinite(parsed)) return 0
                return Math.max(0, Math.round(parsed))
            }

            return {
                nombre,
                calorias: toNonNegativeInt((item as { calorias?: unknown })?.calorias),
                proteinas: toNonNegativeInt((item as { proteinas?: unknown })?.proteinas),
                carbos: toNonNegativeInt((item as { carbos?: unknown })?.carbos),
                grasas: toNonNegativeInt((item as { grasas?: unknown })?.grasas),
            }
        })
        .filter(Boolean)
}

function stripDataUrlPrefix(base64Image: string) {
    const marker = 'base64,'
    const markerIndex = base64Image.indexOf(marker)
    return markerIndex >= 0 ? base64Image.slice(markerIndex + marker.length) : base64Image
}

function decodeBase64Bytes(base64Value: string) {
    try {
        return Uint8Array.from(atob(base64Value), (char) => char.charCodeAt(0)).byteLength
    } catch {
        throw new Error('La imagen base64 es invalida.')
    }
}

function normalizeImagePayload(rawBase64Image: unknown, rawImageMimeType: unknown) {
    const base64Input = String(rawBase64Image || '').trim()
    const imageMimeType = String(rawImageMimeType || '').trim().toLowerCase() || 'image/jpeg'

    if (!base64Input) {
        throw new Error('Debes enviar una imagen para analizar.')
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(imageMimeType)) {
        throw new Error('Formato de imagen no soportado. Usa JPG, PNG o WEBP.')
    }

    const base64Image = stripDataUrlPrefix(base64Input)
    const imageSizeBytes = decodeBase64Bytes(base64Image)

    if (imageSizeBytes > MAX_IMAGE_BYTES) {
        throw new Error('La imagen excede el limite de 8 MB.')
    }

    return { base64Image, imageMimeType }
}

function buildTextPrompt(text: string) {
    return `
Eres un nutricionista experto. Analiza el siguiente texto con una comida o conjunto de comidas.
Debes separar cada alimento identificado y estimar de la forma mas precisa posible sus calorias, proteinas, carbohidratos y grasas.
No inventes alimentos que no aparezcan en el texto.

Texto:
${text}
`
}

function buildImagePrompt() {
    return `
Eres un nutricionista experto. Analiza la imagen de esta comida.
Identifica los alimentos presentes y estima de la forma mas precisa posible los valores nutricionales de la porcion total servida en la foto.

Debes devolver tu respuesta obligatoriamente en formato JSON, con la siguiente estructura exacta:
{
  "alimentos": [
    {
      "nombre": "Nombre del alimento",
      "calorias": 250,
      "proteinas": 40,
      "carbos": 0,
      "grasas": 5
    }
  ]
}
`
}

function jsonResponse(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    })
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Metodo no permitido.' }, 405)
    }

    try {
        const body = await request.json()
        const mode = String(body?.mode || '').trim()
        const ai = getGeminiClient()
        const model = getGeminiModel()

        let contents: string | Array<unknown>

        if (mode === 'text') {
            const text = String(body?.text || '').trim()

            if (!text) {
                return jsonResponse({ error: 'Debes enviar un texto para analizar.' }, 400)
            }

            contents = buildTextPrompt(text)
        } else if (mode === 'image') {
            const { base64Image, imageMimeType } = normalizeImagePayload(body?.base64Image, body?.imageMimeType)

            contents = [
                {
                    text: buildImagePrompt(),
                },
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: imageMimeType,
                    },
                },
            ]
        } else {
            return jsonResponse({ error: 'Modo de analisis no soportado.' }, 400)
        }

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: buildNutritionSchema(),
            },
        })

        if (!response.text) {
            throw new Error('La IA devolvio una respuesta vacia.')
        }

        const data = JSON.parse(response.text)
        const alimentos = sanitizeAlimentos(Array.isArray(data?.alimentos) ? data.alimentos : [])

        return jsonResponse({ alimentos })
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : 'No se pudo completar el analisis nutricional.'

        return jsonResponse({ error: message }, 500)
    }
})
