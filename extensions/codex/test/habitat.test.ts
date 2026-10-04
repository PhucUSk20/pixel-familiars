import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PetHabitat, type HabitatFrame } from '../habitat'

function random() {
  let seed = 42
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}

test('both pets roam independently with bounded steps, varied solo activities and room between them', () => {
  const habitat = new PetHabitat(random())
  const mainPositions = new Set<number>(), miniPositions = new Set<number>(), texts = new Set<string>()
  let previous: HabitatFrame | undefined
  let separate = 0
  for (let now = 1000; now < 121000; now += 100) {
    const frame = habitat.update(now, 80, 0, 72, true)!
    assert.ok(frame.main.x >= 0 && frame.main.x + 19 <= 80)
    assert.ok(frame.mini.x >= 0 && frame.mini.x + 6 <= 80)
    if (frame.phase === 'roam') {
      mainPositions.add(Math.round(frame.main.x)); miniPositions.add(Math.round(frame.mini.x)); texts.add(frame.text)
      if (Math.abs(frame.main.x + 9.5 - frame.mini.x - 3) > 24) separate++
    }
    if (previous && previous.phase !== 'play' && frame.phase !== 'play') {
      assert.ok(Math.abs(frame.main.x - previous.main.x) <= 1.21, 'main must walk to its destination')
      assert.ok(Math.abs(frame.mini.x - previous.mini.x) <= 1.81, 'Mini must not teleport to follow the main pet')
    }
    previous = frame
  }
  assert.ok(mainPositions.size > 10 && miniPositions.size > 10)
  assert.ok(texts.size > 5, 'the two actors must choose different solo activities')
  assert.ok(separate > 100, 'Mini must not continually occupy the slot beside the main pet')
})

test('an invitation walks the pair together, starts the scene only on arrival, then separates them', () => {
  const habitat = new PetHabitat(() => 0.5)
  habitat.request('highfive')
  let frame = habitat.update(1000, 80, 0, 72, true)!
  assert.equal(frame.phase, 'meet'); assert.equal(frame.kind, undefined)
  assert.equal(frame.main.x, 0); assert.equal(frame.mini.x, 72)
  let played = false, separated = false, largestGap = 0
  for (let now = 1100; now < 22000; now += 100) {
    frame = habitat.update(now, 80, 0, 72, true)!
    if (frame.phase === 'play') { assert.equal(frame.kind, 'highfive'); played = true }
    if (frame.phase === 'apart') {
      assert.equal(played, true); separated = true
      largestGap = Math.max(largestGap, frame.mini.x - frame.main.x)
    }
  }
  assert.equal(played, true); assert.equal(separated, true)
  assert.ok(largestGap > 40, 'after playing Mini must head away instead of snapping beside the main pet')
})

test('work cancels a rendezvous or active scene and resumes fresh without moving the busy AI pet', () => {
  const habitat = new PetHabitat(() => 0.5)
  habitat.request('play')
  let frame = habitat.update(1000, 80, 0, 72, true)!
  assert.equal(habitat.update(1100, 80, 12, frame.mini.x, false), undefined)
  frame = habitat.update(1200, 80, 12, frame.mini.x, true)!
  assert.equal(frame.kind, undefined); assert.equal(frame.phase, 'roam')
  assert.ok(Math.abs(frame.main.x - 12) <= 0.6)
  habitat.request('feed')
  for (let now = 1300; now < 10000; now += 100) {
    frame = habitat.update(now, 80, 12, frame.mini.x, true)!
    if (frame.kind === 'feed') break
  }
  assert.equal(frame.kind, 'feed')
  assert.equal(habitat.update(10100, 80, 18, frame.mini.x, false), undefined)
  assert.equal(habitat.update(10200, 80, 18, frame.mini.x, true)?.kind, undefined)
})

test('manual Mini placement and resizing retain valid positions and never trigger an immediate scene', () => {
  const habitat = new PetHabitat(random())
  habitat.update(1000, 200, 140, 10, true)
  habitat.placeMini(90)
  habitat.update(1100, 200, 140, 90, false)
  const frame = habitat.update(1200, 48, 20, 42, true)!
  assert.equal(frame.kind, undefined)
  assert.ok(frame.main.x >= 0 && frame.main.x + 19 <= 48)
  assert.ok(frame.mini.x >= 0 && frame.mini.x + 6 <= 48)
})
