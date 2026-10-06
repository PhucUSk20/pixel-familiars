import { KyogreAnimator, KyogreTexture, kyogreMouth, KYOGRE_ACTIONS, KYOGRE_DURATION, KYOGRE_WIDTH, KYOGRE_HEIGHT, type KyogreAction } from './primal-kyogre'
import { drawKyogreEffects } from './kyogre-effects'
const canvas = document.querySelector<HTMLCanvasElement>('#kyogre')!, context = canvas.getContext('2d')!
const atlas = document.querySelector<HTMLImageElement>('#kyogre-atlas')!, status = document.querySelector<HTMLElement>('#kyogre-status')!
const world = document.createElement('canvas'); world.width = KYOGRE_WIDTH; world.height = KYOGRE_HEIGHT
const ctx = world.getContext('2d')!, animator = new KyogreAnimator()
const sprite = document.createElement('canvas'); sprite.width = KYOGRE_WIDTH; sprite.height = KYOGRE_HEIGHT
const spriteCtx = sprite.getContext('2d')!
const labels: Record<KyogreAction,string> = { original:'Hình gốc · 160 frame', swim:'Bơi · vây quạt lệch nhịp, đuôi nối tiếp', dive:'Lặn · chúi đầu, ép vây, bong bóng và nổi lại', sleep:'Nghỉ · vây khép, thở chậm', roar:'Gầm · ngẩng đầu, mở hàm, sóng âm', pulse:'Cầu sáng · tụ năm cầu rồi phóng tia', wave:'Song vòi rồng · dựng hai xoáy nước, hợp nhất và phóng', rain:'Mưa giông · mở vây, gọi mây và chớp' }
let texture: KyogreTexture | undefined, auto = true, paused = false, clock = 0, last = 0, paint = 0
function draw(): void {
  if (!texture) return
  const pose = animator.pose(), action = animator.action, t = clock/1000, frame = Math.floor(clock/50)%160
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,KYOGRE_WIDTH,KYOGRE_HEIGHT)
  for (let i = 0; i < 24; i++) { ctx.fillStyle = '#718595'; ctx.fillRect(i*61%256,i*31%80,1,1) }
  ctx.fillStyle = '#081e2d'; ctx.fillRect(0,145,256,47)
  for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) { ctx.fillStyle = row%2 ? '#24526b' : '#173f57'; ctx.fillRect(Math.round((i*33+t*(row%2 ? -4 : 5)+row*11+512)%280-14),146+row*10,13,1) }
  spriteCtx.clearRect(0,0,KYOGRE_WIDTH,KYOGRE_HEIGHT)
  if (action === 'original' && !animator.transitioning) spriteCtx.drawImage(atlas,frame%16*128,Math.floor(frame/16)*128,128,128,64,32,128,128)
  else spriteCtx.putImageData(new ImageData(texture.render(pose),KYOGRE_WIDTH,KYOGRE_HEIGHT),0,0)
  ctx.globalAlpha = 1-pose.depth*.65; ctx.drawImage(sprite,0,0); ctx.globalAlpha = 1
  if (pose.depth > .3) { ctx.fillStyle = '#186c8c55'; ctx.fillRect(74,140,114,14); ctx.fillStyle = '#83d8e9'; ctx.fillRect(90,144,54,1) }
  ctx.globalAlpha = animator.transitioning ? Math.min(1,animator.elapsed/1100) : 1
  drawKyogreEffects(ctx,action,pose,animator.elapsed,kyogreMouth(pose),false,180,150,undefined,undefined,{x:24,y:115}); ctx.globalAlpha = 1
  const rect = canvas.getBoundingClientRect(); canvas.width = Math.max(1,Math.round(rect.width)); canvas.height = Math.max(1,Math.round(rect.height))
  const scale = Math.min(canvas.width/KYOGRE_WIDTH,canvas.height/KYOGRE_HEIGHT)
  context.fillStyle = '#000'; context.fillRect(0,0,canvas.width,canvas.height); context.imageSmoothingEnabled = false
  context.drawImage(world,(canvas.width-KYOGRE_WIDTH*scale)/2,(canvas.height-KYOGRE_HEIGHT*scale)/2,KYOGRE_WIDTH*scale,KYOGRE_HEIGHT*scale)
  status.textContent = (animator.transitioning ? 'Chuyển tư thế · ' : '')+labels[action]
  Object.assign(canvas.dataset,{ ready:'true', action, elapsed:String(Math.round(animator.elapsed)), frame:String(frame), transition:String(animator.transitioning), effect:['pulse','wave','rain'].includes(action) ? animator.elapsed/KYOGRE_DURATION[action] < .46 ? 'charge' : 'release' : '' })
}
new ResizeObserver(draw).observe(canvas)
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.addEventListener('click',() => {
  const action = button.dataset.action
  if (action !== 'auto' && action !== 'original' && !KYOGRE_ACTIONS.includes(action as typeof KYOGRE_ACTIONS[number])) return
  auto = action === 'auto'; animator.select(auto ? 'swim' : action as KyogreAction)
  document.querySelectorAll('[data-action]').forEach(item => item.setAttribute('aria-pressed',String(item === button))); draw()
}))
document.querySelector('#kyogre-pause')!.addEventListener('click',event => { paused = !paused; const button = event.currentTarget as HTMLButtonElement; button.setAttribute('aria-pressed',String(paused)); button.textContent = paused ? 'Tiếp tục' : 'Tạm dừng' })
function loaded(): void {
  if (texture) return
  const source = document.createElement('canvas'); source.width = source.height = 128
  const original = source.getContext('2d')!; original.drawImage(atlas,0,0,128,128,0,0,128,128)
  texture = new KyogreTexture(original.getImageData(0,0,128,128).data); animator.select('swim'); draw()
}
atlas.addEventListener('load',loaded,{ once:true }); atlas.addEventListener('error',() => { status.textContent = 'Không tải được sprite Kyogre. Hãy cài lại extension.' },{ once:true })
if (atlas.complete && atlas.naturalWidth) loaded()
function tick(now: number): void {
  const delta = last ? Math.max(0,Math.min(100,now-last)) : 0; last = now
  if (texture && !paused && !document.hidden) { clock += delta; animator.advance(delta,auto); if (now-paint >= 50) { paint = now; draw() } }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
