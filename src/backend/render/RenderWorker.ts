import { JobStore } from './JobStore';
import { FFmpegEngine } from './FFmpegEngine';
import { RenderQueue } from './RenderQueue';
import { BackendRenderJob } from './types';

export class RenderWorker {
  private static isRunning = false;

  /**
   * Starts the background queue worker processor.
   */
  static start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[RenderWorker] Production background rendering worker started.");
    this.workerLoop();
  }

  /**
   * Gracefully stops the worker processor.
   */
  static stop(): void {
    this.isRunning = false;
    console.log("[RenderWorker] Production background rendering worker stopped.");
  }

  /**
   * Continuous loop polling the queue for jobs.
   */
  private static async workerLoop(): Promise<void> {
    while (this.isRunning) {
      const nextJobId = RenderQueue.dequeue();
      if (nextJobId) {
        const job = JobStore.getJob(nextJobId);
        if (job) {
          try {
            await this.processJob(job);
          } catch (err: any) {
            console.error(`[RenderWorker] [ERROR] Job ${nextJobId} processing failed:`, err);
            JobStore.updateJobStatus(
              nextJobId,
              'failed',
              job.progress,
              'Render worker exception occurred.',
              err.message || 'Unknown render error.'
            );
          }
        }
      }
      // Poll interval: wait 1 second before checking queue again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Core workflow orchestration for executing a render task.
   */
  static async processJob(job: BackendRenderJob): Promise<void> {
    const { jobId, request } = job;
    console.log(`[RenderWorker] Commencing job processing for ${jobId}...`);

    try {
      // 1. Validation & Preparing Stage
      JobStore.updateJobStatus(jobId, 'preparing', 20, 'Preparing assets and validating parameters...');

      if (!request.videoId) {
        throw new Error("Invalid payload: videoId reference cannot be empty.");
      }
      if (request.startTime < 0 || request.endTime <= request.startTime) {
        throw new Error(`Invalid timeline bounds: start (${request.startTime}) must be less than end (${request.endTime}) and positive.`);
      }
      const duration = request.endTime - request.startTime;
      if (duration > 3600) {
        throw new Error("Render safety threshold limit exceeded: maximum clip duration is 1 hour.");
      }

      if (this.checkIfCancelled(jobId)) return;

      const videoPath = `/mnt/videos/raw/${request.videoId}.mp4`;
      const outputPath = `/mnt/videos/exports/${jobId}.mp4`;

      // 2. Rendering Stage
      JobStore.updateJobStatus(jobId, 'rendering', 50, 'Processing video crop and resolution filters with native FFmpeg...');
      console.log(`[RenderWorker] [START RENDER] Starting native FFmpeg render task for job ${jobId}`);

      // Call the native FFmpegEngine render method (which returns a Promise resolving on end and rejecting on error)
      await FFmpegEngine.render(videoPath, outputPath, request.startTime, request.endTime);

      console.log(`[RenderWorker] [END RENDER] Finished native FFmpeg render task for job ${jobId}`);

      if (this.checkIfCancelled(jobId)) return;

      // 3. Encoding Stage
      JobStore.updateJobStatus(jobId, 'encoding', 80, 'Finalizing container format with ultrafast performance profile...');

      if (this.checkIfCancelled(jobId)) return;

      // 4. Completed Stage
      const finalDownloadUrl = `/render/output/${jobId}.mp4`;
      const estimatedSizeBytes = Math.round(duration * 1.5 * 1024 * 1024); // 1.5MB per second estimate

      JobStore.updateJobResult(jobId, finalDownloadUrl, estimatedSizeBytes);
      console.log(`[RenderWorker] Job ${jobId} successfully marked as completed.`);
    } catch (err: any) {
      console.error(`[RenderWorker] [ERROR] Rendering failed for job ${jobId}:`, err);
      
      // Update job status to failed and save the error message
      JobStore.updateJobStatus(
        jobId,
        'failed',
        job.progress,
        'Rendering failed.',
        err.message || 'Unknown render error.'
      );
    }
  }

  /**
   * Guard condition to check for user manual cancellations during tasks
   */
  private static checkIfCancelled(jobId: string): boolean {
    const jobState = JobStore.getJob(jobId);
    if (jobState && jobState.status === 'cancelled') {
      console.log(`[RenderWorker] Job ${jobId} cancellation detected. Halting pipeline.`);
      return true;
    }
    return false;
  }
}
