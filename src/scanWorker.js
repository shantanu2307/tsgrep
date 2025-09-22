import { parentPort, workerData } from 'worker_threads';
import { scanForMatches } from './matcher';

const { files, query } = workerData ?? {};

async function main() {
  try {
    const allResults = [];

    for (const file of files) {
      const result = await scanForMatches(file, query);
      allResults.push(...result);
    }
    parentPort?.postMessage({ results: allResults });
  } catch (err) {
    parentPort?.postMessage({ results: [] });
  }
}

main();
