import {judgmentShots,arceusContact} from '../arceus-effects'
import {ArceusLife,judgmentHitTime,ARCEUS_CAST_MS} from '../arceus-life'
import test from 'node:test'
import assert from 'node:assert/strict'
import {ArenaLife} from '../arena-life'
import {PortalParadoxLife,portalPunch,encounterContact} from '../portal-paradox-life'

test('both new encounters complete their charges, attacks, ultimates and departures independently',()=>{
  for(const kind of ['hoopa','paradox'] as const){
    const visit=new PortalParadoxLife(kind);visit.resize(1100);assert.ok(visit.begin());assert.equal(visit.begin(),false)
    const stages=new Set<string>()
    for(let t=0;t<42000;t+=100){stages.add(visit.stage);for(const pet of visit.pets)assert.ok(Number.isFinite(pet.x)&&Number.isFinite(pet.y));visit.advance(100)}
    for(const phase of ['arrival','first-charge','first-fire','reply-fire','ultimate-charge','ultimate-fire','final-charge','final-fire','final-impact','departure'])assert.ok(stages.has(phase))
    assert.equal(visit.active,false)
  }
})

test('portal fists surround each victim, reach the victim and retract instead of hitting the other encounter',()=>{
  const target={x:300,y:80},origins=[]
  for(let i=0;i<6;i++){
    const at=portalPunch(target,i,(.5+i*.11)/1.7);origins.push(at.origin)
    assert.equal(at.reach,1);assert.deepEqual(at.tip,target)
    const retracted=portalPunch(target,i,1);assert.equal(retracted.reach,0);assert.deepEqual(retracted.tip,retracted.origin)
  }
  assert.equal(new Set(origins.map(p=>p.x+','+p.y)).size,6)
})

test('Electro Drift moves Miraidon into Koraidon and back, with no contact during charging',()=>{
  const visit=new PortalParadoxLife('paradox');visit.resize(1100);visit.begin()
  visit.elapsed=29000;assert.equal(encounterContact(visit,0),0);assert.equal(visit.offset(1).x<5,true)
  visit.elapsed=30500+(34500-30500)*.4
  assert.ok(visit.offset(1).x< -100);assert.ok(encounterContact(visit,0)>0)
  visit.elapsed=34400;assert.ok(Math.abs(visit.offset(1).x)<.001)
})

test('new groups keep their approved lanes and proportional positions through camera and viewport resize',()=>{
  const life=new ArenaLife(()=>.9);life.resize(1100);life.select('rest');assert.ok(life.summonPortal('hoopa'));assert.ok(life.summonPortal('paradox'))
  assert.equal(life.hoopa.pets[0].y,-225);assert.equal(life.paradox.pets[0].y,-35);assert.equal(life.paradox.pets[0].x+96,440);assert.ok(Math.abs(life.paradox.pets[1].x+96-748)<.001)
  assert.ok(life.hoopa.pets[1].x<life.hoopa.pets[0].x&&life.hoopa.pets[0].x<life.hoopa.pets[2].x)
  const before=life.hoopa.pets[0].x+96;life.resizeCamera(2200,2);assert.equal(life.hoopa.pets[0].x+96,before*2)
  life.resize(1100);assert.equal(life.hoopa.pets[0].x+96,before)
})

test('new visitors join every boss target list, stay held and cancel with Rest',()=>{
  const life=new ArenaLife(()=>.9);life.resize(1100);life.select('rest');life.summonPortal('hoopa');life.summonPortal('paradox')
  life.advance(5000);assert.ok(life.residentDuel);assert.equal(life.ultraTargetIndex,9)
  life.summonUltra();assert.ok(life.hoopa.held&&life.paradox.held)
  life.advance(2000);life.summonArceus();assert.equal(life.ultraTargetIndex,9);assert.ok(life.necrozma.battle.allied)
  const elapsed=life.hoopa.elapsed;life.advance(5000);assert.equal(life.hoopa.elapsed,elapsed)
  life.select('rest');assert.ok(!life.hoopa.active&&!life.paradox.active);assert.equal(life.ultraTargetIndex,4)
  life.summonAll();assert.ok(life.hoopa.active&&life.paradox.active);assert.equal(life.ultraTargetIndex,29)
  for(let t=0;t<10000;t+=100)life.advance(100)
  assert.ok(life.arceus.active&&life.necrozma.battle.allied&&life.hoopa.held&&life.paradox.held)
})


test('all three Judgment volleys reach all thirty targets before departure, with matching visual contact',()=>{
 const targets=Array.from({length:30},(_,i)=>({x:i*25,y:0,surface:40})),arceus=new ArceusLife();arceus.begin();arceus.targetCount=30
 for(let wave=0;wave<3;wave++)for(let i=0;i<30;i++){
  const time=judgmentHitTime(wave,i,30);assert.ok(time<ARCEUS_CAST_MS)
  arceus.elapsed=9000+time+1;assert.ok(arceusContact(arceus,i)>0)
  assert.ok(judgmentShots(375,time+1,targets).some(shot=>shot.target===targets[i]&&shot.progress===1&&shot.impact>0))
 }
})
