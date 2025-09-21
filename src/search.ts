// src/search.ts

import path from 'path';
import fs from 'fs';
import fg from 'fast-glob';
import ignore from 'ignore';

import { scanForMatches, SearchResult } from './matcher';
import { compose, parseRegexInQuery } from './utils';

export interface SearchOptions {
  ignore?: string[];
  ext?: string[];
  gitignore?: boolean; // default true
}

export async function search(
  expression: string,
  directory: string = '.',
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
  const pattern = exts.map(ext => path.join(directory, `**/*${ext}`));

  // Load .gitignore rules (default: true)
  let ig: ReturnType<typeof ignore> | null = null;
  if (options.gitignore) {
    const gitignorePath = path.join(directory, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      ig = ignore().add(gitignoreContent.split('\n'));
    }
  }

  let files = await fg(pattern, {
    ignore: options.ignore ?? [],
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  // Filter using .gitignore
  if (ig) {
    files = files.filter(file => !ig!.ignores(path.relative(directory, file)));
  }

  // Run matcher
  const matches = new Set<SearchResult>();
  files.forEach(file => {
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
