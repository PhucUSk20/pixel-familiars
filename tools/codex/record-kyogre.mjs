// Deterministic recording of the production Legendary renderer; no model calls.
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { spawnSync } from 'node:child_process'
import { join, resolve, relative, isAbsolute } from 'node:path'
import { tmpdir } from 'node:os'
import { checkKyogre } from './kyogre-smoke.mjs'

const root = resolve('.'), temporary = await mkdtemp(join(tmpdir(), 'kyogre-record-'))
const output = join(root, 'docs/images')
const bundle = await build({ entryPoints: ['extensions/codex/kyogre.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vscode'] })
const host = { exports: {} }, require = createRequire(import.meta.url)
runInNewContext(bundle.outputFiles[0].text, { module: host, exports: host.exports, require: name => name === 'vscode' ? {} : require(name) })
let html = ''
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/kyogre.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile('dist/kyogre.js')) }
    else if (request.url === '/atlas.png') { response.setHeader('Content-Type', 'image/png'); response.end(await readFile('extensions/codex/kyogre-primal-128px-atlas.png')) }
    else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
  } catch { response.statusCode = 500; response.end('Recording asset unavailable') }
})
let browser
try {
  await mkdir(output, { recursive: true })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${server.address().port}`
  html = host.exports.kyogreHtml(`${url}/kyogre.js`, `${url}/atlas.png`, url, 'recording')
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  if (process.argv.includes('--check')) await checkKyogre(browser, url)
  const page = await browser.newPage({ viewport: { width: 700, height: 480 } })
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => { window.legendaryTick = callback; return 1 }
  })
  const errors = []; page.on('pageerror', error => errors.push(String(error)))
  await page.goto(url)
  await page.waitForFunction(() => document.querySelector('#kyogre').dataset.ready === 'true', undefined, { polling: 50 })
  const originalOnly = process.argv.includes('--original')
  const actionIndex = process.argv.indexOf('--action')
  const selectedAction = actionIndex < 0 ? undefined : process.argv[actionIndex + 1]
  const durations = { swim: 7000, dive: 7000, sleep: 9000, roar: 5500, pulse: 7000, wave: 7000, rain: 8000 }
  if (actionIndex >= 0 && !Object.hasOwn(durations, selectedAction)) throw new Error('--action requires swim, dive, sleep, roar, pulse, wave or rain')
  if (originalOnly && selectedAction) throw new Error('Use either --original or --action')
  await page.locator(`button[data-action="${originalOnly ? 'original' : selectedAction ?? 'auto'}"]`).click()
  const filename = originalOnly ? 'kyogre-original' : selectedAction ? `kyogre-${selectedAction}` : 'kyogre-actions'
  const frameCount = originalOnly ? 165 : selectedAction ? durations[selectedAction] / 100 + 15 : 520
  const seen = new Set(), captures = []
  for (let i = 0; i < frameCount; i++) {
    const data = await page.evaluate(time => {
      window.legendaryTick(time)
      const source = document.querySelector('#kyogre')
      const frame = document.createElement('canvas'); frame.width = 700; frame.height = 480
      const ctx = frame.getContext('2d'); ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#0b1925'; ctx.fillRect(0, 0, 700, 480)
      ctx.fillStyle = '#ffe39a'; ctx.font = 'bold 14px monospace'; ctx.fillText('Primal Kyogre · Source-textured motion · Local / No tokens', 16, 24)
      ctx.drawImage(source, 0, 0, source.width, source.height, 0, 38, 700, 385)
      ctx.fillStyle = '#b4d9ca'; ctx.font = '13px sans-serif'; ctx.fillText(document.querySelector('#kyogre-status').textContent, 16, 456)
      return { png: frame.toDataURL('image/png').split(',')[1], action: source.dataset.action, transition: source.dataset.transition }
    }, 1000 + i * 100)
    seen.add(data.action)
    await writeFile(join(temporary, `${String(i).padStart(4, '0')}.png`), Buffer.from(data.png, 'base64'))
    if ([30,110,180,260,320,395,470].includes(i)) captures.push(Buffer.from(data.png, 'base64'))
  }
  if ((originalOnly || selectedAction ? seen.size !== 1 || !seen.has(originalOnly ? 'original' : selectedAction) : seen.size !== 7) || errors.length) throw new Error(`Incomplete recording: ${JSON.stringify({ seen: [...seen], errors })}`)
  await writeFile(join(output, `${filename}.png`), captures[0])
  for (let i = 0; i < captures.length; i++) await writeFile(join(root, 'dist', `kyogre-pose-${i}.png`), captures[i])
  const encoded = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '10', '-i', join(temporary, '%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=240[p];[b][p]paletteuse=dither=none', '-loop', '0', join(output, `${filename}.gif`)], { windowsHide: true, stdio: 'inherit' })
  if (encoded.error || encoded.status !== 0) throw encoded.error ?? new Error('GIF encoding failed')
  console.log(`Recorded docs/images/${filename}.gif; actions: ${[...seen].join(', ')}`)
} finally {
  await browser?.close(); await new Promise(done => server.close(done))
  const inside = relative(resolve(tmpdir()), resolve(temporary))
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unsafe recording cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
