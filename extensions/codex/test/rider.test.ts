import {teraStars} from '../stellar-magma-effects'
import test from 'node:test'
import assert from 'node:assert/strict'
import {RiderLife} from '../rider-life'
import {ArenaLife} from '../arena-life'
import {riderBomb} from '../rider-effects'
import {drawAerialFinale} from '../aerial-finale'
test('Calyrex alternates Ice/Shadow/Ice and both Mega variants complete every attack phase',()=>{
 for(const mega of ['x','y'] as const){const life=new RiderLife(()=>.9);life.resize(1100);life.begin(mega);const stages=new Set<string>(),forms=new Set<string>();for(let i=0;i<47000;i+=100){stages.add(life.stage);forms.add(life.form);life.advance(100)};assert.deepEqual([...forms],['calyrex-ice-rider','calyrex-shadow-rider']);for(const stage of ['freeze','lance-charge','lance-fire','lance-impact','astral-charge','astral-fire','astral-impact','mega-transform','mega-charge','mega-fire','mega-impact','rider-return'])assert.ok(stages.has(stage));assert.equal(life.active,false);assert.equal(life.mewtwoForm,'mewtwo')}
})
test('two opponent pairs are separate from birds, preserve ordered slots and share boss targets',()=>{
 const life=new ArenaLife(()=>.9);life.resize(1100);life.select('rest');life.summonAvian();assert.equal(life.rider.active,false);life.summonRider();assert.ok(life.rider.mewtwo.x>life.rider.terapagos.x);assert.ok(life.rider.heatran.x>life.rider.calyrex.x);assert.equal(life.ultraTargetIndex,10);life.summonArceus();assert.ok(life.rider.held);assert.equal(life.ultraTargetIndex,10);life.select('rest');assert.equal(life.rider.active,false);assert.equal(life.ultraTargetIndex,4)
})
test('Summon All reveals every strong form before Arceus and Rest cancels pending boss arrival',()=>{
 const life=new ArenaLife(()=>.9);life.resize(1100);life.summonAll();assert.equal(life.arceus.active,false);assert.equal(life.necrozma.form,'ultra');assert.equal(life.kalos.form,'mega-zygarde-complete');assert.equal(life.galar.form,'eternatus-eternamax');for(let i=0;i<1800;i+=100)life.advance(100);assert.ok(life.unova.opacityFor(2)>.8&&life.kalos.opacityFor(2)>.8);assert.equal(life.rider.mewtwoForm,'mega-mewtwo-y');assert.equal(life.arceus.active,false);for(let i=0;i<8200;i+=100)life.advance(100);assert.ok(life.arceus.active&&life.necrozma.battle.allied);assert.equal(life.ultraTargetIndex,29);life.select('rest');life.advance(20000);assert.equal(life.arceus.active,false)
})
test('psychic bomb rises above its opponent before accelerating down to the opponent',()=>{
 const life=new RiderLife();life.begin('y');const source={x:100,y:80},target={x:250,y:90};life.elapsed=35000;assert.deepEqual(riderBomb(life,source,target),source);life.elapsed=36800;const top=riderBomb(life,source,target);assert.ok(top.x===target.x&&top.y<target.y-80);life.elapsed=38000;assert.deepEqual(riderBomb(life,source,target),target)
})
test('Deoxys meteor shield follows the actual raised body rather than the old ground lane',()=>{
 const life=new ArenaLife(()=>.9);life.select('duel');life.airDuel.stage='fight';life.airDuel.turn=4;life.airDuel.elapsed=6000;const points:{y:number;c:string}[]=[];const ctx={fillStyle:'',globalAlpha:1,save(){},restore(){},fillRect(this:{fillStyle:string},_x:number,y:number){points.push({y,c:this.fillStyle})}} as unknown as CanvasRenderingContext2D;drawAerialFinale(ctx,life.airDuel,{x:150,y:-50},{x:280,y:-44});const barrier=points.filter(p=>p.c==='#b5f7ff');assert.ok(barrier.length>0);assert.ok(Math.abs(barrier.reduce((n,p)=>n+p.y,0)/barrier.length+44)<2)
})

test('Tera stars rise before falling, impact only at the target and arrive in a staggered barrage',()=>{
 const source={x:300,y:-130},target={x:150,y:-120}
 const launch=teraStars(0,source,target);assert.equal(launch[0].y,source.y);assert.ok(!launch.some(s=>s.impact))
 const peak=teraStars(750,source,target)[0];assert.ok(!peak.rising&&peak.y===target.y-120&&!peak.impact)
 const impact=teraStars(1400,source,target);assert.ok(impact[0].impact);assert.equal(impact[0].y,target.y);assert.ok(!impact[1].impact)
 assert.ok(teraStars(1640,source,target)[1].impact)
})
test('central psychic and aerial pairs share a tier while Calyrex and Heatran retain the lower right',()=>{
 const life=new ArenaLife(()=>.9);life.resize(1100);life.summonAll();life.advance(100)
 assert.equal(life.rider.mewtwo.y,-120);assert.equal(life.rider.terapagos.y,-120)
 assert.ok(life.rider.terapagos.x<life.rider.mewtwo.x&&life.rider.mewtwo.x<life.ray.x&&life.ray.x<life.deoxys.x)
 assert.ok(life.rider.calyrex.x>life.rider.terapagos.x&&life.rider.heatran.x>life.rider.calyrex.x)
 assert.equal(life.ultraTargetIndex,29)
})


test('Summon All lets Ultra arrive without a boss assault and protects selected Judgment targets',()=>{
 const life=new ArenaLife(()=>.9);life.resize(1100);life.summonAll()
 for(let t=0;t<9900;t+=100){life.advance(100);assert.equal(life.ultraBoss,false);assert.equal(life.necrozma.battle.assaultPower,0);assert.equal(life.necrozma.battle.fireElapsed,0)}
 assert.equal(life.necrozma.battle.stage,'ultra-alliance');assert.ok(life.residentDuel)
 life.advance(100);assert.ok(life.arceus.active&&life.necrozma.battle.allied)
 for(const index of [0,life.riderTargetIndex,life.unovaTargetIndex+2,life.kalosTargetIndex+2,life.galarTargetIndex+2,life.ultraTargetIndex])assert.equal(life.judgmentShield(index),true)
 assert.equal(life.judgmentShield(3),false)
})
