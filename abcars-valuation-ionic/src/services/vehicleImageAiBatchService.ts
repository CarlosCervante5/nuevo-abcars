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
const MAX_CONCURRENT_GEMINI = 4;

type GeminiResult = {
  target: BatchImageTarget;
  file: File;
};

function emitUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BATCH_JOB_EVENT));
  }
}

function loadJobs(): BatchJob[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BatchJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: BatchJob[]): void {
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

function updateJob(jobId: string, patch: Partial<BatchJob>): void {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return;
  jobs[idx] = { ...jobs[idx], ...patch };
  saveJobs(jobs);
  emitUpdate();
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function processOneWithGemini(target: BatchImageTarget): Promise<GeminiResult> {
  let source: File;
  if (target.kind === 'existing') {
    source = await fetchImageAsFile(target.remoteUrl, `src_${target.imageUuid}.jpg`);
  } else {
    source = target.file;
  }
  const batch = await geminiVehicleImageService.processFilesRecorteEmbellecer([source]);
  const file = batch[0];
  if (!file) {
    throw new Error('La IA no devolvió imagen.');
  }
  return { target, file };
}

async function runJob(
  jobId: string,
  vehicleUuid: string,
  targets: BatchImageTarget[],
): Promise<void> {
  const geminiResults: GeminiResult[] = [];
  const errors: string[] = [];

  try {
    await mapWithConcurrency(targets, MAX_CONCURRENT_GEMINI, async (target) => {
      try {
        const result = await processOneWithGemini(target);
        geminiResults.push(result);
        const jobs = loadJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { geminiDone: job.geminiDone + 1 });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error IA';
        errors.push(msg);
        const jobs = loadJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { failed: job.failed + 1 });
        }
      }
    });

    updateJob(jobId, { status: 'saving' });

    const newProcessed: File[] = [];

    for (const { target, file } of geminiResults) {
      try {
        if (target.kind === 'existing') {
          await vehicleService.replaceGalleryImageAtIndex(
            vehicleUuid,
            target.imageUuid,
            target.slotIndex,
            file,
          );
        } else {
          newProcessed.push(file);
        }
        const jobs = loadJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { saved: job.saved + 1 });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al guardar';
        errors.push(msg);
        const jobs = loadJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (job) {
          updateJob(jobId, { failed: job.failed + 1 });
        }
      }
    }

    if (newProcessed.length > 0) {
      try {
        await vehicleService.uploadVehicleImages(vehicleUuid, newProcessed);
        const jobAfterUpload = loadJobs().find((j) => j.id === jobId);
        if (jobAfterUpload) {
          updateJob(jobId, { saved: jobAfterUpload.saved + newProcessed.length });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error al subir nuevas fotos';
        errors.push(msg);
        const jobFail = loadJobs().find((j) => j.id === jobId);
        if (jobFail) {
          updateJob(jobId, { failed: jobFail.failed + newProcessed.length });
        }
      }
    }

    const finalStatus: BatchJobStatus =
      errors.length > 0 && geminiResults.length === 0 ? 'failed' : 'completed';
    updateJob(jobId, {
      status: finalStatus,
      finishedAt: Date.now(),
      lastError: errors.length ? errors[0] : undefined,
    });
  } catch (e: unknown) {
    updateJob(jobId, {
      status: 'failed',
      finishedAt: Date.now(),
      lastError: e instanceof Error ? e.message : 'Error en lote IA',
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

  startBatch(
    vehicleUuid: string,
    vehicleLabel: string,
    targets: BatchImageTarget[],
  ): string {
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
