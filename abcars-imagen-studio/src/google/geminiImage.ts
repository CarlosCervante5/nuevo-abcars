import type { GeminiPresetApiOptions } from '../studio/presets'
import { getGeminiApiKey, getGeminiGenerateContentUrl } from './env'

export type GeminiImageEditResult = {
  /** data URL lista para <img> y descarga */
  imageDataUrl: string
  model: string
  finishReason?: string
}

function fileToBase64(file: File): Promise<{ mime: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      const m = s.match(/^data:([^;]*);base64,(.+)$/s)
      if (!m) {
        reject(new Error('No se pudo codificar la imagen en base64'))
        return
      }
      resolve({
        mime: (m[1] || file.type || 'image/jpeg').trim() || 'image/jpeg',
        base64: m[2] ?? '',
      })
    }
    r.onerror = () => reject(r.error ?? new Error('Lectura de archivo fallida'))
    r.readAsDataURL(file)
  })
}

type Part = {
  text?: string
  inlineData?: { mimeType?: string; data?: string }
  inline_data?: { mime_type?: string; data?: string }
}

type GenResponse = {
  candidates?: Array<{
    finishReason?: string
    content?: { parts?: Part[] }
  }>
  promptFeedback?: { blockReason?: string }
  error?: { code?: number; message?: string; status?: string }
}

const RETRYABLE_HTTP = new Set([429, 500, 502, 503])

/** Tiempo máximo por intento (fetch + leer cuerpo); evita quedarse colgado. */
const ATTEMPT_TIMEOUT_MS = 300_000

/** Intentos completos (nueva petición cada uno si falla red, cuerpo cortado, etc.). */
const MAX_FULL_ROUNDS = 5

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function parseRetryAfterMs(res: Response): number | null {
  const h = res.headers.get('retry-after')
  if (!h) return null
  const s = Number.parseInt(h, 10)
  if (!Number.isFinite(s) || s < 0) return null
  return Math.min(120_000, s * 1000)
}

function isLikelyRetriableTransportError(e: unknown): boolean {
  if (e instanceof TypeError) return true
  if (e instanceof DOMException && e.name === 'AbortError') return true
  if (e instanceof Error) {
    if (e.name === 'AbortError') return true
    const m = e.message.toLowerCase()
    if (
      m.includes('network') ||
      m.includes('failed to fetch') ||
      m.includes('fetch') ||
      m.includes('aborted') ||
      m.includes('abort') ||
      m.includes('chunk') ||
      m.includes('incomplete') ||
      m.includes('connection') ||
      m.includes('reset')
    ) {
      return true
    }
  }
  return false
}

function looksLikeTruncatedJson(text: string): boolean {
  const t = text.trim()
  if (!t || t[0] !== '{') return false
  try {
    JSON.parse(t)
    return false
  } catch {
    return true
  }
}

function extractImageFromResponse(parsed: GenResponse): {
  dataUrl: string
  finishReason?: string
} {
  if (parsed.error?.message) {
    throw new Error(parsed.error.message)
  }

  const block = parsed.promptFeedback?.blockReason
  if (block) {
    throw new Error(`Contenido bloqueado (${block}). Prueba a acortar el prompt o cambiar la imagen.`)
  }

  const cand = parsed.candidates?.[0]
  const finishReason = cand?.finishReason
  const parts = cand?.content?.parts

  if (!parts?.length) {
    throw new Error(
      'La API no devolvió imagen. Revisa el modelo, cuotas y políticas de uso.',
    )
  }

  for (const p of parts) {
    const raw =
      p.inlineData?.data ??
      p.inline_data?.data
    if (!raw) continue
    const mime =
      p.inlineData?.mimeType ??
      p.inline_data?.mime_type ??
      'image/png'
    return {
      dataUrl: `data:${mime};base64,${raw}`,
      finishReason,
    }
  }

  throw new Error(
    finishReason === 'SAFETY' || finishReason === 'BLOCKLIST'
      ? 'La respuesta fue filtrada por políticas de seguridad.'
      : 'La respuesta no incluye datos de imagen (solo texto o vacío).',
  )
}

const PRESERVE_CANVAS_SUFFIX = `[Technical output requirement] The output image MUST match the input image pixel dimensions exactly (same width and height). Preserve the same framing, composition, and aspect ratio. Apply only the visual changes described in the instructions above; do not crop, pad, reframe, or change canvas size.`

const STUDIO_RECORTE_SUFFIX = `[Technical output requirement] Deliver a professional vehicle cutout on a new background. Replace the entire original scene with a clean premium studio or showroom environment (seamless cyclorama: soft neutral gray-to-white gradient or polished floor, no people, no signage, no random objects). Tight, balanced framing around the vehicle with consistent margins. Beautify subtly: reduce visible dirt, balance reflections, catalog-quality finish. Do NOT change the vehicle's identity, geometry, badges, wheels, or proportions—photorealistic edges and a soft natural contact shadow on the new floor.`

export async function geminiEditImage(params: {
  file: File
  prompt: string
  apiOptions: GeminiPresetApiOptions
  /** Por defecto true: mismo lienzo. false = recorte/fondo (usa imageConfig si viene en apiOptions). */
  preserveInputCanvas?: boolean
}): Promise<GeminiImageEditResult> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Falta VITE_GEMINI_API_KEY')
  }

  const preserve =
    params.preserveInputCanvas !== undefined
      ? params.preserveInputCanvas
      : true

  const { mime, base64 } = await fileToBase64(params.file)
  const model = params.apiOptions.model
  const url = getGeminiGenerateContentUrl(model)

  const suffix = preserve ? PRESERVE_CANVAS_SUFFIX : STUDIO_RECORTE_SUFFIX
  const promptText = `${params.prompt.trim()}\n\n${suffix}`

  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  }
  if (!preserve && params.apiOptions.imageConfig) {
    generationConfig.imageConfig = params.apiOptions.imageConfig
  }

  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mime,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig,
  }

  const payload = JSON.stringify(body)
  let lastErrorMessage = 'Error desconocido'

  for (let round = 0; round < MAX_FULL_ROUNDS; round++) {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), ATTEMPT_TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'content-type': 'application/json',
        },
        body: payload,
        signal: ac.signal,
      })

      let text: string
      try {
        text = await res.text()
      } catch (readErr) {
        lastErrorMessage =
          readErr instanceof Error
            ? readErr.message
            : 'Respuesta cortada (chunked incompleto)'
        if (round < MAX_FULL_ROUNDS - 1) {
          clearTimeout(timer)
          await sleep(Math.min(45_000, 2500 * 2 ** round))
          continue
        }
        throw new Error(
          `La conexión se cortó al leer la respuesta tras ${MAX_FULL_ROUNDS} intentos (${lastErrorMessage}). Reinicia el servidor de desarrollo o prueba más tarde; cada intento nuevo es una petición nueva a la API.`,
        )
      } finally {
        clearTimeout(timer)
      }

      if (!res.ok && RETRYABLE_HTTP.has(res.status) && round < MAX_FULL_ROUNDS - 1) {
        const fromHeader = parseRetryAfterMs(res)
        const backoff = Math.min(45_000, 1800 * 2 ** round)
        await sleep(fromHeader ?? backoff)
        continue
      }

      let parsed: GenResponse
      try {
        parsed = JSON.parse(text) as GenResponse
      } catch {
        if (
          (looksLikeTruncatedJson(text) || text.length < 20) &&
          round < MAX_FULL_ROUNDS - 1
        ) {
          await sleep(Math.min(45_000, 2500 * 2 ** round))
          continue
        }
        throw new Error(
          text.slice(0, 280) || `Error Gemini (${res.status}) · JSON inválido o truncado`,
        )
      }

      if (!res.ok) {
        const msg = parsed.error?.message ?? text.slice(0, 400)
        const hint =
          res.status === 503
            ? ' El servicio estaba saturado (503). Reintenta más tarde.'
            : ''
        throw new Error((msg || `Error Gemini (${res.status})`) + hint)
      }

      const { dataUrl, finishReason } = extractImageFromResponse(parsed)

      const outB64 = dataUrl.match(/^data:[^;]+;base64,(.+)$/s)?.[1]
      if (preserve && outB64 && outB64 === base64) {
        throw new Error(
          'La API devolvió la misma imagen que la entrada (sin cambios en los datos). Acorta el prompt, prueba otra foto o reintenta; a veces el modelo no aplica edición.',
        )
      }

      return {
        imageDataUrl: dataUrl,
        model,
        finishReason,
      }
    } catch (e) {
      clearTimeout(timer)

      if (e instanceof Error && e.message.includes('La API devolvió la misma imagen')) {
        throw e
      }
      if (e instanceof Error && e.message.includes('Contenido bloqueado')) {
        throw e
      }

      const retriable = isLikelyRetriableTransportError(e)
      lastErrorMessage = e instanceof Error ? e.message : String(e)

      if (retriable && round < MAX_FULL_ROUNDS - 1) {
        await sleep(Math.min(60_000, 2500 * 2 ** round))
        continue
      }

      if (round === MAX_FULL_ROUNDS - 1) {
        throw new Error(
          `No se pudo completar la generación tras ${MAX_FULL_ROUNDS} intentos. Último error: ${lastErrorMessage}. Si ves ERR_INCOMPLETE_CHUNKED_ENCODING, el proxy o la red cortaron la respuesta: reinicia Vite, sube timeouts del proxy o prueba con menos imágenes en paralelo.`,
        )
      }

      throw e instanceof Error ? e : new Error(String(e))
    }
  }

  throw new Error(lastErrorMessage)
}
