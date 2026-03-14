import { GoogleGenAI, Type } from 'npm:@google/genai'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
            const base64Image = String(body?.base64Image || '').trim()
            const imageMimeType = String(body?.imageMimeType || '').trim() || 'image/jpeg'

            if (!base64Image) {
                return jsonResponse({ error: 'Debes enviar una imagen para analizar.' }, 400)
            }

            contents = [
                buildImagePrompt(),
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
        const alimentos = Array.isArray(data?.alimentos) ? data.alimentos : []

        return jsonResponse({ alimentos })
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : 'No se pudo completar el analisis nutricional.'

        return jsonResponse({ error: message }, 500)
    }
})
