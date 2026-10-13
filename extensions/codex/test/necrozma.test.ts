import {test} from 'node:test'
import assert from 'node:assert/strict'
import {NecrozmaLife} from '../necrozma-life'
import {NecrozmaTexture,necrozmaPose} from '../necrozma-rig'
import {ArenaLife} from '../arena-life'
test('anime sequence frees both hosts before restoring Ultra with light',()=>{
 const l=new NecrozmaLife(()=>.5);assert.ok(l.begin());assert.equal(l.begin(),false)
 const origin={x:20,y:-106}
 for(const [ms,form,luna,solar]of [[1000,'normal',1,1],[6000,'dawn',0,1],[17500,'normal',1,1],[21500,'dusk',1,0],[34500,'normal',1,1],[41500,'ultra',1,1]] as const){l.elapsed=ms;assert.equal(l.form,form);const a=l.host('lunala',origin),b=l.host('solgaleo',origin);if(ms!==17500){assert.equal(a.opacity,luna);assert.equal(b.opacity,solar)}else assert.ok(a.opacity>.5);assert.ok(Number.isFinite(a.x)&&Number.isFinite(b.y))}
 l.elapsed=35000;assert.equal(l.stage,'restoration-charge');l.elapsed=37500;assert.equal(l.stage,'restoration-fire');l.elapsed=43000;assert.equal(l.stage,'ultra-charge');l.elapsed=47000;assert.equal(l.stage,'ultra-fire');l.advance(100,47100);assert.equal(l.battle.active,true);assert.ok(l.advance(24000,71000));assert.equal(l.opacity,0);assert.equal(l.active,false)
})
test('summon holds celestial visitors while residents battle; rest and Arceus release hosts',()=>{
 const l=new ArenaLife(()=>.9);l.select('rest');assert.ok(l.summonNecrozma());assert.equal(l.sunMoon.stage,'await-necrozma');assert.ok(l.residentDuel);assert.equal(l.summonNecrozma(),false);assert.equal(l.summonCreation(),false)
 for(let i=0;i<22000;i+=100)l.advance(100);assert.equal(l.necrozma.form,'dusk');assert.equal(l.sunMoon.elapsed,0);assert.ok(l.airDuel.elapsed>0)
 const x=l.necrozma.actor.x;l.resizeCamera(960,2);assert.equal(l.necrozma.actor.x,(x+96)*2-96)
 l.summonArceus();assert.equal(l.necrozma.active,false);assert.equal(l.sunMoon.stage,'await-arceus');l.select('rest');assert.equal(l.sunMoon.active,false);assert.equal(l.necrozma.active,false)
})
test('complete Necrozma encounter departs cleanly; automatic visits respect rest and active rivals',()=>{
 const l=new ArenaLife(()=>.9);l.avian.nextVisit=Infinity;l.summonNecrozma();for(let i=0;i<67000;i+=100)l.advance(100);assert.equal(l.necrozma.active,false);assert.equal(l.sunMoon.active,false);assert.equal(l.state,'roam')
 l.select('rest');l.necrozma.nextVisit=0;l.advance(100);assert.equal(l.necrozma.active,false)
 l.summonCreation(true);l.necrozma.nextVisit=0;assert.equal(l.summonNecrozma(),true);l.select('rest');l.summonSunMoon();l.necrozma.nextVisit=0;l.advance(100);assert.equal(l.necrozma.active,true)
})

test('all four native bodies retain colors and bounded pixel articulation through charge phases',()=>{
 const source=new Uint8ClampedArray(128*128*4);for(let y=20;y<110;y++)for(let x=20;x<110;x++)source.set([90,130,150,255],(y*128+x)*4)
 const l=new NecrozmaLife(()=>.5);l.begin()
 for(const [ms,form]of [[1000,'normal'],[7400,'dawn'],[12600,'dawn'],[22800,'dusk'],[27800,'dusk'],[42000,'ultra'],[45300,'ultra']] as const){l.elapsed=ms;const tex=new NecrozmaTexture(form,source),pose=necrozmaPose(l),pixels=tex.render(pose);let visible=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){visible++;assert.deepEqual([...pixels.slice(i,i+3)],[90,130,150])}assert.ok(visible>4000&&visible<16000);assert.ok(Object.values(pose).every(Number.isFinite))}
})
