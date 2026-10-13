import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ArenaLife} from '../arena-life'
import {spritePoint,RAY_SCALE,DEOXYS_SCALE} from '../arena-scale'
test('sprite enlargement and shrinking share a stable center and transform actual attack anchors',()=>{
 const origin={x:20,y:10};for(const scale of [RAY_SCALE,DEOXYS_SCALE])assert.deepEqual(spritePoint(origin,{x:96,y:96},scale),{x:116,y:106})
 assert.equal(spritePoint(origin,{x:116,y:96},RAY_SCALE).x,138);assert.equal(spritePoint(origin,{x:116,y:96},DEOXYS_SCALE).x,134)
})
test('aerial finale breaks orb then meteor shield, hides Deoxys and restores it only after meteor impact',()=>{
 const life=new ArenaLife(()=>.9);life.select('duel');const duel=life.airDuel
 duel.turn=4;duel.stage='fight';life.deoxys.perform('skill');life.deoxys.form='normal'
 const stages=new Set<string>();let hidden=false,returned=false
 for(let t=0;t<24000;t+=50){life.advance(50);stages.add(duel.finale);if(duel.finale==='waiting'){assert.equal(duel.deoxysOpacity,0);hidden=true}if(duel.finale==='rebirth'&&duel.deoxysOpacity>.5)returned=true}
 for(const phase of ['ultimate-clash','orb-break','meteor-shield','shield-break','destroyed','waiting','rebirth-impact','rebirth'])assert.ok(stages.has(phase))
 assert.ok(hidden&&returned);assert.equal(duel.turn,0);assert.equal(duel.deoxysOpacity,1)
 duel.turn=4;duel.stage='fight';duel.elapsed=18500;life.select('rest');assert.equal(duel.deoxysOpacity,1)
})
test('normal aerial staging separates Rayquaza from Kyogre in narrow and wide worlds',()=>{
 for(const width of [480,1200]){const life=new ArenaLife(()=>.9);life.resize(width);assert.ok(Math.abs(life.airDuel.rayX+96-(life.duelKyogreX+128))>65)}
})

test('automatic visitor timers cannot interrupt an autonomous aerial finale',()=>{
 const life=new ArenaLife(()=>.9);life.sunMoon.nextVisit=life.creation.nextVisit=life.arceus.nextVisit=Infinity
 for(let t=0;t<300000&&!life.residentDuel;t+=50)life.advance(50)
 assert.ok(life.residentDuel);life.creation.nextVisit=life.arceus.nextVisit=life.clock
 life.advance(1000);assert.equal(life.creation.active,false);assert.equal(life.arceus.active,false)
})

test('Deoxys shields as soon as its ultimate orb is launched, before Rayquaza reaches it',()=>{
 const life=new ArenaLife(()=>.9);life.select('duel');const d=life.airDuel;d.turn=4;d.stage='fight';d.elapsed=4999;assert.equal(d.shieldActive,false);d.elapsed=5000;assert.equal(d.shieldActive,true);assert.ok(life.ray.x<d.deoxysX-72);d.elapsed=12499;assert.equal(d.shieldActive,true);d.elapsed=12500;assert.equal(d.shieldActive,false);d.cancel();assert.equal(d.shieldActive,false)
})
