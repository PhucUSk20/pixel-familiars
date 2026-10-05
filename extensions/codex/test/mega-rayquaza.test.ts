import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MegaAnimator, MegaTexture, MEGA_ACTIONS, MEGA_SIZE, MEGA_DURATION, megaPose, megaMouth } from '../mega-rayquaza'

function fixture(): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(128 * 128 * 4)
  for (let y = 10; y < 120; y++) for (let x = 10; x < 120; x++) {
    const i = (y * 128 + x) * 4
    pixels[i] = x; pixels[i + 1] = y; pixels[i + 2] = (x + y) % 255; pixels[i + 3] = 255
  }
  return pixels
}
test('texture articulation reuses source colors instead of inventing replacement anatomy', () => {
  const source = fixture(), texture = new MegaTexture(source), palette = new Set<string>()
  for (let i = 0; i < source.length; i += 4) if (source[i + 3]) palette.add(`${source[i]},${source[i + 1]},${source[i + 2]}`)
  const frames = new Set<string>()
  for (const action of MEGA_ACTIONS) {
    const output = texture.render(megaPose(action, 2500))
    assert.equal(output.length, MEGA_SIZE * MEGA_SIZE * 4)
    let opaque = 0
    for (let i = 0; i < output.length; i += 4) if (output[i + 3]) { opaque++; assert.ok(palette.has(`${output[i]},${output[i + 1]},${output[i + 2]}`)) }
    assert.ok(opaque > 5000); frames.add(Buffer.from(output).toString('base64'))
  }
  assert.equal(frames.size, 5)
})
test('source head, body, jaw and fins have independent motion and pulse origin follows the face', () => {
  const fly1 = megaPose('fly', 400), fly2 = megaPose('fly', 1600)
  assert.notDeepEqual(fly1.body, fly2.body)
  const differences = fly1.body.map((p, i) => p.x - fly2.body[i].x)
  assert.ok(new Set(differences.map(n => Math.round(n * 10))).size > 5, 'flight is not rigid translation')
  assert.ok(megaPose('sleep', 2500).eyes > .9)
  assert.ok(megaPose('roar', 2500).jaw > .4)
  assert.ok(megaPose('roar', 5400).jaw < .05)
  const charge = megaPose('pulse', 2600), recoil = megaPose('pulse', 3000)
  assert.deepEqual(megaMouth(megaPose('original', 0)), { x: 71, y: 89 })
  assert.notDeepEqual(megaMouth(charge), megaMouth(recoil))
  assert.ok(recoil.headX > charge.headX)
  const dash = megaPose('dash', 3000), brake = megaPose('dash', 5900)
  assert.ok(dash.body.at(-1)!.x > brake.body.at(-1)!.x + 25)
})
test('rapid selections transition from the current blended pose; automatic and manual loops retain transitions', () => {
  const animator = new MegaAnimator(); animator.select('fly'); animator.advance(2300, false)
  let before = animator.pose(); animator.select('sleep'); assert.deepEqual(animator.pose(), before)
  animator.advance(500, false); before = animator.pose(); animator.select('pulse'); assert.deepEqual(animator.pose(), before)
  animator.advance(1200, false); assert.equal(animator.transitioning, false)
  assert.deepEqual(animator.pose(), megaPose('pulse', 1200))
  animator.select('fly')
  for (const action of MEGA_ACTIONS) { assert.equal(animator.action, action); animator.advance(MEGA_DURATION[action], true); assert.ok(animator.transitioning) }
  animator.select('dash'); animator.advance(MEGA_DURATION.dash, false); assert.equal(animator.action, 'dash'); assert.ok(animator.transitioning)
})
