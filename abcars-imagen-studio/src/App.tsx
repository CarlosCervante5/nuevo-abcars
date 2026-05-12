/**
 * Cola Gemini: importar solo defaultGeminiApiOptions desde ./studio/presets
 * (no existe STUDIO_PRESETS ni estado preset).
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import './App.css'
import { defaultGeminiApiOptions } from './studio/presets'
import { isGeminiConfigured } from './google/env'
import { geminiEditImage } from './google/geminiImage'
import { downloadImageFromUrl } from './lib/downloadFromUrl'
import { runWithConcurrency } from './lib/runWithConcurrency'
import { ComparisonModal } from './studio/ComparisonModal'
import {
  getImagePromptOptionsForMode,
  getImagePromptById,
  type ImagePromptId,
} from './studio/imagePrompts'

const BATCH_PARALLEL = 2

function getInitialStudioMode(): 'full' | 'solo-embellecer' {
  if (typeof window === 'undefined') return 'full'
  const p = new URLSearchParams(window.location.search).get('mode')
  return p === 'solo-embellecer' ? 'solo-embellecer' : 'full'
}

type JobStatus = 'pending' | 'running' | 'done' | 'error'

type StudioJob = {
  id: string
  file: File
  previewUrl: string
  status: JobStatus
  resultUrl?: string
  error?: string
  model?: string
}

function makeJob(file: File): StudioJob {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: 'pending',
  }
}

function DropIcon() {
  return (
    <svg
      className="dropzone__svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function App() {
  const configured = isGeminiConfigured()

  const [studioMode] = useState(() => getInitialStudioMode())
  const promptOptions = getImagePromptOptionsForMode(studioMode)

  const [dragOver, setDragOver] = useState(false)
  const [batchBusy, setBatchBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [jobs, setJobs] = useState<StudioJob[]>([])
  const [imagePromptId, setImagePromptId] = useState<ImagePromptId | null>(() =>
    studioMode === 'solo-embellecer' ? 'recuperar-sobreexpuesta' : null,
  )
  const [modalId, setModalId] = useState<string | null>(null)

  const jobsRef = useRef(jobs)
  useEffect(() => {
    jobsRef.current = jobs
  }, [jobs])

  const imagePromptIdRef = useRef(imagePromptId)
  useEffect(() => {
    imagePromptIdRef.current = imagePromptId
  }, [imagePromptId])

  const processChainRef = useRef(Promise.resolve<void>(undefined))

  useEffect(() => {
    return () => {
      for (const j of jobsRef.current) {
        URL.revokeObjectURL(j.previewUrl)
      }
    }
  }, [])

  useEffect(() => {
    if (modalId && !jobs.some((j) => j.id === modalId)) {
      setModalId(null)
    }
  }, [modalId, jobs])

  const processJobsInternal = useCallback(
    async (toRun: StudioJob[]) => {
      if (!configured || toRun.length === 0) return

      const pid = imagePromptIdRef.current
      if (!pid) return

      const promptMeta = getImagePromptById(pid)
      const prompt = promptMeta.body
      const opts = {
        ...defaultGeminiApiOptions(),
        ...(promptMeta.outputMode === 'studio-recorte'
          ? {
              imageConfig: { aspectRatio: '4:3' as const, imageSize: '2K' as const },
            }
          : {}),
      }
      const preserveInputCanvas = promptMeta.outputMode === 'preserve'

      setBatchBusy(true)
      setError(null)

      try {
        await runWithConcurrency(toRun, BATCH_PARALLEL, async (job) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? { ...j, status: 'running', error: undefined }
                : j,
            ),
          )
          try {
            const result = await geminiEditImage({
              file: job.file,
              prompt,
              apiOptions: opts,
              preserveInputCanvas,
            })
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id
                  ? {
                      ...j,
                      status: 'done',
                      resultUrl: result.imageDataUrl,
                      error: undefined,
                      model: result.model,
                    }
                  : j,
              ),
            )
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : 'No se pudo procesar la imagen.'
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id ? { ...j, status: 'error', error: msg } : j,
              ),
            )
          }
        })
      } finally {
        setBatchBusy(false)
      }
    },
    [configured],
  )

  const scheduleProcess = useCallback(
    (toRun: StudioJob[]) => {
      if (!configured || toRun.length === 0) return
      processChainRef.current = processChainRef.current
        .catch(() => undefined)
        .then(() => processJobsInternal(toRun))
    },
    [configured, processJobsInternal],
  )

  const appendFiles = useCallback(
    (files: File[]) => {
      if (!configured) return
      if (!imagePromptIdRef.current) {
        setError('Selecciona primero un tipo de retoque arriba.')
        return
      }
      const imgs = files.filter((f) => f.type.startsWith('image/'))
      if (!imgs.length) {
        setError('Suelta solo archivos de imagen (JPEG, PNG, WebP, etc.).')
        return
      }
      setError(null)
      setDownloadError(null)
      const newJobs = imgs.map(makeJob)
      setJobs((prev) => [...prev, ...newJobs])
      scheduleProcess(newJobs)
    },
    [configured, scheduleProcess],
  )

  const removeJob = useCallback((id: string) => {
    setModalId((mid) => (mid === id ? null : mid))
    setJobs((prev) => {
      const j = prev.find((x) => x.id === id)
      if (j) URL.revokeObjectURL(j.previewUrl)
      return prev.filter((x) => x.id !== id)
    })
  }, [])

  const clearJobs = useCallback(() => {
    setModalId(null)
    setJobs((prev) => {
      for (const j of prev) URL.revokeObjectURL(j.previewUrl)
      return []
    })
    setDownloadError(null)
    setError(null)
  }, [])

  const markAllDoneForRerun = useCallback(() => {
    setJobs((prev) => {
      const next = prev.map((j) =>
        j.status === 'done'
          ? { ...j, status: 'pending' as const, resultUrl: undefined, model: undefined }
          : j,
      )
      const toRun = next.filter((j) => j.status === 'pending')
      queueMicrotask(() => scheduleProcess(toRun))
      return next
    })
  }, [scheduleProcess])

  const processQueue = useCallback(() => {
    const toRun = jobsRef.current.filter(
      (j) => j.status === 'pending' || j.status === 'error',
    )
    scheduleProcess(toRun)
  }, [scheduleProcess])

  const downloadAllProcessed = useCallback(async () => {
    const done = jobs.filter((j) => j.status === 'done' && j.resultUrl)
    if (!done.length) return
    setDownloadError(null)
    setDownloading(true)
    try {
      for (const j of done) {
        const tail = j.file.name.replace(/\.[^.]+$/, '') || 'imagen'
        const stem = `abcars-${imagePromptId ?? 'retoque'}-${tail}`
        await downloadImageFromUrl(j.resultUrl!, stem)
        await new Promise((r) => setTimeout(r, 400))
      }
    } catch (e) {
      setDownloadError(
        e instanceof Error ? e.message : 'Error al descargar una o más imágenes.',
      )
    } finally {
      setDownloading(false)
    }
  }, [jobs, imagePromptId])

  const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    const next = e.relatedTarget as Node | null
    if (next && e.currentTarget.contains(next)) return
    setDragOver(false)
  }, [])

  const pendingOrErrorCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'error',
  ).length
  const doneCount = jobs.filter((j) => j.status === 'done').length

  const modalJob = modalId
    ? jobs.find((j) => j.id === modalId) ?? null
    : null

  return (
    <div className="app">
      <ComparisonModal
        job={modalJob}
        onClose={() => setModalId(null)}
      />

      <header className="app__header">
        <p className="app__eyebrow">ABCars · Herramientas</p>
        <h1 className="app__title">Imagen Studio</h1>
        <p className="app__lead">
          {studioMode === 'solo-embellecer' ? (
            <>
              <strong>Modo embellecer / evidencia:</strong> solo correcciones sobreexpuesta u opaca (sin
              recorte ni fondo de estudio). Elige el tipo de retoque y suelta las fotos; se procesan en cola.
            </>
          ) : (
            <>
              <strong>Primero elige el tipo de retoque</strong>; después puedes soltar las fotos (se
              procesan solas y aparecen abajo). Pulsa una imagen para el comparador.{' '}
              <strong>Recorte + fondo</strong> usa salida 4:3 (2K en API); el resto mantiene el mismo lienzo.
              Hasta {BATCH_PARALLEL} en paralelo.
            </>
          )}
        </p>
      </header>

      {!configured ? (
        <div className="alert alert--warn" role="status">
          <strong>Falta la clave de Gemini.</strong> En{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
          >
            Google AI Studio
          </a>{' '}
          crea una API key y ponla en <code>abcars-imagen-studio/.env</code> como{' '}
          <code>VITE_GEMINI_API_KEY</code>. En desarrollo el proxy de Vite usa{' '}
          <code>/gemini-api</code> para evitar CORS. Reinicia{' '}
          <code>npm run dev</code> tras guardar.
        </div>
      ) : null}

      {error ? (
        <div className="alert alert--err" role="alert">
          {error}
        </div>
      ) : null}

      <section className="panel" aria-labelledby="prompt-brief-heading">
        <h2 id="prompt-brief-heading" className="panel__title">
          Tipo de retoque
        </h2>
        <div className="prompt-grid" role="radiogroup" aria-label="Tipo de mejora">
          {promptOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={imagePromptId === opt.id}
              className={`prompt-card${imagePromptId === opt.id ? ' prompt-card--active' : ''}`}
              onClick={() => {
                setImagePromptId(opt.id)
                setError(null)
              }}
            >
              <span className="prompt-card__label">{opt.label}</span>
            </button>
          ))}
        </div>
        <p className="prompt-hint">
          {imagePromptId
            ? 'Puedes arrastrar o elegir fotos en el área de abajo.'
            : 'Elige una opción para habilitar la subida de imágenes.'}
        </p>
      </section>

      <section className="panel panel--upload" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="panel__title">
          {jobs.length ? 'Añadir más imágenes' : 'Arrastra y suelta aquí'}
        </h2>
        <label
          className={`dropzone dropzone--large${dragOver ? ' dropzone--drag' : ''}${batchBusy ? ' dropzone--busy' : ''}${configured && !imagePromptId ? ' dropzone--locked' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            if (!configured || !imagePromptId) {
              e.dataTransfer.dropEffect = 'none'
              return
            }
            e.dataTransfer.dropEffect = 'copy'
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!imagePromptId) {
              setError('Selecciona primero un tipo de retoque arriba.')
              return
            }
            appendFiles(Array.from(e.dataTransfer.files))
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={!configured || !imagePromptId}
            onChange={(e) => {
              const list = e.target.files ? Array.from(e.target.files) : []
              appendFiles(list)
              e.target.value = ''
            }}
          />
          <div className="dropzone__body">
            {batchBusy ? (
              <span className="spinner" aria-hidden />
            ) : (
              <DropIcon />
            )}
            <span className="dropzone__strong">
              {batchBusy
                ? 'Procesando… puedes seguir añadiendo fotos'
                : !imagePromptId && configured
                  ? 'Primero elige el tipo de retoque'
                  : dragOver
                    ? 'Suelta las imágenes'
                    : 'Arrastra varias imágenes o haz clic para elegir'}
            </span>
            <p className="dropzone__hint">
              {imagePromptId
                ? 'Al soltar se envían a Gemini automáticamente. JPEG, PNG o WebP; recomendado ≤ 10 MB por archivo.'
                : 'La subida está desactivada hasta que selecciones un tipo de retoque.'}
            </p>
          </div>
        </label>
      </section>

      {configured && jobs.length > 0 ? (
        <section className="panel" aria-labelledby="batch-heading">
          <div className="panel__head">
            <h2 id="batch-heading" className="panel__title panel__title--inline">
              Resultados · {jobs.length} fotos · {doneCount} listas
              {pendingOrErrorCount > 0
                ? ` · ${pendingOrErrorCount} en curso o con error`
                : null}
            </h2>
            <div className="panel__head-actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!imagePromptId || !pendingOrErrorCount}
                onClick={() => void processQueue()}
              >
                Reintentar pendientes / fallidos
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={batchBusy || !imagePromptId || !doneCount}
                onClick={() => void markAllDoneForRerun()}
              >
                Reprocesar todas
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={batchBusy || !doneCount || downloading}
                onClick={() => void downloadAllProcessed()}
              >
                {downloading ? (
                  <>
                    <span className="spinner spinner--dark" aria-hidden />
                    Descargando…
                  </>
                ) : (
                  'Descargar todas'
                )}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={batchBusy}
                onClick={() => clearJobs()}
              >
                Limpiar lista
              </button>
            </div>
          </div>

          {downloadError ? (
            <div className="alert alert--err" role="alert">
              {downloadError}
            </div>
          ) : null}

          <ul className="batch-grid">
            {jobs.map((j) => (
              <li key={j.id} className="batch-card">
                <button
                  type="button"
                  className="batch-card__thumb"
                  onClick={() => setModalId(j.id)}
                  aria-label="Abrir comparador antes y después"
                >
                  <img
                    src={
                      j.status === 'done' && j.resultUrl
                        ? j.resultUrl
                        : j.previewUrl
                    }
                    alt=""
                  />
                  {j.status === 'running' ? (
                    <div className="batch-card__thumb-overlay">
                      <span className="spinner spinner--dark" aria-hidden />
                    </div>
                  ) : null}
                  {j.status === 'pending' ? (
                    <div className="batch-card__thumb-overlay">En cola…</div>
                  ) : null}
                  {j.status === 'error' ? (
                    <div className="batch-card__thumb-overlay batch-card__thumb-overlay--err">
                      Error
                    </div>
                  ) : null}
                </button>
                <div className="batch-card__meta">
                  <span className="batch-card__name" title={j.file.name}>
                    {j.file.name}
                  </span>
                  <span className="batch-card__kb">
                    {(j.file.size / 1024).toFixed(0)} KB
                  </span>
                  {j.model ? (
                    <span className="batch-card__model">{j.model}</span>
                  ) : null}
                </div>
                {j.error ? (
                  <p className="batch-card__err" role="alert">
                    {j.error}
                  </p>
                ) : null}
                <div className="batch-card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={batchBusy || j.status !== 'done' || !j.resultUrl}
                    onClick={() =>
                      void downloadImageFromUrl(
                        j.resultUrl!,
                        `abcars-${imagePromptId ?? 'retoque'}-${j.file.name.replace(/\.[^.]+$/, '') || 'imagen'}`,
                      )
                    }
                  >
                    Descargar
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={batchBusy}
                    onClick={() => removeJob(j.id)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
