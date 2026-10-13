import test from 'node:test'
import assert from 'node:assert/strict'
import {groupPositions} from '../arena-layout'
import {ArenaLife} from '../arena-life'
test('three-tier groups occupy spaced column slots in the requested order',()=>{
 for(const width of [480,960,1600]){
  const groups=['unova','creation','kalos','celestial','galar']as const
  const points=Object.fromEntries(groups.map(group=>[group,groupPositions(width,group)]))
  assert.ok(points.unova[2].x<points.creation[2].x&&points.creation[2].x<points.kalos[2].x)
  assert.ok(points.celestial[2].x<points.galar[2].x)
  for(const [left,right] of [[points.unova[0],points.kalos[1]],[points.celestial[0],points.galar[1]]]){assert.ok(Math.abs(left.x+96-width*.085)<1e-9);assert.ok(Math.abs(right.x+96-width*.915)<1e-9)}
  for(const group of groups){const p=points[group];assert.ok(p[1].x-p[0].x>=width*.16);assert.ok(Math.abs(p[2].x-(p[0].x+p[1].x)/2)<1e-9);assert.ok(p[2].y<p[0].y)}
  assert.ok(points.galar[0].y===points.creation[0].y)
 }
})
test('summoning other groups and bosses retains each group slot',()=>{
 const l=new ArenaLife(()=>.9);l.resize(1200);l.select('rest');l.summonCreation(true);const creation=[l.creation.palkia,l.creation.dialga,l.creation.giratina].map(p=>({...p}));l.summonUnova();l.summonKalos();l.summonGalar();l.summonSunMoon();l.summonUltra()
 assert.deepEqual([l.creation.palkia,l.creation.dialga,l.creation.giratina],creation)
 assert.equal(l.necrozma.actor.y,-355);assert.equal(l.sunMoon.solgaleo.y,-290);assert.equal(l.galar.eternatus.y,-355);assert.equal(l.kalos.zygarde.y,-185)
 l.summonArceus();assert.equal(l.necrozma.actor.y,-355);assert.equal(l.kalos.zygarde.y,-185)
})

test('Summon All starts every group and both bosses, blocks repeats and Rest cancels all',()=>{
 for(const mode of ['play','duel','rest']as const){
  const l=new ArenaLife(()=>.9);l.select(mode);l.summonNecrozma();assert.ok(l.summonAll())
  assert.ok(l.creation.active&&l.creation.trio&&l.unova.active&&l.kalos.active&&l.galar.active&&l.sunMoon.active)
  assert.equal(l.necrozma.form,'ultra');assert.equal(l.kalos.form,'mega-zygarde-complete');assert.ok(l.unova.opacityFor(2)===0);assert.equal(l.creation.stage,'arrival');assert.equal(l.unova.stage,'arrival');assert.equal(l.kalos.stage,'arrival');assert.equal(l.arceus.active,false);assert.equal(l.summonAll(),false)
  for(let i=0;i<10000;i+=100)l.advance(100)
  assert.equal(l.necrozma.form,'ultra');assert.ok(l.necrozma.battle.allied&&l.arceus.active);assert.equal(l.ultraTargetIndex,29)
  for(let i=0;i<5000;i+=100)l.advance(100);const elapsed=l.arceus.elapsed;assert.equal(l.summonAll(),false);assert.equal(l.arceus.elapsed,elapsed)
  l.select('rest');assert.equal(l.ultraTargetIndex,4);assert.equal(l.necrozma.active,false);assert.equal(l.arceus.active,false)
 }
})

test('Rest cancels queued Summon All bosses during native entrances',()=>{
 const life=new ArenaLife(()=>.9);life.summonAll();life.advance(1000);life.select('rest');life.advance(30000)
 assert.equal(life.summoningAll,false);assert.equal(life.necrozma.active,false);assert.equal(life.arceus.active,false);assert.equal(life.ultraTargetIndex,4)
})
