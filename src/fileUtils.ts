import path from 'path';
import fs from 'fs';

export function rimrafDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.lstatSync(full);
    if (stat.isDirectory()) rimrafDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
