// libs
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';

// utils
import { getSingletonInstance } from './utils';

// types
import type { QueryNode, SearchResult } from './matcher';
interface WorkerTask {
  files: string[];
  query: QueryNode;
  resolve: (results: SearchResult[]) => void;
  reject: (error: Error) => void;
}

interface PooledWorker {
  worker: Worker;
  busy: boolean;
  task?: WorkerTask;
}

export class WorkerPool {
  private workers: PooledWorker[] = [];
  private taskQueue: WorkerTask[] = [];
  private maxWorkers: number;
  private workerPath: string;

  constructor(maxWorkers?: number) {
    this.maxWorkers = maxWorkers || Math.max(1, os.cpus().length - 1);
    const ext = process.env.TEST === 'true' ? '.ts' : '.js';
    this.workerPath = path.join(__dirname, `scan.worker${ext}`);
    this.initializeWorkers();
  }

  initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): PooledWorker {
    const worker = new Worker(this.workerPath);
    const pooledWorker: PooledWorker = {
      worker,
      busy: false,
    };

    worker.on('message', ({ results }) => {
      if (pooledWorker.task) {
        pooledWorker.task.resolve(results);
        pooledWorker.task = undefined;
        pooledWorker.busy = false;
        this.processNextTask();
      }
    });

    worker.on('error', error => {
      if (pooledWorker.task) {
        pooledWorker.task.reject(error);
        pooledWorker.task = undefined;
        pooledWorker.busy = false;
      }
      this.processNextTask();
    });

    worker.on('exit', code => {
      if (code !== 0 && pooledWorker.task) {
        pooledWorker.task.reject(new Error(`Worker stopped with exit code ${code}`));
        pooledWorker.task = undefined;
        pooledWorker.busy = false;
      }
      this.processNextTask();
    });

    this.workers.push(pooledWorker);
    return pooledWorker;
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift();

    if (!task) return;

    availableWorker.busy = true;
    availableWorker.task = task;

    availableWorker.worker.postMessage({
      files: task.files,
      query: task.query,
    });
  }

  async processFiles(files: string[], query: QueryNode): Promise<SearchResult[]> {
    return new Promise<SearchResult[]>((resolve, reject) => {
      const task: WorkerTask = {
        files,
        query,
        resolve,
        reject,
      };
      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  async processBatches(batches: string[][], query: QueryNode): Promise<SearchResult[]> {
    const matches: Set<SearchResult> = new Set<SearchResult>();

    // Process all batches concurrently using the worker pool
    const promises = batches.map(batch => this.processFiles(batch, query));

    const results = await Promise.all(promises);
    results.forEach(batchResults => {
      batchResults.forEach(match => matches.add(match));
    });

    return Array.from(matches);
  }

  destroy(): void {
    this.workers.forEach(({ worker }) => {
      worker.terminate();
    });
    this.workers = [];
    this.taskQueue = [];
  }

  getStats(): { totalWorkers: number; busyWorkers: number; queuedTasks: number } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queuedTasks: this.taskQueue.length,
    };
  }
}

export default getSingletonInstance(() => new WorkerPool());
