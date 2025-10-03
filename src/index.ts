import getQueryCache from './queryCache';
import getWorkerPool from './workerPool';

export const cleanup = (printStats: boolean = false): void => {
  const workerPool = getWorkerPool();
  const queryCache = getQueryCache();

  if (printStats) {
    console.log(workerPool.getStats());
    console.log(queryCache.getStats());
  }

  workerPool.destroy();
  queryCache.clear();
};
export { search } from './search';
export type { SearchResult } from './matcher';
