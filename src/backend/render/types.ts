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

export interface BackendRenderRequest {
  videoId: string;
  startTime: number;
  endTime: number;
  cropMode: string;
  subtitleTracks: SubtitleTrack[];
  outputFormat: 'mp4' | 'mov' | 'mkv';
  resolution: '1080x1920' | '720x1280';
  fps: number;
}

export type BackendJobStatus = 
  | 'queued' 
  | 'preparing' 
  | 'rendering' 
  | 'encoding' 
  | 'uploading' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface BackendRenderJob {
  jobId: string;
  status: BackendJobStatus;
  progress: number;
  stepMessage: string;
  createdAt: string;
  request: BackendRenderRequest;
  error?: string;
  downloadUrl?: string;
  sizeBytes?: number;
}
