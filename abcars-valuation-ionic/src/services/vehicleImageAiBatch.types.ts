export type BatchTargetExisting = {
  kind: 'existing';
  imageUuid: string;
  slotIndex: number;
  remoteUrl: string;
  label: string;
};

export type BatchTargetNew = {
  kind: 'new';
  localId: string;
  file: File;
  label: string;
};

export type BatchImageTarget = BatchTargetExisting | BatchTargetNew;

export type BatchJobStatus = 'processing' | 'saving' | 'completed' | 'failed';

export type BatchJob = {
  id: string;
  vehicleUuid: string;
  vehicleLabel: string;
  status: BatchJobStatus;
  total: number;
  geminiDone: number;
  saved: number;
  failed: number;
  startedAt: number;
  finishedAt?: number;
  lastError?: string;
};

export const BATCH_JOB_EVENT = 'abcars-vehicle-ia-batch-update';
