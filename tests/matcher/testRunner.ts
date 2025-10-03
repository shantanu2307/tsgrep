// libs
import fs from 'fs';
import path from 'path';

// utils
import { scanForMatches } from '../../src/matcher';

// types
import type { MatcherTestCase } from './testCases';

function writeTempFile(content: string): string {
  const filePath = path.join(__dirname, 'temp.ts');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function removeTempFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export async function runMatcherTestCase(tc: MatcherTestCase) {
  const file = writeTempFile(tc.code);
  try {
    const matches = scanForMatches(file, tc.query);
    expect(matches.length).toBe(tc.expectedMatches);
  } finally {
    removeTempFile(file);
  }
}
