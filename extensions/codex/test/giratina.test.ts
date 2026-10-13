import {giratinaClashes,giratinaOrbCenters} from '../giratina-clash'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ArenaLife} from '../arena-life'
import {CreationLife} from '../creation-life'
import {GiratinaTexture,giratinaPose,giratinaHeight,giratinaAura,giratinaShieldActive,giratinaShieldCrown} from '../giratina'
import {giratinaOrbs,giratinaHits,drawGiratinaShield} from '../giratina-effects'
import {plasmaRingFrames} from '../plasma-rings'
import {arceusAssaultPower} from '../arceus-effects'

test('duo and trio are chosen once; Giratina rises from and returns to the ground rupture',()=>{
 for(const value of [.1,.9]){
  const life=new CreationLife(()=>value);life.begin();assert.equal(life.trio,value<.45)
  assert.equal(giratinaHeight(life),224);life.advance(3200,3200);assert.equal(giratinaHeight(life),0)
  life.leave();life.advance(1300,25000);assert.ok(giratinaHeight(life)>100&&giratinaHeight(life)<125)
  life.advance(1300,26300);assert.equal(life.active,false)
 }
})
test('resident duels continue independently during both space-time scenarios and pause only for Arceus',()=>{
 for(const trio of [false,true]){
  const life=new ArenaLife(()=>.9);life.deoxys.form='defense';life.summonCreation(trio)
  for(let i=0;i<180;i++)life.advance(100)
  assert.ok(life.residentDuel);assert.equal(life.groundState,'fight');assert.ok(life.airDuel.active)
  const elapsed=life.groundElapsed,turn=life.groundTurn;life.advance(1000)
  assert.ok(life.groundElapsed!==elapsed||life.groundTurn!==turn)
  life.summonArceus();assert.equal(life.residentDuel,false);assert.equal(life.airDuel.active,false)
  assert.deepEqual(life.creation.shields,[true,true])
 }
})
test('seven-pet Judgment ends the visitors and Arceus together without another skill',()=>{
 const life=new ArenaLife(()=>.1);life.summonCreation(true)
 while(!life.arceus.active)life.advance(100)
 assert.ok(life.creation.trio);const start=life.creation.giratina.x
 while(life.arceus.elapsed<20900)life.advance(100)
 assert.equal(life.arceus.skill,'judgment');assert.notEqual(life.creation.giratina.x,start)
 life.advance(100);assert.equal(life.arceus.stage,'departure');life.advance(100);assert.equal(life.creation.stage,'departure')
 life.advance(2500);assert.equal(life.arceus.active,false);assert.equal(life.creation.active,false)
})
test('two shadow orbs hold both clash fronts; recoil starts only at the explosion',()=>{
 const from=[{x:240,y:-65},{x:264,y:-65}],to=[{x:150,y:-20},{x:380,y:-22}]
 assert.equal(giratinaOrbs(.1,from,to).length,0)
 const shots=giratinaOrbs(.5,from,to);assert.equal(shots.length,2)
 shots.forEach((shot,i)=>assert.deepEqual(shot.position,to[i]))
 const life=new CreationLife(()=>.9);life.begin(true);life.elapsed=13000+.77*3200
 assert.equal(giratinaHits(life).rivals,0);life.elapsed+=100;assert.equal(giratinaHits(life).rivals,0);life.elapsed=16200;assert.ok(giratinaHits(life).rivals>0)
})
test('native Giratina joints retain body area and gold chest colors while wings and head move',()=>{
 const source=new Uint8ClampedArray(128*128*4)
 for(let y=22;y<104;y++)for(let x=30;x<100;x++)source.set([210,170,65,255],(y*128+x)*4)
 const texture=new GiratinaTexture(source),life=new CreationLife(()=>.9);life.begin(true)
 const idle=giratinaPose(life);life.elapsed=12300;const charge=giratinaPose(life)
 assert.notEqual(charge.leftWing,idle.leftWing);assert.notEqual(charge.head,idle.head)
 const area=(bytes:Uint8ClampedArray)=>bytes.filter((n,i)=>i%4===3&&n>0).length
 assert.ok(area(texture.render(charge))/area(texture.render(idle))>.85)
 const offset=(90*192+96)*4;assert.deepEqual([...texture.render(charge).slice(offset,offset+3)],[210,170,65])
})
test('two plasma rings align perpendicular to horizontal and diagonal beams; every assault shares one launch envelope',()=>{
 for(const to of [{x:200,y:10},{x:130,y:140}]){
  const from={x:10,y:10},rings=plasmaRingFrames(from,to,500);assert.equal(rings.length,2)
  for(const ring of rings){assert.ok(Math.abs(ring.axis.x*ring.normal.x+ring.axis.y*ring.normal.y)<1e-12);assert.ok(ring.radius>4&&ring.radius<15)}
 }
 assert.equal(plasmaRingFrames({x:1,y:1},{x:1,y:1},0).length,0)
 assert.equal(arceusAssaultPower(4500),0);assert.ok(arceusAssaultPower(4900)>0);assert.equal(arceusAssaultPower(6000),1)
})

test('shadow clash fronts separate the two skills and align exactly with enemy trajectories',()=>{
 const p={mouth:{x:100,y:30},hand:{x:110,y:40},gem:{x:100,y:40}},d={mouth:{x:380,y:30},hand:{x:380,y:40},gem:{x:380,y:40}},g={mouth:{x:240,y:-65},left:{x:228,y:-45},right:{x:252,y:-45}}
 const fronts=giratinaClashes(p,d,g,true)
 assert.equal(fronts.length,2);assert.ok(fronts[0].x<g.mouth.x&&fronts[1].x>g.mouth.x)
 const centers=giratinaOrbCenters(fronts,[g.left,g.right]),shots=giratinaOrbs(.5,[g.left,g.right],centers)
 shots.forEach((shot,index)=>{assert.deepEqual(shot.position,centers[index]);assert.ok(Math.abs(Math.hypot(shot.position.x-fronts[index].x,shot.position.y-fronts[index].y)-22)<1e-10)})
 const ordinary=giratinaClashes(p,d,g,false,true);assert.notDeepEqual(ordinary,fronts)
})
test('Giratina dark shield renders violet glow and absorbs Judgment with reduced recoil',()=>{
 const life=new ArenaLife(()=>.9);life.summonCreation(true);life.summonArceus()
 assert.ok(life.creation.shadowShield)
 const colors:string[]=[],ctx={fillStyle:'',globalAlpha:1,save(){},restore(){},fillRect(this:{fillStyle:string}){colors.push(this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const body=new Uint8ClampedArray(192*192*4);body.set([190,150,70,255],(70*192+96)*4)
 drawGiratinaShield(ctx,body,{x:0,y:0},1,18000)
 for(const color of ['#cc6eff','#7d30cc','#fff0ff'])assert.ok(colors.includes(color))
 while(life.arceus.elapsed<16000)life.advance(20)
 const start=life.creation.giratina.x
 while(life.arceus.elapsed<20000)life.advance(20)
 assert.ok(Math.abs(life.creation.giratina.x-start)<=24.01,'three shielded volleys push at most eight pixels each')
 life.select('rest');assert.equal(life.creation.shadowShield,false)
})

test('Giratina aura follows articulated silhouette, preserves interior colors and clears before attacking',()=>{
 const source=new Uint8ClampedArray(128*128*4)
 for(let y=22;y<104;y++)for(let x=30;x<100;x++)source.set([210,170,65,255],(y*128+x)*4)
 const life=new CreationLife(()=>.9);life.begin(true);assert.ok(giratinaShieldActive(life))
 const texture=new GiratinaTexture(source),pose=giratinaPose(life),body=texture.render(pose,.28),aura=giratinaAura(body,500)
 let glow=0
 for(let i=3;i<aura.length;i+=4){if(body[i])assert.equal(aura[i],0,'aura must never paint over body colors');if(aura[i])glow++}
 assert.ok(glow>0);assert.equal(aura[(5*192+5)*4+3],0,'no distant circular shield')
 const center=(90*192+96)*4;assert.deepEqual([...body.slice(center,center+3)],[159,128,57])
 const crown=giratinaShieldCrown(body,{x:100,y:-160});assert.ok(crown.x>=190&&crown.x<=202);assert.ok(crown.y<-100)
 life.elapsed=4000;assert.equal(giratinaShieldActive(life),false)
 life.prepareShields();life.holdForArceus();assert.equal(giratinaShieldActive(life,true),true)
 life.cancel(0);assert.equal(giratinaShieldActive(life,true),false)
})
