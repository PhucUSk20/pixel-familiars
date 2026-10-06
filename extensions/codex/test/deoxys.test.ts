import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DeoxysLife } from '../deoxys-life'
import { DEOXYS_FORMS, deoxysPose, DeoxysTexture } from '../deoxys-rig'
test('Deoxys reaches meteorite before touching; forms switch only at the flash midpoint',()=>{
 const life=new DeoxysLife(()=>.4); life.x=0;life.meteor();life.advance(1000)
 assert.equal(life.state,'meteor');assert.equal(life.form,'normal');assert.ok(life.meteorVisible&&life.meteorY>-32&&life.meteorY<184);assert.equal(life.x,0)
 life.advance(1100);assert.equal(life.state,'approach')
 while(life.state==='approach')life.advance(50)
 assert.equal(life.y,52)
 assert.ok(Math.abs(life.x-(life.meteorX-155))<.1);life.advance(1700);assert.equal(life.state,'transform')
 life.advance(1100);assert.equal(life.form,'normal');life.advance(200);assert.notEqual(life.form,'normal')
})
test('automatic meteorite visits show every variant and its skill; pause/rest resumes safely',()=>{
 const life=new DeoxysLife(()=>.3), forms=new Set(),skills=new Set()
 for(let i=0;i<300000;i+=50){life.advance(50);forms.add(life.form);if(life.action==='skill')skills.add(life.form)}
 assert.equal(forms.size,4);assert.ok(['attack','defense','speed'].every(form=>skills.has(form)))
 const x=life.x,y=life.y,form=life.form;life.rest(true);life.advance(40000);assert.equal(life.x,x);assert.equal(life.y,y);assert.equal(life.form,form);assert.equal(life.action,'rest')
 life.rest(false);life.advance(15000);assert.notEqual(life.state,'rest')
})
test('narrowing while approaching retargets meteorite and malformed deltas do not corrupt state',()=>{
 const life=new DeoxysLife(()=>.4);life.resize(1600);life.x=1300;life.meteor();life.resize(480);life.advance(10000)
 assert.ok(life.x>=0&&life.x<=288);const time=life.clock;life.advance(NaN);life.advance(-2);assert.equal(life.clock,time)
})
test('form skills articulate limbs differently and the neutral mesh preserves pixels',()=>{
 const source=new Uint8ClampedArray(128*128*4); const i=(64*128+64)*4;source.set([255,80,40,255],i)
 const texture=new DeoxysTexture(source), pose=deoxysPose('normal','float',0);pose.squash=1
 const pixels=texture.render(pose), dest=((64+24)*192+64+32)*4;assert.deepEqual([...pixels.slice(dest,dest+4)],[255,80,40,255])
 const attack=deoxysPose('attack','skill',2600);assert.ok(attack.leftArm>0&&attack.rightArm<0,'tentacles extend outward instead of folding across the torso')
 const signatures=DEOXYS_FORMS.map(form=>JSON.stringify(deoxysPose(form,'skill',2600)));assert.equal(new Set(signatures).size,4)
})

test('free flight changes both altitude and position; meteor lands nearby before descent/contact',()=>{
 const life=new DeoxysLife(()=>.25);const start={x:life.x,y:life.y};life.advance(6000)
 assert.ok(Math.abs(life.x-start.x)>10&&Math.abs(life.y-start.y)>10)
 const current={x:life.x,y:life.y};life.meteor();assert.ok(Math.abs(life.meteorX-current.x-155)<=18)
 life.advance(1400);assert.equal(life.x,current.x);assert.equal(life.y,current.y);assert.equal(life.form,'normal')
 life.advance(200);assert.equal(life.meteorY,184);assert.equal(life.state,'meteor')
 life.advance(500);assert.equal(life.state,'approach')
 life.rest(true);const frozen=life.y;life.advance(6000);assert.equal(life.y,frozen)
})

test('shared arena gives Deoxys a higher coastal flight lane, separate from the ocean pets',()=>{
 const life=new DeoxysLife(()=>.25,true);assert.equal(life.y,-18)
 life.resize(1200);life.advance(6000);assert.ok(life.x>=1200*.42&&life.x<=1008);assert.ok(life.y<0)
 life.resize(480);assert.ok(life.x>=480*.42&&life.x<=288)
})


test('transformation keeps all forms structurally neutral beneath the flash',()=>{
 for(const form of DEOXYS_FORMS)for(const ms of [0,600,1150,1200,1250,1800,2400]) {
  const pose=deoxysPose(form,'transform',ms)
  for(const joint of ['head','leftArm','rightArm','leftLeg','rightLeg','angle'] as const)assert.equal(pose[joint],0)
  assert.equal(pose.squash,1)
 }
})
