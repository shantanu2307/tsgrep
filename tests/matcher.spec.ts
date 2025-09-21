import { scanForMatches, QueryNode } from '../src/matcher';
import * as fs from 'fs';
import * as path from 'path';

function writeTempFile(content: string): string {
  const filePath = path.join(__dirname, 'temp.ts');
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

function removeTempFile(filePath: string) {
  fs.unlinkSync(filePath);
}

describe('scanForMatches', () => {
  it('should match simple identifier', () => {
    const code = `const foo = 123;`;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: 'foo' },
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(1);
    removeTempFile(file);
  });

  it('should match nested child', () => {
    const code = `
      function add(a: number, b: number) {
        return a + b;
      }
    `;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'FunctionDeclaration',
      child: { type: 'ReturnStatement' },
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(1);

    removeTempFile(file);
  });

  it('should match regex for identifier', () => {
    const code = `
      const getValue = 5;
      const setValue = 10;
    `;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: /^get/ },
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(1);
    removeTempFile(file);
  });

  it('should return empty array if no matches', () => {
    const code = `const foo = 1;`;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'VariableDeclarator',
      id: { type: 'Identifier', name: 'bar' },
    };

    const matches = scanForMatches(file, query);
    expect(matches).toEqual([]);

    removeTempFile(file);
  });

  it('should match nodes where a property is an array', () => {
    const code = `const a = 1, b = 2;`;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'VariableDeclaration',
      declarations: [
        { type: 'VariableDeclarator', id: { name: 'a' } },
        { type: 'VariableDeclarator', id: { name: 'b' } },
      ],
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(1); // should match the single VariableDeclaration
    removeTempFile(file);
  });

  it('should match async function declaration using non-string property', () => {
    const code = `
      async function fetchData() {
        return 42;
      }
    `;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'FunctionDeclaration',
      async: 'true', // this triggers actual=String(actual)
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(1);
    removeTempFile(file);
  });

  it('should match correct CallExpression in if block', () => {
    const code = `
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
    `;
    const file = writeTempFile(code);

    const query: QueryNode = {
      type: 'IfStatement',
      child: {
        type: 'CallExpression',
        callee: {
          name: 'triggerAlert',
        },
      },
    };

    const matches = scanForMatches(file, query);
    expect(matches.length).toBe(2);
    removeTempFile(file);
  });
});
