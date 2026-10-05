import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DragonAnimator, dragonPose, rasterDragon, LEGENDARY_ACTIONS, TRANSITION_MS, LEGENDARY_DURATION } from '../legendary-rig'

test('flight changes body shape in local coordinates; tail lags, sleep coils and jaw articulates', () => {
  const a = dragonPose('fly', 0), b = dragonPose('fly', 1100)
  const local = (pose: typeof a) => pose.spine.map(p => [p.x - pose.spine[0].x, p.y - pose.spine[0].y])
  assert.notDeepEqual(local(a), local(b), 'flight cannot just translate one sprite')
  const sleep = dragonPose('sleep', 3000), dash = dragonPose('dash', 3000)
  assert.equal(sleep.eyes, 1)
  assert.ok(sleep.fins < a.fins)
  assert.ok(Math.max(...sleep.spine.map(p => p.x)) - Math.min(...sleep.spine.map(p => p.x)) < Math.max(...dash.spine.map(p => p.x)) - Math.min(...dash.spine.map(p => p.x)))
  assert.ok(dragonPose('roar', 2500).jaw > .9)
  assert.ok(dragonPose('roar', 5400).jaw < .1)
  assert.ok(dragonPose('dash', 5300).fins > dragonPose('dash', 2000).fins, 'braking opens the fins')
  const shapes = LEGENDARY_ACTIONS.map(action => Buffer.from(rasterDragon(dragonPose(action, 2500)).buffer).toString('base64'))
  assert.equal(new Set(shapes).size, 5)
})
test('action changes begin at the exact current blended pose and finish continuously, even after rapid clicks', () => {
  const animator = new DragonAnimator(); animator.advance(2400, false)
  let before = animator.pose(); animator.select('sleep'); assert.deepEqual(animator.pose(), before)
  animator.advance(500, false); before = animator.pose(); animator.select('roar'); assert.deepEqual(animator.pose(), before)
  const midway = animator.pose(); animator.advance(TRANSITION_MS, false)
  assert.equal(animator.transitioning, false); assert.notDeepEqual(animator.pose(), midway)
  assert.deepEqual(animator.pose(), dragonPose('roar', TRANSITION_MS))
})
test('automatic action cycle and manual repeats use transitions; bounded sprites remain visible', () => {
  const animator = new DragonAnimator()
  for (const action of LEGENDARY_ACTIONS) {
    assert.equal(animator.action, action)
    animator.advance(LEGENDARY_DURATION[action], true)
    assert.equal(animator.transitioning, true)
  }
  animator.select('dash'); animator.advance(LEGENDARY_DURATION.dash, false)
  assert.equal(animator.action, 'dash'); assert.equal(animator.transitioning, true)
  for (const action of LEGENDARY_ACTIONS) for (let ms = 0; ms < LEGENDARY_DURATION[action]; ms += 250) {
    const pixels = rasterDragon(dragonPose(action, ms))
    assert.equal(pixels.length, 4096); assert.ok(pixels.filter(p => p !== 0).length > 120)
  }
})
