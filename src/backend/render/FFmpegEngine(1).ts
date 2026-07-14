export interface FFmpegOptions {
  inputVideo: string;
  startTime: number;
  endTime: number;
  cropMode: string;
  resolution: string;
  fps: number;
  subtitleFile?: string;
  outputFile: string;
}

export interface FFmpegCommandResult {
  command: string;
  args: string[];
  outputFile: string;
}

export class FFmpegEngine {
  /**
   * Translates rendering options into a production-grade native FFmpeg command.
   * This handles high-throughput video processing parameter design.
   */
  static renderClip(options: FFmpegOptions): Promise<FFmpegCommandResult> {
    const {
      inputVideo,
      startTime,
      endTime,
      cropMode,
      resolution,
      fps,
      subtitleFile,
      outputFile,
    } = options;

    console.log("[FFmpegEngine] Translating high-level render request into native command line parameters...");

    // Build duration from bounds
    const duration = endTime - startTime;

    // Resolve Crop filter. Default 9:16 portrait.
    // Standard crop formula for 9:16 portrait from horizontal 16:9 input: crop=ih*9/16:ih:(iw-ih*9/16)/2:0
    let videoFilter = '';
    if (cropMode === '9:16') {
      videoFilter = `crop=ih*9/16:ih:(iw-ih*9/16)/2:0`;
    } else if (cropMode === '1:1') {
      videoFilter = `crop=ih:ih:(iw-ih)/2:0`;
    } else {
      videoFilter = 'scale=iw:ih';
    }

    // Resolve scaling (e.g. 1080x1920)
    const [targetWidth, targetHeight] = resolution.split('x');
    videoFilter += `,scale=${targetWidth}:${targetHeight}`;

    // Inject subtitles filter if present
    if (subtitleFile) {
      // Escape paths for FFmpeg filter compliance
      const escapedSubtitlePath = subtitleFile.replace(/\\/g, '/').replace(/:/g, '\\:');
      videoFilter += `,subtitles='${escapedSubtitlePath}'`;
    }

    // Form native arguments list
    const args = [
      '-y',                                  // Overwrite output files
      '-ss', startTime.toFixed(3),          // Start seek time (fast seek before input is generally preferred)
      '-t', duration.toFixed(3),             // Limit duration
      '-i', inputVideo,                      // Source file input
      '-vf', videoFilter,                    // Apply constructed Video Filters
      '-r', fps.toString(),                  // Target Frames Per Second
      '-c:v', 'libx264',                     // Video Codec: High Compatibility H.264
      '-preset', 'veryfast',                 // Encoding performance profile preset
      '-profile:v', 'high',                  // Profile for maximum device support
      '-level:v', '4.1',                     // Level
      '-pix_fmt', 'yuv420p',                 // Pixel Format required for QuickTime/Safari playback
      '-c:a', 'aac',                         // Audio Codec: Advanced Audio Coding
      '-b:a', '192k',                        // Audio Bitrate
      '-ac', '2',                            // Force stereo channels
      outputFile,                            // Destination output target
    ];

    const command = `ffmpeg ${args.map(arg => arg.includes(' ') || arg.includes(',') ? `"${arg}"` : arg).join(' ')}`;

    console.log("[FFmpegEngine] Generated Command Line Pipeline:");
    console.log(`[FFmpegEngine] CLI: ${command}`);

    return new Promise((resolve) => {
      // Return metadata of the formulated execution plan.
      // In production, this result is routed to the child_process spawning engine.
      setTimeout(() => {
        resolve({
          command,
          args,
          outputFile,
        });
      }, 100);
    });
  }
}
