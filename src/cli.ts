#!/usr/bin/env node

// libs
import { Command } from 'commander';
import { search } from './search';

// CLI definition
const program = new Command();

program
  .name('ts-grep')
  .description('Search TypeScript/JavaScript code with AST Expressions')
  .argument('<expression>', 'query expression')
  .argument('[directory]', 'directory to search', '.')
  .option('-i, --ignore <patterns...>', "glob patterns to ignore (e.g. '**/node_modules/**' '**/dist/**')", [])
  .option('-e, --ext <extensions...>', 'file extensions to include', ['.ts', '.tsx', '.js', '.jsx'])
  .option('--no-gitignore', 'do not respect .gitignore rules')
  .action(async (expression: string, directory: string, options: any) => {
    try {
      const matches = await search(expression, directory, {
        ignore: options.ignore,
        ext: options.ext,
        gitignore: options.gitignore,
      });

      console.log(`🔍 Scanning in ${directory}`);

      if (matches.length === 0) {
        console.log('🔍 No matches found.');
      } else {
        console.log(`\n📋 Found ${matches.length} match(es):`);
        console.log('─'.repeat(50));
        matches.forEach(m => console.log(m));
        console.log('─'.repeat(50));
      }
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
