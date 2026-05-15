import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { GeminiVehicleImageService } from './gemini-vehicle-image.service';
import { ImagesService } from './images.service';

export interface VehicleImageBatchJob {
  id: string;
  vehicleUuid: string;
  phase: 'gemini' | 'upload';
  geminiCurrent: number;
  geminiTotal: number;
}

/**
 * Cola de procesamiento IA + subida a Laravel sin bloquear el panel (marketing).
 */
@Injectable({ providedIn: 'root' })
export class VehicleImageAiQueueService {
  private readonly jobsSubject = new BehaviorSubject<VehicleImageBatchJob[]>([]);
  readonly batchJobs$ = this.jobsSubject.asObservable();

  readonly vehicleBatchFinished$ = new Subject<{
    vehicleUuid: string;
    ok: boolean;
    message?: string;
  }>();

  constructor(
    private readonly gemini: GeminiVehicleImageService,
    private readonly imagesService: ImagesService,
  ) {}

  enqueueBatchProcessAndUpload(
    vehicleUuid: string,
    files: File[],
    processWithAi: boolean,
  ): void {
    if (!vehicleUuid || files.length === 0) {
      return;
    }

    const jobId = `${vehicleUuid}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const job: VehicleImageBatchJob = {
      id: jobId,
      vehicleUuid,
      phase: processWithAi ? 'gemini' : 'upload',
      geminiCurrent: processWithAi ? 0 : files.length,
      geminiTotal: processWithAi ? files.length : files.length,
    };

    this.upsertJob(job);
    void this.runJob(jobId, vehicleUuid, [...files], processWithAi);
  }

  private upsertJob(job: VehicleImageBatchJob): void {
    const cur = this.jobsSubject.value.filter((j) => j.id !== job.id);
    this.jobsSubject.next([...cur, job]);
  }

  private patchJob(jobId: string, patch: Partial<VehicleImageBatchJob>): void {
    this.jobsSubject.next(
      this.jobsSubject.value.map((j) =>
        j.id === jobId ? { ...j, ...patch } : j,
      ),
    );
  }

  private removeJob(jobId: string): void {
    this.jobsSubject.next(this.jobsSubject.value.filter((j) => j.id !== jobId));
  }

  private async runJob(
    jobId: string,
    vehicleUuid: string,
    files: File[],
    processWithAi: boolean,
  ): Promise<void> {
    try {
      let filesToUpload = files;

      if (processWithAi) {
        if (!this.gemini.isConfigured()) {
          throw new Error(
            'IA no disponible: configura geminiApiKey en environment.ts.',
          );
        }
        filesToUpload = await this.gemini.processFilesRecorteEmbellecer(
          files,
          (cur, tot) =>
            this.patchJob(jobId, {
              phase: 'gemini',
              geminiCurrent: cur,
              geminiTotal: tot,
            }),
        );
      }

      this.patchJob(jobId, {
        phase: 'upload',
        geminiCurrent: filesToUpload.length,
        geminiTotal: filesToUpload.length,
      });

      await firstValueFrom(
        this.imagesService
          .setImage(vehicleUuid, filesToUpload)
          .pipe(timeout(240_000)),
      );

      this.removeJob(jobId);
      this.vehicleBatchFinished$.next({ vehicleUuid, ok: true });
    } catch (e) {
      this.removeJob(jobId);
      let message =
        e instanceof Error ? e.message : 'No se pudieron procesar o subir las imágenes.';
      if (e instanceof TimeoutError) {
        message =
          'Tiempo agotado al subir (240 s). Comprueba el servidor y la red.';
      }
      this.vehicleBatchFinished$.next({
        vehicleUuid,
        ok: false,
        message,
      });
    }
  }
}
