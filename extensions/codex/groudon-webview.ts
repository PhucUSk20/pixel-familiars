import { drawMeteorRain, drawPrecipiceBlades } from './ground-duel-effects'
import { GroudonAnimator, GroudonTexture, GROUDON_ACTIONS, GROUDON_DURATION, GROUDON_WIDTH, GROUDON_HEIGHT, groudonMouth, type GroudonAction, type GroudonPose } from './primal-groudon'
const canvas = document.querySelector<HTMLCanvasElement>('#groudon')!, context = canvas.getContext('2d')!
const atlas = document.querySelector<HTMLImageElement>('#groudon-atlas')!, status = document.querySelector<HTMLElement>('#groudon-status')!
const world = document.createElement('canvas'); world.width = GROUDON_WIDTH; world.height = GROUDON_HEIGHT
const ctx = world.getContext('2d')!, animator = new GroudonAnimator()
const labels: Record<GroudonAction, string> = { original: 'Hình gốc · Primal Groudon 128px', walk: 'Đi nặng · chân luân phiên, tay và đuôi theo nhịp', sleep: 'Ngủ · hạ người, khép tay, thở chậm', roar: 'Gầm · ngẩng đầu, mở hàm, rung giáp', blades: 'Precipice Blades · lấy đà, đập đất, địa kiếm trồi lên', burst: 'Energy Burst · tụ cầu tím tại miệng, phóng và giật lùi', eruption: 'Eruption · tích nhiệt, gầm, phóng lửa từ miệng lên trời, mưa thiên thạch rơi xuống' }
let texture: GroudonTexture | undefined, paused = false, auto = true, clock = 0, last = 0, lastPaint = 0
const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-action]')
function pixel(x: number, y: number, size: number, color: string): void { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(size)), Math.max(1, Math.round(size))) }
function ring(x: number, y: number, radius: number, color: string, flatten = 1): void {
  for (let i = 0; i < 36; i++) { const angle = i * Math.PI / 18; pixel(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * flatten, 1, color) }
}
function disc(x: number, y: number, radius: number, color: string): void {
  const r = Math.max(1, Math.round(radius)); ctx.fillStyle = color
  for (let row = -r; row <= r; row++) { const half = Math.floor(Math.sqrt(r * r - row * row)); ctx.fillRect(Math.round(x) - half, Math.round(y) + row, half * 2 + 1, 1) }
}
function polygon(points: number[][], color: string): void {
  // Scan rows into solid integer pixels instead of antialiased vector edges.
  ctx.fillStyle = color
  for (let y = Math.floor(Math.min(...points.map(p => p[1]))); y <= Math.ceil(Math.max(...points.map(p => p[1]))); y++) {
    const intersections: number[] = []
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[j], b = points[i]
      if ((a[1] > y + .5) !== (b[1] > y + .5)) intersections.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
    }
    intersections.sort((a, b) => a - b)
    for (let i = 0; i + 1 < intersections.length; i += 2) ctx.fillRect(Math.ceil(intersections[i]), y, Math.max(0, Math.floor(intersections[i + 1]) - Math.ceil(intersections[i]) + 1), 1)
  }
}
function ground(t: number, pose: GroudonPose, original: boolean): void {
  ctx.fillStyle = '#24222a'; ctx.fillRect(8, 145, 240, 3)
  ctx.fillStyle = '#40323a'; ctx.fillRect(8, 145, 240, 1)
  if (original) return
  for (let i = 0; i < 7; i++) {
    const x = 18 + i * 32, size = 3 + i % 3
    polygon([[x, 145], [x + size, 141 - i % 2], [x + size * 2, 145]], '#38313a')
    pixel(x + size, 147, 1, pose.glow > .4 ? '#ffad45' : '#6b3b33')
  }
  for (let i = 0; i < 10; i++) { const p = (t * .22 + i * .137) % 1; pixel(24 + i * 22 + Math.sin(t + i) * 3, 145 - p * 48, 1, p < .7 ? '#ff9c424d' : '#ffcd6b25') }
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#00000025'; ctx.fillRect(145 - i * 5 + pose.x, 140 + i, 36 + i * 10, 1) }
}
function blades(t: number, phase: number): void {
  drawPrecipiceBlades(ctx,phase,{x:155,y:145},{x:34,y:96},145)
}
function burst(t: number, phase: number, mouth: { x: number; y: number }): void {
  if (phase < .04 || phase > .94) return
  const { x, y } = mouth
  if (phase < .46) {
    const charge = Math.min(1, (phase - .04) / .38), radius = 2 + charge * 11
    for (let i = 0; i < 16; i++) { const a = i * .4 + t * 3.4, r = radius + 3 + (1 - charge) * 23; pixel(x + Math.cos(a) * r, y + Math.sin(a) * r, i % 3 === 0 ? 2 : 1, i % 2 ? '#f5c3ff' : '#ae62e5') }
    ring(x, y, radius + 3, '#ce79ff')
    disc(x, y, radius, '#a144e2'); disc(x - 1, y - 1, radius * .72, '#d776f6'); disc(x - 2, y - 2, radius * .4, '#f3c7ff')
    pixel(x - 2, y - 2, 4, '#fff7ff')
    if (charge > .6) for (let i = 0; i < 4; i++) { const a = t * 2 + i * Math.PI / 2; for (let r = radius + 4; r < radius + 12; r += 2) pixel(x + Math.cos(a) * r, y + Math.sin(a) * r, 1, '#ffd475') }
  } else {
    const travel = (phase - .46) / .48 * 260, tip = x - travel
    for (let i = 30; i >= 0; i--) { const px = tip + i * 3; if (px > x) continue; const wave = Math.sin(t * 25 + i * .55) * 2; pixel(px, y - 3 + wave, 6, i < 4 ? '#fff3ff' : i < 16 ? '#d287f6' : '#7b42b580') }
    disc(tip, y, 12, '#9343df'); disc(tip - 2, y - 1, 8, '#eaaaff'); disc(tip - 3, y - 2, 4, '#fff6ff')
    ring(x, y, 7 + (phase - .46) * 34, '#d68bff80')
  }
}
function eruption(t:number,phase:number,mouth:{x:number;y:number}):void {
  drawMeteorRain(ctx,phase,mouth,{x:Math.max(30,mouth.x-110),y:147})
}
function draw(): void {
  if (!texture) return
  const action = animator.action, pose = animator.pose(), phase = animator.elapsed / GROUDON_DURATION[action], t = animator.elapsed / 1000
  const original = action === 'original' && !animator.transitioning, frame = Math.floor(clock / 50) % 160
  ctx.clearRect(0, 0, GROUDON_WIDTH, GROUDON_HEIGHT); ground(t, pose, original)
  const alpha = animator.transitioning ? Math.min(1, animator.elapsed / 1100) : 1
  ctx.globalAlpha = alpha
  if (action === 'blades') blades(t, phase)
  ctx.globalAlpha = 1
  if (original) ctx.drawImage(atlas, frame % 16 * 128, Math.floor(frame / 16) * 128, 128, 128, 100, 40, 128, 128)
  // Composite an offscreen sprite so transparent pixels preserve the scenery.
  if (!original) {
    spriteCtx.putImageData(new ImageData(texture.render(pose), GROUDON_WIDTH, GROUDON_HEIGHT), 0, 0)
    ctx.drawImage(sprite, 0, 0)
  }
  const mouth = groudonMouth(pose)
  ctx.globalAlpha = alpha
  if (action === 'burst') burst(t, phase, mouth)
  if (action === 'eruption') eruption(t, phase, mouth)
  if (action === 'roar' && pose.jaw > .1) for (let i = 0; i < 3; i++) ring(mouth.x - 5, mouth.y, 7 + (t * 25 + i * 11) % 32, '#ffc76780', .7)
  if (action === 'sleep') { ctx.fillStyle = '#e4c5b6'; ctx.font = '8px monospace'; ctx.fillText('z', mouth.x - 6, mouth.y - 12 - t * 2 % 10); ctx.fillText('Z', mouth.x + 2, mouth.y - 25 - t * 2 % 10) }
  if (action === 'walk') for (let i = 0; i < 5; i++) { const age = (t * .6 + i * .19) % 1; pixel(150 + pose.x + age * 25, 143 - Math.sin(age * Math.PI) * 5, 2, '#82665c55') }
  ctx.globalAlpha = 1
  context.clearRect(0, 0, canvas.width, canvas.height)
  const scale = Math.max(.001, Math.min(3, (canvas.width - 8) / GROUDON_WIDTH, (canvas.height - 6) / GROUDON_HEIGHT))
  context.imageSmoothingEnabled = false
  context.drawImage(world, Math.round((canvas.width - GROUDON_WIDTH * scale) / 2), Math.round((canvas.height - GROUDON_HEIGHT * scale) / 2), GROUDON_WIDTH * scale, GROUDON_HEIGHT * scale)
  status.textContent = (animator.transitioning ? 'Chuyển tư thế · ' : '') + labels[action]
  canvas.dataset.action = action; canvas.dataset.elapsed = String(Math.round(animator.elapsed)); canvas.dataset.frame = String(frame); canvas.dataset.transition = String(animator.transitioning)
  canvas.dataset.effect = ['blades', 'burst', 'eruption'].includes(action) ? phase < (action === 'burst' ? .46 : .3) ? 'charge' : phase < .8 ? 'release' : 'recover' : ''
}
const sprite = document.createElement('canvas'); sprite.width = GROUDON_WIDTH; sprite.height = GROUDON_HEIGHT
const spriteCtx = sprite.getContext('2d')!
function resize(): void { const rect = canvas.getBoundingClientRect(); canvas.width = Math.max(1, Math.round(rect.width)); canvas.height = Math.max(1, Math.round(rect.height)); draw() }
new ResizeObserver(resize).observe(canvas)
buttons.forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action
  if (action !== 'auto' && action !== 'original' && !GROUDON_ACTIONS.includes(action as typeof GROUDON_ACTIONS[number])) return
  auto = action === 'auto'; animator.select(auto ? 'walk' : action as GroudonAction)
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button))); draw()
}))
document.querySelector<HTMLButtonElement>('#groudon-pause')!.addEventListener('click', event => { paused = !paused; const button = event.currentTarget as HTMLButtonElement; button.textContent = paused ? 'Tiếp tục' : 'Tạm dừng'; button.setAttribute('aria-pressed', String(paused)) })
function loaded(): void {
  if (texture) return
  const source = document.createElement('canvas'); source.width = source.height = 128
  const sourceCtx = source.getContext('2d')!; sourceCtx.drawImage(atlas, 0, 0, 128, 128, 0, 0, 128, 128)
  texture = new GroudonTexture(sourceCtx.getImageData(0, 0, 128, 128).data)
  animator.select('walk'); canvas.dataset.ready = 'true'; resize()
}
atlas.addEventListener('load', loaded, { once: true })
atlas.addEventListener('error', () => { status.textContent = 'Không tải được sprite Primal Groudon. Hãy cài lại extension.' }, { once: true })
if (atlas.complete && atlas.naturalWidth) loaded()
function tick(now: number): void {
  const delta = last ? Math.min(100, now - last) : 0; last = now
  if (texture && !paused && !document.hidden) { clock += delta; animator.advance(delta, auto); if (now - lastPaint >= 50) { lastPaint = now; draw() } }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
