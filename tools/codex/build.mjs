import { build } from 'esbuild'
await build({ tsconfig: 'tsconfig.codex.json', entryPoints: ['extensions/codex/extension.ts'], outfile: 'dist/extension.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node20', external: ['vscode'] })
await build({ tsconfig: 'tsconfig.codex.json', entryPoints: ['extensions/codex/webview.ts'], outfile: 'dist/webview.js', bundle: true, platform: 'browser', target: 'es2022' })
await build({ tsconfig: 'tsconfig.codex.json', entryPoints: ['extensions/codex/hook-entry.ts'], outfile: 'dist/hook.cjs', bundle: true, platform: 'node', format: 'cjs', target: 'node20' })
await build({ tsconfig: 'tsconfig.codex.json', entryPoints: ['extensions/codex/mcp-entry.ts'], outfile: 'dist/mcp.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node20', banner: { js: "import { createRequire as pixelPetRequire } from 'node:module'; const require = pixelPetRequire(import.meta.url);" } })
