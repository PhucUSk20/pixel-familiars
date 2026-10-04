import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { InteractionClock, INTERACTIONS, interactionFrame, interactionMain, drawInteraction } from '../interactions'
import { canvas } from '../../../plugins/pixel-pet/hooks/pixels'
import { animate, readTheme } from '../../../plugins/pixel-pet/hooks/theme'

test('automatic playlist waits for idle, covers every interaction before repeats and yields immediately', () => {
  const clock = new InteractionClock(() => 0.5)
  assert.equal(clock.update(1000, true, 48, 0), undefined)
  const seen = new Set<string>()
  let previous = ''
  for (let now = 13000; seen.size < INTERACTIONS.length && now < 900000; now += 30000) {
    const frame = clock.update(now, true, 48, 0)!
    assert.ok(frame)
    assert.notEqual(frame.kind, previous)
    assert.equal(seen.has(frame.kind), false, 'playlist must exhaust its bag')
    seen.add(frame.kind); previous = frame.kind
  }
  assert.equal(seen.size, 20)
  assert.equal(clock.update(910000, false, 48, 0), undefined, 'work/Rest must cancel even an active scene')
  assert.equal(clock.update(910100, true, 48, 0), undefined, 'returning to idle waits; interrupted scenes never resume')
})

test('Feed and Play have different choreography; explicit actions replace the current scene', () => {
  const clock = new InteractionClock(() => 0)
  clock.request('feed', 100)
  assert.equal(clock.update(600, true, 48, 0)?.kind, 'feed')
  clock.request('play', 700)
  assert.equal(clock.update(800, true, 48, 0)?.kind, 'play')
  assert.notDeepEqual(interactionFrame('feed', 1500, 48, 0).props, interactionFrame('play', 1500, 48, 0).props)
  assert.notDeepEqual(interactionFrame('feed', 1500, 48, 0).main, interactionFrame('play', 1500, 48, 0).main)
  clock.cancel(850)
  assert.equal(clock.update(1000, true, 48, 0), undefined)
})

test('all 20 interactions animate distinct bounded pixel sequences with slime and custom pet art', async () => {
  for (const name of ['slime', 'alien']) {
    const parsed = readTheme(JSON.parse(await readFile(`plugins/pixel-pet/assets/${name}.json`, 'utf8')))
    assert.equal(parsed.errors, undefined)
    const body = animate(parsed.theme)
    const fingerprints = new Set<string>()
    for (const kind of INTERACTIONS) {
      const frames: number[][] = []
      for (const elapsed of [500, 1800, 3600, 5900]) {
        const frame = interactionFrame(kind, elapsed, 48, 200)
        assert.ok(frame.main.x >= 0 && frame.main.x + 19 <= 48)
        assert.ok(frame.mini.x >= 0 && frame.mini.x + 6 <= 48)
        const main = interactionMain(body, frame)
        const band = canvas(48, 22)
        for (let y = 0; y < main.h; y++) for (let x = 0; x < main.w; x++) band.px[y * band.w + Math.round(frame.main.x) + x] = main.px[y * main.w + x]
        drawInteraction(body, band, frame)
        assert.equal(band.px.length, 48 * 22, 'drawing must not write beyond the canvas')
        assert.ok(band.px.every(pixel => Number.isInteger(pixel)))
        frames.push(band.px)
      }
      assert.ok(new Set(frames.map(frame => JSON.stringify(frame))).size > 1, `${kind} must have motion`)
      const fingerprint = JSON.stringify(frames)
      assert.equal(fingerprints.has(fingerprint), false, `${kind} must not reuse another scene's animation`)
      fingerprints.add(fingerprint)
    }
    assert.equal(fingerprints.size, 20)
  }
})
