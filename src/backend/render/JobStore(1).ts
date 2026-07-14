import { BackendRenderJob, BackendJobStatus } from './types';

export class JobStore {
  private static store = new Map<string, BackendRenderJob>();

  /**
   * Saves or registers a new render job in the storage.
   */
  static saveJob(job: BackendRenderJob): void {
    this.store.set(job.jobId, { ...job });
    console.log(`[JobStore] Saved job state for: ${job.jobId}`);
  }

  /**
   * Retrieves an existing render job by its ID.
   */
  static getJob(jobId: string): BackendRenderJob | undefined {
    const job = this.store.get(jobId);
    return job ? { ...job } : undefined;
  }

  /**
   * Updates the progress and execution status of a specific render job.
   */
  static updateJobStatus(
    jobId: string,
    status: BackendJobStatus,
    progress: number,
    stepMessage: string,
    error?: string
  ): void {
    const job = this.store.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      job.stepMessage = stepMessage;
      if (error) {
        job.error = error;
      }
      this.store.set(jobId, job);
      console.log(`[JobStore] Job ${jobId} updated: [${status}] ${progress}% - ${stepMessage}`);
    }
  }

  /**
   * Attaches the output download metadata upon successful job completion.
   */
  static updateJobResult(jobId: string, downloadUrl: string, sizeBytes: number): void {
    const job = this.store.get(jobId);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.stepMessage = 'Render task successfully completed.';
      job.downloadUrl = downloadUrl;
      job.sizeBytes = sizeBytes;
      this.store.set(jobId, job);
      console.log(`[JobStore] Job ${jobId} finalized. Result size: ${sizeBytes} bytes.`);
    }
  }

  /**
   * Clears or removes a job from storage.
   */
  static deleteJob(jobId: string): boolean {
    return this.store.delete(jobId);
  }

  /**
   * Lists all currently registered render jobs.
   */
  static getAllJobs(): BackendRenderJob[] {
    return Array.from(this.store.values()).map(job => ({ ...job }));
  }
}
