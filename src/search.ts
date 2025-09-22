// src/search.ts

import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';

import { scanForMatches, SearchResult } from './matcher';
import { compose, parseRegexInQuery } from './utils';

export interface SearchOptions {
  ignore?: string[];
  ext?: string[];
  gitignore?: boolean; // default true
}

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

  // Run matcher
  const matches = new Set<SearchResult>();
  Array.from(allFiles).forEach(file => {
    const result = scanForMatches(file, query);
    result.forEach(m => matches.add(m));
  });

  // Return sorted results
  return Array.from(matches).sort((a, b) => {
    const fileA = a.file;
    const fileB = b.file;
    const lineA = a.line;
    const lineB = b.line;
    return fileA.localeCompare(fileB) || lineA - lineB;
  });
}
