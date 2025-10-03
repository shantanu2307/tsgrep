import type { QueryNode } from '../../src/matcher';

export interface MatcherTestCase {
  name: string;
  code: string;
  query: QueryNode;
  expectedMatches: number;
}

export const TEST_CASES: MatcherTestCase[] = [
  {
    name: 'should match simple identifier',
    code: `const foo = 123;`,
    query: {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: 'foo' },
    },
    expectedMatches: 1,
  },
  {
    name: 'should match nested child',
    code: `
      function add(a: number, b: number) {
        return a + b;
      }
    `,
    query: {
      type: 'FunctionDeclaration',
      child: { type: 'ReturnStatement' },
    },
    expectedMatches: 1,
  },
  {
    name: 'should match regex for identifier',
    code: `
      const getValue = 5;
      const setValue = 10;
    `,
    query: {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: /^get/ },
    },
    expectedMatches: 1,
  },
  {
    name: 'should return empty array if no matches',
    code: `const foo = 1;`,
    query: {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: 'bar' },
    },
    expectedMatches: 0,
  },
  {
    name: 'should match nodes where a property is an array',
    code: `const a = 1, b = 2;`,
    query: {
      type: 'VariableDeclaration',
      declarations: [
        { type: 'VariableDeclarator', id: { name: 'a' } },
        { type: 'VariableDeclarator', id: { name: 'b' } },
      ],
    },
    expectedMatches: 1,
  },
  {
    name: 'should match async function declaration using non-string property',
    code: `
      async function fetchData() {
        return 42;
      }
    `,
    query: {
      type: 'FunctionDeclaration',
      async: 'true', // will be coerced to string internally
    },
    expectedMatches: 1,
  },
  {
    name: 'should match correct CallExpression in if block',
    code: `
     if(num>5){
	      switch(num){
          case 6:{
      	      triggerAlert(); 
            }
            default:
        }
        trigger();
      }
      if(num<4){
        triggerAlert();
      }
    `,
    query: {
      type: 'IfStatement',
      child: {
        type: 'CallExpression',
        callee: { name: 'triggerAlert' },
      },
    },
    expectedMatches: 2,
  },
];
