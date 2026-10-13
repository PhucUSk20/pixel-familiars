import {checkPortalParadox} from './portal-paradox-smoke.mjs'
import {checkRider} from './rider-smoke.mjs'
import {checkAvian} from './avian-smoke.mjs'
import {checkLayout} from './layout-smoke.mjs'
import {checkGalar} from './galar-smoke.mjs'
import {checkKalos} from './kalos-smoke.mjs'
import {checkUnova} from './unova-smoke.mjs'
import {checkUltra} from './ultra-smoke.mjs'
import {checkNecrozma} from './necrozma-smoke.mjs'
import {checkSunMoon} from './sun-moon-smoke.mjs'
import {checkAerial} from './aerial-smoke.mjs'
import { checkCreation,checkCreationGuarantee } from './creation-smoke.mjs'
import { checkArceus } from './arceus-smoke.mjs'
import { arceusFixtureBundle } from './arceus-fixture.mjs'
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

const galar=process.argv.includes('--galar')
const kalos=process.argv.includes('--kalos')
const unova=process.argv.includes('--unova'),black=process.argv.includes('--black')
const ultraBattle=process.argv.includes('--ultra')
const alliance=process.argv.includes('--alliance')
const necrozma=process.argv.includes('--necrozma')
const celestial=process.argv.includes('--celestial')
const aerial=process.argv.includes('--aerial')
const intervention=process.argv.includes('--intervention')
const arceus = process.argv.includes('--arceus'),trio=process.argv.includes('--giratina'),creation=trio||process.argv.includes('--creation')
const divineFixture = process.argv.includes('--check')||galar||kalos||unova||arceus||creation||aerial||celestial||necrozma||ultraBattle ? await arceusFixtureBundle(resolve('.')) : undefined
const temporary = await mkdtemp(join(tmpdir(), 'familiars-arena-'))
const bundle = await build({ entryPoints: ['extensions/codex/arena.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['vscode'] })
const host = { exports: {} }, require = createRequire(import.meta.url)
runInNewContext(bundle.outputFiles[0].text, { module: host, exports: host.exports, require: name => name === 'vscode' ? {} : require(name) })
let html, browser
const server = createServer(async (request, response) => {
  const files = { ...Object.fromEntries(['hoopa-unbound','mega-latias','mega-latios','koraidon','miraidon','ho-oh','lugia','mewtwo','mega-mewtwo-x','mega-mewtwo-y','calyrex-ice-rider','calyrex-shadow-rider','mega-heatran','terapagos-stellar'].map(form=>[`/${form}.png`,[`extensions/codex/${form}-128px-atlas.png`,'image/png']])), ...Object.fromEntries(['zacian-crowned','zamazenta-crowned','eternatus','eternatus-eternamax'].map(form=>[`/${form}.png`,[`extensions/codex/${form}-128px-atlas.png`,'image/png']])), ...Object.fromEntries(['xerneas','yveltal','zygarde-complete','mega-zygarde-complete'].map(form=>[`/${form}.png`,[`extensions/codex/${form}-128px-atlas.png`,'image/png']])), ...Object.fromEntries(['reshiram','zekrom','kyurem','kyurem-white','kyurem-black'].map(form=>[`/${form}.png`,[`extensions/codex/${form}-128px-atlas.png`,'image/png']])), ...Object.fromEntries(['normal','dawn','dusk','ultra'].map(form=>[`/necrozma-${form}.png`,[`extensions/codex/necrozma-${form}-128px-atlas.png`,'image/png']])), ...Object.fromEntries(['lunala','solgaleo'].map(name=>[`/${name}.png`,[`extensions/codex/${name}-128px-atlas.png`,'image/png']])), '/giratina.png':['extensions/codex/giratina-128px-atlas.png','image/png'], '/palkia.png':['extensions/codex/palkia-128px-atlas.png','image/png'],'/dialga.png':['extensions/codex/dialga-128px-atlas.png','image/png'],'/arceus.png':['extensions/codex/arceus-128px-atlas.png','image/png'], ...Object.fromEntries(['normal','attack','defense','speed'].map(form=>[`/deoxys-${form}.png`,[`extensions/codex/deoxys-${form}-128px-atlas.png`,'image/png']])), '/arena.js': ['dist/arena.js', 'text/javascript'], '/kyogre.png': ['extensions/codex/kyogre-primal-128px-atlas.png', 'image/png'], '/ray.png': ['extensions/codex/legendary-128px-atlas.png', 'image/png'], '/ground.png': ['extensions/codex/groudon-primal-128px-atlas.png', 'image/png'] }
  try {
    if (divineFixture && request.url === '/arena.js') { response.setHeader('Content-Type','text/javascript');response.end(divineFixture) }
    else if (files[request.url]) { const [path, type] = files[request.url]; response.setHeader('Content-Type', type); response.end(await readFile(path)) }
    else { response.setHeader('Content-Type', 'text/html'); response.end(html) }
  } catch { response.writeHead(500); response.end('Asset unavailable') }
})
try {
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const url = `http://127.0.0.1:${server.address().port}`
  html = host.exports.arenaHtml(`${url}/arena.js`, `${url}/ray.png`, `${url}/ground.png`, url, 'recordarena', `${url}/kyogre.png`, ['normal','attack','defense','speed'].map(form=>`${url}/deoxys-${form}.png`))
  const executablePath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  browser = await chromium.launch({ executablePath, headless: true })
  if((process.argv.includes('--portal-paradox')||process.argv.includes('--avian')||process.argv.includes('--rider'))||process.argv.includes('--layout')||galar||kalos||unova||arceus||creation||aerial||celestial||necrozma||ultraBattle)html=html.replace('No AI tokens','Demo')
  if(process.argv.includes('--portal-paradox'))await checkPortalParadox(browser,url)
  else if(process.argv.includes('--rider'))await checkRider(browser,url)
  else if(process.argv.includes('--avian'))await checkAvian(browser,url)
  else if(process.argv.includes('--layout'))await checkLayout(browser,url)
  else if(process.argv.includes('--guarantee'))await checkCreationGuarantee(browser,url)
  else if (process.argv.includes('--check')) { if(galar)await checkGalar(browser,url);else if(kalos)await checkKalos(browser,url);else if(unova)await checkUnova(browser,url);else if(ultraBattle)await checkUltra(browser,url);else if(necrozma)await checkNecrozma(browser,url);else if(celestial)await checkSunMoon(browser,url);else if(aerial)await checkAerial(browser,url);else if(creation)await checkCreation(browser,url);else if(arceus)await checkArceus(browser,url);else await checkArena(browser, url) }
  if(!process.argv.includes('--check-only')){
  const page = await browser.newPage({ viewport: { width: galar?960:kalos?960:ultraBattle?1100:creation?960:720, height: galar?540:kalos?540:ultraBattle?620:creation?500:390 } })
  await page.addInitScript(() => { let seed = 42; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }; window.requestAnimationFrame = callback => { window.arenaTick = callback; return 1 } })
  await page.goto(url)
  await page.waitForFunction(() => document.querySelector('#arena')?.dataset.ready === 'true', undefined, { polling: 50 })
  const auto = process.argv.includes('--auto')
  if(necrozma||ultraBattle)await page.evaluate(()=>window.divineJoinChance(.9))
  if(ultraBattle){await page.evaluate(()=>{window.creationScenario(true);window.creationChance(.9)});await page.locator('#arena-creation').click();await page.locator('#arena-celestial').click();for(let i=0;i<50;i++)await page.evaluate(i=>window.arenaTick(1000+i*100),i);await page.locator('#arena-ultra').click()}
  if(galar){await page.evaluate(()=>window.divineJoinChance(.9));await page.locator('#arena-galar').click()}
  if(kalos){await page.evaluate(()=>window.divineJoinChance(.9));await page.locator('#arena-kalos').click()}
  if(unova){await page.evaluate(black=>{window.unovaScenario(!black);window.divineJoinChance(.9)},black);await page.locator('#arena-unova').click()}
  if(necrozma)await page.locator('#arena-necrozma').click()
  if(celestial)await page.locator('#arena-celestial').click()
  if(aerial)await page.evaluate(()=>window.previewAerial(0))
  if(creation){await page.evaluate(({trio,intervention})=>{window.creationScenario(trio);window.creationChance(trio&&!intervention?.9:0)},{trio,intervention});await page.locator('#arena-creation').click();await page.evaluate(()=>window.creationVariant('orb'))}
  if(arceus)await page.evaluate(()=>window.previewArceus())
  if (!galar && !kalos && !unova && !auto && !arceus && !creation && !aerial && !celestial && !necrozma && !ultraBattle) await page.locator('button[data-mode="duel"]').click()
  const seen=new Set()
  for (let i = 0; i < (galar?475:kalos?460:unova?490:ultraBattle?(alliance?345:260):necrozma?675:celestial?225:aerial?435:creation ? (trio&&!intervention?260:460) : arceus ? 255 : auto ? 450 : 1800); i++) {
    if(ultraBattle&&alliance&&i===90)await page.locator('#arena-summon').click()
    if(aerial&&i===65)await page.evaluate(()=>window.previewAerial(1))
    if(aerial&&i===130)await page.evaluate(()=>window.previewAerial(2))
    if(aerial&&i===195)await page.evaluate(()=>window.previewAerial(4))
    await page.evaluate(({time, auto}) => { if (auto) window.arenaTick(time-100); window.arenaTick(time) }, { time: (ultraBattle?6100:1000) + i * (auto ? 200 : 100), auto })
    if(!galar && !kalos && !unova && !auto && !arceus && !creation && !aerial && !celestial && !necrozma && !ultraBattle && await page.locator('#arena').getAttribute('data-air-stage')==='fight') seen.add(await page.locator('#arena').getAttribute('data-air-turn'))
    await page.screenshot({ path: join(temporary, `${String(i).padStart(4, '0')}.png`) })
  }
  if(!galar&&!kalos&&!unova&&!auto&&!arceus&&!creation&&!aerial&&!celestial&&!necrozma&&!ultraBattle&&seen.size!==5)throw new Error('Duel recording did not cover all five rounds')
  const filename=galar?'galar-heroes':kalos?'kalos-guardians':unova?(black?'unova-black-fusion':'unova-white-fusion'):ultraBattle?(alliance?'ultra-arceus-war':'ultra-boss'):necrozma?'necrozma-restoration':celestial?'sun-moon-encounter':aerial?'aerial-finale':trio?'giratina-encounter':creation?'creation-rivals':arceus?'arceus-judgment':auto?'legendary-arena':'legendary-duel'
  const result = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', auto ? '5' : '10', '-i', join(temporary, '%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=240[p];[b][p]paletteuse=dither=none', '-loop', '0', `docs/images/${filename}.gif`], { windowsHide: true, stdio: 'inherit' })
  if (result.error || result.status !== 0) throw result.error ?? new Error('GIF encoding failed')
  await writeFile(`docs/images/${filename}.png`, await readFile(join(temporary, '0040.png')))
  console.log(`Recorded docs/images/${filename}.gif`)
  }
} finally {
  await browser?.close(); await new Promise(done => server.close(done))
  const inside = relative(resolve(tmpdir()), resolve(temporary))
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unsafe cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
