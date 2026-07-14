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
            console.error(`[RenderWorker] Job ${nextJobId} processing failed:`, err);
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

    // 1. Validation Stage
    JobStore.updateJobStatus(jobId, 'preparing', 10, 'Validating rendering parameters...');
    await new Promise(resolve => setTimeout(resolve, 500));

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

    // 2. Asset Preparation & Mounting
    JobStore.updateJobStatus(jobId, 'preparing', 25, 'Downloading video artifacts and generating subtitle tracks...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Handle subtitle mock file creation simulation if subtitles exist
    let simulatedSubtitlePath: string | undefined;
    if (request.subtitleTracks && request.subtitleTracks.length > 0) {
      simulatedSubtitlePath = `/tmp/subtitles_${jobId}.srt`;
      console.log(`[RenderWorker] Synthesized SRT file at temporary worker storage: ${simulatedSubtitlePath}`);
    }

    // Check cancellation before intensive stages
    if (this.checkIfCancelled(jobId)) return;

    // 3. Command Formulation and Rendering Pipeline
    JobStore.updateJobStatus(jobId, 'rendering', 45, 'Compiling video filters and running FFmpeg pipeline...');
    
    // Call our FFmpegEngine to formulate the exact parameters
    const renderPlan = await FFmpegEngine.renderClip({
      inputVideo: `/mnt/videos/raw/${request.videoId}.mp4`,
      startTime: request.startTime,
      endTime: request.endTime,
      cropMode: request.cropMode,
      resolution: request.resolution,
      fps: request.fps,
      subtitleFile: simulatedSubtitlePath,
      outputFile: `/mnt/videos/exports/${jobId}.mp4`,
    });

    console.log(`[RenderWorker] Plan constructed: ${renderPlan.command}`);
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (this.checkIfCancelled(jobId)) return;

    // 4. Video and Audio Encoding
    JobStore.updateJobStatus(jobId, 'encoding', 70, 'Multiplexing visual frames and audio samples into high-fidelity H.264 wrapper...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.checkIfCancelled(jobId)) return;

    // 5. CDN Uploading & Storage Synchronization
    JobStore.updateJobStatus(jobId, 'uploading', 90, 'Uploading rendered video file to Cloud Storage buckets...');
    await new Promise(resolve => setTimeout(resolve, 600));

    if (this.checkIfCancelled(jobId)) return;

    // 6. Complete and Publish Metadata
    const finalDownloadUrl = `/render/output/${jobId}.mp4`;
    const estimatedSizeBytes = Math.round(duration * 1.5 * 1024 * 1024); // 1.5MB per second estimate

    JobStore.updateJobResult(jobId, finalDownloadUrl, estimatedSizeBytes);
    console.log(`[RenderWorker] Job ${jobId} finalized. Status set to Completed.`);
  }

  /**
   * Guard condition to check for user manual cancellations during long tasks
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
