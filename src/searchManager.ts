// utils
import { getSingletonInstance } from './utils';

// types
import type { SearchResult } from './matcher';

class SearchManager {
  private seenMatches = new Set<string>();
  private timer: NodeJS.Timeout | undefined;
  progressAccumulator: SearchResult[] = [];

  constructor(
    private onProgress?: (results: SearchResult[]) => void,
    private interval: number = 10000
  ) {}

  startProgressReporting() {
    if (!this.onProgress) return;
    this.timer = setInterval(() => {
      if (this.progressAccumulator.length > 0) {
        this.onProgress?.(this.progressAccumulator.slice());
      }
    }, this.interval);
  }

  stopProgressReporting() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.progressAccumulator = [];
    this.seenMatches.clear();
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
      this.onProgress?.(this.progressAccumulator.slice());
    }
  }

  setOnProgress(onProgress?: (results: SearchResult[]) => void) {
    this.onProgress = onProgress;
  }

  setInterval(interval: number | undefined = 10000) {
    this.interval = interval;
  }

  private getMatchKey(match: SearchResult): string {
    return `${match.file}:${match.line}`;
  }
}

const getSearchManager = getSingletonInstance(() => new SearchManager());

export default getSearchManager;
