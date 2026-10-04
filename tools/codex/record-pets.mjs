// Records the production habitat/pixel engine, without model calls or real session data.
// npm.cmd run record:codex-pets — requires ffmpeg and Chrome/Edge (or PIXEL_PET_BROWSER).
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, relative, resolve, isAbsolute } from 'node:path'

const root = resolve('.')
const output = join(root, 'docs', 'images')
const temporary = await mkdtemp(join(tmpdir(), 'pixel-pet-record-'))
const browserPath = process.env.PIXEL_PET_BROWSER || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(existsSync)
const bundle = await build({ tsconfig: 'tsconfig.codex.json', bundle: true, write: false, platform: 'browser', stdin: { resolveDir: root, contents: `
  import { PetHabitat } from './extensions/codex/habitat';
  import { INTERACTIONS, interactionFrame, interactionMain, drawInteraction } from './extensions/codex/interactions';
  import { animate, readTheme } from './plugins/pixel-pet/hooks/theme';
  import { drawBand, layScene } from './plugins/pixel-pet/hooks/scene';
  import { bundledTheme } from './extensions/codex/scene-theme';
  import { compose } from './plugins/pixel-pet/hooks/pixels';
  import { WorkerSprites, SUMMON_MS } from './extensions/codex/task-minis';
  import { TOOL_DEPARTURE_MS } from './extensions/codex/protocol';
  const body = animate(readTheme(bundledTheme(${await readFile(join(root, 'plugins/pixel-pet/assets/slime.json'), 'utf8')})).theme);
  const surface = document.createElement('canvas'); document.body.append(surface);
  const context = surface.getContext('2d');
  const labels = { feed:'Picnic', play:'Catch', chase:'Tag', hide:'Peekaboo', seesaw:'Seesaw', trampoline:'Trampoline', dance:'Disco', umbrella:'Umbrella', bubbles:'Bubbles', gift:'Surprise gift', tug:'Tug of war', stargaze:'Stargazing', highfive:'High five', paperplane:'Paper plane', fishing:'Fishing', magic:'Magic portal', stack:'Block tower', pillow:'Pillow fight', boat:'Leaf boat', photo:'Photo booth' };
  function pixels(band, left, top, scale) {
    for (let y = 0; y < band.h; y++) for (let x = 0; x < band.w; x++) {
      const pixel = band.px[y * band.w + x]; if (pixel < 0) continue;
      context.fillStyle = '#' + (pixel & 0xffffff).toString(16).padStart(6, '0');
      context.fillRect(left + x * scale, top + y * scale, scale, scale);
    }
  }
  function background(width, height, title) {
    surface.width = width; surface.height = height;
    context.fillStyle = '#14171f'; context.fillRect(0, 0, width, height);
    context.fillStyle = '#e6eafa'; context.font = 'bold 15px monospace'; context.textBaseline = 'top';
    context.fillText(title, 16, 12);
  }
  let habitat, last = -100, frame;
  window.recordPetPhases = new Set();
  function reset() {
    let seed = 42;
    habitat = new PetHabitat(() => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 });
    last = -100;
  }
  reset();
  const workers = new WorkerSprites();
  const workerTasks = [
    { id:'read-demo', mode:'read', target:'', since:1000, doneAt:7200, source:'call' },
    { id:'edit-demo', mode:'edit', target:'', since:2600, doneAt:8000, source:'call' },
    { id:'run-demo', mode:'bash', target:'', since:4200, doneAt:8800, source:'process' },
  ];
  window.recordWorkerPhases = new Set();
  window.recordWorkerPeak = 0;
  window.recordPetFrame = (kind, elapsed) => {
    if (kind === 'summon') {
      background(816, 194, 'Demo: sky portals summon Read, Edit and Run workers');
      const now = elapsed + 1000;
      const tasks = workerTasks.filter(task => now >= task.since && now - task.doneAt < TOOL_DEPARTURE_MS).map(task => now < task.doneAt ? { ...task, doneAt:undefined } : task);
      const picture = compose(body, tasks.length ? 'think' : 'idle', elapsed, 1);
      const band = drawBand(body, body.scene, layScene(body.scene, 196), picture, 80, elapsed);
      workers.draw(body, band, tasks, now, 80, picture.w, 180);
      pixels(band, 16, 44, 4);
      const visible = workers.current();
      for (const worker of visible) window.recordWorkerPhases.add(worker.phase);
      if (!visible.length) window.recordWorkerPhases.add('empty');
      window.recordWorkerPeak = Math.max(window.recordWorkerPeak, visible.length);
      window.recordWorkerRemaining = visible.length;
      const phase = elapsed < 180 ? 'Sky sigil opens' : elapsed < 650 ? 'Light projects downward' : elapsed < 1100 ? 'Worker materializes on the ground' : elapsed < SUMMON_MS ? 'Portal closes' : visible.length ? 'Independent task workers: ' + visible.length : 'All workers have finished';
      context.fillStyle = '#a7caff'; context.font = '13px monospace'; context.fillText(phase, 16, 143);
      context.fillStyle = '#b6c4df'; context.font = '12px monospace';
      context.fillText('Demo: staggered starts, parallel work, separate completions. No AI calls.', 16, 168);
    } else if (kind === 'gallery') {
      background(816, 654, 'Demo: 20 pet interactions — local animation, no AI tokens');
      INTERACTIONS.forEach((name, index) => {
        const x = 12 + index % 4 * 200, y = 46 + Math.floor(index / 4) * 116;
        context.fillStyle = '#b6c4df'; context.font = '13px monospace'; context.fillText(labels[name], x + 4, y);
        const motion = interactionFrame(name, elapsed, 48, 5);
        const band = drawBand(body, body.scene, layScene(body.scene, 48), interactionMain(body, motion), Math.round(motion.main.x), elapsed);
        drawInteraction(body, band, motion); pixels(band, x, y + 20, 4);
      });
    } else {
      background(592, 198, 'Demo: independent walks → meet → play → separate');
      if (elapsed < last) reset();
      for (let tick = last + 100; tick <= elapsed; tick += 100) {
        frame = habitat.update(tick + 1000, 140, 0, 132, true); last = tick;
        window.recordPetPhases.add(frame.phase);
      }
      const band = drawBand(body, body.scene, layScene(body.scene, 140), interactionMain(body, frame), Math.round(frame.main.x), elapsed);
      drawInteraction(body, band, frame); pixels(band, 16, 44, 4);
      context.fillStyle = '#a7caff'; context.font = '13px monospace'; context.fillText('Demo · ' + frame.phase + (frame.kind ? ' · ' + labels[frame.kind] : ''), 16, 143);
      context.fillStyle = '#b6c4df'; context.font = '12px monospace';
      const words = frame.text.split(' '); let line = '', y = 164;
      for (const word of words) {
        if (context.measureText(line + word).width > 560) { context.fillText(line, 16, y); y += 15; line = ''; }
        line += word + ' ';
      }
      context.fillText(line, 16, y);
    }
    return surface.toDataURL('image/png').split(',')[1];
  };
` } })

let browser
try {
  await mkdir(output, { recursive: true })
  browser = await chromium.launch({ executablePath: browserPath, headless: true })
  const page = await browser.newPage()
  await page.setContent('<!doctype html><body style="margin:0;background:#14171f"></body>')
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  const only = process.argv.indexOf('--only');
  const selection = only >= 0 ? process.argv[only + 1] : undefined;
  if (only >= 0 && !['life', 'gallery', 'summon'].includes(selection)) throw new Error('--only must be life, gallery or summon');
  for (const [kind, frames, filename] of [['life', 400, 'codex-pet-life'], ['gallery', 76, 'codex-pet-actions'], ['summon', 110, 'codex-pet-summoning']].filter(([kind]) => !selection || kind === selection)) {
    const directory = join(temporary, kind)
    await mkdir(directory)
    for (let index = 0; index < frames; index++) {
      const png = await page.evaluate(({ kind, elapsed }) => window.recordPetFrame(kind, elapsed), { kind, elapsed: index * 100 })
      await writeFile(join(directory, `${String(index).padStart(4, '0')}.png`), Buffer.from(png, 'base64'))
      if (index === (kind === 'summon' ? 8 : 36)) await writeFile(join(output, `${filename}.png`), Buffer.from(png, 'base64'))
    }
    if (kind === 'life') {
      const phases = await page.evaluate(() => [...window.recordPetPhases].sort())
      if (phases.join(',') !== 'apart,meet,play,roam') throw new Error(`Recording missed habitat phases: ${phases}`)
      console.log(`Recorded complete habitat cycle: ${phases.join(', ')}`)
    }
    if (kind === 'summon') {
      const coverage = await page.evaluate(() => ({ phases:[...window.recordWorkerPhases], peak:window.recordWorkerPeak, remaining:window.recordWorkerRemaining }))
      if (coverage.peak !== 3 || coverage.remaining !== 0 || !['summon', 'work', 'depart', 'empty'].every(phase => coverage.phases.includes(phase))) throw new Error('Incomplete worker summoning demo: ' + JSON.stringify(coverage));
      console.log('Recorded sky summoning, three parallel workers and independent departures');
    }
    const encoded = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '10', '-i', join(directory, '%04d.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=192:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', join(output, `${filename}.gif`)], { windowsHide: true, stdio: 'inherit' })
    if (encoded.error || encoded.status !== 0) throw encoded.error ?? new Error(`ffmpeg failed: ${encoded.status}`)
    console.log(`Recorded docs/images/${filename}.gif: ${frames} frames at 10 fps`)
  }
} finally {
  await browser?.close()
  // Only remove the freshly created recording directory under the system temp root.
  const inside = relative(resolve(tmpdir()), resolve(temporary))
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Unsafe recording cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
