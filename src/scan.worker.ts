import { parentPort } from 'worker_threads';
import { scanForMatches, SearchResult } from './matcher';

parentPort?.on('message', msg => {
  const files = msg.files;
  const query = msg.query;
  try {
    const allResults: SearchResult[] = [];
    for (const file of files) {
      const result = scanForMatches(file, query);
      allResults.push(...result);
    }
    parentPort?.postMessage({ results: allResults });
  } catch (err) {
    console.log(err);
    parentPort?.postMessage({ results: [] });
  }
});
