// libs
import path from 'path';
import fs from 'fs/promises';
import fg from 'fast-glob';
import os from 'os';
import ignore from 'ignore';

// singleton classes
import getWorkerPool from './workerPool';
import getQueryCache from './queryCache';
import getSearchManager from './searchManager';

// types
import type { QueryNode, SearchResult } from './matcher';

export interface SearchOptions {
  ignore?: string[];
  ext?: string[];
  gitignore?: boolean; // default true
  batchSize?: number;
  onProgress?: (results: SearchResult[]) => void;
  interval?: number;
}

const DEFAULT_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function normalizeExtensions(exts: string[]): string[] {
  return exts.map(ext => (ext.startsWith('.') ? ext : `.${ext}`));
}

function createIgnoreFilter(patterns: string[]): (file: string) => boolean {
  const ig = ignore().add(patterns);
  return (file: string) => !ig.ignores(file);
}

async function loadGitignore(directory: string): Promise<string[]> {
  try {
    const gitignorePath = path.join(directory, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf8');

    return content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#');
      })
      .map(pattern => {
        if (pattern.startsWith('!')) {
          return '!' + pattern.slice(1).trim();
        }
        return pattern.trim();
      });
  } catch {
    return [];
  }
}

async function findFilesInDirectory(
  directory: string,
  exts: string[],
  ignorePatterns: string[],
  useGitignore: boolean
): Promise<string[]> {
  const patterns = exts.map(ext => path.join(directory, `**/*${ext}`));

  const files = await fg(patterns, {
    ignore: ignorePatterns,
    onlyFiles: true,
    absolute: true,
    dot: false,
    caseSensitiveMatch: false,
    followSymbolicLinks: false,
  });

  // Additional filtering for gitignore patterns that need relative path checking
  if (useGitignore) {
    const gitignorePatterns = await loadGitignore(directory);
    if (gitignorePatterns.length > 0) {
      const filter = createIgnoreFilter(gitignorePatterns);
      return files.filter(file => {
        const relativePath = path.relative(directory, file);
        const fileName = path.basename(file);
        return filter(relativePath) && filter(fileName);
      });
    }
  }

  return files;
}

function createFileBatches(files: string[], batchSize: number): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < files.length; i += batchSize) {
    batches.push(files.slice(i, i + batchSize));
  }
  return batches;
}

function calculateOptimalBatchSize(fileCount: number, maxWorkers: number): number {
  const minBatchSize = 10;
  const maxBatchSize = 100;
  const targetBatchesPerWorker = 4;

  const idealBatchSize = Math.ceil(fileCount / (maxWorkers * targetBatchesPerWorker));
  return Math.max(minBatchSize, Math.min(idealBatchSize, maxBatchSize));
}

async function getMatches(
  files: string[],
  query: QueryNode,
  options: {
    maxWorkers: number;
    batchSize?: number;
  }
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  let batchSize = calculateOptimalBatchSize(files.length, options.maxWorkers);
  if (options.batchSize && options.batchSize > 0) {
    batchSize = Math.floor(options.batchSize);
  }
  const batches = createFileBatches(files, batchSize);
  const workerPool = getWorkerPool();
  const searchManager = getSearchManager();
  try {
    workerPool.setOnBatchResults((batch: SearchResult[]) => {
      searchManager.addBatchResults(batch);
    });
    await workerPool.processBatches(batches, query);
    workerPool.setOnBatchResults(undefined);
  } catch (error) {
    console.log(error);
  }
}

export async function search(
  expression: string,
  directories: string[] = ['.'],
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const queryCache = getQueryCache();
  const query = queryCache.parseQuery(expression);

  // Normalize options
  const exts = normalizeExtensions(options.ext ?? DEFAULT_EXTS);
  const ignorePatterns = options.ignore ?? [];
  const useGitignore = options.gitignore !== false; // default true
  const maxWorkers = Math.max(1, os.cpus().length - 1);
  const progressInterval = options.interval ?? 5000; // 5 seconds
  const searchManager = getSearchManager();
  searchManager.setOnProgress(options.onProgress);
  searchManager.setInterval(progressInterval);

  try {
    searchManager.startProgressReporting();
    const filePromises = directories.map(directory =>
      findFilesInDirectory(directory, exts, ignorePatterns, useGitignore)
    );
    const fileArrays = await Promise.all(filePromises);
    const allFiles = Array.from(new Set(fileArrays.flat()));
    if (allFiles.length === 0) {
      return [];
    }
    await getMatches(allFiles, query, {
      maxWorkers,
      batchSize: options.batchSize,
    });
    searchManager.flushProgress();
    const results = searchManager.progressAccumulator.slice();
    return results;
  } catch (error) {
    console.log(error);
    const results = searchManager.progressAccumulator.slice();
    return results;
  } finally {
    searchManager.stopProgressReporting();
  }
}
