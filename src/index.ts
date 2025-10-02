import getQueryCache from './queryCache';
import getWorkerPool from './workerPool';

export const cleanup = () => {
  const workerPool = getWorkerPool();
  const queryCache = getQueryCache();

  workerPool.destroy();
  queryCache.clear();
};
export { search } from './search';
export type { SearchResult } from './matcher';
