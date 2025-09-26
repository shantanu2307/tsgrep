// libs
import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import os from 'os';
import ignore from 'ignore';
import _uniqBy from 'lodash/uniqBy';

// worker pool
import getWorkerPool from './workerPool';

// query cache
import getQueryCache from './queryCache';

// types
import type { QueryNode, SearchResult } from './matcher';

export interface SearchOptions {
  ignore?: string[];
  ext?: string[];
  gitignore?: boolean; // default true
}

const getMatches = async (files: Set<string>, query: QueryNode): Promise<SearchResult[]> => {
  const maxWorkers = Math.max(1, os.cpus().length - 1);
  const fileList = Array.from(files);

  // Create batches for parallel processing
  const batchSize = Math.ceil(fileList.length / maxWorkers);
  const batches: string[][] = [];

  for (let i = 0; i < fileList.length; i += batchSize) {
    batches.push(fileList.slice(i, i + batchSize));
  }

  const workerPool = getWorkerPool();
  // Use worker pool for processing
  const results = await workerPool.processBatches(batches, query);
  return results;
};

export async function search(
  expression: string,
  directories: string[] = ['.'],
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const queryCache = getQueryCache();
  const query = queryCache.parseQuery(expression);

  // Normalize extensions
  const exts = (options.ext ?? ['.ts', '.tsx', '.js', '.jsx']).map(ext => (ext.startsWith('.') ? ext : '.' + ext));

  const allFiles = new Set<string>();

  const tasks = directories.map(async directory => {
    const pattern = exts.map(ext => path.join(directory, `**/*${ext}`));
    const ig = ignore();

    if (options.gitignore) {
      const gitignorePath = path.join(directory, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const gitignorePatterns = gitignoreContent
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

        ig.add(gitignorePatterns);
      }
    }

    const files = await fg(pattern, {
      ignore: options.ignore ?? [],
      onlyFiles: true,
      absolute: true,
      dot: false,
    });

    const finalSetOfFiles = files.filter(file => {
      const relativePath = path.relative(directory, file);
      // For root-level patterns, also check the filename alone
      const fileName = path.basename(file);
      return !ig.ignores(relativePath) && !ig.ignores(fileName);
    });

    return finalSetOfFiles;
  });

  const results = await Promise.all(tasks);
  results.flat().forEach(file => allFiles.add(file));

  const matches = await getMatches(allFiles, query);
  const dedupedMatches: SearchResult[] = _uniqBy(matches, match => `${match.file}:${match.line}`);
  return dedupedMatches.sort((a, b) => {
    const fileA = a.file;
    const fileB = b.file;
    const lineA = a.line;
    const lineB = b.line;
    return fileA.localeCompare(fileB) || lineA - lineB;
  });
}
