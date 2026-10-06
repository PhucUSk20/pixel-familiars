import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GroudonAnimator, GroudonTexture, GROUDON_ACTIONS, GROUDON_DURATION, GROUDON_WIDTH, GROUDON_HEIGHT, groudonPose, groudonMouth } from '../primal-groudon'

test('Groudon walking alternates feet and arms; its attacks articulate rather than translate a rigid sprite', () => {
  const left = groudonPose('walk', 350), right = groudonPose('walk', 1100)
  assert.ok(left.leftLift > 3 && left.rightLift === 0)
  assert.ok(right.rightLift > 3 && right.leftLift === 0)
  assert.notEqual(left.leftArm, right.leftArm); assert.notEqual(left.tail, right.tail)
  assert.ok(groudonPose('sleep', 2000).squash < .9)
  assert.ok(groudonPose('roar', 1500).jaw > .3)
  const gather = groudonPose('blades', 1400), slam = groudonPose('blades', 2600)
  assert.ok(gather.leftArm > .2 && slam.leftArm < -.1)
  const charged = groudonPose('burst', 2400), recoil = groudonPose('burst', 3250)
  assert.ok(recoil.x > charged.x + 4)
  assert.notDeepEqual(groudonMouth(charged), groudonMouth(recoil))
  assert.deepEqual(groudonMouth(groudonPose('original', 0)), { x: 131, y: 87 })
})
test('Groudon actions reuse the original texture palette and render distinct bounded frames', () => {
  const source = new Uint8ClampedArray(128 * 128 * 4), palette = new Set<string>()
  for (let y = 20; y < 110; y++) for (let x = 20; x < 110; x++) {
    const i = (y * 128 + x) * 4; source.set([x, y, 70, 255], i); palette.add(`${x},${y},70`)
  }
  const texture = new GroudonTexture(source), frames = new Set<string>()
  for (const action of GROUDON_ACTIONS) {
    const frame = texture.render(groudonPose(action, 2500))
    assert.equal(frame.length, GROUDON_WIDTH * GROUDON_HEIGHT * 4)
    let count = 0
    for (let i = 0; i < frame.length; i += 4) if (frame[i + 3]) { count++; assert.ok(palette.has(`${frame[i]},${frame[i + 1]},${frame[i + 2]}`)) }
    assert.ok(count > 5000); frames.add(Buffer.from(frame).toString('base64'))
  }
  assert.equal(frames.size, 6)
})
test('Groudon rapid interrupted selections remain continuous and auto cycles all six actions', () => {
  const animator = new GroudonAnimator(); animator.select('walk'); animator.advance(2300, false)
  let before = animator.pose(); animator.select('blades'); assert.deepEqual(animator.pose(), before)
  animator.advance(400, false); before = animator.pose(); animator.select('burst'); assert.deepEqual(animator.pose(), before)
  animator.advance(1100, false); assert.equal(animator.transitioning, false)
  animator.select('walk')
  for (const action of GROUDON_ACTIONS) { assert.equal(animator.action, action); animator.advance(GROUDON_DURATION[action], true) }
  assert.equal(animator.action, 'walk')
  const elapsed = animator.elapsed; animator.advance(NaN, true); animator.advance(-5, true); assert.equal(animator.elapsed, elapsed)
})
