// libs
import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import os from 'os';

// worker class
import { Worker } from 'worker_threads';

// utils
import { compose, parseRegexInQuery } from './utils';

// types
import type { QueryNode, SearchResult } from './matcher';

export interface SearchOptions {
  ignore?: string[];
  ext?: string[];
  gitignore?: boolean; // default true
}

const workerPath = path.resolve(__dirname, './scanWorker.js');

const getMatches = async (files: Set<string>, query: QueryNode): Promise<SearchResult[]> => {
  const maxWorkers = Math.max(1, os.cpus().length - 1);
  const matches: Set<SearchResult> = new Set<SearchResult>();

  const fileList = Array.from(files);

  const batchSize = Math.ceil(fileList.length / maxWorkers);
  const batches: string[][] = [];

  for (let i = 0; i < fileList.length; i += batchSize) {
    batches.push(fileList.slice(i, i + batchSize));
  }

  const workerPromises = batches.map(batch => {
    return new Promise<void>((resolve, reject) => {
      const worker = new Worker(workerPath, { workerData: { files: batch, query } });

      worker.on('message', ({ results }) => {
        results.forEach((m: SearchResult) => matches.add(m));
      });

      worker.on('error', reject);

      worker.on('exit', code => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        else resolve();
      });
    });
  });
  await Promise.all(workerPromises);
  return Array.from(matches);
};

export async function search(
  expression: string,
  directories: string[] = ['.'],
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  let query: any;
  try {
    // @ts-ignore -- parser built at runtime
    const { parse } = await import('./parser');
    const composedParser = compose(parseRegexInQuery, parse);
    query = composedParser(expression.replace(/\s/g, ''));
  } catch (err: any) {
    throw new Error(`Failed to parse expression: ${err.message}`);
  }
  // Normalize extensions
  const exts = (options.ext ?? ['.ts', '.tsx', '.js', '.jsx']).map(ext => (ext.startsWith('.') ? ext : '.' + ext));

  const allFiles = new Set<string>();

  const tasks = directories.map(async directory => {
    const pattern = exts.map(ext => path.join(directory, `**/*${ext}`));

    let gitignoreRules: string[] = [];
    if (options.gitignore) {
      const gitignorePath = path.join(directory, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        gitignoreRules.push(...gitignoreContent.split('\n').filter(Boolean));
      }
    }

    let files = await fg(pattern, {
      ignore: [...(options.ignore ?? []), ...gitignoreRules],
      onlyFiles: true,
      absolute: true,
      dot: false,
    });

    return files;
  });

  const results = await Promise.all(tasks);
  results.flat().forEach(file => allFiles.add(file));

  const matches = await getMatches(allFiles, query);

  return matches.sort((a, b) => {
    const fileA = a.file;
    const fileB = b.file;
    const lineA = a.line;
    const lineB = b.line;
    return fileA.localeCompare(fileB) || lineA - lineB;
  });
}
