import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contactStrength,groundFireHit } from '../arena-hit'
import { meteorFlight } from '../ground-duel-effects'
test('energy burst and blades cause recoil only while their impact is visible',()=>{
 assert.equal(groundFireHit(1,.69),0);assert.ok(groundFireHit(1,.73)>0);assert.equal(groundFireHit(1,.88),0)
 assert.equal(groundFireHit(2,.57),0);assert.ok(groundFireHit(2,.65)>0);assert.equal(groundFireHit(2,.85),0)
 assert.equal(groundFireHit(0,.8),0);assert.equal(groundFireHit(4,.7),0)
})
test('meteor recoil follows actual landing frames and recovers after the last meteor',()=>{
 for(let i=0;i<8;i++){
  const p=.22+i*.025+.48
  assert.equal(meteorFlight(i,p,{x:0,y:0},{x:1,y:1})!.stage,'impact')
  assert.ok(groundFireHit(3,p)>0)
 }
 assert.equal(groundFireHit(3,.65),0);assert.equal(groundFireHit(3,.97),0)
})
test('recoil ramps in and decays without a permanent offset',()=>{
 assert.equal(contactStrength(.7,.7,.9),0)
 assert.ok(contactStrength(.72,.7,.9)>contactStrength(.89,.7,.9))
 assert.equal(contactStrength(.9,.7,.9),0)
})
