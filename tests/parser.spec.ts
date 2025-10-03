import { cleanup } from '../dist';
import getQueryCache from '../src/queryCache';

export const TEST_CASES = [
  // A simple selector for a node type
  {
    input: 'CallExpression',
    expectedOutput: {
      type: 'CallExpression',
    },
  },
  // A selector with a string attribute
  {
    input: 'Identifier[name="foo"]',
    expectedOutput: {
      type: 'Identifier',
      name: 'foo',
    },
  },
  // A selector with a number attribute
  {
    input: 'Literal[value="123"]',
    expectedOutput: {
      type: 'Literal',
      value: '123',
    },
  },
  // A selector with a boolean attribute
  {
    input: 'UnaryExpression[prefix="true"]',
    expectedOutput: {
      type: 'UnaryExpression',
      prefix: 'true',
    },
  },
  // A selector with a null attribute
  {
    input: 'Literal[value="null"]',
    expectedOutput: {
      type: 'Literal',
      value: 'null',
    },
  },
  // A selector with a simple array of primitives
  {
    input: 'ArrayExpression[elements=["a", "b", "c"]]',
    expectedOutput: {
      type: 'ArrayExpression',
      elements: ['a', 'b', 'c'],
    },
  },
  // A selector with a nested object attribute
  {
    input: 'MemberExpression[property.name="bar"]',
    expectedOutput: {
      type: 'MemberExpression',
      property: {
        name: 'bar',
      },
    },
  },
  // A selector with a nested array of selectors
  {
    input: 'CallExpression[arguments=[Identifier, Literal]]',
    expectedOutput: {
      type: 'CallExpression',
      arguments: [{ type: 'Identifier' }, { type: 'Literal' }],
    },
  },
  // A selector with multiple attributes of different types
  {
    input: 'FunctionDeclaration[id.name="myFunc", async="true"]',
    expectedOutput: {
      type: 'FunctionDeclaration',
      id: { name: 'myFunc' },
      async: 'true',
    },
  },
  // A selector with a child selector
  {
    input: 'BlockStatement > ReturnStatement',
    expectedOutput: {
      type: 'BlockStatement',
      child: {
        type: 'ReturnStatement',
      },
    },
  },
  // A selector with a deeply nested child selector
  {
    input: 'Program > FunctionDeclaration > BlockStatement > ReturnStatement',
    expectedOutput: {
      type: 'Program',
      child: {
        type: 'FunctionDeclaration',
        child: {
          type: 'BlockStatement',
          child: {
            type: 'ReturnStatement',
          },
        },
      },
    },
  },
  // An empty selector with attributes (matches any node with the specified attributes)
  {
    input: '[async="true"]',
    expectedOutput: {
      async: 'true',
    },
  },
  // A selector with single-quoted string
  {
    input: "Identifier[name='bar']",
    expectedOutput: {
      type: 'Identifier',
      name: 'bar',
    },
  },
  // A complex case combining multiple features
  {
    input: 'CallExpression[callee.name="log", async="false", arguments=[Literal, Identifier[name="myVar"]]]',
    expectedOutput: {
      type: 'CallExpression',
      callee: { name: 'log' },
      async: 'false',
      arguments: [{ type: 'Literal' }, { type: 'Identifier', name: 'myVar' }],
    },
  },
  // Selector with whitespace
  {
    input: '     CallExpression [ async="true" ] ',
    expectedOutput: {
      type: 'CallExpression',
      async: 'true',
    },
  },
];

describe('parser.js', () => {
  afterAll(cleanup);
  const queryCache = getQueryCache();
  TEST_CASES.forEach(({ input, expectedOutput }) => {
    it(`should create correct query for input:${input}`, async () => {
      const output = queryCache.parseQuery(input);
      expect(output).toEqual(expectedOutput);
    });
  });
});
