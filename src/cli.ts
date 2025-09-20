#!/usr/bin/env node

// libs
import path from "path";
import { Command } from "commander";
import fg from "fast-glob";

// utils
import { scanForMatches } from "./matcher";

// CLI definition
const program = new Command();

program
  .name("ts-grep")
  .description("Search TypeScript/JavaScript code with AST Expressions")
  .argument("<expression>", "query expression")
  .argument("[directory]", "directory to search", ".")
  .option(
    "-i, --ignore <patterns...>",
    "glob patterns to ignore (e.g. '**/node_modules/**' '**/dist/**')",
    ["**/node_modules/**", "**/dist/**"]
  )
  .option("-e, --ext <extensions...>", "file extensions to include", [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
  ])
  .action(async (expression: string, directory: string, options: any) => {
    let query: any;
    try {
      // @ts-ignore -- This will be created when npm run build is run. 
      const { parse } = await import('./parser');
      query = parse(expression);
    } catch (err: any) {
      console.error("Failed to parse expression:", err.message);
      process.exit(1);
    }

    const exts = options.ext.map((ext: string) =>
      ext.startsWith(".") ? ext : "." + ext
    );

    const pattern = exts.map((ext: string) =>
      path.join(directory, `**/*${ext}`)
    );

    const files = await fg(pattern, {
      ignore: options.ignore,
      onlyFiles: true,
      absolute: true,
      dot: false, // skip dotfiles unless explicitly asked
    });

    console.log(`🔍 Scanning ${files.length} files under ${directory}`);
    const matches = new Set<string>();
    files.forEach((file) => {
      const match = scanForMatches(file, query);
      match.forEach((m) => {
        matches.add(m);
      });
    });
    // Print results in a clean, readable format
    if (matches.size === 0) {
      console.log("🔍 No matches found.");
    } else {
      console.log(`\n📋 Found ${matches.size} match(es):`);
      console.log("─".repeat(50));

      // Sort matches for better readability (by filename then line number)
      const sortedMatches = Array.from(matches).sort((a, b) => {
        const [fileA, lineA] = a.split(":");
        const [fileB, lineB] = b.split(":");
        return fileA.localeCompare(fileB) || parseInt(lineA) - parseInt(lineB);
      });

      sortedMatches.forEach((match) => {
        console.log(`${match}`);
      });

      console.log("─".repeat(50));
    }
  });

program.parse(process.argv);
