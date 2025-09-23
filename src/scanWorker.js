import { parentPort, workerData } from 'worker_threads';
import { scanForMatches } from './matcher';

const { files, query } = workerData ?? {};

const main = () => {
  try {
    const allResults = [];
    for (const file of files) {
      const result = scanForMatches(file, query);
      allResults.push(...result);
    }
    parentPort?.postMessage({ results: allResults });
  } catch (err) {
    console.log(err);
    parentPort?.postMessage({ results: [] });
  }
};

main();
