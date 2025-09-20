import { parseRegexInQuery } from '../src/utils';

describe('parseRegexInQuery', () => {
  it('should convert a regex string to a RegExp object', () => {
    const input = '/^get/i';
    const result = parseRegexInQuery(input);
    expect(result).toBeInstanceOf(RegExp);
    expect(result!.source).toBe('^get');
    expect(result!.flags).toBe('i');
  });

  it('should leave normal strings unchanged', () => {
    const input = 'normalString';
    const result = parseRegexInQuery(input);
    expect(result).toBe('normalString');
  });

  it('should recursively convert regex strings in objects', () => {
    const input = {
      name: '/^get/',
      nested: {
        prop: '/foo/g',
        other: 'bar',
      },
    };
    const result = parseRegexInQuery(input);
    expect(result.name).toBeInstanceOf(RegExp);
    expect(result.name.source).toBe('^get');

    expect(result.nested.prop).toBeInstanceOf(RegExp);
    expect(result.nested.prop.source).toBe('foo');
    expect(result.nested.prop.flags).toBe('g');

    expect(result.nested.other).toBe('bar');
  });

  it('should recursively convert regex strings in arrays', () => {
    const input = ['/a/', '/b/i', 'c'];
    const result = parseRegexInQuery(input);

    expect(result[0]).toBeInstanceOf(RegExp);
    expect(result[0].source).toBe('a');

    expect(result[1]).toBeInstanceOf(RegExp);
    expect(result[1].source).toBe('b');
    expect(result[1].flags).toBe('i');

    expect(result[2]).toBe('c');
  });

  it('should return other primitive types as-is', () => {
    expect(parseRegexInQuery(123)).toBe(123);
    expect(parseRegexInQuery(true)).toBe(true);
    expect(parseRegexInQuery(null)).toBe(null);
    expect(parseRegexInQuery(undefined)).toBe(undefined);
  });

  it('should handle deeply nested combinations', () => {
    const input = {
      arr: [{ name: '/foo/' }, { nested: { val: '/bar/i' } }, 'string'],
    };
    const result = parseRegexInQuery(input);

    expect(result.arr[0].name).toBeInstanceOf(RegExp);
    expect(result.arr[0].name.source).toBe('foo');

    expect(result.arr[1].nested.val).toBeInstanceOf(RegExp);
    expect(result.arr[1].nested.val.source).toBe('bar');
    expect(result.arr[1].nested.val.flags).toBe('i');

    expect(result.arr[2]).toBe('string');
  });
});
