import {drawPlasmaRings} from './plasma-rings'
import { ARCEUS_EFFECT_SCALE } from './arceus-rig'
import { ARCEUS_CAST_MS, judgmentHitTime,judgmentStagger, type ArceusLife } from './arceus-life'
export type DivineTarget = { x: number; y: number; surface: number; water?: boolean }
export type JudgmentShot = { x: number; y: number; target: DivineTarget; progress: number; impact: number; bend: number }
/** Three staggered volleys fan out from the sky orb, then descend into all four targets. */
export function judgmentShots(center: number, elapsed: number, targets: DivineTarget[], skyY = 22): JudgmentShot[] {
  const p = elapsed / ARCEUS_CAST_MS, result: JudgmentShot[] = []
  for (let wave = 0; wave < 3; wave++) for (let i = 0; i < targets.length; i++) {
    const age = p - (.47 + wave * .08 + i * judgmentStagger(targets.length))
    if (age < 0 || age > .3) continue
    const target = targets[i], f = Math.min(1, age / .16)
    const side = target.x < center ? -1 : 1, bend = side * Math.sin(f * Math.PI) * (18 + wave * 11)
    result.push({ x: center + (target.x - center) * f + bend, y: skyY + (target.y - skyY) * f * f,
      target, progress: f, bend:18+wave*11, impact: age < .16 ? 0 : Math.min(1, (age - .16) / .14) })
  }
  return result
}
export function arceusContact(life: ArceusLife, index: number): number {
  if (life.stage !== 'cast') return 0
  const p = life.castElapsed / ARCEUS_CAST_MS
  if (life.skill === 'judgment') {
    let strength = 0
    for (let wave = 0; wave < 3; wave++) {
      const age = p - judgmentHitTime(wave, index,life.targetCount) / ARCEUS_CAST_MS
      if (age >= 0 && age < .14) strength = Math.max(strength, Math.min(1, age / .009) * (1 - age / .14))
    }
    return strength
  }
  if (life.skill === 'twister') return p > .58 && p < .87 ? Math.sin((p - .58) / .29 * Math.PI) : 0
  if (life.skill === 'hyper-beam') {const start=index===0?.4:index===2?.64:1,end=index===0?.62:.88;return p>start&&p<end?Math.sin((p-start)/(end-start)*Math.PI):0}
  return 0
}
export function arceusAssaultPower(elapsed:number):number {
 const q=(elapsed-4200)/4800
 return Math.min(1,Math.max(0,(q-.08)/.13))*Math.min(1,Math.max(0,(1-q)/.08))
}
const PLATE_COLORS = ['#dadddc','#ef744a','#55ace6','#ebbd68','#8dd875','#b1d6f8','#f3cb48','#b797e0','#ddb097','#8ad2d7','#dfa2d3','#aac077','#c68761','#baa8d7','#789deb','#caddad','#e7bfe1','#b6b9c0']
/** Orbiting elemental tablets are split behind/in front of the source-textured body. */
export function drawArceusHalo(ctx: CanvasRenderingContext2D, life: ArceusLife, center: number, front: boolean): void {
  if (!life.active) return
  const cy = 99 + life.heightOffset, turn = life.elapsed / 11000
  ctx.save(); ctx.globalAlpha = life.opacity * (front ? 1 : .65)
  const pixel = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h) }
  for (let i = 0; i < 18; i++) {
    const a = i * Math.PI / 9 + turn, depth = Math.sin(a), x = center + Math.cos(a) * 72 * ARCEUS_EFFECT_SCALE, y = cy + depth * 79 * ARCEUS_EFFECT_SCALE
    if ((depth >= 0) !== front) continue
    // Each tablet is a small outlined, tilted plaque with an elemental core and engraved rune.
    const tilt = Math.cos(a) * .5
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(tilt)
    pixel(-6,-4,12,8,'#9b8059'); pixel(-5,-4,10,8,'#fff1c4'); pixel(-4,-3,8,6,PLATE_COLORS[i])
    pixel(-1,-2,2,4,'#fff7de'); pixel(-3,0,6,1,'#fff7de'); pixel(4,-3,1,2,'#fffdf0')
    ctx.restore()
    if (i % 3 === 0) { pixel(x+9,y-6,3,1,'#fff0b6'); pixel(x+10,y-7,1,3,'#fff0b6') }
  }
  ctx.restore()
}
export function drawArceusEffects(ctx: CanvasRenderingContext2D, life: ArceusLife, center: number, width: number, targets: DivineTarget[], attackOrigins: { x: number; y: number; color?: string }[] = targets): void {
  if (!life.active) return
  const t = life.elapsed / 1000, p = life.castElapsed / ARCEUS_CAST_MS, skyY = Math.min(22,...targets.map(at=>at.y-30))
  const px = (x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))) }
  const ring = (x: number, y: number, radius: number, color: string, flat = 1, turn = 0) => {
    for (let i = 0; i < 72; i++) { const a = i * Math.PI / 36 + turn; px(x + Math.cos(a) * radius, y + Math.sin(a) * radius * flat, 2, 1, color) }
  }
  const orb = (x: number, y: number, radius: number, color = '#ffc65a') => {
    for (let row = -radius; row <= radius; row++) { const half = Math.sqrt(Math.max(0, radius * radius - row * row)); px(x - half, y + row, half * 2, 1, color) }
    for (let row = -radius * .55; row <= radius * .55; row++) { const half = Math.sqrt(Math.max(0, (radius * .55) ** 2 - row * row)); px(x - half, y + row, half * 2, 1, '#fff5cd') }
  }
  const beam = (ax: number, ay: number, bx: number, by: number, color: string, size = 2) => {
    const count = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2))
    for (let i = 0; i <= count; i++) { const f = i / count; px(ax + (bx - ax) * f - size / 2, ay + (by - ay) * f - size / 2, size, size, color) }
  }
  const sparks = (x: number, y: number, radius: number, color: string, count = 24) => {
    for (let i = 0; i < count; i++) { const f = (t * .7 + i / count) % 1, a = i * 2.399; px(x + Math.cos(a) * radius * f, y + Math.sin(a) * radius * f, 1 + i % 2, 2, i % 5 ? color : '#fffbea') }
  }
  ctx.save()
  // Low opacity preserves the black star sky rather than replacing the scene.
  ctx.globalAlpha = .12 * life.opacity; ctx.fillStyle = '#f5df9c'; ctx.fillRect(center - 1, 0, 3, 189)
  ctx.globalAlpha = life.opacity
  if (life.stage === 'arrival' || life.stage === 'departure') {
    const f = life.stage === 'arrival' ? life.elapsed / 2800 : (life.duration - life.elapsed) / 2600
    ring(center, 175, 48 * Math.min(1, f), '#fff0b0', .22, t)
    ring(center, 175, 61 * Math.min(1, f), '#a98c4a', .22, -t)
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + t * .2; px(center + Math.cos(a) * 56, 175 + Math.sin(a) * 12, 2, 3, '#ffe199') }
    for (let i = 0; i < 24; i++) { const a = i * 2.4 + t, y = 172 - (t * 34 + i * 9) % 150; px(center + Math.sin(a) * 33, y, 1, 3, '#f6dfa6') }
    for (let i = -3; i <= 3; i++) { ctx.globalAlpha = life.opacity * .05; ctx.fillStyle = '#fff2c3'; ctx.fillRect(center + i * 12 - 6, 0, 12, 178) }
    ctx.restore(); return
  }
  ring(center, 175, 49 + Math.sin(t) * 3, '#967840', .2, t * .2)
  if (life.stage === 'assault') {
    const q = (life.elapsed - 4200) / 4800, cy = 99, radius = 65 * ARCEUS_EFFECT_SCALE
    // All four attacks terminate at the barrier; nothing penetrates Arceus' body.
    ctx.globalAlpha = life.opacity * .12; ctx.fillStyle = '#fff1a7'
    for (let row = -Math.floor(radius); row <= radius; row++) { const half = Math.sqrt(Math.max(0, radius * radius - row * row)); ctx.fillRect(Math.round(center-half),cy+row,Math.round(half*2),1) }
    ctx.globalAlpha = life.opacity
    ring(center,cy,radius,'#ffe9a8',1, t); ring(center,cy,radius-4,'#a9ede5',1, -t)
    const colors = ['#72efa8','#f5a9ec','#88e4ff','#ffbf56','#e79cf5','#91ceff','#b773f8']
    attackOrigins.forEach((origin,index) => {
      const color=origin.color??colors[index%colors.length]
      const power=arceusAssaultPower(life.elapsed)
      if (!power) return
      const dx=origin.x-center,dy=origin.y-cy,length=Math.max(1,Math.hypot(dx,dy))
      const distance=Math.min(radius,length),end={x:center+dx/length*distance,y:cy+dy/length*distance}
      const tip={x:origin.x+(end.x-origin.x)*power,y:origin.y+(end.y-origin.y)*power}
      beam(origin.x,origin.y,tip.x,tip.y,color,index===3?7:5)
      beam(origin.x,origin.y,tip.x,tip.y,'#fffbe1',2)
      drawPlasmaRings(ctx,origin,tip,life.elapsed,power)
      for(let j=0;j<8;j++){const f=(t*2+j/8)%1*power;orb(origin.x+(end.x-origin.x)*f,origin.y+(end.y-origin.y)*f,index===3?3:2,color)}
      if(power>.95){ring(end.x,end.y,7+Math.sin(t*17)*2,color);sparks(end.x,end.y,23,color,18);beam(end.x,end.y,end.x+(origin.x-end.x)*.12,end.y+(origin.y-end.y)*.12,'#fff7cf',3)}
    })
    for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.4;px(center+Math.cos(a)*radius,cy+Math.sin(a)*radius,3,3,'#fff8cd')}
    ctx.restore(); return
  }
  if (life.stage !== 'cast') { sparks(center, 111, 48, '#fff0a9', 16); ctx.restore(); return }
  if (life.skill === 'judgment') {
    const charge = Math.min(1, p / .24), release = Math.min(1, Math.max(0, (p - .24) / .16))
    const ox = center - 37 * ARCEUS_EFFECT_SCALE * (1 - release), foreheadY = 99 + (64 - 99) * ARCEUS_EFFECT_SCALE, oy = foreheadY + (skyY - foreheadY) * release
    if (p < .56) {
      for (let i = 0; i < 3; i++) ring(ox, oy, (12 + i * 5) * charge, i % 2 ? '#fff8dc' : '#e9b94c', .72 + i * .09, t * (i % 2 ? -1 : 1))
      orb(ox, oy, 2 + charge * 10)
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + t, r = (t * 18 + i * 7) % 35; beam(ox + Math.cos(a) * r, oy + Math.sin(a) * r, ox + Math.cos(a) * (r + 8), oy + Math.sin(a) * (r + 8), '#ffe89a', 1) }
      if (p < .24) for (let i = 0; i < 28; i++) { const f = (t * .9 + i / 28) % 1, a = i * 2.4; px(ox + Math.cos(a) * 45 * (1 - f), oy + Math.sin(a) * 35 * (1 - f), 1, 2, '#ffdfa0') }
      if (p > .38) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, spread = Math.min(1, (p - .38) / .12); beam(ox, oy, ox + Math.cos(a) * 52 * spread, oy + Math.sin(a) * 20 * spread, '#e986b4', 3); beam(ox, oy, ox + Math.cos(a) * 52 * spread, oy + Math.sin(a) * 20 * spread, '#fff4bd', 1) }
    }
    if (p >= .4 && p < .92) { orb(center, skyY, 8 + Math.sin(t * 11) * 2); ring(center, skyY, 16, '#ee91cb', .7, t); sparks(center, skyY, 25, '#ffe7aa') }
    for (const shot of judgmentShots(center, life.castElapsed, targets, skyY)) {
      if (shot.progress < 1) {
        for (let j = 14; j > 0; j--) { const back = Math.max(0, shot.progress - j * .012), side = shot.target.x < center ? -1 : 1; const x = center + (shot.target.x - center) * back + side * Math.sin(back * Math.PI) * shot.bend, y = skyY + (shot.target.y - skyY) * back * back; px(x - 2, y - 2, j > 8 ? 2 : 4, j > 8 ? 3 : 5, j > 8 ? '#8c476f' : '#f6a6d3'); px(x, y, 1, 3, '#fff2bb') }
        orb(shot.x, shot.y, 3, '#ffb8dc')
      } else {
        const f = shot.impact, at = shot.target
        ctx.globalAlpha = (1 - f) * life.opacity
        beam(at.x, skyY-8, at.x, at.y, '#f1a0cd', 5); beam(at.x, skyY-8, at.x, at.y, '#fff6d2', 2)
        ring(at.x, at.y, 6 + f * 32, '#fff2b6', .7); ring(at.x, at.surface, 8 + f * 37, at.water ? '#a6e6fb' : '#e7ba78', .2)
        sparks(at.x, at.y, 20 + f * 38, '#ffdfa2', 30)
        for (let j = 0; j < 14; j++) { const a = j * 2.4; px(at.x + Math.cos(a) * f * 40, at.surface - Math.sin(f * Math.PI) * (14 + j % 4 * 5), 2, 3, at.water ? '#87d6ef' : '#b78d6d') }
        ctx.globalAlpha = life.opacity
      }
    }
  } else if (life.skill === 'twister') {
    const power = Math.sin(Math.min(1, p) * Math.PI), height = 132 * Math.min(1, p / .27)
    for (let row = 0; row < height; row += 2) {
      const f = row / height, r = (12 + f * 47) * power, y = 174 - row
      for (let band = 0; band < 3; band++) { const a = f * 19 - t * 9 + band * Math.PI * 2 / 3; px(center + Math.cos(a) * r, y, 5, 2, Math.sin(a) > 0 ? '#eadbff' : '#745c9c') }
    }
    if (p > .5 && p < .92) for (const target of targets) {
      const f = Math.min(1, (p - .5) / .15), cx = center + (target.x - center) * f
      for (let j = 0; j < 50; j++) { const a = j * .8 - t * 11, radius = 8 + j % 8 * 2; px(cx + Math.cos(a) * radius, target.y - 35 + j * 1.4 + Math.sin(a) * 5, 3, 2, j % 3 ? '#bcb0ec' : '#fff1fd') }
      ring(cx, target.surface, 27, '#e5ceff', .2, t)
    }
    sparks(center, 111, 54, '#c8b0e6', 40)
  } else if (life.skill === 'recover') {
    const power = Math.sin(p * Math.PI)
    for (let i = 0; i < 4; i++) ring(center, 110, (25 + i * 9) * power, i % 2 ? '#bcf6dc' : '#ffefba', .7, t * .3)
    for (const target of targets) { ring(target.x, target.surface, 25 * power, '#8ddbb5', .2, t); for (let i = 0; i < 8; i++) { const f = (t * .3 + i / 8) % 1; const x = target.x + Math.sin(i * 2.4) * 21, y = target.y + 27 - f * 60; px(x - 2, y, 5, 1, '#d3ffe0'); px(x, y - 2, 1, 5, '#d3ffe0') } }
    sparks(center, 105, 58, '#dfffe8', 40)
  } else {
    const mouth={x:center-38*ARCEUS_EFFECT_SCALE,y:99+(61-99)*ARCEUS_EFFECT_SCALE},charge=Math.min(1,p/.32)
    if(p<.4){orb(mouth.x,mouth.y,3+charge*10);ring(mouth.x,mouth.y,15*charge,'#ffb64b');sparks(mouth.x,mouth.y,33,'#ffd47a')}
    if(p>.35&&p<.9){
      const target=targets[p<.63?0:2]
      if(target){
        const dx=target.x-mouth.x,dy=target.y-mouth.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length
        const power=Math.min(1,(p-.35)/.05,(.9-p)/.03)
        for(let d=0;d<length;d+=2){const f=d/length,r=(3+f*13)*power,x=mouth.x+dx*f,y=mouth.y+dy*f;beam(x+nx*r,y+ny*r,x-nx*r,y-ny*r,'#ef9b2d',3);beam(x+nx*r*.6,y+ny*r*.6,x-nx*r*.6,y-ny*r*.6,'#fff0a1',3);px(x,y,3,2,'#fffceb')}
        for(let j=0;j<8;j++){const f=(t*1.8+j/8)%1;ring(mouth.x+dx*f,mouth.y+dy*f,5+f*15,'#ffb846',.8,t)}
        ring(target.x,target.y,18+Math.sin(t*12)*4,'#fff0b7');sparks(target.x,target.y,48,'#ffce80',35)
      }
    }
  }
  ctx.restore()
}
