import { JobStore } from './JobStore';
import { RenderQueue } from './RenderQueue';
import { RenderWorker } from './RenderWorker';
import { BackendRenderJob, BackendRenderRequest } from './types';

export interface ControllerRequest {
  body?: any;
  params?: { [key: string]: string };
  query?: { [key: string]: string };
}

export interface ControllerResponse {
  statusCode: number;
  data: any;
  headers: { [key: string]: string };
  status(code: number): ControllerResponse;
  json(body: any): ControllerResponse;
  send(content: any): ControllerResponse;
}

export class RenderController {
  
  /**
   * Helper utility to create a default mocked HTTP response object
   */
  private static createMockResponse(): ControllerResponse {
    const res: ControllerResponse = {
      statusCode: 200,
      data: null,
      headers: { 'Content-Type': 'application/json' },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        this.data = body;
        return this;
      },
      send(content: any) {
        this.data = content;
        return this;
      }
    };
    return res;
  }

  /**
   * POST /render
   * Receives and validates incoming clip specifications, enqueues the job, and registers it in storage.
   */
  static async submitRender(req: ControllerRequest, res: ControllerResponse = this.createMockResponse()): Promise<ControllerResponse> {
    try {
      console.log("[RenderController] Received POST /render");
      const body = req.body as BackendRenderRequest;

      // Basic payload verification
      if (!body || !body.videoId) {
        return res.status(400).json({
          success: false,
          error: "Bad Request: Missing videoId reference in payload."
        });
      }

      // Format unique Job identification
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newJob: BackendRenderJob = {
        jobId,
        status: 'queued',
        progress: 0,
        stepMessage: 'Job enqueued. Waiting for render slot...',
        createdAt: new Date().toISOString(),
        request: body
      };

      // 1. Save in global job registry
      JobStore.saveJob(newJob);

      // 2. Put onto FIFO Queue
      RenderQueue.enqueue(jobId);

      // Proactively prompt the background worker loop to process
      RenderWorker.start();

      return res.status(202).json({
        success: true,
        message: "Render job submitted and accepted successfully.",
        jobId,
        status: 'queued',
        progress: 0
      });
    } catch (error: any) {
      console.error("[RenderController] Error in submitRender:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error during render registration."
      });
    }
  }

  /**
   * GET /render/:id
   * Resolves and serves the granular progress metrics and status details for a specified job.
   */
  static async getRenderStatus(req: ControllerRequest, res: ControllerResponse = this.createMockResponse()): Promise<ControllerResponse> {
    try {
      const jobId = req.params?.id;
      console.log(`[RenderController] Received GET /render/${jobId}`);

      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: "Bad Request: Missing render jobId parameter."
        });
      }

      const job = JobStore.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Not Found: Render job does not exist."
        });
      }

      return res.status(200).json({
        success: true,
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        stepMessage: job.stepMessage,
        createdAt: job.createdAt,
        error: job.error
      });
    } catch (error: any) {
      console.error("[RenderController] Error in getRenderStatus:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error during status lookup."
      });
    }
  }

  /**
   * GET /render/:id/download
   * Generates or provides the download details for finished render artifacts.
   */
  static async downloadRender(req: ControllerRequest, res: ControllerResponse = this.createMockResponse()): Promise<ControllerResponse> {
    try {
      const jobId = req.params?.id;
      console.log(`[RenderController] Received GET /render/${jobId}/download`);

      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: "Bad Request: Missing render jobId parameter."
        });
      }

      const job = JobStore.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Not Found: Render job does not exist."
        });
      }

      if (job.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: `Bad Request: Render job is not complete (current status: ${job.status}).`
        });
      }

      return res.status(200).json({
        success: true,
        jobId,
        downloadUrl: job.downloadUrl || `/render/output/${jobId}.mp4`,
        sizeBytes: job.sizeBytes || 0,
        outputFormat: job.request.outputFormat,
        mimeType: 'video/mp4'
      });
    } catch (error: any) {
      console.error("[RenderController] Error in downloadRender:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error during download retrieval."
      });
    }
  }

  /**
   * DELETE /render/:id
   * Terminates active processing tasks or purges completed/failed records.
   */
  static async cancelRender(req: ControllerRequest, res: ControllerResponse = this.createMockResponse()): Promise<ControllerResponse> {
    try {
      const jobId = req.params?.id;
      console.log(`[RenderController] Received DELETE /render/${jobId}`);

      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: "Bad Request: Missing render jobId parameter."
        });
      }

      const job = JobStore.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Not Found: Render job does not exist."
        });
      }

      // If job is already finished, simply delete from memory registry
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        JobStore.deleteJob(jobId);
        return res.status(200).json({
          success: true,
          message: "Render job record purged from active registry."
        });
      }

      // Otherwise, cancel the active pipeline
      RenderQueue.cancel(jobId);
      JobStore.updateJobStatus(jobId, 'cancelled', job.progress, 'Rendering task cancelled by the user.');

      return res.status(200).json({
        success: true,
        message: "Render job execution cancelled successfully."
      });
    } catch (error: any) {
      console.error("[RenderController] Error in cancelRender:", error);
      return res.status(500).json({
        success: false,
        error: "Internal Server Error during task termination."
      });
    }
  }
}
