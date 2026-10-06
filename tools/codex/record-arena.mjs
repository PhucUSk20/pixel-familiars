import { build } from 'esbuild'
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { spawnSync } from 'node:child_process'
import { join, relative, resolve, isAbsolute } from 'node:path'
import { tmpdir } from 'node:os'
import { checkArena } from './arena-smoke.mjs'

const temporary = await mkdtemp(join(tmpdir(), 'familiars-arena-'))
const bundle = await build({ entryPoints: ['extensions/codex/arena.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vscode'] })
const host = { exports: {} }, require = createRequire(import.meta.url)
runInNewContext(bundle.outputFiles[0].text, { module: host, exports: host.exports, require: name => name === 'vscode' ? {} : require(name) })
let html, browser
const server = createServer(async (request, response) => {
  const files = { ...Object.fromEntries(['normal','attack','defense','speed'].map(form=>[`/deoxys-${form}.png`,[`extensions/codex/deoxys-${form}-128px-atlas.png`,'image/png']])), '/arena.js': ['dist/arena.js', 'text/javascript'], '/kyogre.png': ['extensions/codex/kyogre-primal-128px-atlas.png', 'image/png'], '/ray.png': ['extensions/codex/legendary-128px-atlas.png', 'image/png'], '/ground.png': ['extensions/codex/groudon-primal-128px-atlas.png', 'image/png'] }
  try {
    if (files[request.url]) { const [path, type] = files[request.url]; response.setHeader('Content-Type', type); response.end(await readFile(path)) }
    else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
  } catch { response.writeHead(500); response.end('Asset unavailable') }
})
try {
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${server.address().port}`
  html = host.exports.arenaHtml(`${url}/arena.js`, `${url}/ray.png`, `${url}/ground.png`, url, 'recordarena', `${url}/kyogre.png`, ['normal','attack','defense','speed'].map(form=>`${url}/deoxys-${form}.png`))
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  if (process.argv.includes('--check')) await checkArena(browser, url)
  const page = await browser.newPage({ viewport: { width: 720, height: 390 } })
  await page.addInitScript(() => { let seed = 42; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }; window.requestAnimationFrame = callback => { window.arenaTick = callback; return 1 } })
  await page.goto(url)
  await page.waitForFunction(() => document.querySelector('#arena')?.dataset.ready === 'true', undefined, { polling: 50 })
  const auto = process.argv.includes('--auto')
  if (!auto) await page.locator('button[data-mode="duel"]').click()
  const seen=new Set()
  for (let i = 0; i < (auto ? 450 : 850); i++) {
    await page.evaluate(({time, auto}) => { if (auto) window.arenaTick(time-100); window.arenaTick(time) }, { time: 1000 + i * (auto ? 200 : 100), auto })
    if(!auto && await page.locator('#arena').getAttribute('data-air-stage')==='fight') seen.add(await page.locator('#arena').getAttribute('data-air-turn'))
    await page.screenshot({ path: join(temporary, `${String(i).padStart(4, '0')}.png`) })
  }
  if(!auto&&seen.size!==4)throw new Error('Duel recording did not cover all four rounds')
  const filename=auto?'legendary-arena':'legendary-duel'
  const result = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', auto ? '5' : '10', '-i', join(temporary, '%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=240[p];[b][p]paletteuse=dither=none', '-loop', '0', `docs/images/${filename}.gif`], { windowsHide: true, stdio: 'inherit' })
  if (result.error || result.status !== 0) throw result.error ?? new Error('GIF encoding failed')
  await writeFile(`docs/images/${filename}.png`, await readFile(join(temporary, '0040.png')))
  console.log(`Recorded docs/images/${filename}.gif`)
} finally {
  await browser?.close(); await new Promise(done => server.close(done))
  const inside = relative(resolve(tmpdir()), resolve(temporary))
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unsafe cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
