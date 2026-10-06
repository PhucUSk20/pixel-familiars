import { arenaUsage,arenaUsageRows } from './arena-hud'
import { drawGroundDuel, drawMeteorRain } from './ground-duel-effects'
import { drawAirDuel } from './air-duel-effects'
import { DeoxysRenderer } from './deoxys-renderer'
import { DEOXYS_FORMS } from './deoxys-rig'
import { KyogreAnimator, KyogreTexture, KYOGRE_DURATION, kyogreMouth } from './primal-kyogre'
import { drawKyogreEffects,kyogreThunderActive } from './kyogre-effects'
import { ArenaLife, type ArenaMode } from './arena-life'
import { drawArenaScene } from './arena-scene'
import { MegaAnimator, MegaTexture, megaMouth, MEGA_DURATION, type MegaAction } from './mega-rayquaza'
import { GroudonAnimator, GroudonTexture, groudonMouth, GROUDON_DURATION, type GroudonAction } from './primal-groudon'

declare function acquireVsCodeApi():{postMessage(message:unknown):void}
const api=typeof acquireVsCodeApi==='function'?acquireVsCodeApi():undefined
let usage:unknown={},lastUsageKey=''
function renderUsage(now=Date.now()):void {
 const key=JSON.stringify([usage,Math.floor(now/60000)])
 if(key===lastUsageKey)return;lastUsageKey=key
 for(const row of arenaUsageRows(usage,now)){
  const element=document.querySelector<HTMLElement>(`.quota[data-key=${row.key}]`)!,meter=element.querySelector<HTMLElement>('.meter')!
  element.querySelector('label')!.textContent=row.label
  element.querySelector('output')!.textContent=row.value===undefined?'—':`${Math.round(row.value)}%`
  element.querySelector('.reset')!.textContent=row.reset?`↻${row.reset.replace('reset ','').split(' ')[0]}`:''
  element.dataset.low=String(row.value!==undefined&&row.value<=20)
  meter.querySelector<HTMLElement>('i')!.style.width=`${row.value??0}%`
  meter.setAttribute('aria-label',`${row.label} remaining: ${row.value===undefined?'unavailable':Math.round(row.value)+'%'}`)
  meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100')
  if(row.value===undefined)meter.removeAttribute('aria-valuenow');else meter.setAttribute('aria-valuenow',String(row.value))
  element.title=row.value===undefined?'Usage data is unavailable for the selected Codex session':`${row.label} remaining: ${Math.round(row.value)}%${row.reset?' · '+row.reset:''}`
 }
}
window.addEventListener('message',(event:MessageEvent<unknown>)=>{
 const message=event.data
 if(message&&typeof message==='object'&&(message as {type?:unknown}).type==='arena-usage'){usage=arenaUsage((message as {usage?:unknown}).usage);renderUsage()}
})
renderUsage();api?.postMessage({type:'arena-ready'})
const canvas = document.querySelector<HTMLCanvasElement>('#arena')!, ctx = canvas.getContext('2d')!
const status = document.querySelector<HTMLElement>('#arena-status')!
const ray = new MegaAnimator(), groudon = new GroudonAnimator(), kyogre = new KyogreAnimator()
const world = document.createElement('canvas'); world.width = 480; world.height = 224
const pen = world.getContext('2d')!
const raySprite = document.createElement('canvas'); raySprite.width = raySprite.height = 192
const groundSprite = document.createElement('canvas'); groundSprite.width = 256; groundSprite.height = 192
const seaSprite = document.createElement('canvas'); seaSprite.width = 256; seaSprite.height = 192
let seaTexture: KyogreTexture
let seaRevision = -1
let rayTexture: MegaTexture, groundTexture: GroudonTexture
const life = new ArenaLife()
const deoxysLife = life.deoxys
const deoxys = new DeoxysRenderer(DEOXYS_FORMS.map(form => document.querySelector<HTMLImageElement>(`#arena-deoxys-${form}`)!))
let last = 0, paint = 0, ready = false, rayRevision = -1, groundRevision = -1
const pixel = (x: number, y: number, w: number, h: number, color: string) => { pen.fillStyle = color; pen.fillRect(Math.round(x), Math.round(y), w, h) }
function ring(x: number, y: number, r: number, color: string): void {
  for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24; pixel(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2, color) }
}
function actions(): void {
  if (seaRevision !== life.kyogre.revision) { seaRevision = life.kyogre.revision; kyogre.select(life.kyogre.action) }
  if (rayRevision !== life.ray.revision) { rayRevision = life.ray.revision; ray.select(life.ray.action) }
  if (groundRevision !== life.groudon.revision) { groundRevision = life.groudon.revision; groudon.select(life.groudon.action) }
}
function draw(): void {
  if (!ready) return
  const rect = canvas.getBoundingClientRect()
  if (canvas.width !== Math.max(1, Math.round(rect.width))) canvas.width = Math.max(1, Math.round(rect.width))
  if (canvas.height !== Math.max(1, Math.round(rect.height))) canvas.height = Math.max(1, Math.round(rect.height))
  const scale = Math.min(canvas.width / 480, canvas.height / 224)
  const width = Math.max(480, Math.ceil(canvas.width / scale))
  if (world.width !== width) { world.width = width; life.resize(width) }
  pen.clearRect(0, 0, world.width, 224)
  const t = life.clock / 1000, p = (life.mode==='duel'?life.groundElapsed:life.duelElapsed) / 7000, beat = life.mode==='duel'?life.groundTurn:life.turn, mode = life.mode
  drawArenaScene(pen, t, world.width)
  const rp = ray.pose(), gp = groudon.pose(), kp = kyogre.pose()
  const waterHit=(mode==='duel'?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre')&&beat===0&&kyogre.elapsed/KYOGRE_DURATION.pulse>=.78&&kyogre.elapsed/KYOGRE_DURATION.pulse<.94
  const groundBattle=mode==='duel'?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre'
  const vortexHit=groundBattle&&beat===2&&kyogre.elapsed/KYOGRE_DURATION.wave>=.76&&kyogre.elapsed/KYOGRE_DURATION.wave<.94
  const bladesHit=groundBattle&&beat===2&&p>.58&&p<.85
  if(vortexHit){gp.x+=Math.sin(t*43)*3+4;gp.angle+=Math.sin(t*37)*.03;gp.head-=.1;gp.glow=1}
  if(bladesHit){kp.y-=Math.abs(Math.sin(t*31))*5;kp.angle+=Math.sin(t*29)*.04;kp.head-=.07}
  const thunderHit=(mode==='duel'?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre')&&beat===3&&kyogreThunderActive(kyogre.elapsed)
  if(thunderHit){gp.x+=Math.sin(t*65)*3;gp.angle+=Math.sin(t*53)*.025;gp.jaw+=.1;gp.glow=1}
  if(waterHit){gp.x+=Math.sin(t*35)*2+3;gp.angle+=Math.sin(t*24)*.018;gp.head-=.07;gp.jaw+=.06}

  const rx = life.ray.x, ry = life.ray.y + (life.ray.action === 'sleep' ? 0 : Math.sin(t * 1.1) * 3)
  const gx = life.groudon.x, gy = life.groudon.y
  raySprite.getContext('2d')!.putImageData(new ImageData(rayTexture.render(rp), 192, 192), 0, 0)
  groundSprite.getContext('2d')!.putImageData(new ImageData(groundTexture.render(gp), 256, 192), 0, 0)
  // Ray's source faces left; mirror the complete articulated sprite to face Groudon.
  if(mode==='duel'&&life.turn===2&&life.airDuel.stage==='fight') for(let i=3;i>0;i--){pen.save();pen.globalAlpha=.06*(4-i);pen.translate(rx+192-i*11,ry+i*4);pen.scale(-1,1);pen.drawImage(raySprite,0,0);pen.restore()}
  pen.save(); pen.translate(rx + (life.ray.right ? 192 : 0), ry); pen.scale(life.ray.right ? -1 : 1, 1); pen.drawImage(raySprite, 0, 0); pen.restore()
  pen.save(); pen.translate(gx + (life.groudon.right ? 330 : 0), gy); pen.scale(life.groudon.right ? -1 : 1, 1); pen.drawImage(groundSprite, 0, 0); pen.restore()
  if(thunderHit||vortexHit){pen.save();pen.globalAlpha=.45;pen.globalCompositeOperation='screen';pen.translate(gx+(life.groudon.right?330:0),gy);pen.scale(life.groudon.right?-1:1,1);pen.drawImage(groundSprite,0,0);pen.restore()}
  const kx = life.kyogre.x, ky = life.kyogre.y
  seaSprite.getContext('2d')!.putImageData(new ImageData(seaTexture.render(kp),256,192),0,0)
  pen.save(); pen.globalAlpha = 1-kp.depth*.6; pen.translate(kx+(life.kyogre.right ? 256 : 0),ky); pen.scale(life.kyogre.right ? -1 : 1,1); pen.drawImage(seaSprite,0,0); pen.restore()
  const groundPair=mode==='duel'?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre'
  const rm=megaMouth(rp),gm=groudonMouth(gp)
  const fireMouth={x:gx+(life.groudon.right?330-gm.x:gm.x),y:gy+gm.y}
  const km = kyogreMouth(kp), waterMouth = { x:kx+(life.kyogre.right ? 256-km.x : km.x), y:ky+km.y }
  pen.save(); pen.globalAlpha = kyogre.transitioning ? Math.min(1,kyogre.elapsed/1100) : 1
  if(!(groundPair&&beat===4))drawKyogreEffects(pen,kyogre.action,kp,kyogre.elapsed,waterMouth,life.kyogre.right,Math.max(1,fireMouth.x-waterMouth.x),189,groundPair&&beat===0?gx+145+gp.x:undefined,groundPair?{x:gx+160+gp.x,y:gy+70+gp.y}:undefined,groundPair?{x:gx+145+gp.x,y:gy+85+gp.y}:undefined); pen.restore()
  const rayAim={x:rx+(life.ray.right?192-rm.x:rm.x),y:ry+rm.y}
  deoxys.draw(pen,deoxysLife,52,false,mode==='duel',rayAim)
  const source = beat % 4 === 0 ? { x: rx + (life.ray.right ? 192 - rm.x : rm.x), y: ry + rm.y } : { x: gx + (life.groudon.right ? 330 - gm.x : gm.x), y: gy + gm.y }
  const target = beat % 4 === 0 ? { x: gx + 165, y: gy + 64 } : (mode==='duel'||life.opponent === 'kyogre') ? { x:kx+128,y:ky+95 } : { x: rx + 110, y: ry + 85 }
  let phase = 'idle'
  if (mode === 'duel') {
    phase=life.airDuel.phase
    const mouth={x:rx+(life.ray.right?192-rm.x:rm.x),y:ry+rm.y}
    drawAirDuel(pen,life.airDuel,mouth)
  }
  let groundEffect='idle'
  if(groundPair) {
    groundEffect=drawGroundDuel(pen,beat,mode==='duel'?life.groundElapsed:life.duelElapsed,waterMouth,fireMouth,{x:kx+128+kp.x,y:ky+95+kp.y},gx)
    phase=groundEffect;status.textContent=`Kyogre vs Groudon · ${['Hydro Cannon','Energy Burst','Precipice Blades','Meteor Rain','Water / Fire Clash'][beat]} · ${groundEffect}`
  } else if (mode==='duel'?life.groundState==='fight':life.state === 'duel') {
    const turn = beat % 4
    const color = turn === 0 ? '#68f1c8' : '#ff9254'
    if (!(turn === 0 && (mode==='duel'||life.opponent === 'kyogre')) && turn < 2 && p < .43) { phase = 'charge'; ring(source.x, source.y, 4 + p * 22, color) }
    else if (!(turn === 0 && (mode==='duel'||life.opponent === 'kyogre')) && turn < 2 && p < .7) {
      phase = 'projectile'; const travel = (p - .43) / .27
      ring(source.x + (target.x - source.x) * travel, source.y + (target.y - source.y) * travel, 7, color)
      for (let i = 8; i >= 0; i--) { const f = Math.max(0, travel - i * .018); pixel(source.x + (target.x - source.x) * f, source.y + (target.y - source.y) * f, 3 + (8 - i), 3, i > 4 ? '#686399' : color) }
    } else if (p >= .7 && p < .88) {
      phase = 'shield'; ring(target.x, target.y, 18 + (p - .7) * 50, '#9bd5ff'); ring(target.x, target.y, 12, color)
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; pixel(target.x + Math.cos(a) * (p - .7) * 150, target.y + Math.sin(a) * (p - .7) * 150, 2, 2, color) }
    } else phase = 'recover'
    if (beat % 4 === 2 && p > .35 && p < .85) for (let i = 0; i < 4; i++) { const h = Math.max(0, Math.sin(Math.min(1, Math.max(0, (p - .35 - i * .04) * 4)) * Math.PI)) * 42; pixel(gx - 14 - i * 23, 189 - h, 8, h, '#8b4835'); pixel(gx - 12 - i * 23, 190 - h, 2, h, '#ffc262') }
    if(beat%4===3)drawMeteorRain(pen,p,fireMouth,target)
    if (turn === 0 && (mode==='duel'||life.opponent === 'kyogre')) phase = p < .43 ? 'charge' : p < .7 ? 'projectile' : p < .88 ? 'shield' : 'recover'
    status.textContent = `Sparring · ${(mode==='duel'||life.opponent === 'kyogre') ? 'Kyogre & Groudon' : 'Rayquaza & Groudon'} · ${beat % 4 === 0 ? (mode==='duel'||life.opponent === 'kyogre') ? 'Hydro Cannon' : 'Dragon Pulse' : ['','Energy Burst','Precipice Blades','Eruption'][beat % 4]} · ${phase}`
  } else if(mode!=='duel') {
    if (life.ray.action === 'sleep' || life.groudon.action === 'sleep') { pen.fillStyle = '#b5e3df'; pen.font = '10px monospace'; pen.fillText('z Z', rx + 110, 44); pen.fillText('z Z', gx + 150, 64) }
    else { const x = 235 + Math.sin(t) * 45, y = 70 + Math.cos(t * 1.3) * 22; ring(x, y, 3, '#ffdb81'); pixel(x, y, 2, 2, '#fff2cc') }
    status.textContent = life.state === 'approach' ? 'Pets are moving into position…' : mode === 'rest' ? 'All four pets are resting' : `Auto · Rayquaza: ${life.ray.action} · Groudon: ${life.groudon.action} · Kyogre: ${life.kyogre.action}`
  }
  if(mode==='duel') {
    phase=life.airDuel.phase
    const names=['Dragon Pulse / Defense Barrier','Psycho Boost / Air Dodge','Extreme Speed / Dragon Chase','Psychic Pulse / Energy Clash']
    status.textContent=`Rayquaza vs Deoxys · ${names[life.turn]} · ${phase} | Kyogre vs Groudon · ${life.groundState==='fight'?['Hydro Cannon','Energy Burst','Precipice Blades','Meteor Rain','Water / Fire Clash'][life.groundTurn]:'approach'}`
  }
  status.textContent += ` · Deoxys: ${deoxysLife.form} / ${deoxysLife.state}`
  const shot=mode==='duel'?life.airDuel.shot:deoxys.projectile
  Object.assign(canvas.dataset,{vortexHit:String(vortexHit),bladesHit:String(bladesHit),thunderHit:String(thunderHit),thunderElapsed:String(kyogre.elapsed),waterHit:String(waterHit),groundEffect,fireMouthX:String(fireMouth.x),fireMouthY:String(fireMouth.y),waterMouthX:String(waterMouth.x),waterMouthY:String(waterMouth.y),rayAimX:String(rayAim.x),rayAimY:String(rayAim.y),shotTargetX:shot.target?String(shot.target.x):'',shotTargetY:shot.target?String(shot.target.y):'',airElapsed:String(life.airDuel.elapsed),deoxys:deoxysLife.form,deoxysState:deoxysLife.state,deoxysY:String(deoxysLife.y),groundState:life.groundState,groundTurn:String(life.groundTurn),groundElapsed:String(life.groundElapsed),airStage:life.airDuel.stage,airTurn:String(life.airDuel.turn),deoxysX:String(deoxysLife.x)})
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false
  ctx.drawImage(world, 0, (canvas.height - 224 * scale) / 2, world.width * scale, 224 * scale)
  Object.assign(canvas.dataset, { ready: 'true', mode, phase, elapsed: String(life.clock), ray: ray.action, groudon: groudon.action, state: life.state, rayX: String(rx), groundX: String(gx), rayY: String(ry), groundY: String(gy), worldWidth: String(world.width), coast: String(life.coast), kyogre:kyogre.action, kyogreX:String(kx), opponent:life.opponent })
}
document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.mode; if (mode !== 'play' && mode !== 'duel' && mode !== 'rest') return
  life.select(mode as ArenaMode); actions()
  document.querySelectorAll('button[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); draw()
}))
new ResizeObserver(draw).observe(canvas)
async function load(): Promise<void> {
  await deoxys.load()
  const images = ['#arena-ray', '#arena-groudon', '#arena-kyogre'].map(id => document.querySelector<HTMLImageElement>(id)!)
  await Promise.all(images.map(image => image.complete && image.naturalWidth ? Promise.resolve() : new Promise<void>((resolve, reject) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', reject, { once: true }) })))
  const source = document.createElement('canvas'); source.width = source.height = 128; const context = source.getContext('2d')!
  const data = images.map(image => { context.clearRect(0, 0, 128, 128); context.drawImage(image, 0, 0, 128, 128, 0, 0, 128, 128); return context.getImageData(0, 0, 128, 128).data })
  rayTexture = new MegaTexture(data[0]); groundTexture = new GroudonTexture(data[1]); seaTexture = new KyogreTexture(data[2]); ready = true; actions(); draw()
}
void load().catch(() => { status.textContent = 'Unable to load sprites. Reinstall the extension.' })
function tick(now: number): void {
  renderUsage()
  const delta = last ? Math.max(0, Math.min(100, now - last)) : 0; last = now
  if (ready && !document.hidden) {
    life.advance(delta); actions()
    // Attacks finish once per turn; breathing and roaming motions keep looping.
    ray.advance(life.state === 'duel' ? Math.max(0, Math.min(delta, MEGA_DURATION[ray.action] - 1 - ray.elapsed)) : delta, false)
    kyogre.advance((life.mode==='duel'?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre') ? Math.max(0, Math.min(delta, KYOGRE_DURATION[kyogre.action]-1-kyogre.elapsed)) : delta,false)
    groudon.advance((life.mode==='duel'?life.groundState==='fight':life.state==='duel') ? Math.max(0, Math.min(delta, GROUDON_DURATION[groudon.action] - 1 - groudon.elapsed)) : delta, false)
    if (now - paint >= 50) { paint = now; draw() }
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

