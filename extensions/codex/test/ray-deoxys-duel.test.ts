import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ArenaLife } from '../arena-life'

test('manual duel stages Rayquaza vs Deoxys, transforms through contact and covers all four aerial rounds',()=>{
 const life=new ArenaLife(()=>.4), start=[life.ray.x,life.deoxys.x,life.deoxys.y]
 life.select('duel');assert.equal(life.opponent,'deoxys');assert.deepEqual([life.ray.x,life.deoxys.x,life.deoxys.y],start)
 const turns=new Map<number,string>(),states=new Set<string>(), groundTurns=new Set<number>()
 let previous=life.deoxys.form, touched=false, dodged=false,chased=false
 for(let i=0;i<95000;i+=50){
  life.advance(50);states.add(life.deoxys.state)
  if(life.deoxys.state==='touch')touched=true
  if(previous!==life.deoxys.form){assert.ok(touched,'each form change requires contact');assert.equal(life.deoxys.state,'transform');touched=false}
  previous=life.deoxys.form
  if(life.airDuel.stage==='fight'){
   turns.set(life.turn,life.deoxys.form)
   if(life.turn===1&&life.ray.y>0)dodged=true
   if(life.turn===2&&life.ray.x>life.airDuel.rayX+30)chased=true
  }
  if(life.groundState==='fight'){groundTurns.add(life.groundTurn);assert.equal(life.groudon.right,false);assert.equal(life.kyogre.right,true)}
 }
 assert.deepEqual([...turns].slice(0,4),[[0,'defense'],[1,'attack'],[2,'speed'],[3,'normal']])
 assert.ok(states.has('meteor')&&states.has('touch')&&dodged&&chased)
 assert.deepEqual([...groundTurns],[0,1,2,3,4])
})
test('cancelling or resizing an aerial fight preserves finite bounds and resumes autonomous life',()=>{
 const life=new ArenaLife(()=>.3);life.resize(1200);life.select('duel')
 for(let i=0;i<35000;i+=50)life.advance(50)
 life.resize(480);for(let i=0;i<20000;i+=50)life.advance(50)
 assert.ok(life.ray.x>=4&&life.ray.x<=284);assert.ok(life.deoxys.x>=0&&life.deoxys.x<=288)
 life.select('rest');const at=[life.ray.x,life.ray.y,life.deoxys.x,life.deoxys.y,life.groudon.x,life.kyogre.x];life.advance(6000)
 assert.deepEqual([life.ray.x,life.ray.y,life.deoxys.x,life.deoxys.y,life.groudon.x,life.kyogre.x],at);assert.equal(life.airDuel.active,false)
 life.select('play');assert.equal(life.state,'roam');assert.equal(life.deoxys.state,'roam');assert.equal(life.airDuel.active,false)
})
