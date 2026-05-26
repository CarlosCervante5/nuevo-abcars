import { fetchImageAsFile } from '../utils/fetchImageAsFile';
import { geminiVehicleImageService } from './geminiVehicleImageService';
import { vehicleService } from './vehicleService';
import {
  BATCH_JOB_EVENT,
  type BatchImageTarget,
  type BatchJob,
  type BatchJobStatus,
} from './vehicleImageAiBatch.types';

const STORAGE_KEY = 'abcars_vehicle_ia_batch_jobs';
/** Solo un lote activo: varios lotes saturan red y el plugin HTTP nativo. */
const MAX_ACTIVE_BATCH_JOBS = 1;
/** Tras este tiempo sin finalizar, se marca fallido (app cerrada o petición colgada). */
const STALE_JOB_MS = 40 * 60 * 1000;

type GeminiResult = {
  target: BatchImageTarget;
  file: File;
};

function emitUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BATCH_JOB_EVENT));
  }
}

function recoverStaleJobs(jobs: BatchJob[]): BatchJob[] {
  const now = Date.now();
  let changed = false;
  const out = jobs.map((j) => {
    if (
      (j.status === 'processing' || j.status === 'saving') &&
      now - j.startedAt > STALE_JOB_MS
    ) {
      changed = true;
      return {
        ...j,
        status: 'failed' as BatchJobStatus,
        finishedAt: now,
        lastError:
          'El proceso quedó incompleto (app cerrada o tiempo agotado). Vuelve a intentar con menos fotos.',
      };
    }
    return j;
  });
  if (changed) {
    saveJobsRaw(out);
  }
  return out;
}

function loadJobs(): BatchJob[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BatchJob[];
    const list = Array.isArray(parsed) ? parsed : [];
    return recoverStaleJobs(list);
  } catch {
    return [];
  }
}

function saveJobsRaw(jobs: BatchJob[]): void {
  if (typeof localStorage === 'undefined') return;
  const active = jobs.filter(
    (j) => j.status === 'processing' || j.status === 'saving',
  );
  const recentDone = jobs
    .filter((j) => j.status === 'completed' || j.status === 'failed')
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...active, ...recentDone]));
}

function saveJobs(jobs: BatchJob[]): void {
  saveJobsRaw(jobs);
}

function updateJob(jobId: string, patch: Partial<BatchJob>): void {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return;
  jobs[idx] = { ...jobs[idx], ...patch };
  saveJobs(jobs);
  emitUpdate();
}

async function processOneWithGemini(
  target: BatchImageTarget,
  serverGemini: boolean,
): Promise<GeminiResult> {
  let source: File;
  if (target.kind === 'existing') {
    source = await fetchImageAsFile(target.remoteUrl, `src_${target.imageUuid}.jpg`);
  } else {
    source = target.file;
  }
  const batch = await geminiVehicleImageService.processFilesRecorteEmbellecer(
    [source],
    undefined,
    serverGemini,
  );
  const file = batch[0];
  if (!file) {
    throw new Error('La IA no devolvió imagen.');
  }
  return { target, file };
}

/**
 * Una foto a la vez: IA → guardar. Evita acumular N resultados en memoria y
 * actualiza el progreso en cada paso (antes parecía “colgado” en IA 0/N).
 */
async function runJob(
  jobId: string,
  vehicleUuid: string,
  targets: BatchImageTarget[],
): Promise<void> {
  const errors: string[] = [];
  const pendingNewUploads: File[] = [];

  let serverGemini = false;
  try {
    serverGemini = await geminiVehicleImageService.resolveServerGeminiMode();
  } catch {
    serverGemini = false;
  }

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const step = i + 1;

      updateJob(jobId, {
        status: 'processing',
        currentStep: step,
        phaseDetail: `IA foto ${step}/${targets.length}`,
      });

      let result: GeminiResult;
      try {
        result = await processOneWithGemini(target, serverGemini);
        updateJob(jobId, { geminiDone: step });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error IA';
        errors.push(`${target.label}: ${msg}`);
        const job = loadJobs().find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { failed: job.failed + 1 });
        }
        continue;
      }

      updateJob(jobId, {
        status: 'saving',
        phaseDetail: `Guardando foto ${step}/${targets.length}`,
      });

      try {
        if (result.target.kind === 'existing') {
          await vehicleService.replaceGalleryImageAtIndex(
            vehicleUuid,
            result.target.imageUuid,
            result.target.slotIndex,
            result.file,
          );
          const job = loadJobs().find((j) => j.id === jobId);
          if (job) {
            updateJob(jobId, { saved: job.saved + 1 });
          }
        } else {
          pendingNewUploads.push(result.file);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al guardar';
        errors.push(`${result.target.label}: ${msg}`);
        const job = loadJobs().find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { failed: job.failed + 1 });
        }
      }
    }

    if (pendingNewUploads.length > 0) {
      updateJob(jobId, {
        status: 'saving',
        phaseDetail: `Subiendo ${pendingNewUploads.length} foto(s) nueva(s)…`,
      });
      try {
        await vehicleService.uploadVehicleImages(vehicleUuid, pendingNewUploads);
        const jobOk = loadJobs().find((j) => j.id === jobId);
        if (jobOk) {
          updateJob(jobId, { saved: jobOk.saved + pendingNewUploads.length });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al subir nuevas fotos';
        errors.push(msg);
        const jobFail = loadJobs().find((j) => j.id === jobId);
        if (jobFail) {
          updateJob(jobId, {
            failed: jobFail.failed + pendingNewUploads.length,
          });
        }
      }
    }

    const jobNow = loadJobs().find((j) => j.id === jobId);
    const anyOk = (jobNow?.saved ?? 0) > 0;
    const finalStatus: BatchJobStatus =
      errors.length > 0 && !anyOk ? 'failed' : 'completed';
    updateJob(jobId, {
      status: finalStatus,
      finishedAt: Date.now(),
      lastError: errors.length ? errors.slice(0, 2).join(' · ') : undefined,
      phaseDetail: undefined,
      currentStep: undefined,
    });
  } catch (e: unknown) {
    updateJob(jobId, {
      status: 'failed',
      finishedAt: Date.now(),
      lastError: e instanceof Error ? e.message : 'Error en lote IA',
      phaseDetail: undefined,
      currentStep: undefined,
    });
  }
}

export const vehicleImageAiBatchService = {
  getJobs(): BatchJob[] {
    return loadJobs();
  },

  getActiveJobs(): BatchJob[] {
    return loadJobs().filter((j) => j.status === 'processing' || j.status === 'saving');
  },

  getJobForVehicle(vehicleUuid: string): BatchJob | undefined {
    return loadJobs().find(
      (j) =>
        j.vehicleUuid === vehicleUuid &&
        (j.status === 'processing' || j.status === 'saving'),
    );
  },

  /**
   * @returns job id o null si ya hay un lote activo
   */
  startBatch(
    vehicleUuid: string,
    vehicleLabel: string,
    targets: BatchImageTarget[],
  ): string | null {
    if (vehicleImageAiBatchService.getActiveJobs().length >= MAX_ACTIVE_BATCH_JOBS) {
      return null;
    }

    const id = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: BatchJob = {
      id,
      vehicleUuid,
      vehicleLabel,
      status: 'processing',
      total: targets.length,
      geminiDone: 0,
      saved: 0,
      failed: 0,
      startedAt: Date.now(),
      currentStep: 0,
      phaseDetail: 'Iniciando…',
    };
    const jobs = loadJobs();
    jobs.unshift(job);
    saveJobs(jobs);
    emitUpdate();

    void runJob(id, vehicleUuid, targets);

    return id;
  },

  subscribe(listener: () => void): () => void {
    const handler = () => listener();
    window.addEventListener(BATCH_JOB_EVENT, handler);
    return () => window.removeEventListener(BATCH_JOB_EVENT, handler);
  },

  dismissCompleted(jobId: string): void {
    const jobs = loadJobs().filter((j) => j.id !== jobId);
    saveJobs(jobs);
    emitUpdate();
  },
};
