import { useEffect } from 'react'
import { BeforeAfterSlider } from './BeforeAfterSlider'

type JobStatus = 'pending' | 'running' | 'done' | 'error'

export type ModalJob = {
  id: string
  previewUrl: string
  status: JobStatus
  resultUrl?: string
} | null

type Props = {
  job: ModalJob
  onClose: () => void
}

export function ComparisonModal({ job, onClose }: Props) {
  useEffect(() => {
    if (!job) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [job, onClose])

  if (!job) return null

  const statusLine =
    job.status === 'pending'
      ? 'En cola…'
      : job.status === 'running'
        ? 'Generando…'
        : job.status === 'error'
          ? 'No hay resultado · revisa el error en la tarjeta'
          : ''

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Comparar antes y después"
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>
        <div className="modal-body">
          <BeforeAfterSlider
            beforeSrc={job.previewUrl}
            afterSrc={
              job.status === 'done' && job.resultUrl ? job.resultUrl : null
            }
            statusLine={statusLine}
            isLoading={job.status === 'running'}
          />
        </div>
      </div>
    </div>
  )
}
