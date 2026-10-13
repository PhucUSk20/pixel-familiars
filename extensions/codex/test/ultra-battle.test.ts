import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ArenaLife} from '../arena-life'
import {UltraBattle} from '../ultra-battle'
test('Ultra boss has one blocked assault followed by a sky counter with staggered impacts',()=>{
 const b=new UltraBattle();b.begin();b.advance(6000);assert.equal(b.stage,'ultra-assault');assert.ok(b.assaultPower>.9);b.advance(6600);assert.equal(b.stage,'ultra-fire');b.advance(1880);assert.ok(b.contact(0)>0);assert.ok(b.contact(0,true)<b.contact(0));b.joinArceus();const time=b.elapsed;b.advance(10000);assert.equal(b.elapsed,time);assert.equal(b.stage,'ultra-alliance');b.leave();assert.equal(b.stage,'departure');assert.ok(b.advance(3000))
})
test('Ultra and all five visitors coexist; both summon orders target Arceus with ten attacks',()=>{
 for(const order of ['ultra-first','arceus-first']){
  const l=new ArenaLife(()=>.9);l.resize(960);l.summonCreation(true);l.summonSunMoon()
  if(order==='ultra-first'){assert.ok(l.summonUltra());assert.ok(l.ultraBoss);assert.ok(l.creation.heldForUltra&&l.sunMoon.heldForUltra);l.summonArceus()}
  else{l.summonArceus();assert.ok(l.summonUltra())}
  assert.equal(l.necrozma.battle.allied,true);assert.equal(l.ultraBoss,false);assert.equal(l.ultraTargetIndex,9)
  const x=l.necrozma.actor.x;l.resizeCamera(1920,2);assert.equal(l.necrozma.actor.x,(x+96)*2-96);for(let i=0;i<25000;i+=100)l.advance(100)
  assert.equal(l.arceus.active,false);assert.equal(l.necrozma.active,false);assert.equal(l.creation.active,false);assert.equal(l.sunMoon.active,false);assert.ok(Number.isFinite(l.necrozma.actor.x))
 }
})
test('creation can join an active Ultra boss, shields appear and signature counter knocks back residents',()=>{
 const l=new ArenaLife(()=>.9);l.summonUltra();l.advance(3000);assert.ok(l.summonCreation(true));for(let i=0;i<4000;i+=100)l.advance(100);assert.equal(l.creation.heldForUltra,true);const x=l.ray.x;for(let i=0;i<9200;i+=100)l.advance(100);assert.ok(Math.abs(l.ray.x-x)>20);assert.ok(l.creation.shields.every(Boolean)&&l.creation.shadowShield);l.select('rest');assert.equal(l.necrozma.active,false);assert.equal(l.creation.active,false)
})
test('natural Ultra creates probabilistic overlap, and lone Ultra exits back into roaming',()=>{
 const l=new ArenaLife(()=>0);l.avian.nextVisit=Infinity;l.summonUltra();for(let i=0;i<9000;i+=100)l.advance(100);assert.ok(l.creation.active);assert.ok(l.arceus.active);assert.ok(l.necrozma.battle.allied)
 const solo=new ArenaLife(()=>.9);solo.avian.nextVisit=Infinity;solo.summonUltra();for(let i=0;i<25000;i+=100)solo.advance(100);assert.equal(solo.necrozma.active,false);assert.equal(solo.state,'roam');assert.equal(solo.residentDuel,false)
})

test('Arceus can naturally recruit Ultra after arrival without changing existing visitors',()=>{const l=new ArenaLife(()=>0);l.summonArceus();for(let i=0;i<4000;i+=100)l.advance(100);assert.ok(l.arceus.active&&l.necrozma.battle.allied&&l.creation.active);assert.equal(l.ultraTargetIndex,7);l.select('rest');assert.equal(l.necrozma.active,false)})

test('late Ultra arrival preserves existing Arceus retreat goals',()=>{const l=new ArenaLife(()=>.9);l.resize(1000);l.ray.x=390;l.ray.y=10;l.summonArceus();for(let i=0;i<2000;i+=100)l.advance(100);l.summonUltra();for(let i=0;i<2000;i+=100)l.advance(100);assert.ok(Math.abs(l.ray.x-374)<.01);assert.ok(l.necrozma.battle.allied)})
