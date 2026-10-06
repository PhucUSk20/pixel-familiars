import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ArenaLife } from '../arena-life'

test('autonomous pets roam independently, stage occasional battles, and resume life without manual tasks', () => {
  let seed = 42
  const life = new ArenaLife(() => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 })
  const rayActions = new Set(), groundActions = new Set(), states = new Set()
  let movedRay = false, movedGround = false, previous = life.state, returns = 0, fights = 0
  for (let time = 0; time < 300000; time += 50) {
    life.advance(50)
    states.add(life.state); rayActions.add(life.ray.action); groundActions.add(life.groudon.action)
    movedRay ||= Math.abs(life.ray.x - 16) > 20; movedGround ||= Math.abs(life.groudon.x - 224) > 20
    assert.ok(life.ray.x >= 4 && life.ray.x <= life.width - 196)
    assert.ok(life.groudon.x >= 90 && life.groudon.x <= 230)
    if (previous !== 'duel' && life.state === 'duel') {
      fights++; assert.equal(life.ray.x, 16); assert.equal(life.groudon.x, 224)
      assert.equal(life.ray.right, true); assert.equal(life.groudon.right, false)
    }
    if (previous === 'duel' && life.state === 'roam') returns++
    previous = life.state
  }
  assert.ok(movedRay && movedGround)
  assert.ok(states.has('approach') && fights >= 3 && returns >= 3)
  assert.ok(rayActions.has('sleep') && rayActions.has('dash') && rayActions.has('pulse'))
  assert.ok(groundActions.has('walk') && groundActions.has('sleep') && groundActions.has('burst'))
})

test('rest stops travel; manual battle stages from current positions and free mode cancels it', () => {
  const life = new ArenaLife(() => .4)
  life.advance(4000)
  life.select('rest')
  const x = [life.ray.x, life.groudon.x]
  life.advance(20000)
  assert.deepEqual([life.ray.x, life.groudon.x], x)
  assert.equal(life.ray.action, 'sleep'); assert.equal(life.groudon.action, 'sleep')
  life.select('duel')
  assert.deepEqual([life.ray.x, life.groudon.x], x, 'no teleport when changing modes')
  for (let i = 0; i < 1200 && life.state !== 'duel'; i++) life.advance(50)
  assert.equal(life.state, 'duel')
  life.select('play'); assert.equal(life.state, 'roam')
  const clock = life.clock; life.advance(NaN); life.advance(-1); assert.equal(life.clock, clock)
})


test('wide arena expands flight and keeps Groudon on land across resizes', () => {
  let seed = 17
  const life = new ArenaLife(() => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 })
  life.resize(1600)
  let maxRayX = 0, maxGroundX = 0, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < 24000; i++) {
    life.advance(50)
    maxRayX = Math.max(maxRayX, life.ray.x); maxGroundX = Math.max(maxGroundX, life.groudon.x)
    minY = Math.min(minY, life.ray.y); maxY = Math.max(maxY, life.ray.y)
    assert.ok(life.groudon.x >= life.groundMin && life.groudon.x <= life.groundMax)
    assert.equal(life.groudon.y, 44)
  }
  assert.ok(maxRayX > 480 && maxGroundX > 800)
  assert.ok(maxY - minY > 40, 'flight changes altitude substantially')
  for (const width of [480, 1000, 480]) {
    life.resize(width)
    assert.ok(life.groudon.x >= life.groundMin && life.groudon.x <= life.groundMax)
    assert.ok(life.ray.x >= 4 && life.ray.x <= width - 196)
  }
})

test('Kyogre stays in the sea, moves independently and joins alternating automatic battle pairs', () => {
  let seed = 7
  const life = new ArenaLife(() => { seed = (seed*1664525+1013904223) >>> 0; return seed/2**32 })
  const actions = new Set(), opponents = new Set()
  let moved = false
  for (let i = 0; i < 18000; i++) {
    if (i === 7000) life.resize(1000)
    if (i === 13000) life.resize(480)
    life.advance(50)
    assert.ok(life.kyogre.x >= -40 && life.kyogre.x <= life.swimMax)
    actions.add(life.kyogre.action)
    moved ||= Math.abs(life.kyogre.x+15)>15
    if (life.state === 'duel') opponents.add(life.opponent)
  }
  assert.ok(moved && actions.has('swim') && actions.has('dive') && actions.has('pulse'))
  assert.deepEqual(opponents,new Set(['kyogre','ray']))
  life.select('rest'); const x = life.kyogre.x; life.advance(15000)
  assert.equal(life.kyogre.action,'sleep'); assert.equal(life.kyogre.x,x)
})
