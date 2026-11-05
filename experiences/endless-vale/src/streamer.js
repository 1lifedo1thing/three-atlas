// Generation queue: jobs run in a worker pool, or on the main thread in small slices when workers are unavailable.
import { runJob } from './jobs.js';
import { buildTile } from './tiles.js';
import { scatterCell, scatterGrass } from './scatter.js';

export function createStreamer({ workers = 2, onResult }) {
  const pool = [], pending = new Map(), queue = [];
  let fallback = null, nextId = 1, disposed = false;
  try {
    for (let i = 0; i < workers; i++) {
      const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.busy = 0;
      worker.onmessage = ({ data }) => { worker.busy--; finish(data); pump(); };
      worker.onerror = () => { useFallback(); };
      pool.push(worker);
    }
  } catch { useFallback(); }

  function useFallback() {
    if (fallback) return;
    for (const worker of pool) worker.terminate();
    pool.length = 0;
    fallback = Promise.resolve({ buildTile, scatterCell, scatterGrass });
    // Requeue jobs that were in flight on the workers.
    for (const job of pending.values()) if (!queue.includes(job)) queue.push(job);
    pump();
  }

  function finish(data) {
    const job = pending.get(data.id);
    pending.delete(data.id);
    if (!job || job.cancelled || disposed) return;
    onResult(job, data);
  }

  let slicing = false;
  async function sliceFallback() {
    if (slicing) return;
    slicing = true;
    const generators = await fallback;
    while (queue.length && !disposed) {
      const start = performance.now();
      while (queue.length && performance.now() - start < 6) {
        const job = take();
        if (!job) break;
        finish(runJob(job, generators).result);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    slicing = false;
  }

  function take() {
    // Highest priority first; skip cancelled jobs.
    let best = -1;
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].cancelled) { pending.delete(queue[i].id); queue.splice(i--, 1); continue; }
      if (best < 0 || queue[i].priority < queue[best].priority) best = i;
    }
    return best < 0 ? null : queue.splice(best, 1)[0];
  }

  function pump() {
    if (disposed) return;
    if (fallback) { sliceFallback(); return; }
    for (const worker of pool) {
      while (worker.busy < 2) {
        const job = take();
        if (!job) return;
        worker.busy++;
        worker.postMessage(job.message);
      }
    }
  }

  return {
    /** Queue a job; lower priority numbers run first. Returns a handle with cancel(). */
    request(message, priority = 0) {
      const id = nextId++;
      const job = { id, priority, message: { ...message, id }, cancelled: false, cancel() { this.cancelled = true; } };
      pending.set(id, job); queue.push(job);
      return job;
    },
    reprioritize(job, priority) { job.priority = priority; },
    pump,
    get backlog() { return queue.length; },
    get inFlight() { return pending.size - queue.length; },
    dispose() { disposed = true; for (const worker of pool) worker.terminate(); queue.length = 0; pending.clear(); },
  };
}
