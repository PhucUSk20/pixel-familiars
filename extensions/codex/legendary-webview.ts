import { MegaAnimator, MegaTexture, MEGA_ACTIONS, MEGA_DURATION, MEGA_SIZE, megaMouth, type MegaAction } from './mega-rayquaza'
const canvas = document.querySelector<HTMLCanvasElement>('#legendary')!
const ctx = canvas.getContext('2d')!
const atlas = document.querySelector<HTMLImageElement>('#atlas')!
const status = document.querySelector<HTMLElement>('#status')!
const animator = new MegaAnimator()
const sprite = document.createElement('canvas'); sprite.width = sprite.height = MEGA_SIZE
const textureCtx = sprite.getContext('2d')!
const labels: Record<MegaAction, string> = { original: 'Hình gốc · Mega Rayquaza 128px', fly: 'Bay lượn · đầu dẫn hướng, sóng thân và đuôi nối tiếp', sleep: 'Cuộn mình ngủ · thu đầu, khép vây và thở', roar: 'Gầm · ngẩng đầu, mở hàm và rung thân', pulse: 'Dragon Pulse · tụ lực tại miệng, phóng và giật lùi', dash: 'Lướt nhanh · duỗi thân, kéo đuôi, hãm và thu mình' }
let texture: MegaTexture | undefined, clock = 0, last = 0, lastPaint = 0, paused = false, auto = true, width = 192, height = 192
let offsetX = 0, offsetY = 0
const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-action]')
function resize(): void {
  const rect = canvas.getBoundingClientRect()
  canvas.width = width = Math.max(1, Math.round(rect.width)); canvas.height = height = Math.max(1, Math.round(rect.height))
  ctx.imageSmoothingEnabled = false; draw()
}
new ResizeObserver(resize).observe(canvas)
buttons.forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.action
  if (action !== 'auto' && action !== 'original' && !MEGA_ACTIONS.includes(action as typeof MEGA_ACTIONS[number])) return
  auto = action === 'auto'; animator.select(auto ? 'fly' : action as MegaAction)
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button))); draw()
}))
document.querySelector<HTMLButtonElement>('#pause')!.addEventListener('click', event => {
  paused = !paused; const button = event.currentTarget as HTMLButtonElement
  button.textContent = paused ? 'Tiếp tục' : 'Tạm dừng'; button.setAttribute('aria-pressed', String(paused))
})
function dot(x: number, y: number, size: number, color: string): void { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), size, size) }
function ring(x: number, y: number, radius: number, color: string): void {
  for (let i = 0; i < 52; i++) { const a = i * Math.PI / 26; dot(x + Math.cos(a) * radius, y + Math.sin(a) * radius * .75, Math.max(1, Math.round(radius / 20)), color) }
}
function draw(): void {
  if (!texture) return
  ctx.clearRect(0, 0, width, height)
  const action = animator.action, pose = animator.pose(), t = animator.elapsed / 1000, phase = animator.elapsed / MEGA_DURATION[action]
  const available = Math.max(1, Math.min(width - 8, height - 6))
  const scale = Math.min(3, available / MEGA_SIZE)
  const size = MEGA_SIZE * scale
  const original = action === 'original' && !animator.transitioning
  const left = Math.round((width - size) / 2 + (original ? 0 : offsetX) * scale), top = Math.round((height - size) / 2 + (original ? 0 : offsetY) * scale)
  const frame = Math.floor(clock / 50) % 160
  textureCtx.clearRect(0, 0, MEGA_SIZE, MEGA_SIZE)
  if (action === 'original' && !animator.transitioning) textureCtx.drawImage(atlas, (frame % 16) * 128, Math.floor(frame / 16) * 128, 128, 128, 32, 24, 128, 128)
  else textureCtx.putImageData(new ImageData(texture.render(pose), MEGA_SIZE, MEGA_SIZE), 0, 0)
  if (action === 'dash' && phase > .2 && phase < .75) {
    for (let i = 4; i > 0; i--) { ctx.globalAlpha = .035 * (5 - i); ctx.drawImage(sprite, left + i * 11 * scale, top, size, size) }
    ctx.globalAlpha = 1
    for (let i = 0; i < 12; i++) dot(left + (100 + (t * 70 + i * 17) % 90) * scale, top + (30 + i * 9) * scale, 2, '#f6d88185')
  }
  ctx.drawImage(sprite, left, top, size, size)
  const mouth = megaMouth(pose), mx = left + mouth.x * scale, my = top + mouth.y * scale
  // Mouth axis follows head articulation, so the burst always starts at the face.
  const angle = 2.25 + pose.headAngle + pose.angle, dx = Math.cos(angle), dy = Math.sin(angle)
  const effectAlpha = animator.transitioning ? Math.min(1, animator.elapsed / 1200) : 1
  ctx.globalAlpha = effectAlpha
  if (action === 'sleep') {
    ctx.fillStyle = '#cff8e7'; ctx.font = `${Math.max(10, 8 * scale)}px monospace`
    ctx.fillText('z', mx + 13 * scale, my - (18 + t * 3 % 12) * scale)
    ctx.fillText('Z', mx + 24 * scale, my - (32 + t * 3 % 12) * scale)
  } else if (action === 'roar' && pose.jaw > .15) {
    for (let i = 0; i < 3; i++) ring(mx + dx * 9 * scale, my + dy * 9 * scale, (8 + (t * 30 + i * 17) % 55) * scale, '#f8d76c80')
  } else if (action === 'pulse') {
    if (phase < .44) {
      const radius = (2 + pose.power * 7) * scale
      ring(mx, my, radius + 5 * scale, '#d2a4ff')
      for (let i = 0; i < 14; i++) { const a = t * 5 + i * .45, r = (8 + (1 - pose.power) * 24) * scale; dot(mx + Math.cos(a) * r, my + Math.sin(a) * r, Math.max(1, Math.round(scale)), '#b4f4ff') }
      dot(mx - radius / 2, my - radius / 2, Math.max(2, Math.round(radius)), '#f7f1ff')
    } else {
      const travel = (phase - .44) / .56 * (Math.max(width, height) + 100), hx = mx + dx * travel, hy = my + dy * travel
      for (let i = 20; i >= 0; i--) {
        const d = i * 5 * scale, wave = Math.sin(t * 24 + i * .7) * 3 * scale
        dot(hx - dx * d - dy * wave, hy - dy * d + dx * wave, Math.max(2, Math.round(6 * scale)), i < 4 ? '#edfaff' : i < 11 ? '#b094ff' : '#66579c90')
      }
      ring(hx, hy, 11 * scale, '#bcefff'); ring(hx, hy, 16 * scale, '#b493ff')
    }
  }
  ctx.globalAlpha = 1
  status.textContent = (animator.transitioning ? 'Chuyển tư thế · ' : '') + labels[action]
  canvas.dataset.action = action; canvas.dataset.elapsed = String(Math.round(animator.elapsed)); canvas.dataset.frame = String(frame); canvas.dataset.transition = String(animator.transitioning)
}
function loaded(): void {
  if (texture) return
  const original = document.createElement('canvas'); original.width = original.height = 128
  const context = original.getContext('2d')!; context.drawImage(atlas, 0, 0, 128, 128, 0, 0, 128, 128)
  texture = new MegaTexture(context.getImageData(0, 0, 128, 128).data)
  if (auto) animator.select('fly')
  canvas.dataset.ready = 'true'; resize()
}
atlas.addEventListener('load', loaded, { once: true })
atlas.addEventListener('error', () => { status.textContent = 'Không tải được sprite Mega Rayquaza. Hãy cài lại extension.' }, { once: true })
if (atlas.complete && atlas.naturalWidth) loaded()
function tick(now: number): void {
  const delta = last ? Math.min(100, now - last) : 0; last = now
  if (texture && !paused && !document.hidden) {
    animator.advance(delta, auto); clock += delta
    const t = animator.elapsed / 1000, phase = animator.elapsed / MEGA_DURATION[animator.action]
    const range = Math.max(0, Math.min(22, width / Math.max(1, height / MEGA_SIZE) / 2 - 100))
    const targetX = animator.action === 'fly' ? Math.sin(t * .8) * Math.min(10, range) : animator.action === 'dash' ? (1 - 2 * Math.min(1, Math.max(0, (phase - .2) / .55))) * range : 0
    const targetY = animator.action === 'fly' ? Math.sin(t * 1.4) * 3 : 0
    const follow = 1 - Math.exp(-delta / 250)
    offsetX += (targetX - offsetX) * follow; offsetY += (targetY - offsetY) * follow
    if (now - lastPaint >= 50) { draw(); lastPaint = now }
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
