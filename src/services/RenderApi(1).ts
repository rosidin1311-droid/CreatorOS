export interface SubtitleTrack {
  id: string;
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  position?: { x: number; y: number };
  style?: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
}

export interface RenderRequest {
  videoId: string;
  startTime: number;
  endTime: number;
  cropMode: string;
  subtitleTracks: SubtitleTrack[];
  outputFormat: 'mp4' | 'mov' | 'mkv';
  resolution: '1080x1920' | '720x1280';
  fps: number;
}

export type RenderStatusType = 'queued' | 'preparing' | 'rendering' | 'encoding' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface RenderJob {
  jobId: string;
  status: RenderStatusType;
  progress: number;
  createdAt: string;
  request: RenderRequest;
}

export interface RenderStatus {
  jobId: string;
  status: RenderStatusType;
  progress: number;
  stepMessage: string;
  error?: string;
}

export interface RenderResult {
  jobId: string;
  downloadUrl: string;
  sizeBytes: number;
  duration: number;
}

export class RenderApi {
  // In-memory registry to track simulated background render jobs
  private static activeJobs = new Map<string, { job: RenderJob; startedAt: number }>();

  /**
   * Generates a random UUID v4 for mock job identifiers
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Submits a RenderRequest to the simulated production rendering service.
   * Returns a RenderJob with status set to 'queued'.
   */
  static async submitRender(request: RenderRequest): Promise<RenderJob> {
    console.log("[RenderApi] Submitting render request:", request);
    
    const jobId = this.generateUUID();
    const job: RenderJob = {
      jobId,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      request,
    };

    // Save job with current timestamp to simulate progression
    this.activeJobs.set(jobId, {
      job,
      startedAt: Date.now(),
    });

    console.log(`[RenderApi] Job submitted successfully. Job ID: ${jobId}`);
    return job;
  }

  /**
   * Retrieves current status of the specified render job.
   * Dynamically calculates pipeline progression steps based on elapsed time.
   */
  static async getRenderStatus(jobId: string): Promise<RenderStatus> {
    const record = this.activeJobs.get(jobId);
    if (!record) {
      return {
        jobId,
        status: 'failed',
        progress: 0,
        stepMessage: 'Job not found in queue.',
        error: 'Job ID does not exist.',
      };
    }

    const { job, startedAt } = record;

    // If job was manually cancelled, return cancelled state
    if (job.status === 'cancelled') {
      return {
        jobId,
        status: 'cancelled',
        progress: job.progress,
        stepMessage: 'Rendering was cancelled by the user.',
      };
    }

    // Dynamic timeline simulation
    const elapsedSeconds = (Date.now() - startedAt) / 1000;
    let status: RenderStatusType = 'queued';
    let progress = 0;
    let stepMessage = 'Queueing render task...';

    if (elapsedSeconds < 3) {
      status = 'queued';
      progress = 5;
      stepMessage = 'Loading renderer and queueing task...';
    } else if (elapsedSeconds < 7) {
      status = 'preparing';
      progress = 20;
      stepMessage = 'Reading source video data and loading profiles...';
    } else if (elapsedSeconds < 14) {
      status = 'rendering';
      progress = 50;
      stepMessage = 'Trimming and cropping workspace coordinates to 9:16 portrait...';
    } else if (elapsedSeconds < 21) {
      status = 'encoding';
      progress = 75;
      stepMessage = 'Encoding visual frames and mixing audio tracks (x264, AAC)...';
    } else if (elapsedSeconds < 26) {
      status = 'uploading';
      progress = 90;
      stepMessage = 'Uploading final render to content delivery network...';
    } else {
      status = 'completed';
      progress = 100;
      stepMessage = 'Render task successfully completed.';
      
      // Update job record permanently to completed
      job.status = 'completed';
      job.progress = 100;
    }

    // Update progress/status on stored record if not completed/cancelled
    if (job.status !== 'completed') {
      job.status = status;
      job.progress = progress;
    }

    return {
      jobId,
      status: job.status,
      progress: job.progress,
      stepMessage,
    };
  }

  /**
   * Retrieves final download metadata and URL for a completed render job.
   */
  static async downloadRender(jobId: string): Promise<RenderResult> {
    const record = this.activeJobs.get(jobId);
    if (!record) {
      throw new Error(`Job ${jobId} not found.`);
    }

    const { job } = record;
    if (job.status !== 'completed') {
      throw new Error(`Job ${jobId} is not in completed state (current: ${job.status}).`);
    }

    const duration = job.request.endTime - job.request.startTime;
    // Mock size of ~2MB per second of output video
    const sizeBytes = Math.round(duration * 2 * 1024 * 1024);

    return {
      jobId,
      downloadUrl: `/render/output/${jobId}.mp4`,
      sizeBytes,
      duration,
    };
  }

  /**
   * Cancels/terminates a running render task.
   */
  static async cancelRender(jobId: string): Promise<boolean> {
    const record = this.activeJobs.get(jobId);
    if (!record) {
      return false;
    }

    const { job } = record;
    if (job.status === 'completed' || job.status === 'failed') {
      return false; // cannot cancel already finished jobs
    }

    job.status = 'cancelled';
    console.log(`[RenderApi] Job ${jobId} has been cancelled.`);
    return true;
  }
}
