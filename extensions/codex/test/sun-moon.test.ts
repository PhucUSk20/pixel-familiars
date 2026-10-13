import {test} from 'node:test'
import assert from 'node:assert/strict'
import {SunMoonLife} from '../sun-moon-life'
import {ArenaLife} from '../arena-life'
import {CelestialTexture,celestialPose} from '../sun-moon-rig'
import {celestialCollision,celestialBackdrops} from '../sun-moon-effects'
test('friendly visitors complete two distinct rounds and depart without an Arceus roll',()=>{const l=new SunMoonLife(()=>.5);assert.ok(l.begin());assert.equal(l.begin(),false);const stages=new Set();for(let i=0;i<21000;i+=50){stages.add(l.stage);l.advance(50,i)};for(const stage of ['arrival','ordinary-charge','ordinary-fire','ordinary-impact','signature-charge','signature-fire','signature-impact','departure'])assert.ok(stages.has(stage));assert.equal(l.active,false);assert.equal(l.opacity,0);assert.ok(l.nextVisit>110000)})
test('Sun Moon summon coexists with resident duels, resizes and cancels cleanly',()=>{const l=new ArenaLife(()=>.9);l.select('rest');assert.ok(l.summonSunMoon());assert.ok(l.residentDuel);assert.equal(l.summonSunMoon(),false);l.advance(1000);const centers=[l.ray.x+96,l.deoxys.x+96,l.sunMoon.lunala.x+96];l.resizeCamera(960,2);assert.deepEqual([l.ray.x+96,l.deoxys.x+96,l.sunMoon.lunala.x+96],centers.map(x=>x*2));l.select('rest');assert.equal(l.sunMoon.active,false);l.advance(5000);assert.equal(l.sunMoon.stage,'absent');assert.ok(l.summonSunMoon());l.summonArceus();assert.equal(l.sunMoon.stage,'await-arceus');assert.equal(l.arceus.active,true)})
test('Auto schedules friendly encounters but Rest and Duel never summon them automatically',()=>{const l=new ArenaLife(()=>.9);l.creation.nextVisit=l.arceus.nextVisit=Infinity;l.sunMoon.nextVisit=0;l.advance(100);assert.ok(l.sunMoon.active);for(const mode of ['rest','duel'] as const){l.select(mode);l.sunMoon.nextVisit=0;l.advance(100);assert.equal(l.sunMoon.active,false)}})
test('celestial texture preserves source colors and attached joints use bounded poses',()=>{const source=new Uint8ClampedArray(128*128*4);for(let y=25;y<105;y++)for(let x=20;x<105;x++)source.set([117,89,198,255],(y*128+x)*4);const life=new SunMoonLife(()=>.5);life.begin();for(const name of ['lunala','solgaleo'] as const){const tex=new CelestialTexture(name,source),neutral={wing:0,fold:0,mane:0,head:0,leg:0,tail:0,lean:0,lift:0};const base=tex.render(neutral);const outputs=new Set();for(const ms of [1400,3500,6300,11000,13500]){life.elapsed=ms;const pose=celestialPose(name,life),pixels=tex.render(pose);let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){count++;assert.deepEqual([...pixels.slice(i,i+3)],[117,89,198])}assert.ok(count>3000);assert.ok(count<10000);const point=tex.anchor(pose);assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));outputs.add(Buffer.from(pixels).toString('base64'))}assert.ok(outputs.size>3);assert.ok(base.some(n=>n>0))}})
test('Lunala folds to charge then opens to fire; solar beam does not move Solgaleo',()=>{assert.deepEqual(celestialCollision({x:100,y:20},{x:300,y:40}),{x:200,y:30});const life=new SunMoonLife(()=>.5);life.begin();life.elapsed=4700;assert.ok(celestialPose('lunala',life).fold>.8);life.elapsed=5600;assert.equal(celestialPose('lunala',life).fold,0);const x=life.solgaleo.x;life.elapsed=12100;for(let i=0;i<3500;i+=100)life.advance(100,i);assert.equal(life.solgaleo.x,x)})

test('both visitor groups advance independently in either summon order and Auto',()=>{
 for(const order of ['moon-first','creation-first','auto'] as const){
  const l=new ArenaLife(()=>.9);l.select('rest');l.arceus.nextVisit=Infinity
  if(order==='moon-first'){l.summonSunMoon();assert.ok(l.summonCreation(true))}
  else{l.summonCreation(true);if(order==='auto')l.sunMoon.nextVisit=0;else assert.ok(l.summonSunMoon())}
  for(let i=0;i<5000;i+=100)l.advance(100)
  assert.ok(l.creation.active&&l.sunMoon.active&&l.residentDuel);assert.ok(l.creation.elapsed>=5000);assert.ok(l.sunMoon.elapsed>=5000);assert.ok(l.sunMoon.lunala.y===-290)
  const creationTime=l.creation.elapsed;l.sunMoon.elapsed=20699;l.advance(100);assert.equal(l.sunMoon.active,false);assert.ok(l.creation.elapsed>creationTime);assert.ok(l.residentDuel)
 }
})
test('Arceus holds both visitor groups, hits all nine pets and all depart after Judgment',()=>{
 const l=new ArenaLife(()=>.9);l.avian.nextVisit=Infinity;l.summonCreation(true);l.summonSunMoon();l.summonArceus();assert.equal(l.celestialTargetIndex,7);assert.ok(l.creation.held&&l.sunMoon.held)
 const starts=[l.sunMoon.lunala.x,l.sunMoon.solgaleo.x];for(let i=0;i<20200;i+=100)l.advance(100)
 assert.ok(Math.abs(l.sunMoon.lunala.x-starts[0])>20);assert.ok(Math.abs(l.sunMoon.solgaleo.x-starts[1])>20)
 for(let i=0;i<7000;i+=100)l.advance(100);assert.equal(l.arceus.active,false);assert.equal(l.creation.active,false);assert.equal(l.sunMoon.active,false);assert.equal(l.state,'roam')
})
test('late creation arrival keeps celestial Judgment target indices and retreat goals finite',()=>{
 const l=new ArenaLife(()=>0);l.summonSunMoon();l.summonArceus();assert.equal(l.celestialTargetIndex,4);for(let i=0;i<20000;i+=100)l.advance(100)
 assert.equal(l.celestialTargetIndex,7);assert.ok(l.creation.active&&l.sunMoon.active);for(const pet of [l.sunMoon.lunala,l.sunMoon.solgaleo,l.creation.palkia,l.creation.dialga,l.creation.giratina])assert.ok(Number.isFinite(pet.x))
})
test('creation departure leaves the friendly encounter and resident battles running',()=>{
 const l=new ArenaLife(()=>.9);l.summonCreation(true);l.creation.elapsed=19000;l.summonSunMoon();l.creation.elapsed=24099;l.advance(100)
 assert.equal(l.creation.active,false);assert.equal(l.sunMoon.active,true);assert.ok(l.residentDuel);assert.equal(l.sunMoon.elapsed,100);assert.equal(l.state,'cosmic')
})
test('old creation shield flags cannot reduce celestial Judgment knockback',()=>{
 const l=new ArenaLife(()=>.9);l.resize(960);l.summonCreation(true);l.creation.prepareShields();l.creation.cancel(l.clock);l.summonSunMoon();l.summonArceus()
 const starts=[l.sunMoon.lunala.x,l.sunMoon.solgaleo.x];for(let i=0;i<20700;i+=100)l.advance(100)
 assert.equal(l.celestialTargetIndex,4);assert.ok(Math.abs(l.sunMoon.lunala.x-starts[0])>60);assert.ok(Math.abs(l.sunMoon.solgaleo.x-starts[1])>=Math.min(61,starts[1]+96)-.1);assert.ok(l.sunMoon.solgaleo.x>=-96)
})
test('sun and moon stay near opposite top corners independently of visitor movement',()=>{
 const l=new SunMoonLife(()=>.5);l.begin();assert.ok(l.solgaleo.x<l.lunala.x);assert.equal(l.solgaleo.right,true);assert.equal(l.lunala.right,false)
 for(const viewport of [{width:480,top:-280},{width:1200,top:-216}]){
  const back=celestialBackdrops(l,viewport)
  assert.deepEqual(back,{sun:{x:88,y:viewport.top+88},moon:{x:viewport.width-70,y:viewport.top+70}})
  l.solgaleo.x+=30;l.lunala.x-=30;l.lunala.y-=80
  assert.deepEqual(celestialBackdrops(l,viewport),back)
 }
})

test('solar mane spreads source pixels while face anchors and body core remain attached',()=>{
 const source=new Uint8ClampedArray(128*128*4)
 for(let y=20;y<75;y++)for(let x=18;x<78;x++)if(Math.hypot(x-43,y-50)>15)source.set([242,214,132,255],(y*128+x)*4)
 source.set([45,103,212,255],(50*128+43)*4);source.set([198,180,170,255],(94*128+64)*4)
 const texture=new CelestialTexture('solgaleo',source),neutral={wing:0,fold:0,mane:0,head:0,leg:0,tail:0,lean:0,lift:0},open={...neutral,mane:1}
 const bounds=(pixels:Uint8ClampedArray)=>{let min=192,max=0;for(let y=0;y<110;y++)for(let x=0;x<192;x++)if(pixels[(y*192+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x)}return max-min}
 const closed=texture.render(neutral),spread=texture.render(open);assert.ok(bounds(spread)>bounds(closed)+10);assert.deepEqual(texture.anchor(open),texture.anchor(neutral));assert.ok(texture.anchor(open,'forehead').y<texture.anchor(open).y)
 assert.deepEqual([...spread.slice((118*192+96)*4,(118*192+96)*4+4)],[198,180,170,255])
})
