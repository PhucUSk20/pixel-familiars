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
import { checkDeoxys } from './deoxys-smoke.mjs'

const root = resolve('.'), temporary = await mkdtemp(join(tmpdir(), 'deoxys-record-'))
const output = join(root, 'docs/images')
const bundle = await build({ entryPoints: ['extensions/codex/deoxys.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vscode'] })
const host = { exports: {} }, require = createRequire(import.meta.url)
runInNewContext(bundle.outputFiles[0].text, { module: host, exports: host.exports, require: name => name === 'vscode' ? {} : require(name) })
let html = ''
const server = createServer(async (request, response) => {
  try {
    if (request.url === '/deoxys.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(await readFile('dist/deoxys.js')) }
    else if (/^\/deoxys-(normal|attack|defense|speed)\.png$/.test(request.url)) { response.setHeader('Content-Type','image/png');response.end(await readFile(`extensions/codex/${request.url.slice(1).replace('.png','-128px-atlas.png')}`)) }
    else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
  } catch { response.statusCode = 500; response.end('Recording asset unavailable') }
})
let browser
try {
  await mkdir(output, { recursive: true })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${server.address().port}`
  html = host.exports.deoxysHtml(`${url}/deoxys.js`, ['normal','attack','defense','speed'].map(form=>`${url}/deoxys-${form}.png`), url, 'recording')
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  if (process.argv.includes('--check')) await checkDeoxys(browser, url)
  const page = await browser.newPage({ viewport: { width: 700, height: 480 } })
  await page.addInitScript(() => {
    let seed=31;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};
    window.requestAnimationFrame = callback => { window.legendaryTick = callback; return 1 }
  })
  const errors = []; page.on('pageerror', error => errors.push(String(error)))
  await page.goto(url)
  await page.waitForFunction(() => document.querySelector('#deoxys').dataset.ready === 'true', undefined, { polling: 50 })
  const filename='deoxys-actions', frameCount=850
  const seen = new Set(), states = new Set(), captures = []
  for (let i = 0; i < frameCount; i++) {
    const data = await page.evaluate(time => {
      window.legendaryTick(time); window.legendaryTick(time+100)
      const source = document.querySelector('#deoxys')
      const frame = document.createElement('canvas'); frame.width = 700; frame.height = 480
      const ctx = frame.getContext('2d'); ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#0b1925'; ctx.fillRect(0, 0, 700, 480)
      ctx.fillStyle = '#ffe39a'; ctx.font = 'bold 14px monospace'; ctx.fillText('Deoxys · Source-textured motion · Local / No tokens', 16, 24)
      ctx.drawImage(source, 0, 0, source.width, source.height, 0, 38, 700, 385)
      ctx.fillStyle = '#b4d9ca'; ctx.font = '13px sans-serif'; ctx.fillText(document.querySelector('#deoxys-status').textContent, 16, 456)
      return { png: frame.toDataURL('image/png').split(',')[1], action: `${source.dataset.form}/${source.dataset.action}`, state:source.dataset.state }
    }, 1000 + i * 200)
    seen.add(data.action); states.add(data.state)
    await writeFile(join(temporary, `${String(i).padStart(4, '0')}.png`), Buffer.from(data.png, 'base64'))
    if ([30,110,180,260,320,395,470,570,680,780].includes(i)) captures.push(Buffer.from(data.png, 'base64'))
  }
  if(!['normal','attack','defense','speed'].every(form=>seen.has(`${form}/skill`))||!['meteor','approach','touch','transform','skill'].every(state=>states.has(state))||errors.length)throw new Error(`Incomplete recording: ${JSON.stringify({seen:[...seen],errors})}`)
  await writeFile(join(output, `${filename}.png`), captures[0])
  for (let i = 0; i < captures.length; i++) await writeFile(join(root, 'dist', `deoxys-pose-${i}.png`), captures[i])
  const encoded = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '5', '-i', join(temporary, '%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=240[p];[b][p]paletteuse=dither=none', '-loop', '0', join(output, `${filename}.gif`)], { windowsHide: true, stdio: 'inherit' })
  if (encoded.error || encoded.status !== 0) throw encoded.error ?? new Error('GIF encoding failed')
  const short=spawnSync('ffmpeg',['-y','-v','error','-ss','7','-t','12','-i',join(output,`${filename}.gif`),'-vf','split[a][b];[a]palettegen=max_colors=240[p];[b][p]paletteuse=dither=none','-loop','0',join(output,'deoxys-meteor.gif')],{windowsHide:true,stdio:'inherit'})
  if(short.error||short.status!==0)throw short.error??new Error('Meteorite GIF encoding failed')
  console.log(`Recorded docs/images/${filename}.gif; actions: ${[...seen].join(', ')}`)
} finally {
  await browser?.close(); await new Promise(done => server.close(done))
  const inside = relative(resolve(tmpdir()), resolve(temporary))
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unsafe recording cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
