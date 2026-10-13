import {PORTAL_FORMS,encounterContact,type PortalForm} from './portal-paradox-life'
import {drawPortalParadox,type EncounterAnchor} from './portal-paradox-effects'
import {drawStellarMagma} from './stellar-magma-effects'
import {RIDER_FORMS,type RiderForm} from './rider-life'
import {riderPose} from './rider-rig'
import {drawRiderEffects} from './rider-effects'
import {AVIAN_FORMS,type AvianForm} from './avian-life'
import {AvianTexture,avianPose} from './avian-rig'
import {drawAvianEffects,hoohRainbow,type AvianAnchors} from './avian-effects'
import {GALAR_FORMS,type GalarForm} from './galar-life'
import {GalarTexture,galarPose} from './galar-rig'
import {drawGalarEffects,type GalarAnchors} from './galar-effects'
import {KALOS_FORMS,type KalosForm} from './kalos-life'
import {KalosTexture,kalosPose} from './kalos-rig'
import {drawKalosEffects,type KalosAnchors} from './kalos-effects'
import {UNOVA_FORMS,type UnovaForm} from './unova-life'
import {UnovaTexture,unovaPose} from './unova-rig'
import {drawUnovaEffects,type UnovaAnchors} from './unova-effects'
import {drawUltraBattle} from './ultra-effects'
import {NecrozmaTexture,necrozmaPose} from './necrozma-rig'
import {drawNecrozmaEffects} from './necrozma-effects'
import type {NecrozmaForm} from './necrozma-life'
import {CelestialTexture,celestialPose} from './sun-moon-rig'
import {drawCelestialEffects,celestialCollision,celestialBackdrops} from './sun-moon-effects'
import {giratinaClashes} from './giratina-clash'
import {spritePoint,RAY_SCALE,DEOXYS_SCALE,ULTRA_SCALE,ETERNATUS_SCALE} from './arena-scale'
import {frenzyContact} from './aerial-finale'
import {GiratinaTexture,giratinaPose,giratinaHeight,giratinaShieldActive,giratinaShieldCrown} from './giratina'
import {drawGiratinaEffects,drawGiratinaShield,giratinaHits} from './giratina-effects'
import { CreationTexture,creationPose } from './creation-rig'
import { drawCreationPortals,drawCreationBattle,drawCreationShields,creationCollision,type CreationAnchors } from './creation-effects'
import { ArceusTexture,arceusPose } from './arceus-rig'
import { arceusContact,drawArceusEffects,drawArceusHalo,arceusAssaultPower } from './arceus-effects'
import { contactStrength,groundFireHit } from './arena-hit'
import { arenaUsage,arenaUsageRows } from './arena-hud'
import { drawGroundDuel, drawMeteorRain } from './ground-duel-effects'
import { drawAirDuel } from './air-duel-effects'
import { DeoxysRenderer } from './deoxys-renderer'
import { DEOXYS_FORMS } from './deoxys-rig'
import { KyogreAnimator, KyogreTexture, KYOGRE_DURATION, kyogreMouth } from './primal-kyogre'
import { drawKyogreEffects,kyogreThunderActive } from './kyogre-effects'
import { ArenaLife, type ArenaMode } from './arena-life'
import { drawArenaScene } from './arena-scene'
import { MegaAnimator, MegaTexture, megaMouth,megaPose, MEGA_DURATION, type MegaAction } from './mega-rayquaza'
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
const divineSprite=document.createElement('canvas');divineSprite.width=divineSprite.height=192
const creationSprites=['palkia','dialga'].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
const rayLight=document.createElement('canvas');rayLight.width=rayLight.height=192
const shadowSprite=document.createElement('canvas');shadowSprite.width=shadowSprite.height=192
let shadowTexture:GiratinaTexture
const necrozmaSprite=document.createElement('canvas');necrozmaSprite.width=necrozmaSprite.height=192
let necrozmaTextures:Record<NecrozmaForm,NecrozmaTexture>
let galarTextures:Record<GalarForm,GalarTexture>
let portalImages:Record<PortalForm,HTMLImageElement>
let riderTextures:Record<RiderForm,AvianTexture>
const riderSprites=[0,1,2,3].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
let avianTextures:Record<AvianForm,AvianTexture>
const avianSprites=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
const galarSprites=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
let kalosTextures:Record<KalosForm,KalosTexture>
const kalosSprites=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
let unovaTextures:Record<UnovaForm,UnovaTexture>
const unovaSprites=[0,1,2].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
let celestialTextures:CelestialTexture[]=[]
const celestialSprites=['lunala','solgaleo'].map(()=>{const c=document.createElement('canvas');c.width=c.height=192;return c})
let celestialFront:{x:number;y:number}|undefined
let celestialLayerY:number|undefined
let creationTextures: CreationTexture[]=[]
let previousScale=0,previousViewportWidth=0,previousViewportHeight=0
let extraSky=160,creationRift:{x:number;y:number}[]|undefined,riftWidth=480
let divineTexture: ArceusTexture
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
  const height=224+Math.round(extraSky)
  if(world.height!==height)world.height=height
  document.querySelector<HTMLButtonElement>('#arena-necrozma')!.disabled=life.necrozma.active||life.arceus.active
  document.querySelector<HTMLButtonElement>('#arena-ultra')!.disabled=life.necrozma.active
  const celestialButton=document.querySelector<HTMLButtonElement>('#arena-celestial')!;celestialButton.disabled=life.sunMoon.active||life.arceus.active
  const scale = Math.min(canvas.width / 480, canvas.height / height)
  const width = Math.max(480, Math.ceil(canvas.width / scale))
  const cameraOnly=previousScale>0&&previousViewportWidth===canvas.width&&previousViewportHeight===canvas.height
  if(previousScale&&cameraOnly&&previousScale!==scale){
    const ratio=previousScale/scale;life.resizeCamera(width,ratio)
    if(celestialFront)celestialFront.x*=ratio
    if(creationRift)for(const point of creationRift)point.x*=ratio
  }else if(world.width!==width){life.resize(width);if(celestialFront)celestialFront.x+=(width-riftWidth)/2;if(creationRift)for(const point of creationRift)point.x+=(width-riftWidth)/2}
  world.width=width
  previousScale=scale;previousViewportWidth=canvas.width;previousViewportHeight=canvas.height
  riftWidth=world.width
  if(!life.creation.active)creationRift=undefined
  if(!life.sunMoon.active){celestialFront=undefined;celestialLayerY=undefined}
  pen.clearRect(0, 0, world.width, world.height)
  pen.save();pen.imageSmoothingEnabled=false;pen.translate(0,world.height-224)
  const paired=life.residentDuel
  const t = life.clock / 1000, p = (paired?life.groundElapsed:life.duelElapsed) / 7000, beat = paired?life.groundTurn:life.turn, mode = life.mode
  drawArenaScene(pen, t, world.width)
  const divine=life.arceus.active,ultraBoss=life.ultraBoss,ultra=life.necrozma.battle,ultraFire=ultraBoss&&ultra.stage==='ultra-fire',ultraAssault=ultraBoss&&ultra.stage==='ultra-assault',bossContact=(index:number,shield=false)=>ultraBoss?ultra.contact(index,shield):0,fright=ultraBoss?Math.min(1,ultra.elapsed/1200)*ultra.opacity:divine?Math.min(1,life.arceus.elapsed/1200)*life.arceus.opacity:0
  // Facing is a presentation override: preserve every actor's normal direction through the visit.
  const facingPets=[life.ray,life.kyogre,life.groudon,life.creation.palkia,life.creation.dialga,life.creation.giratina,life.sunMoon.lunala,life.sunMoon.solgaleo,...life.unova.pets,...life.kalos.pets,...life.galar.pets,...life.avian.visiblePets,...life.rider.pets,...life.hoopa.pets,...life.paradox.pets,life.necrozma.actor]
  const originalFacing=facingPets.map(pet=>pet.right)
  if(divine)facingPets.forEach(pet=>{pet.right=pet.x+(pet===life.kyogre?128:pet===life.groudon?154:96)<world.width/2})
  try {
  const divineGroundHit=arceusContact(life.arceus,3)||bossContact(3)
  const rp = ray.pose(), gp = groudon.pose(), kp = kyogre.pose()
  const ap=life.airDuel.elapsed/life.airDuel.duration,airFight=paired&&life.airDuel.stage==='fight'
  const ultimate=airFight&&life.airDuel.turn===4
  const gather=ultimate?Math.min(1,Math.max(0,(life.airDuel.elapsed-4500)/700)):0
  if(ultimate&&life.airDuel.elapsed<14500)Object.assign(rp,megaPose(life.airDuel.elapsed<5000?'roar':'dash',life.airDuel.elapsed<5000?life.airDuel.elapsed:3000))
  const autoTarget=deoxys.projectile.target,baseRayMouth=megaMouth(rp)
  const autoContact=mode==='play'&&deoxysLife.state==='skill'&&autoTarget&&Math.hypot(autoTarget.x-spritePoint(life.ray,baseRayMouth,RAY_SCALE,life.ray.right).x,autoTarget.y-spritePoint(life.ray,baseRayMouth,RAY_SCALE,life.ray.right).y)<32?contactStrength(deoxysLife.elapsed/6500,.77,.95):0
  const legacyFight=mode==='play'&&life.state==='duel'&&life.opponent==='ray'
  const legacyRayHit=legacyFight?(beat===1?contactStrength(p,.7,.88):beat===3?groundFireHit(beat,p):0):0
  const dragonHit=legacyFight&&beat===0?contactStrength(p,.7,.88):0
  const rayHit=arceusContact(life.arceus,0)||bossContact(0)||legacyRayHit||autoContact||(airFight&&life.airDuel.turn===2?frenzyContact(life.airDuel.elapsed):0)
  const deoxysHit=arceusContact(life.arceus,1)||bossContact(1)||(airFight?life.airDuel.turn===0?contactStrength(ap,.7,.9):life.airDuel.turn===2?contactStrength(ap,.82,.95):life.airDuel.turn===4?contactStrength(life.airDuel.elapsed,13200,15100):0:0)
  if(fright){rp.headAngle-=fright*.13;rp.jaw+=fright*.07;gp.head-=fright*.11;gp.leftArm+=fright*.1;gp.rightArm-=fright*.08;gp.x+=Math.sin(t*29)*fright*1.3;kp.head-=fright*.12;kp.angle+=Math.sin(t*23)*fright*.018}
  if(divineGroundHit){gp.x+=Math.sin(t*42)*divineGroundHit*4;gp.head-=divineGroundHit*.1;gp.glow=1}
  if(rayHit){rp.angle+=rayHit*Math.sin(t*38)*.035;rp.headAngle-=rayHit*.1}
  const waterHit=(paired?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre')&&beat===0&&kyogre.elapsed/KYOGRE_DURATION.pulse>=.78&&kyogre.elapsed/KYOGRE_DURATION.pulse<.94
  const groundBattle=paired?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre'
  const vortexHit=groundBattle&&beat===2&&kyogre.elapsed/KYOGRE_DURATION.wave>=.76&&kyogre.elapsed/KYOGRE_DURATION.wave<.94
  const bladesHit=groundBattle&&beat===2&&p>.58&&p<.85
  if(vortexHit){gp.x+=Math.sin(t*43)*3+4;gp.angle+=Math.sin(t*37)*.03;gp.head-=.1;gp.glow=1}
  const fireHit=arceusContact(life.arceus,2)||bossContact(2)||(groundBattle?groundFireHit(beat,p):0)
  if(fireHit){kp.x+=(life.kyogre.right?1:-1)*fireHit*8;kp.y-=Math.abs(Math.sin(t*31))*7*fireHit;kp.angle+=Math.sin(t*29)*.055*fireHit;kp.head-=.1*fireHit}
  const thunderHit=(paired?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre')&&beat===3&&kyogreThunderActive(kyogre.elapsed)
  if(thunderHit){gp.x+=Math.sin(t*65)*3;gp.angle+=Math.sin(t*53)*.025;gp.jaw+=.1;gp.glow=1}
  if(dragonHit){gp.x+=dragonHit*7;gp.angle+=Math.sin(t*35)*.035*dragonHit;gp.head-=.12*dragonHit;gp.glow=1}
  if(waterHit){const force=contactStrength(kyogre.elapsed/KYOGRE_DURATION.pulse,.78,.94);gp.x+=(5+Math.sin(t*35)*3)*force;gp.angle+=Math.sin(t*24)*.035*force;gp.head-=.12*force;gp.jaw+=.1*force;gp.glow=1}

  const rx = life.ray.x+(life.ray.right?-1:1)*rayHit*8, ry = life.ray.y + (life.ray.action === 'sleep' ? 0 : Math.sin(t * 1.1) * 3)
  const gx = life.groudon.x, gy = life.groudon.y
  raySprite.getContext('2d')!.putImageData(new ImageData(rayTexture.render(rp), 192, 192), 0, 0)
  groundSprite.getContext('2d')!.putImageData(new ImageData(groundTexture.render(gp), 256, 192), 0, 0)
  // Ray's source faces left; mirror the complete articulated sprite to face Groudon.
  if(paired&&life.turn===2&&life.airDuel.stage==='fight') for(let i=3;i>0;i--){pen.save();pen.globalAlpha=.06*(4-i);pen.translate(rx+96-i*11,ry+96+i*4);pen.scale(-RAY_SCALE,RAY_SCALE);pen.drawImage(raySprite,-96,-96);pen.restore()}
  const paintRay=(image:HTMLCanvasElement,x=rx,y=ry)=>{pen.save();pen.translate(x+96,y+96);pen.scale(life.ray.right?-RAY_SCALE:RAY_SCALE,RAY_SCALE);pen.drawImage(image,-96,-96);pen.restore()}
  paintRay(raySprite)
  if(ultimate&&life.airDuel.elapsed<14500){const c=rayLight.getContext('2d')!;c.clearRect(0,0,192,192);c.drawImage(raySprite,0,0);c.save();c.globalCompositeOperation='source-in';c.fillStyle='#fff09a';c.fillRect(0,0,192,192);c.restore();pen.save();pen.globalCompositeOperation='screen';pen.globalAlpha=.25+Math.min(1,life.airDuel.elapsed/2800)*.45;paintRay(rayLight);pen.restore()}
  if(rayHit){pen.save();pen.globalAlpha=rayHit*.6;pen.globalCompositeOperation='screen';paintRay(raySprite);pen.restore()}
  pen.save(); pen.translate(gx + (life.groudon.right ? 330 : 0), gy); pen.scale(life.groudon.right ? -1 : 1, 1); pen.drawImage(groundSprite, 0, 0); pen.restore()
  if(thunderHit||vortexHit||waterHit||dragonHit||divineGroundHit){pen.save();pen.globalAlpha=.45;pen.globalCompositeOperation='screen';pen.translate(gx+(life.groudon.right?330:0),gy);pen.scale(life.groudon.right?-1:1,1);pen.drawImage(groundSprite,0,0);pen.restore()}
  const kx = life.kyogre.x, ky = life.kyogre.y
  seaSprite.getContext('2d')!.putImageData(new ImageData(seaTexture.render(kp),256,192),0,0)
  pen.save(); pen.globalAlpha = 1-kp.depth*.6; pen.translate(kx+(life.kyogre.right ? 256 : 0),ky); pen.scale(life.kyogre.right ? -1 : 1,1); pen.drawImage(seaSprite,0,0); pen.restore()
  if(fireHit){pen.save();pen.globalAlpha=fireHit*.65;pen.globalCompositeOperation='screen';pen.translate(kx+(life.kyogre.right?256:0),ky);pen.scale(life.kyogre.right?-1:1,1);pen.drawImage(seaSprite,0,0);pen.restore()}
  const groundPair=paired?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre'
  const rm=megaMouth(rp),gm=groudonMouth(gp)
  const fireMouth={x:gx+(life.groudon.right?330-gm.x:gm.x),y:gy+gm.y}
  const km = kyogreMouth(kp), waterMouth = { x:kx+(life.kyogre.right ? 256-km.x : km.x), y:ky+km.y }
  pen.save(); pen.globalAlpha = kyogre.transitioning ? Math.min(1,kyogre.elapsed/1100) : 1
  if(!divine&&!ultraBoss&&!(groundPair&&beat===4))drawKyogreEffects(pen,kyogre.action,kp,kyogre.elapsed,waterMouth,life.kyogre.right,Math.max(1,fireMouth.x-waterMouth.x),189,groundPair&&beat===0?gx+145+gp.x:undefined,groundPair?{x:gx+160+gp.x,y:gy+70+gp.y}:undefined,groundPair?{x:gx+145+gp.x,y:gy+85+gp.y}:undefined,{pulseTop:gy+groudonMouth(groudon.pose()).y,stormLeft:0}); pen.restore()
  const rayAim=spritePoint({x:rx,y:ry},rm,RAY_SCALE,life.ray.right)
  deoxys.draw(pen,deoxysLife,52,false,paired||divine||ultraBoss,rayAim,deoxysHit,fright,{flip:divine&&life.deoxys.x+96<world.width/2,scale:DEOXYS_SCALE,opacity:paired?life.airDuel.deoxysOpacity:1,pose:airFight&&life.airDuel.turn===2?{leftArm:Math.sin(life.airDuel.elapsed*.017)*.65,rightArm:Math.sin(life.airDuel.elapsed*.019+1)*.65,head:-.08,glow:1}:ultimate&&life.airDuel.elapsed<14500?{leftArm:.25+gather*.9,rightArm:-.25-gather*.2,head:-.1-gather*.08,glow:1}:undefined})
  const source = beat % 4 === 0 ? rayAim : { x: gx + (life.groudon.right ? 330 - gm.x : gm.x), y: gy + gm.y }
  const target = beat % 4 === 0 ? { x: gx + 165, y: gy + 64 } : (paired||life.opponent === 'kyogre') ? { x:kx+128,y:ky+95 } : { x: rx + 110, y: ry + 85 }
  let phase = 'idle'
  if (paired) {
    phase=life.airDuel.phase
    const mouth=rayAim
    drawAirDuel(pen,life.airDuel,mouth)
  }
  let groundEffect='idle'
  if(groundPair) {
    groundEffect=drawGroundDuel(pen,beat,paired?life.groundElapsed:life.duelElapsed,waterMouth,fireMouth,{x:kx+128+kp.x,y:ky+95+kp.y},gx)
    phase=groundEffect;status.textContent=`Kyogre vs Groudon · ${['Hydro Cannon','Energy Burst','Precipice Blades','Meteor Rain','Water / Fire Clash'][beat]} · ${groundEffect}`
  } else if (paired?life.groundState==='fight':life.state === 'duel') {
    const turn = beat % 4
    const color = turn === 0 ? '#68f1c8' : '#ff9254'
    if (!(turn === 0 && (paired||life.opponent === 'kyogre')) && turn < 2 && p < .43) { phase = 'charge'; ring(source.x, source.y, 4 + p * 22, color) }
    else if (!(turn === 0 && (paired||life.opponent === 'kyogre')) && turn < 2 && p < .7) {
      phase = 'projectile'; const travel = (p - .43) / .27
      ring(source.x + (target.x - source.x) * travel, source.y + (target.y - source.y) * travel, 7, color)
      for (let i = 8; i >= 0; i--) { const f = Math.max(0, travel - i * .018); pixel(source.x + (target.x - source.x) * f, source.y + (target.y - source.y) * f, 3 + (8 - i), 3, i > 4 ? '#686399' : color) }
    } else if (p >= .7 && p < .88) {
      phase = 'shield'; ring(target.x, target.y, 18 + (p - .7) * 50, '#9bd5ff'); ring(target.x, target.y, 12, color)
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; pixel(target.x + Math.cos(a) * (p - .7) * 150, target.y + Math.sin(a) * (p - .7) * 150, 2, 2, color) }
    } else phase = 'recover'
    if (beat % 4 === 2 && p > .35 && p < .85) for (let i = 0; i < 4; i++) { const h = Math.max(0, Math.sin(Math.min(1, Math.max(0, (p - .35 - i * .04) * 4)) * Math.PI)) * 42; pixel(gx - 14 - i * 23, 189 - h, 8, h, '#8b4835'); pixel(gx - 12 - i * 23, 190 - h, 2, h, '#ffc262') }
    if(beat%4===3)drawMeteorRain(pen,p,fireMouth,target)
    if (turn === 0 && (paired||life.opponent === 'kyogre')) phase = p < .43 ? 'charge' : p < .7 ? 'projectile' : p < .88 ? 'shield' : 'recover'
    status.textContent = `Sparring · ${(paired||life.opponent === 'kyogre') ? 'Kyogre & Groudon' : 'Rayquaza & Groudon'} · ${beat % 4 === 0 ? (paired||life.opponent === 'kyogre') ? 'Hydro Cannon' : 'Dragon Pulse' : ['','Energy Burst','Precipice Blades','Eruption'][beat % 4]} · ${phase}`
  } else if(!paired) {
    if (life.ray.action === 'sleep' || life.groudon.action === 'sleep') { pen.fillStyle = '#b5e3df'; pen.font = '10px monospace'; pen.fillText('z Z', rx + 110, 44); pen.fillText('z Z', gx + 150, 64) }
    else { const x = 235 + Math.sin(t) * 45, y = 70 + Math.cos(t * 1.3) * 22; ring(x, y, 3, '#ffdb81'); pixel(x, y, 2, 2, '#fff2cc') }
    status.textContent = life.state === 'approach' ? 'Pets are moving into position…' : mode === 'rest' ? 'All four pets are resting' : `Auto · Rayquaza: ${life.ray.action} · Groudon: ${life.groudon.action} · Kyogre: ${life.kyogre.action}`
  }
  if(paired) {
    phase=life.airDuel.phase
    const names=['Flamethrower / Defense Barrier','Energy Orb Clash','Extreme Speed / Tentacle Frenzy','Psychic Pulse / Energy Clash','Dragon Ascent / Psycho Boost']
    status.textContent=`Rayquaza vs Deoxys · ${names[life.turn]} · ${phase} | Kyogre vs Groudon · ${life.groundState==='fight'?['Hydro Cannon','Energy Burst','Precipice Blades','Meteor Rain','Water / Fire Clash'][life.groundTurn]:'approach'}`
  }
  const creationAnchors: CreationAnchors[]=[]
  const shadowHits=giratinaHits(life.creation)
  const creationHits=[arceusContact(life.arceus,4)||bossContact(4,true)||shadowHits.rivals,arceusContact(life.arceus,5)||bossContact(5,true)||shadowHits.rivals]
  let shadowCrown:{x:number;y:number}|undefined
  const shadowProtected=giratinaShieldActive(life.creation,ultraFire||divine&&life.arceus.stage==='cast')
  let shadowAnchors:{mouth:{x:number;y:number};left:{x:number;y:number};right:{x:number;y:number}}|undefined
  if(life.creation.active){
    drawCreationPortals(pen,life.creation)
    for(const [i,pet] of [life.creation.palkia,life.creation.dialga].entries()){
      const pose=creationPose(i===0?'palkia':'dialga',life.creation,fright,creationHits[i],(divine&&life.arceus.stage==='assault')||ultraAssault),texture=creationTextures[i],sprite=creationSprites[i]
      sprite.getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
      pen.save();pen.imageSmoothingEnabled=false;pen.globalAlpha=life.creation.opacity
      pen.translate(pet.x+(pet.right?192:0),pet.y);pen.scale(pet.right?-1:1,1);pen.drawImage(sprite,0,0)
      if(creationHits[i]){pen.globalCompositeOperation='screen';pen.globalAlpha=life.creation.opacity*creationHits[i]*.5;pen.drawImage(sprite,0,0)}
      pen.restore()
      const anchor=(kind:'mouth'|'gem'|'hand')=>{const at=texture.anchor(kind,pose);return{x:pet.x+(pet.right?192-at.x:at.x),y:pet.y+at.y}}
      creationAnchors.push({mouth:anchor('mouth'),gem:anchor('gem'),hand:anchor('hand')})
    }
    if(life.creation.trio){
      const pet=life.creation.giratina,hit=arceusContact(life.arceus,6)||bossContact(6,true)||shadowHits.body,pose=giratinaPose(life.creation,hit,(divine&&life.arceus.stage==='assault')||ultraAssault),offset=giratinaHeight(life.creation)
      const shadow=shadowProtected ? .28 : life.creation.stage==='departure'?life.creation.phaseProgress:0
      const shadowPixels=shadowTexture.render(pose,shadow),shadowFlip=divine&&pet.right,shadowOrigin={x:pet.x,y:pet.y+offset}
      if(shadowFlip)for(let y=0;y<192;y++)for(let x=0;x<96;x++)for(let c=0;c<4;c++){const a=(y*192+x)*4+c,b=(y*192+191-x)*4+c,temp=shadowPixels[a];shadowPixels[a]=shadowPixels[b];shadowPixels[b]=temp}
      shadowCrown=giratinaShieldCrown(shadowPixels,shadowOrigin)
      shadowSprite.getContext('2d')!.putImageData(new ImageData(shadowPixels,192,192),0,0)
      pen.save();pen.globalAlpha=life.creation.opacity;pen.beginPath();pen.rect(0,-world.height,world.width,189+world.height);pen.clip();if(shadowProtected)drawGiratinaShield(pen,shadowPixels,shadowOrigin,arceusContact(life.arceus,6),life.clock);pen.globalAlpha=life.creation.opacity;pen.drawImage(shadowSprite,pet.x,pet.y+offset)
      if(hit){pen.globalCompositeOperation='screen';pen.globalAlpha=hit*.45;pen.drawImage(shadowSprite,pet.x,pet.y+offset)}pen.restore()
      const anchor=(kind:'mouth'|'left'|'right')=>{const at=shadowTexture.anchor(kind,pose);return{x:pet.x+(shadowFlip?192-at.x:at.x),y:pet.y+offset+at.y}}
      shadowAnchors={mouth:anchor('mouth'),left:anchor('left'),right:anchor('right')}
    }
    if(life.creation.stage==='signature-fire'&&life.creation.phaseProgress>.5)creationRift=shadowAnchors?giratinaClashes(creationAnchors[0],creationAnchors[1],shadowAnchors,true):[creationCollision(creationAnchors[0],creationAnchors[1],true)]
    drawCreationBattle(pen,life.creation,creationAnchors[0],creationAnchors[1],creationRift,shadowAnchors)
    if(shadowAnchors)drawGiratinaEffects(pen,life.creation,shadowAnchors,creationAnchors)
    if(ultraFire||divine&&life.arceus.stage==='cast'&&life.arceus.skill==='judgment'){
      drawCreationShields(pen,life.creation,creationHits,life.clock)
    }
    if(!divine)status.textContent=`${life.creation.trio?'Palkia & Dialga vs Giratina':'Palkia vs Dialga'} · ${life.creation.stage} · Spacial Rend / Roar of Time`
  }
  const celestialAnchors:{x:number;y:number;color:string}[]=[],celestialHits=[arceusContact(life.arceus,life.celestialTargetIndex)||bossContact(life.celestialTargetIndex),arceusContact(life.arceus,life.celestialTargetIndex+1)||bossContact(life.celestialTargetIndex+1)]
  if(life.sunMoon.active){
    const visit=life.sunMoon,poses=(["lunala","solgaleo"] as const).map(name=>celestialPose(name,visit)),pets=[visit.lunala,visit.solgaleo].map((pet,i)=>life.necrozma.active?{...pet,...life.necrozma.host(i?'solgaleo':'lunala',pet)}:{...pet,opacity:1})
    if(celestialFront&&celestialLayerY!==undefined)celestialFront.y+=visit.lunala.y-celestialLayerY
    celestialLayerY=visit.lunala.y
    poses.forEach((pose,i)=>{if(life.necrozma.active){const n=life.necrozma,host=i?'solgaleo':'lunala',charging=n.stage.endsWith('charge')||n.stage==='restoration-fire',strength=charging?n.stage.endsWith('charge')?n.progress:1:0;pose.mane=i?strength:0;pose.fold=i?0:strength*.4;pose.head+=i?strength*.24:-strength*.1;if(n.opponent===host&&n.stage.endsWith('fire'))pose.lean+=Math.sin(t*22)*.025}})
    poses.forEach((pose,i)=>{if(divine||ultraBoss){pose.head-=fright*.1;pose.lean+=Math.sin(t*29)*celestialHits[i]*.045;pose.lift-=celestialHits[i]*4;if(life.arceus.stage==='assault'||ultraAssault){pose.fold=i?0:.25;pose.head-=.08}}})
    const anchors=pets.map((pet,i)=>{const at=celestialTextures[i].anchor(poses[i]);return{x:pet.x+(pet.right?192-at.x:at.x),y:pet.y+at.y}})
    const gem=celestialTextures[1].anchor(poses[1],'forehead'),forehead={x:visit.solgaleo.x+(visit.solgaleo.right?192-gem.x:gem.x),y:visit.solgaleo.y+gem.y}
    if(['ordinary-charge','signature-charge'].includes(visit.stage)||!celestialFront)celestialFront=celestialCollision(anchors[0],anchors[1])
    celestialAnchors.push(...anchors.map((at,i)=>({...at,color:i?'#ffd05b':'#c5a4ff'})))
    if(!life.necrozma.active)drawCelestialEffects(pen,visit,anchors[0],anchors[1],celestialFront,true,forehead,{width:world.width,top:224-world.height})
    pets.forEach((pet,i)=>{
      const pose=poses[i],hit=celestialHits[i]
      const sprite=celestialSprites[i],c=sprite.getContext('2d')!;c.putImageData(new ImageData(celestialTextures[i].render(pose),192,192),0,0)
      pen.save();pen.globalAlpha=visit.opacity*pet.opacity;pen.translate(pet.x+(pet.right?192:0),pet.y);pen.scale(pet.right?-1:1,1);pen.drawImage(sprite,0,0)
      if(visit.stage==='signature-charge'||visit.stage==='signature-fire'||hit||(divine&&life.arceus.stage==='assault')||ultraAssault){
        c.save();c.globalCompositeOperation='source-in';c.fillStyle=i?'#fff1aa':'#c6faff';c.fillRect(0,0,192,192);c.restore();pen.globalCompositeOperation='screen';pen.globalAlpha=visit.opacity*(hit?hit*.65:visit.stage==='signature-charge'?visit.progress*.55:.55);pen.drawImage(sprite,0,0)
      }
      pen.restore()
    })
    if(!life.necrozma.active)drawCelestialEffects(pen,visit,anchors[0],anchors[1],celestialFront,false,forehead,{width:world.width,top:224-world.height})
    status.textContent=`Lunala & Solgaleo friendly encounter - ${visit.stage} - Lunar / Solar Beam`
  }
  if(life.necrozma.active){
    const visit=life.necrozma,pet=visit.actor,ultraHit=visit.battle.allied?arceusContact(life.arceus,life.ultraTargetIndex):0,origin={x:pet.x,y:pet.y+visit.heightOffset},pose=necrozmaPose(visit,life.clock)
    if(ultraHit){pose.lean+=Math.sin(t*35)*ultraHit*.055;pose.lift-=ultraHit*6}
    const hosts=[life.sunMoon.lunala,life.sunMoon.solgaleo].map((pet,i)=>{const pose=celestialPose(i?'solgaleo':'lunala',life.sunMoon),at=celestialTextures[i].anchor(pose);return{x:pet.x+(pet.right?192-at.x:at.x),y:pet.y+at.y}})
    drawNecrozmaEffects(pen,visit,origin,hosts,true)
    const c=necrozmaSprite.getContext('2d')!;c.putImageData(new ImageData(necrozmaTextures[visit.form].render(pose),192,192),0,0)
    pen.save();pen.globalAlpha=visit.opacity;pen.translate(origin.x+96,origin.y+96);const size=visit.form==='ultra'?ULTRA_SCALE:1;pen.scale((divine?(visit.actor.right?-1:1):(visit.form==='dusk'||visit.form==='ultra'?-1:1))*size,size);pen.translate(-96,-96);pen.drawImage(necrozmaSprite,0,0)
    if(visit.form==='ultra'||visit.flash){c.save();c.globalCompositeOperation='source-in';c.fillStyle='#fff3aa';c.fillRect(0,0,192,192);c.restore();pen.globalCompositeOperation='screen';pen.globalAlpha=visit.opacity*(visit.flash*.6+(visit.form==='ultra'?.3:0)+ultraHit*.4);pen.drawImage(necrozmaSprite,0,0)}pen.restore()
    drawNecrozmaEffects(pen,visit,origin,hosts)
    status.textContent=`Necrozma - ${visit.form} - ${visit.stage}`
  }
  const unovaAnchors:UnovaAnchors[]=[]
  const unovaHits:number[]=[]
  if(life.unova.active){
    const visit=life.unova,forms:UnovaForm[]=['reshiram','zekrom',visit.form]
    visit.pets.forEach((pet,index)=>{
      const hit=divine?arceusContact(life.arceus,life.unovaTargetIndex+index):bossContact(life.unovaTargetIndex+index),pose=unovaPose(visit,index,life.clock,hit,divine&&life.arceus.stage==='assault'||ultraBoss&&ultra.stage==='ultra-assault'),texture=unovaTextures[forms[index]]
      const movingHost=index===(visit.white?0:1)&&(visit.stage==='absorb'||visit.stage==='release'),q=movingHost?(visit.stage==='absorb'?visit.progress:1-visit.progress):0
      const x=pet.x+(visit.kyurem.x-pet.x)*q,y=pet.y+(visit.kyurem.y-pet.y)*q+(index===2&&visit.stage==='kyurem-arrival'?-55*(1-visit.progress):0)
      const anchor=(kind:'mouth'|'tail'|'back')=>{const at=texture.anchor(pose,kind);return{x:x+(pet.right?192-at.x:at.x),y:y+at.y}}
      unovaAnchors.push({mouth:anchor('mouth'),tail:anchor('tail'),back:anchor('back')});unovaHits.push(hit)
      unovaSprites[index].getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
    })
    drawUnovaEffects(pen,visit,unovaAnchors,true)
    visit.pets.forEach((pet,index)=>{
      const host=index===(visit.white?0:1)&&(visit.stage==='absorb'||visit.stage==='release'),q=host?(visit.stage==='absorb'?visit.progress:1-visit.progress):0,x=pet.x+(visit.kyurem.x-pet.x)*q,y=pet.y+(visit.kyurem.y-pet.y)*q+(index===2&&visit.stage==='kyurem-arrival'?-55*(1-visit.progress):0)
      pen.save();pen.globalAlpha=visit.opacityFor(index);if(unovaHits[index]>.2){pen.shadowColor='#d7f7ff';pen.shadowBlur=5}pen.translate(Math.round(x+(pet.right?192:0)),Math.round(y));if(pet.right)pen.scale(-1,1);pen.drawImage(unovaSprites[index],0,0);pen.restore()
    })
    drawUnovaEffects(pen,visit,unovaAnchors)
    status.textContent=`Unova Dragons - ${visit.form} - ${visit.stage}`
  }
  const kalosAnchors:KalosAnchors[]=[]
  const kalosHits:number[]=[]
  if(life.kalos.active){
    const visit=life.kalos,forms:KalosForm[]=['xerneas','yveltal',visit.form]
    visit.pets.forEach((pet,index)=>{
      const hit=divine?arceusContact(life.arceus,life.kalosTargetIndex+index):bossContact(life.kalosTargetIndex+index),pose=kalosPose(visit,index,life.clock,hit+(index<2?visit.pairHit:0),divine&&life.arceus.stage==='assault'||ultraBoss&&ultra.stage==='ultra-assault'),texture=kalosTextures[forms[index]],offset=visit.offset(index),x=pet.x+offset.x,y=pet.y+offset.y
      const anchor=(kind:'mouth'|'tail'|'back')=>{const at=texture.anchor(pose,kind);return{x:x+(pet.right?192-at.x:at.x),y:y+at.y}}
      kalosAnchors.push({mouth:anchor('mouth'),tail:anchor('tail'),back:anchor('back')});kalosHits.push(hit)
      kalosSprites[index].getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
    })
    drawKalosEffects(pen,visit,kalosAnchors,true)
    visit.pets.forEach((pet,index)=>{const offset=visit.offset(index);pen.save();pen.globalAlpha=visit.opacityFor(index);pen.translate(Math.round(pet.x+offset.x+(pet.right?192:0)),Math.round(pet.y+offset.y));if(pet.right)pen.scale(-1,1);pen.drawImage(kalosSprites[index],0,0);pen.restore()})
    drawKalosEffects(pen,visit,kalosAnchors)
    status.textContent=`Kalos Guardians - ${visit.form} - ${visit.stage}`
  }
  const galarAnchors:GalarAnchors[]=[]
  const galarHits:number[]=[]
  if(life.galar.active){
    const visit=life.galar,forms:GalarForm[]=['zacian-crowned','zamazenta-crowned',visit.form]
    visit.pets.forEach((pet,index)=>{
      const hit=divine?arceusContact(life.arceus,life.galarTargetIndex+index):bossContact(life.galarTargetIndex+index),pose=galarPose(visit,index,life.clock,hit+(index<2?visit.hit:0),divine&&life.arceus.stage==='assault'||ultraBoss&&ultra.stage==='ultra-assault'),texture=galarTextures[forms[index]],offset=visit.offset(index),x=pet.x+offset.x,y=pet.y+offset.y
      const anchor=(kind:'mouth'|'tail'|'back')=>{const at=texture.anchor(pose,kind);return{x:x+(pet.right?192-at.x:at.x),y:y+at.y}}
      galarAnchors.push({mouth:anchor('mouth'),tail:anchor('tail'),back:anchor('back')});galarHits.push(hit)
      galarSprites[index].getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
    })
    drawGalarEffects(pen,visit,galarAnchors,true)
    visit.pets.forEach((pet,index)=>{const offset=visit.offset(index);pen.save();pen.globalAlpha=visit.opacityFor(index);pen.translate(pet.x+offset.x+96,pet.y+offset.y+96);const size=index===2?ETERNATUS_SCALE:1;pen.scale((pet.right?-1:1)*size,size);pen.drawImage(galarSprites[index],-96,-96);pen.restore()})
    drawGalarEffects(pen,visit,galarAnchors)
    status.textContent=`Galar Heroes - ${visit.form} - ${visit.stage}`
  }
  const avianAnchors:AvianAnchors[]=[]
  if(life.avian.active){
    const visit=life.avian,forms:AvianForm[]=['ho-oh','lugia',visit.form]
    visit.visiblePets.forEach((pet,index)=>{
      const hit=divine?arceusContact(life.arceus,life.avianTargetIndex+index):bossContact(life.avianTargetIndex+index),pose=avianPose(visit,index,life.clock,hit,divine&&life.arceus.stage==='assault'||ultraBoss&&ultra.stage==='ultra-assault'),texture=avianTextures[forms[index]],offset=visit.offset(index)
      const anchor=(kind:'mouth'|'hand')=>{const at=texture.anchor(pose,kind);return{x:pet.x+offset.x+(pet.right?192-at.x:at.x),y:pet.y+offset.y+at.y}}
      avianAnchors.push({mouth:anchor('mouth'),hand:anchor('hand')});avianSprites[index].getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
    })
    drawAvianEffects(pen,visit,avianAnchors,true)
    visit.visiblePets.forEach((pet,index)=>{const offset=visit.offset(index);pen.save();pen.globalAlpha=visit.opacityFor(index);pen.translate(pet.x+offset.x+(pet.right?192:0),pet.y+offset.y);if(pet.right)pen.scale(-1,1);pen.drawImage(avianSprites[index],0,0);pen.restore()})
    drawAvianEffects(pen,visit,avianAnchors)
  }
  document.querySelector<HTMLButtonElement>('#arena-avian')!.disabled=life.avian.active||divine||life.necrozma.active&&!ultraBoss
  Object.assign(canvas.dataset,{rainbowX:String(hoohRainbow(life.avian.width).x),rainbowY:String(hoohRainbow(life.avian.width).y),rainbowTop:String(hoohRainbow(life.avian.width).top),avianStage:life.avian.stage,avianElapsed:String(life.avian.elapsed),avianForm:life.avian.form,avianCount:String(life.avian.visiblePets.length),residentCount:'4',avianMewtwo:String(life.avian.hasMewtwo),avianWing:String(avianPose(life.avian,0,life.clock).wing),hoohScreenX:String(life.avian.hooh.x+life.avian.offset(0).x),lugiaOffsetY:String(life.avian.offset(1).y),hoohY:String(life.avian.hooh.y),lugiaY:String(life.avian.lugia.y),mewtwoY:String(life.avian.mewtwo.y)})
  const riderAnchors:AvianAnchors[]=[]
  if(life.rider.active){
    const visit=life.rider
    visit.pets.forEach((pet,index)=>{
      const texture=index===0?avianTextures[visit.mewtwoForm]:riderTextures[index===1?'terapagos-stellar':index===2?visit.form:'mega-heatran'],hit=divine?arceusContact(life.arceus,life.riderTargetIndex+index):bossContact(life.riderTargetIndex+index),pose=riderPose(visit,index===2?1:index===0?0:2,life.clock,hit),offset=visit.offset(index)
      const anchor=(kind:'mouth'|'hand')=>{const at=texture.anchor(pose,kind);return{x:pet.x+offset.x+(pet.right?192-at.x:at.x),y:pet.y+offset.y+at.y}}
      riderAnchors.push({mouth:anchor('mouth'),hand:anchor('hand')});riderSprites[index].getContext('2d')!.putImageData(new ImageData(texture.render(pose),192,192),0,0)
    })
    const psychic=Object.assign(Object.create(visit),{calyrex:visit.terapagos}) as typeof visit
    const mounted=Object.assign(Object.create(visit),{mewtwo:visit.heatran,offset:(i:number)=>visit.offset(i===0?3:2)}) as typeof visit
    drawRiderEffects(pen,psychic,riderAnchors.slice(0,2),true,'psychic');drawRiderEffects(pen,mounted,[riderAnchors[3],riderAnchors[2]],true,'rider');drawStellarMagma(pen,visit,riderAnchors,true)
    visit.pets.forEach((pet,index)=>{const offset=visit.offset(index);pen.save();pen.globalAlpha=visit.opacity;pen.translate(pet.x+offset.x+(pet.right?192:0),pet.y+offset.y);if(pet.right)pen.scale(-1,1);pen.drawImage(riderSprites[index],0,0);pen.restore()})
    drawRiderEffects(pen,psychic,riderAnchors.slice(0,2),false,'psychic');drawRiderEffects(pen,mounted,[riderAnchors[3],riderAnchors[2]],false,'rider');drawStellarMagma(pen,visit,riderAnchors)
  }
  document.querySelector<HTMLButtonElement>('#arena-rider')!.disabled=life.rider.active||divine||life.necrozma.active&&!ultraBoss
  Object.assign(canvas.dataset,{riderStage:life.rider.stage,riderCount:String(life.rider.active?4:0),riderForm:life.rider.form,riderMewtwo:life.rider.mewtwoForm,riderElapsed:String(life.rider.elapsed),riderFrozen:String(life.rider.frozen),terapagosY:String(life.rider.terapagos.y),terapagosX:String(life.rider.terapagos.x+96),heatranX:String(life.rider.heatran.x+96),riderX:String(life.rider.calyrex.x+96),riderMewtwoX:String(life.rider.mewtwo.x+96),deoxysCoreY:String(life.deoxys.y+74.4)})
  const portalAnchors:EncounterAnchor[]=[]
  for(const visit of [life.hoopa,life.paradox]){
    if(!visit.active)continue
    const anchors:EncounterAnchor[]=[],baseIndex=visit.kind==='hoopa'?life.portalTargetIndex:life.paradoxTargetIndex
    visit.pets.forEach((pet,index)=>{
      const offset=visit.offset(index),form=visit.forms[index],size=visit.kind==='hoopa'?.85:1
      const mouth= form==='hoopa-unbound'?{x:84,y:71}:form.startsWith('mega-lat')?{x:70,y:70}:form==='koraidon'?{x:71,y:71}:{x:76,y:64}
      const at=(point:{x:number;y:number})=>({x:pet.x+offset.x+96+(pet.right?96-point.x:point.x-96)*size,y:pet.y+offset.y+88+(point.y-88)*size})
      anchors.push({body:at({x:96,y:88}),mouth:at(mouth)})
    })
    portalAnchors.push(...anchors);drawPortalParadox(pen,visit,anchors,true)
    visit.pets.forEach((pet,index)=>{
      const offset=visit.offset(index),form=visit.forms[index],frame=Math.floor(life.clock/50)%160,size=visit.kind==='hoopa'?.85:1
      const hit=divine?arceusContact(life.arceus,baseIndex+index):ultraBoss?bossContact(baseIndex+index):encounterContact(visit,index)
      pen.save();pen.globalAlpha=visit.opacity;pen.translate(pet.x+offset.x+96,pet.y+offset.y+88);pen.scale(pet.right?-size:size,size);pen.rotate(hit*Math.sin(t*31)*.055)
      pen.drawImage(portalImages[form],frame%16*128,Math.floor(frame/16)*128,128,128,-64,-64,128,128)
      if(hit){pen.globalCompositeOperation='screen';pen.globalAlpha*=hit*.45;pen.drawImage(portalImages[form],frame%16*128,Math.floor(frame/16)*128,128,128,-64,-64,128,128)}pen.restore()
    })
    drawPortalParadox(pen,visit,anchors)
  }
  for(const kind of ['hoopa','paradox'] as const){const visit=life[kind];document.querySelector<HTMLButtonElement>(`#arena-${kind}`)!.disabled=visit.active||divine||life.necrozma.active&&!ultraBoss}
  Object.assign(canvas.dataset,{hoopaCount:String(life.hoopa.active?3:0),paradoxCount:String(life.paradox.active?2:0),hoopaStage:life.hoopa.stage,paradoxStage:life.paradox.stage,hoopaY:String(life.hoopa.pets[0].y),paradoxY:String(life.paradox.pets[0].y),koraidonX:String(life.paradox.pets[0].x+96),miraidonX:String(life.paradox.pets[1].x+96),portalFrame:String(Math.floor(life.clock/50)%160),portalFacingCorrect:String(!divine||[...life.hoopa.pets,...life.paradox.pets].every(pet=>pet.right===(pet.x+96<world.width/2)))})
  const ultraAt={x:life.necrozma.actor.x+96,y:life.necrozma.actor.y+79.5+life.necrozma.heightOffset}
  const allVisitorAnchors=[...creationAnchors,...(shadowAnchors?[{mouth:shadowAnchors.mouth,hand:shadowAnchors.left,gem:shadowAnchors.right}]:[])]
  const attackOrigins=[rayAim,{x:deoxysLife.x+96,y:deoxysLife.y+75,color:'#f5a9ec'},waterMouth,fireMouth,...allVisitorAnchors.map(at=>at.mouth),...celestialAnchors,...unovaAnchors.map(at=>at.mouth),...kalosAnchors.map(at=>at.mouth),...galarAnchors.map(at=>at.mouth),...avianAnchors.map(at=>at.mouth),...riderAnchors.map(at=>at.mouth),...portalAnchors.map(at=>at.mouth)]
  if(ultraBoss){drawUltraBattle(pen,ultra,ultraAt,attackOrigins.map(at=>({...at,surface:Math.max(at.y+35,189)})),world.width);status.textContent=`Ultra Necrozma boss - ${ultra.stage} - Light That Burns the Sky`}
  const shields=divine&&life.arceus.stage==='cast'&&life.arceus.skill==='judgment'?[{index:0,pet:life.ray,color:'#ffe18d',radius:54},...(life.unova.active?[{index:life.unovaTargetIndex+2,pet:life.unova.pets[2],color:'#baf6ff',radius:52}]:[]),...(life.kalos.active?[{index:life.kalosTargetIndex+2,pet:life.kalos.pets[2],color:'#9affb3',radius:56}]:[]),...(life.galar.active?[{index:life.galarTargetIndex+2,pet:life.galar.pets[2],color:'#ef94ff',radius:58}]:[]),...(life.rider.active?[{index:life.riderTargetIndex,pet:life.rider.mewtwo,color:'#d2a3ff',radius:49}]:[]),...(ultra.allied?[{index:life.ultraTargetIndex,pet:life.necrozma.actor,color:'#fff1a5',radius:57}]:[])].map(s=>({...s,x:s.pet.x+96,y:s.pet.y+85})):[]
  const shieldTarget=(at:{x:number;y:number;surface:number;water?:boolean},index:number)=>{const shield=shields.find(s=>s.index===index);return shield?{x:shield.x,y:shield.y-shield.radius,surface:shield.y-shield.radius+4}:at}
  if(divine){
    const pose=arceusPose(life.arceus.skill,life.arceus.stage==='cast'?life.arceus.castElapsed:life.arceus.elapsed,life.arceus.stage==='cast')
    divineSprite.getContext('2d')!.putImageData(new ImageData(divineTexture.render(pose),192,192),0,0)
    drawArceusHalo(pen,life.arceus,world.width/2,false)
    pen.save();pen.globalAlpha=life.arceus.opacity;pen.imageSmoothingEnabled=false
    pen.drawImage(divineSprite,world.width/2-96,7+life.arceus.heightOffset);pen.restore()
    drawArceusHalo(pen,life.arceus,world.width/2,true)
    const visitors=allVisitorAnchors.map((at,index)=>{const pet=index===2?life.creation.giratina:index?life.creation.dialga:life.creation.palkia,shield=(index<2?life.creation.shields[index]:life.creation.shadowShield)&&life.arceus.skill==='judgment';return shield?index===2&&shadowCrown?{...shadowCrown,surface:shadowCrown.y+4}:{x:pet.x+96,y:pet.y+20,surface:pet.y+25}:{x:at.mouth.x,y:at.mouth.y,surface:at.mouth.y+55}})
    drawArceusEffects(pen,life.arceus,world.width/2,world.width,[{x:rayAim.x,y:rayAim.y,surface:189},{x:deoxysLife.x+96,y:deoxysLife.y+75,surface:189},{x:kx+128,y:ky+94,surface:189,water:true},{x:gx+154,y:gy+80,surface:189},...visitors,...celestialAnchors.map(at=>({...at,surface:at.y+45})),...unovaAnchors.map(at=>({...at.mouth,surface:at.mouth.y+45})),...kalosAnchors.map(at=>({...at.mouth,surface:at.mouth.y+45})),...galarAnchors.map(at=>({...at.mouth,surface:at.mouth.y+45})),...avianAnchors.map(at=>({...at.mouth,surface:at.mouth.y+45})),...riderAnchors.map(at=>({...at.mouth,surface:at.mouth.y+45})),...portalAnchors.map(at=>({...at.body,surface:at.body.y+40})),...(ultra.allied?[{...ultraAt,surface:ultraAt.y+45}]:[])].map(shieldTarget),[rayAim,{x:deoxysLife.x+96,y:deoxysLife.y+75},waterMouth,fireMouth,...allVisitorAnchors.map(at=>at.mouth),...celestialAnchors,...unovaAnchors.map((at,i)=>({...at.mouth,color:i===0?'#6ceaff':i===1?'#5dbfff':'#bcf1ff'})),...kalosAnchors.map((at,i)=>({...at.mouth,color:i===0?'#a9faff':i===1?'#ff95c9':life.kalos.mega?'#d99cff':'#98ffab'})),...galarAnchors.map((at,i)=>({...at.mouth,color:i===0?'#94eeff':i===1?'#ffc59a':'#f99ad8'})),...avianAnchors.map((at,i)=>({...at.mouth,color:['#ffc56d','#b5ffe9','#d8a3ff'][i]})),...riderAnchors.map((at,i)=>({...at.mouth,color:i===0?'#d8a3ff':i===1?'#c2ffff':i===3?'#ffc25b':life.rider.form==='calyrex-ice-rider'?'#c1f7ff':'#bf6cff'})),...portalAnchors.map(at=>({...at.mouth,color:'#d3b0ff'})),...(ultra.allied?[{...ultraAt,color:'#ffe48c'}]:[])])
    for(const shield of shields){
      pen.save();const hit=arceusContact(life.arceus,shield.index);pen.globalAlpha=.7+hit*.3;pen.fillStyle=shield.color
      for(let ring=0;ring<2;ring++)for(let i=0;i<120;i++){const a=i*Math.PI/60,r=shield.radius+ring*3;pen.fillRect(Math.round(shield.x+Math.cos(a)*r),Math.round(shield.y+Math.sin(a)*r),2,2)}
      pen.globalAlpha=.12+hit*.2;pen.beginPath();pen.arc(shield.x,shield.y,shield.radius,0,Math.PI*2);pen.fill();pen.restore()
    }
    if(ultra.allied){const dx=ultraAt.x-world.width/2,dy=ultraAt.y-99,d=Math.max(1,Math.hypot(dx,dy));drawUltraBattle(pen,ultra,ultraAt,[],world.width,{elapsed:life.arceus.elapsed,target:{x:world.width/2+dx/d*45,y:99+dy/d*45},power:life.arceus.stage==='assault'?arceusAssaultPower(life.arceus.elapsed):0,charge:life.arceus.stage==='arrival'||life.arceus.stage==='awe'?Math.min(1,life.arceus.elapsed/4200):0})}
    status.textContent=`Arceus · ${life.arceus.stage==='cast'?life.arceus.skill:life.arceus.stage} · The nearby pets brace in awe`
  }
  Object.assign(canvas.dataset,{judgmentShields:String(shields.length),rayFacing:String(life.ray.right),mewtwoFacing:String(life.rider.mewtwo.right),arceusFacingCorrect:String(!divine||facingPets.every(pet=>pet.right===(pet.x+(pet===life.kyogre?128:pet===life.groudon?154:96)<world.width/2)))})
  status.textContent += ` · Deoxys: ${deoxysLife.form} / ${deoxysLife.state}`
  const shot=paired?life.airDuel.shot:deoxys.projectile
  Object.assign(canvas.dataset,{ultraBoss:String(ultraBoss),ultraAllied:String(ultra.allied),ultraStage:ultra.stage,ultraElapsed:String(ultra.elapsed),ultraAssaultTargets:String(ultraBoss?attackOrigins.length:0),ultraHit:String(bossContact(0)),ultraX:String(life.necrozma.actor.x),ultraY:String(life.necrozma.actor.y),ultraScale:String(ULTRA_SCALE),ultraRight:String(divine?life.necrozma.actor.right:true),eternatusScale:String(ETERNATUS_SCALE),ultraJudgmentHit:String(ultra.allied?arceusContact(life.arceus,life.ultraTargetIndex):0),necrozmaStage:life.necrozma.stage,necrozmaForm:life.necrozma.form,necrozmaElapsed:String(life.necrozma.elapsed),necrozmaOpacity:String(life.necrozma.opacity),lunalaVisible:String(life.necrozma.active?life.necrozma.host('lunala',life.sunMoon.lunala).opacity:life.sunMoon.opacity),solgaleoVisible:String(life.necrozma.active?life.necrozma.host('solgaleo',life.sunMoon.solgaleo).opacity:life.sunMoon.opacity)})
  Object.assign(canvas.dataset,{celestialStage:life.sunMoon.stage,celestialElapsed:String(life.sunMoon.elapsed),celestialOpacity:String(life.sunMoon.opacity),celestialCount:String(life.sunMoon.active?2:0),celestialFrontX:String(celestialFront?.x??''),celestialFrontY:String(celestialFront?.y??''),rayScale:String(RAY_SCALE),deoxysScale:String(DEOXYS_SCALE),airFinale:life.airDuel.finale,deoxysShield:String(life.airDuel.shieldActive),deoxysOpacity:String(paired?life.airDuel.deoxysOpacity:1),arceusStage:life.arceus.stage,arceusSkill:life.arceus.skill,arceusElapsed:String(life.arceus.elapsed),arceusX:String(world.width/2),arceusY:String(7+life.arceus.heightOffset),arceusPlates:String(divine?18:0),arceusShield:String(life.arceus.stage==='assault'),fright:String(fright),divineGroundHit:String(divineGroundHit),fireHit:String(fireHit),rayHit:String(rayHit),deoxysHit:String(deoxysHit),jetTop:String(gy+groudonMouth(groudon.pose()).y),vortexHit:String(vortexHit),bladesHit:String(bladesHit),thunderHit:String(thunderHit),thunderElapsed:String(kyogre.elapsed),waterHit:String(waterHit),groundEffect,fireMouthX:String(fireMouth.x),fireMouthY:String(fireMouth.y),waterMouthX:String(waterMouth.x),waterMouthY:String(waterMouth.y),rayAimX:String(rayAim.x),rayAimY:String(rayAim.y),shotTargetX:shot.target?String(shot.target.x):'',shotTargetY:shot.target?String(shot.target.y):'',airElapsed:String(life.airDuel.elapsed),deoxys:deoxysLife.form,deoxysState:deoxysLife.state,deoxysY:String(deoxysLife.y),groundState:life.groundState,groundTurn:String(life.groundTurn),groundElapsed:String(life.groundElapsed),airStage:life.airDuel.stage,airTurn:String(life.airDuel.turn),deoxysX:String(deoxysLife.x)})
  document.querySelector<HTMLButtonElement>('#arena-all')!.disabled = divine||life.summoningAll
  document.querySelector<HTMLButtonElement>('#arena-summon')!.disabled = divine
  document.querySelector<HTMLButtonElement>('#arena-creation')!.disabled = divine||life.creation.active||life.necrozma.active&&!ultra.active
  Object.assign(canvas.dataset,{lunalaFold:String(celestialPose('lunala',life.sunMoon).fold),solgaleoMane:String(celestialPose('solgaleo',life.sunMoon).mane),lunalaX:String(life.sunMoon.lunala.x),solgaleoX:String(life.sunMoon.solgaleo.x),lunalaY:String(life.sunMoon.lunala.y),lunalaHit:String(celestialHits[0]),solgaleoHit:String(celestialHits[1])})
  document.querySelector<HTMLButtonElement>('#arena-unova')!.disabled=life.unova.active||divine||life.necrozma.active&&!ultraBoss
  Object.assign(canvas.dataset,{unovaStage:life.unova.stage,unovaElapsed:String(life.unova.elapsed),unovaForm:life.unova.form,unovaWhite:String(life.unova.white),unovaCount:String(life.unova.active?3:0),unovaHostOpacity:String(life.unova.opacityFor(life.unova.white?0:1)),unovaKyuremOpacity:String(life.unova.opacityFor(2)),unovaKyuremY:String(life.unova.kyurem.y),unovaKyuremHit:String(unovaHits[2]??0),unovaMissiles:String(life.unova.stage==='missile-fire'?4:0)})
  document.querySelector<HTMLButtonElement>('#arena-kalos')!.disabled=life.kalos.active||divine||life.necrozma.active&&!ultraBoss
  document.querySelector<HTMLButtonElement>('#arena-galar')!.disabled=life.galar.active||divine||life.necrozma.active&&!ultraBoss
  Object.assign(canvas.dataset,{kalosStage:life.kalos.stage,kalosElapsed:String(life.kalos.elapsed),kalosForm:life.kalos.form,kalosCount:String(life.kalos.active?3:0),kalosGuardianOpacity:String(life.kalos.opacityFor(2)),kalosHit:String(kalosHits[2]??0)})
  Object.assign(canvas.dataset,{galarStage:life.galar.stage,galarElapsed:String(life.galar.elapsed),galarForm:life.galar.form,galarCount:String(life.galar.active?3:0),galarEnemyOpacity:String(life.galar.opacityFor(2)),galarHit:String(galarHits[2]??0)})
  const backdrops=celestialBackdrops(life.sunMoon,{width:world.width,top:224-world.height})
  Object.assign(canvas.dataset,{skyTop:String(224-world.height),worldWidth:String(world.width),sunBackdropX:String(backdrops.sun.x),sunBackdropY:String(backdrops.sun.y),moonBackdropX:String(backdrops.moon.x),moonBackdropY:String(backdrops.moon.y)})
  Object.assign(canvas.dataset,{creationStage:life.creation.stage,creationElapsed:String(life.creation.elapsed),creationOpacity:String(life.creation.opacity),creationRift:String(life.creation.riftVisible),riftX:String(creationRift?.[0]?.x??''),riftY:String(creationRift?.[0]?.y??''),riftCount:String(life.creation.riftVisible?creationRift?.length??0:0),riftRightX:String(creationRift?.[1]?.x??''),riftRightY:String(creationRift?.[1]?.y??''),visitorCount:String(life.creation.active?(life.creation.trio?3:2):0),judgmentTargets:String(life.ultraTargetIndex+(ultra.allied?1:0)),palkiaHit:String(creationHits[0]),dialgaHit:String(creationHits[1]),palkiaX:String(life.creation.palkia.x),dialgaX:String(life.creation.dialga.x),assaultPower:String(divine&&life.arceus.stage==='assault'?arceusAssaultPower(life.arceus.elapsed):0),giratinaShield:String(shadowProtected),shadowClashes:String(shadowAnchors&&life.creation.stage.endsWith('fire')&&life.creation.phaseProgress>=(life.creation.stage.startsWith('signature')?.5:.42)?2:0),giratinaActive:String(life.creation.active&&life.creation.trio),giratinaY:String(life.creation.giratina.y+giratinaHeight(life.creation)),giratinaHit:String(arceusContact(life.arceus,6)||bossContact(6,true)||shadowHits.body),residentDuel:String(paired),extraSky:String(extraSky),sceneScale:String(scale),palkiaOrdinary:life.creation.ordinary,palkiaShield:String((divine&&life.arceus.stage==='cast'||ultraFire)&&life.creation.shields[0]),dialgaShield:String((divine&&life.arceus.stage==='cast'||ultraFire)&&life.creation.shields[1]),rayScreenX:String((life.ray.x+96)*scale),deoxysScreenX:String((life.deoxys.x+96)*scale),kyogreScreenX:String((life.kyogre.x+128)*scale),groundScreenX:String((life.groudon.x+154)*scale)})
  pen.restore()
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false
  ctx.drawImage(world, 0, (canvas.height - world.height * scale) / 2, world.width * scale, world.height * scale)
  Object.assign(canvas.dataset, { ready: 'true', mode, phase, elapsed: String(life.clock), ray: ray.action, groudon: groudon.action, state: life.state, rayX: String(rx), groundX: String(gx), rayY: String(ry), groundY: String(gy), worldWidth: String(world.width), coast: String(life.coast), kyogre:kyogre.action, kyogreX:String(kx), opponent:life.opponent })
  } finally {facingPets.forEach((pet,index)=>{pet.right=originalFacing[index]})}
}
document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button => button.addEventListener('click', () => {
  const mode = button.dataset.mode; if (mode !== 'play' && mode !== 'duel' && mode !== 'rest') return
  life.select(mode as ArenaMode); actions()
  document.querySelectorAll('button[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); draw()
}))
document.querySelector<HTMLButtonElement>('#arena-all')!.addEventListener('click',()=>{
  if(!life.summonAll())return
  actions()
  document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)))
  draw()
})
document.querySelector<HTMLButtonElement>('#arena-summon')!.addEventListener('click', () => {
  if (!life.summonArceus()) return
  actions()
  document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === life.mode)))
  draw()
})
document.querySelector<HTMLButtonElement>('#arena-creation')!.addEventListener('click',()=>{
  if(!life.summonCreation())return
  actions()
  document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)))
  draw()
})
document.querySelector('#arena-celestial')!.addEventListener('click',()=>{if(!life.summonSunMoon())return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
document.querySelector('#arena-kalos')!.addEventListener('click',()=>{if(life.summonKalos()){document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode==='play')));actions();draw()}})
document.querySelector<HTMLButtonElement>('#arena-rider')!.addEventListener('click',()=>{life.summonRider();actions();draw()});
 document.querySelector('#arena-avian')!.addEventListener('click',()=>{if(!life.summonAvian())return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
document.querySelector('#arena-galar')!.addEventListener('click',()=>{if(life.summonGalar()){document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode==='play')));actions();draw()}})
document.querySelector('#arena-unova')!.addEventListener('click',()=>{if(!life.summonUnova())return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
document.querySelector('#arena-necrozma')!.addEventListener('click',()=>{if(!life.summonNecrozma())return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
document.querySelector('#arena-ultra')!.addEventListener('click',()=>{if(!life.summonUltra())return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
for(const kind of ['hoopa','paradox'] as const)document.querySelector(`#arena-${kind}`)!.addEventListener('click',()=>{if(!life.summonPortal(kind))return;actions();document.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===life.mode)));draw()})
new ResizeObserver(draw).observe(canvas)
async function load(): Promise<void> {
  await deoxys.load()
  const images = ['#arena-ray', '#arena-groudon', '#arena-kyogre','#arena-arceus','#arena-palkia','#arena-dialga','#arena-giratina','#arena-lunala','#arena-solgaleo',...['normal','dawn','dusk','ultra'].map(form=>`#arena-necrozma-${form}`),...UNOVA_FORMS.map(form=>`#arena-${form}`),...KALOS_FORMS.map(form=>`#arena-${form}`),...GALAR_FORMS.map(form=>`#arena-${form}`),...AVIAN_FORMS.map(form=>`#arena-${form}`),...RIDER_FORMS.map(form=>`#arena-${form}`),...PORTAL_FORMS.map(form=>`#arena-${form}`)].map(id => document.querySelector<HTMLImageElement>(id)!)
  await Promise.all(images.map(image => image.complete && image.naturalWidth ? Promise.resolve() : new Promise<void>((resolve, reject) => { image.addEventListener('load', () => resolve(), { once: true }); image.addEventListener('error', reject, { once: true }) })))
  const source = document.createElement('canvas'); source.width = source.height = 128; const context = source.getContext('2d')!
  const data = images.map(image => { context.clearRect(0, 0, 128, 128); context.drawImage(image, 0, 0, 128, 128, 0, 0, 128, 128); return context.getImageData(0, 0, 128, 128).data })
  rayTexture = new MegaTexture(data[0]); groundTexture = new GroudonTexture(data[1]); seaTexture = new KyogreTexture(data[2]); divineTexture=new ArceusTexture(data[3]); creationTextures=[new CreationTexture('palkia',data[4]),new CreationTexture('dialga',data[5])]; shadowTexture=new GiratinaTexture(data[6]);celestialTextures=[new CelestialTexture('lunala',data[7]),new CelestialTexture('solgaleo',data[8])];necrozmaTextures=Object.fromEntries((['normal','dawn','dusk','ultra'] as const).map((form,i)=>[form,new NecrozmaTexture(form,data[9+i])])) as Record<NecrozmaForm,NecrozmaTexture>;unovaTextures=Object.fromEntries(UNOVA_FORMS.map((form,i)=>[form,new UnovaTexture(form,data[13+i])])) as Record<UnovaForm,UnovaTexture>;kalosTextures=Object.fromEntries(KALOS_FORMS.map((form,i)=>[form,new KalosTexture(form,data[18+i])])) as Record<KalosForm,KalosTexture>;galarTextures=Object.fromEntries(GALAR_FORMS.map((form,i)=>[form,new GalarTexture(form,data[22+i])])) as Record<GalarForm,GalarTexture>;avianTextures=Object.fromEntries(AVIAN_FORMS.map((form,i)=>[form,new AvianTexture(form,data[26+i])])) as Record<AvianForm,AvianTexture>;riderTextures=Object.fromEntries(RIDER_FORMS.map((form,i)=>[form,new AvianTexture(form,data[31+i])])) as Record<RiderForm,AvianTexture>;portalImages=Object.fromEntries(PORTAL_FORMS.map(form=>[form,document.querySelector<HTMLImageElement>(`#arena-${form}`)!])) as Record<PortalForm,HTMLImageElement>;ready = true; actions(); draw()
}
void load().catch(() => { status.textContent = 'Unable to load sprites. Reinstall the extension.' })
function tick(now: number): void {
  renderUsage()
  const delta = last ? Math.max(0, Math.min(100, now - last)) : 0; last = now
  if (ready && !document.hidden) {
    life.advance(delta); actions()
    extraSky+=((life.necrozma.active||life.galar.active||life.kalos.active||life.unova.active||life.sunMoon.active||life.creation.active||life.hoopa.active?360:160)-extraSky)*(1-Math.exp(-delta/300))
    // Attacks finish once per turn; breathing and roaming motions keep looping.
    ray.advance(life.state === 'duel'||life.residentDuel&&life.airDuel.stage==='fight' ? Math.max(0, Math.min(delta, MEGA_DURATION[ray.action] - 1 - ray.elapsed)) : delta, false)
    kyogre.advance((life.residentDuel?life.groundState==='fight':life.state==='duel'&&life.opponent==='kyogre') ? Math.max(0, Math.min(delta, KYOGRE_DURATION[kyogre.action]-1-kyogre.elapsed)) : delta,false)
    groudon.advance((life.residentDuel?life.groundState==='fight':life.state==='duel') ? Math.max(0, Math.min(delta, GROUDON_DURATION[groudon.action] - 1 - groudon.elapsed)) : delta, false)
    if (now - paint >= 50) { paint = now; draw() }
  }
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)

