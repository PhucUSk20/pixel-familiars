import { test } from 'node:test'
import assert from 'node:assert/strict'
import { meteorFlight,drawGroundDuel,drawPrecipiceBlades } from '../ground-duel-effects'
import { drawKyogreEffects,kyogreJetOrigins,kyogreThunderActive } from '../kyogre-effects'
import { kyogrePose } from '../primal-kyogre'

function canvas(){const fills:{x:number;y:number;w:number;h:number;color:string}[]=[];const ctx={fillStyle:'',fillRect(x:number,y:number,w:number,h:number){fills.push({x,y,w,h,color:this.fillStyle})}};return {ctx:ctx as unknown as CanvasRenderingContext2D,fills}}
test('five water jets originate at the unchanged circular charging positions in either facing direction',()=>{
 for(const right of [true,false]) {
  const {ctx,fills}=canvas(),mouth={x:210,y:115}
  drawKyogreEffects(ctx,'pulse',kyogrePose('pulse',4200),4200,mouth,right,140,189)
  const line=fills.filter(p=>p.color==='#d7ffff')
  assert.ok(line.length>15)
  const rows=[...new Set(line.map(p=>p.y))].sort((a,b)=>a-b)
  assert.equal(rows.length,5,'five distinct jets from the ring rather than one collapsed jet')
  const origins=kyogreJetOrigins(mouth,right,4200)
  assert.deepEqual(origins,kyogreJetOrigins(mouth,right,3220),'release freezes the original orbital positions')
  for(const origin of origins){
   const x=((origin.x-mouth.x)*(right?1:-1)-14)/10,y=(origin.y-mouth.y)/22
   assert.ok(Math.abs(x*x+y*y-1)<1e-10,'each charging orb remains on the circular perspective ring')
   assert.ok(line.some(p=>p.x===Math.round(origin.x)&&p.y===Math.round(origin.y)),'each jet starts at its own pre-existing orb')
  }
  assert.ok(line.every(p=>p.h===1))
  assert.ok(line.every(p=>right?p.x>=mouth.x:p.x<=mouth.x))
 }
})
test('each fire meteor leaves the mouth diagonally, crosses above view and falls onto the Kyogre area',()=>{
 const mouth={x:360,y:107},target={x:85,y:145}
 for(let i=0;i<8;i++) {
  const start=.22+i*.025,rise=meteorFlight(i,start+.08,mouth,target)!,fall=meteorFlight(i,start+.35,mouth,target)!,hit=meteorFlight(i,start+.52,mouth,target)!
  assert.equal(rise.stage,'rise');assert.ok(rise.position.x<mouth.x);assert.ok(rise.position.y<mouth.y)
  assert.equal(meteorFlight(i,start+.2,mouth,target)!.stage,'sky')
  assert.equal(fall.stage,'fall');assert.ok(fall.position.x>target.x);assert.ok(fall.position.y<target.y)
  assert.equal(hit.stage,'impact');assert.equal(hit.position.y,target.y);assert.ok(Math.abs(hit.position.x-target.x)<21)
 }
})
test('water/fire clash emits two beams from separate mouths and joins them at a common collision core',()=>{
 const {ctx,fills}=canvas(),water={x:80,y:140},fire={x:340,y:110}
 assert.equal(drawGroundDuel(ctx,4,4200,water,fire,water,224),'clash')
 for(const [color,mouth] of [['#d3ffff',water],['#fff0b5',fire]] as const){
  const line=fills.filter(p=>p.color===color)
  assert.ok(line.some(p=>p.x===mouth.x&&Math.abs(p.y-mouth.y)<3))
  assert.ok(line.some(p=>Math.abs(p.x-210)<4&&Math.abs(p.y-125)<4))
 }
})

test('five water impacts terminate at Groudon and produce spray and steam only after arrival',()=>{
 const mouth={x:80,y:120},hitX=300
 const before=canvas();drawKyogreEffects(before.ctx,'pulse',kyogrePose('pulse',4200),4200,mouth,true,220,189,hitX)
 assert.ok(!before.fills.some(p=>p.color==='#b9d6d9'))
 const after=canvas();drawKyogreEffects(after.ctx,'pulse',kyogrePose('pulse',5800),5800,mouth,true,220,189,hitX)
 assert.ok(after.fills.some(p=>p.color==='#b9d6d9'),'steam rises from hot armor')
 assert.ok(after.fills.some(p=>p.color==='#75d6f4'),'water fragments splash on impact')
 const ends=after.fills.filter(p=>p.color==='#d7ffff');assert.equal(new Set(ends.map(p=>p.y)).size,5)
 assert.ok(ends.every(p=>p.x<=hitX+4),'jets stop at the armor, not beyond the target')
})

test('Kyogre storm extends over Groudon and lightning descends from overhead into the armor',()=>{
 const {ctx,fills}=canvas(),mouth={x:80,y:120},target={x:340,y:115}
 assert.ok(kyogreThunderActive(3500));assert.ok(!kyogreThunderActive(3900))
 drawKyogreEffects(ctx,'rain',kyogrePose('rain',3500),3500,mouth,true,260,189,undefined,target)
 const rain=fills.filter(p=>p.color==='#5d9dbb'),clouds=fills.filter(p=>p.color==='#243947')
 assert.ok(rain.some(p=>p.x>target.x-30)&&rain.some(p=>p.x<140))
 assert.ok(clouds.some(p=>p.x>target.x-30)&&clouds.some(p=>p.x<140),'cloud bank stretches across both pets')
 const bolts=fills.filter(p=>p.color==='#bdf3ff')
 assert.ok(bolts.some(p=>Math.abs(p.x-target.x)<6&&Math.abs(p.y-target.y)<6),'bolt reaches Groudon armor')
 assert.ok(bolts.some(p=>Math.abs(p.x-target.x)<6&&p.y<40),'bolt starts above Groudon')
 assert.ok(bolts.every(p=>Math.abs(p.x-target.x)<10),'lightning descends vertically with local jagged edges')
 const quiet=canvas();drawKyogreEffects(quiet.ctx,'rain',kyogrePose('rain',3900),3900,mouth,true,260,189,undefined,target)
 assert.ok(!quiet.fills.some(p=>p.color==='#bdf3ff'))
})

test('magma blades advance from Groudon and erupt beneath Kyogre with tall cores and impact debris',()=>{
 const origin={x:340,y:189},target={x:80,y:133}
 const start=canvas();drawPrecipiceBlades(start.ctx,.34,origin,target)
 const early=start.fills.filter(p=>p.color==='#fff1a0')
 assert.ok(early.length>0&&early.every(p=>p.x>250),'first column is near the caster')
 const end=canvas();drawPrecipiceBlades(end.ctx,.65,origin,target)
 const cores=end.fills.filter(p=>p.color==='#fff1a0')
 assert.ok(cores.some(p=>Math.abs(p.x-target.x)<20&&p.y<target.y),'last column penetrates the opponent area')
 assert.ok(cores.some(p=>p.y<95),'large pillars reach past the target, not short ground decorations')
 assert.ok(end.fills.some(p=>p.color==='#b8e4e9'),'contact kicks up water and steam')
 const quiet=canvas();drawPrecipiceBlades(quiet.ctx,.99,origin,target);assert.equal(quiet.fills.length,0)
})
test('Kyogre raises two separate waterspouts, merges them and sends a water drill into either opponent direction',()=>{
 for(const right of [true,false]){
  const mouth={x:210,y:120},dir=right?1:-1,target={x:210+dir*180,y:115}
  const charge=canvas();drawKyogreEffects(charge.ctx,'wave',kyogrePose('wave',2100),2100,mouth,right,180,189,undefined,undefined,target)
  const bodies=charge.fills.filter(p=>p.color==='#165d8d'&&p.y<130)
  const center=mouth.x+dir*40
  assert.ok(bodies.some(p=>p.x<center-20)&&bodies.some(p=>p.x>center+10),'two distinct elevated funnels')
  const merge=canvas();drawKyogreEffects(merge.ctx,'wave',kyogrePose('wave',3700),3700,mouth,right,180,189,undefined,undefined,target)
  const merged=merge.fills.filter(p=>p.color==='#165d8d')
  assert.ok(Math.max(...merged.map(p=>p.x))-Math.min(...merged.map(p=>p.x))<35,'funnels converge before release')
  const flight=canvas();drawKyogreEffects(flight.ctx,'wave',kyogrePose('wave',4500),4500,mouth,right,180,189,undefined,undefined,target)
  assert.ok(flight.fills.some(p=>p.color==='#176c9e'))
  assert.ok(!flight.fills.some(p=>p.color==='#bedcde'),'no impact steam before arrival')
  const hit=canvas();drawKyogreEffects(hit.ctx,'wave',kyogrePose('wave',5800),5800,mouth,right,180,189,undefined,undefined,target)
  const splash=hit.fills.filter(p=>p.color==='#d3fbff');assert.ok(splash.length>0);assert.ok(Math.abs((Math.min(...splash.map(p=>p.x))+Math.max(...splash.map(p=>p.x)))/2-target.x)<2&&Math.abs((Math.min(...splash.map(p=>p.y))+Math.max(...splash.map(p=>p.y)))/2-target.y)<2,'impact is centered on the opponent')
  assert.ok(hit.fills.some(p=>p.color==='#bedcde'),'steam and splash at armor contact')
 }
})
