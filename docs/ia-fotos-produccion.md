# IA para analizar fotos de comida (producción)

Esta guía deja el flujo de **análisis por foto/texto** listo para producción usando:
- Frontend React (este repo).
- Supabase Edge Function `nutrition-analyzer`.
- Gemini API (Google AI Studio).

## 1) Dónde se configura cada cosa

### A. Frontend (Vercel/Netlify/etc.)
Variables públicas (cliente):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Estas variables se usan para invocar la Edge Function desde `src/utils/aiScanner.js`.

### B. Backend (Supabase project)
Secrets privados (server-only, en Supabase):

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (opcional, default `gemini-2.5-flash`)

La función lee estos secrets en `supabase/functions/nutrition-analyzer/index.ts`.

---

## 2) Paso a paso en Supabase (producción)

### 2.1 Crear/obtener API key de Gemini
1. Entrá a Google AI Studio.
2. Creá una API key.
3. Guardala para cargarla en Supabase como `GEMINI_API_KEY`.

### 2.2 Cargar secrets en Supabase
Desde terminal (logueado en Supabase CLI):

```bash
supabase link --project-ref <TU_PROJECT_REF>
supabase secrets set GEMINI_API_KEY="<TU_API_KEY_GEMINI>" GEMINI_MODEL="gemini-2.5-flash"
```

También lo podés hacer desde el dashboard de Supabase en **Project Settings → Edge Functions → Secrets**.

### 2.3 Deploy de la Edge Function

```bash
supabase functions deploy nutrition-analyzer
```

### 2.4 Confirmar JWT obligatorio
Este repo ya define `verify_jwt = true` para la función en `supabase/config.toml`, lo que exige sesión válida del usuario autenticado.

---

## 3) Variables en tu hosting frontend

En Vercel (o similar), en el proyecto:

- `VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<tu-anon-key>`

Luego redeploy del frontend.

---

## 4) Qué ya quedó endurecido para producción

En `nutrition-analyzer` ya están agregadas estas defensas:

- Validación de mime-type de imagen (`jpg/png/webp`).
- Límite de tamaño por imagen (8 MB).
- Saneado de salida (`alimentos`) con números enteros no negativos.
- Soporte para payload base64 con o sin prefijo `data:image/...;base64,`.
- `verify_jwt = true` para no permitir uso anónimo sin sesión.

---

## 5) Monitoreo recomendado

- Revisar logs en **Supabase → Edge Functions → nutrition-analyzer → Logs**.
- Configurar alertas por errores 5xx y latencia alta.
- Rotar `GEMINI_API_KEY` periódicamente.

---

## 6) Prueba end-to-end rápida (producción)

1. Iniciá sesión en tu app.
2. Abrí **Mi Nutrición → Escáner (foto)**.
3. Subí una imagen menor a 8 MB (JPG/PNG/WEBP).
4. Confirmá que devuelve alimentos con macros.

Si falla:
- Revisá secrets (`GEMINI_API_KEY`) en Supabase.
- Revisá que frontend tenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Revisá logs de la función para detalle del error.
