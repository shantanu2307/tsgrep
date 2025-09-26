// utils
import { getSingletonInstance } from './utils';

// types
import type { SearchResult } from './matcher';

class SearchManager {
  private progressAccumulator: SearchResult[] = [];
  private seenMatches = new Set<string>();
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private onProgress?: (results: SearchResult[]) => void,
    private interval: number = 10000
  ) {}

  startProgressReporting() {
    if (!this.onProgress) return;

    this.timer = setInterval(() => {
      if (this.progressAccumulator.length > 0) {
        try {
          this.onProgress?.(this.progressAccumulator.slice());
        } catch {
          // ignore consumer errors
        }
        this.progressAccumulator.length = 0;
      }
    }, this.interval);
  }

  stopProgressReporting() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  addBatchResults(batch: SearchResult[]) {
    for (const match of batch) {
      const key = this.getMatchKey(match);
      if (!this.seenMatches.has(key)) {
        this.seenMatches.add(key);
        this.progressAccumulator.push(match);
      }
    }
  }

  flushProgress() {
    if (this.progressAccumulator.length > 0) {
      try {
        this.onProgress?.(this.progressAccumulator.slice());
      } catch {
        /* noop */
      }
      this.progressAccumulator.length = 0;
    }
  }

  setOnProgress(onProgress?: (results: SearchResult[]) => void) {
    this.onProgress = onProgress;
  }

  setInterval(interval: number | undefined = 10000) {
    this.interval = interval;
  }

  cancel() {
    this.stopProgressReporting();
    this.progressAccumulator.length = 0;
    this.seenMatches.clear();
  }

  private getMatchKey(match: SearchResult): string {
    return `${match.file}:${match.line}`;
  }
}

const getSearchManager = getSingletonInstance(() => new SearchManager());

export default getSearchManager;
