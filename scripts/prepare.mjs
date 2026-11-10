import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public', { recursive: true });
await copyFile('LICENSE', 'public/license.txt');
await mkdir('public/wasm', { recursive: true });
await copyFile('node_modules/sql.js/dist/sql-wasm.wasm', 'public/wasm/sql-wasm.wasm');
