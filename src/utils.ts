// Compose multiple functions: compose(f, g, h)(x) => f(g(h(x)))
export function compose<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T): T => fns.reduceRight((acc, fn) => fn(acc), arg);
}

export function parseRegexInQuery(query: any): any {
  if (typeof query === 'string') {
    // detect strings like "/pattern/flags"
    const regexMatch = query.match(/^\/(.+)\/([gimsuy]*)$/);
    if (regexMatch) {
      return new RegExp(regexMatch[1], regexMatch[2]);
    }
    return query;
  }

  if (Array.isArray(query)) {
    return query.map(parseRegexInQuery);
  }

  if (typeof query === 'object' && query !== null) {
    const result: any = {};
    for (const key of Object.keys(query)) {
      result[key] = parseRegexInQuery(query[key]);
    }
    return result;
  }

  return query;
}
