import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { bundledTheme, meadowTheme } from '../scene-theme'
import { animate, readTheme } from '../../../plugins/pixel-pet/hooks/theme'
import { drawBand, layScene, obstacleSpans } from '../../../plugins/pixel-pet/hooks/scene'
import { compose, HEIGHT, BODY_W } from '../../../plugins/pixel-pet/hooks/pixels'
import { step, LEAP_MS } from '../../../plugins/pixel-pet/hooks/anim'
import { compactionBath } from '../compaction'
import type { Anim } from '../../../plugins/pixel-pet/types'

test('bundled slime draws ground, sky, rocks and drifting decor without changing its sprite', async () => {
  const slime = JSON.parse(await readFile('plugins/pixel-pet/assets/slime.json', 'utf8'))
  const themed = bundledTheme(slime)
  assert.deepEqual(themed.sprite, slime.sprite)
  for (const [key, color] of Object.entries(slime.palette)) assert.equal((themed.palette as Record<string, string>)[key], color)
  const read = readTheme(themed)
  assert.equal(read.errors, undefined)
  assert.deepEqual(read.notes, [])
  const body = animate(read.theme)
  assert.ok(body.scene)
  const layout = layScene(body.scene, 140)
  const picture = compose(body, 'idle', 0, 1)
  const first = drawBand(body, body.scene, layout, picture, 0, 0)
  assert.ok(first.px.slice(HEIGHT * first.w).every(color => color >= 0), 'ground must fill the full band')
  assert.ok(first.px.slice(0, first.w * 4).some(color => color >= 0), 'sky must be visible')
  assert.ok(layout.obstacles.length > 0)
  assert.ok(layout.decor.some(item => item.drift !== undefined))
  const later = drawBand(body, body.scene, layout, picture, 0, 10000)
  assert.notDeepEqual(later.px, first.px, 'raised decor must drift')
  const obstacle = obstacleSpans(layout)[0]
  const activity = { isWorking: true, activeTools: 0, activeMode: 'bash' as const, activeTarget: '', lastToolAt: 1000, room: 140 - BODY_W, obstacles: obstacleSpans(layout), trail: 0 }
  const initial: Anim = { mode: 'run', since: 0, x: obstacle.x - BODY_W - 1, dir: 1, tick: 0, target: '', working: true }
  const jumping = step(initial, activity, 1100)
  assert.ok(jumping.leap, 'pet must leap over the rock')
  const landed = step(jumping, { ...activity, activeTools: 1 }, 1100 + LEAP_MS)
  assert.equal(landed.leap, undefined)
  assert.ok(landed.x >= obstacle.x + obstacle.w)
})

test('scene selection preserves custom colors, is repeatable and keeps explicit scene choices', async () => {
  const alien = JSON.parse(await readFile('plugins/pixel-pet/assets/alien.json', 'utf8'))
  assert.deepEqual(bundledTheme(alien), alien)
  const meadow = meadowTheme(alien)
  assert.deepEqual(meadowTheme(meadow), meadow, 'repeated scene selection must not consume more palette keys')
  assert.deepEqual(meadow.props, alien.props)
  for (const [key, color] of Object.entries(alien.palette)) assert.equal((meadow.palette as Record<string, string>)[key], color)
  assert.deepEqual(bundledTheme({ ...alien, scene: null }).scene, null)
})

test('compaction bath retains mini pixels, animates steam and does not mutate the original frame', () => {
  const picture = { w: BODY_W + 8, h: HEIGHT, px: new Array<number>((BODY_W + 8) * HEIGHT).fill(-1) }
  picture.px[18 * picture.w] = 0x123456
  const bath = compactionBath(picture, 1, 0)
  assert.equal(bath.px[18 * picture.w], 0x123456)
  assert.equal(picture.px[19 * picture.w + 10], -1)
  assert.notDeepEqual(compactionBath(picture, 1, 500).px, bath.px)
  assert.equal(bath.px.length, picture.px.length)
})
