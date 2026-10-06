import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AimedShot } from '../aimed-shot'

test('shots lock the real moving target at release and follow its full two-dimensional direction',()=>{
 const shot=new AimedShot(),source={x:340,y:65},target={x:120,y:98}
 assert.equal(shot.sample(300,400,800,source,target),undefined)
 assert.deepEqual(shot.sample(400,400,800,source,target),source)
 target.x=180;target.y=150;source.x=380
 assert.deepEqual(shot.sample(600,400,800,source,target),{x:230,y:81.5})
 assert.deepEqual(shot.sample(800,400,800,source,target),{x:120,y:98})
 const overshoot=shot.sample(900,400,800,source,target)!
 assert.ok(overshoot.x<120&&overshoot.y>98,'continues along the locked direction when Rayquaza dodges')
 shot.reset();assert.deepEqual(shot.sample(400,400,800,source,target),source);assert.deepEqual(shot.target,target)
})
