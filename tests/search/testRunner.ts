//libs
import path from 'path';
import fs from 'fs';

// utils
import { search, SearchResult } from '../../dist';

// constants
import { STRESS_DIR } from '../../src/constants';

export interface TestRunnerOptions {
  name: string;
  numberOfFiles: number;
  callsPerFile: number;
  expression: string;
  expectedMatches: number;
  skip?: boolean;
  interval?: number;
  getContent: (callsPerFile: number) => string;
  debugChunk?: (chunk: SearchResult[]) => void;
}

export async function testRunner({
  numberOfFiles,
  callsPerFile,
  expression,
  interval = 10,
  getContent,
  expectedMatches,
  debugChunk,
}: TestRunnerOptions): Promise<void> {
  const content = getContent(callsPerFile);
  for (let i = 0; i < numberOfFiles; i++) {
    const f = path.join(STRESS_DIR, `file_${i}.ts`);
    fs.writeFileSync(f, content, 'utf-8');
  }
  const start = Date.now();
  let matches = 0;
  await search(
    expression,
    chunk => {
      debugChunk?.(chunk);
      matches += chunk.length;
    },
    { gitignore: true, directories: [STRESS_DIR], interval }
  );
  const durationMs = Date.now() - start;
  console.log(`Found ${matches} ${expression} in ${durationMs} ms across ${numberOfFiles} files.`);
  expect(matches).toBe(expectedMatches);
}
