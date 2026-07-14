export class RenderQueue {
  private static queue: string[] = [];

  /**
   * Pushes a new render job onto the queue.
   */
  static enqueue(jobId: string): void {
    if (!this.queue.includes(jobId)) {
      this.queue.push(jobId);
      console.log(`[RenderQueue] Enqueued job: ${jobId}. Queue Size: ${this.queue.length}`);
    }
  }

  /**
   * Shifts the next eligible render job off the queue.
   */
  static dequeue(): string | undefined {
    const jobId = this.queue.shift();
    if (jobId) {
      console.log(`[RenderQueue] Dequeued job: ${jobId}. Remaining: ${this.queue.length}`);
    }
    return jobId;
  }

  /**
   * Removes a job from the queue if cancelled while waiting.
   */
  static cancel(jobId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(id => id !== jobId);
    const wasRemoved = this.queue.length < initialLength;
    if (wasRemoved) {
      console.log(`[RenderQueue] Removed job ${jobId} from queue. New size: ${this.queue.length}`);
    }
    return wasRemoved;
  }

  /**
   * Returns the number of currently queued jobs.
   */
  static getLength(): number {
    return this.queue.length;
  }

  /**
   * Inspects the current queue array.
   */
  static getQueue(): string[] {
    return [...this.queue];
  }

  /**
   * Clears the entire queue.
   */
  static clear(): void {
    this.queue = [];
    console.log("[RenderQueue] Queue cleared successfully.");
  }
}
