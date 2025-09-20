import fs from 'fs';
import { parse, ParserOptions } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const KEYS_TO_EXCLUDE = ['child', 'type'];

const PLUGINS: any = ['typescript', 'jsx', 'classProperties', 'decorators-legacy', 'objectRestSpread'];

const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  plugins: PLUGINS,
};

export interface QueryNode {
  type?: string;
  child?: QueryNode;
  [key: string]: unknown;
}

function isNode(value: unknown): value is t.Node {
  return typeof value === 'object' && value !== null && 'type' in value;
}

function matchNode(node: t.Node, query: QueryNode): boolean {
  if (query.type && node.type !== query.type) return false;

  for (const key of Object.keys(query)) {
    if (KEYS_TO_EXCLUDE.includes(key)) continue;

    const expected = query[key];
    let actual = (node as any)[key];

    if (expected instanceof RegExp) {
      return typeof actual === 'string' && expected.test(actual);
    }

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual) || expected.length > actual.length) return false;
      for (let i = 0; i < expected.length; i++) {
        if (!isNode(actual[i]) || !matchNode(actual[i], expected[i] as QueryNode)) return false;
      }
      continue;
    }

    if (typeof expected === 'object' && expected !== null) {
      if (!isNode(actual) || !matchNode(actual, expected as QueryNode)) return false;
      continue;
    }

    if (typeof actual !== 'string') {
      actual = String(actual);
    }

    if (actual !== expected) return false;
  }

  if (query.child) {
    if (!matchChild(node, query.child)) return false;
  }

  return true;
}

function matchChild(node: t.Node, query: QueryNode): boolean {
  if (!node || typeof node !== 'object') return false;

  for (const key of Object.keys(node)) {
    const value = (node as any)[key];
    if (Array.isArray(value)) {
      for (const v of value) {
        if (isNode(v) && (matchNode(v, query) || matchChild(v, query))) return true;
      }
    } else if (isNode(value)) {
      if (matchNode(value, query) || matchChild(value, query)) return true;
    }
  }

  return false;
}

export function scanForMatches(filePath: string, query: QueryNode): string[] {
  const source = fs.readFileSync(filePath, 'utf-8');

  try {
    const ast = parse(source, PARSER_OPTIONS);
    const matches: string[] = [];

    traverse(ast, {
      enter(path) {
        if (matchNode(path.node, query)) {
          const line = path.node.loc?.start?.line ?? 0;
          matches.push(`${filePath}:${line}`);
        }
      },
    });

    return matches;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}
