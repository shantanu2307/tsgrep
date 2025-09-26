import { compose, parseRegexInQuery, getSingletonInstance } from './utils';
import { parse } from './parser';
import type { QueryNode } from './matcher';

interface CacheEntry {
  query: QueryNode;
  timestamp: number;
  hitCount: number;
}

export class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private maxAge: number; // in milliseconds
  private parser: (expression: string) => QueryNode;

  constructor(maxSize = 100, maxAge = 24 * 60 * 60 * 1000) {
    // 24 hours default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.parser = compose(parseRegexInQuery, parse);
  }

  private normalizeExpression(expression: string): string {
    return expression.replace(/\s+/g, '').trim();
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    if (this.cache.size < this.maxSize) return;

    // Find the least recently used entry
    let oldestKey = '';
    let oldestTime = Date.now();
    let lowestHitCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize by hit count first, then by timestamp
      if (entry.hitCount < lowestHitCount || (entry.hitCount === lowestHitCount && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHitCount = entry.hitCount;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  parseQuery(expression: string): QueryNode {
    const normalizedExpression = this.normalizeExpression(expression);

    // Check cache first
    const cached = this.cache.get(normalizedExpression);
    if (cached && !this.isExpired(cached)) {
      cached.hitCount++;
      return cached.query;
    }

    // Parse the query
    let query: QueryNode;
    try {
      query = this.parser(normalizedExpression);
    } catch (err: any) {
      throw new Error(`Failed to parse expression: ${err.message}`);
    }

    // Evict expired entries before adding new one
    this.evictExpired();

    // Add to cache
    this.cache.set(normalizedExpression, {
      query,
      timestamp: Date.now(),
      hitCount: 1,
    });

    // Evict LRU if cache is full
    this.evictLRU();

    return query;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    entries: Array<{ expression: string; hits: number; age: number }>;
  } {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0);
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate:
        totalHits > 0 ? Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hitCount, 0) / totalHits : 0,
      totalHits,
      entries: Array.from(this.cache.entries()).map(([expression, entry]) => ({
        expression,
        hits: entry.hitCount,
        age: now - entry.timestamp,
      })),
    };
  }
}

export default getSingletonInstance(() => new QueryCache());
