import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

export async function checkGroudon(browser, url) {
  const page = await browser.newPage({ viewport: { width: 700, height: 480 } }), errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.addInitScript(() => {
    window.groudonTestTime = 1000; window.groudonMessages = []
    window.requestAnimationFrame = callback => { window.groudonTestTick = callback; return 1 }
    window.acquireVsCodeApi = () => ({ postMessage: value => window.groudonMessages.push(value) })
  })
  const advance = ms => page.evaluate(ms => { for (let elapsed = 0; elapsed < ms; elapsed += 50) window.groudonTestTick(window.groudonTestTime += 50) }, ms)
  try {
    await page.goto(`${url}/groudon`)
    await page.waitForFunction(() => document.querySelector('#groudon').dataset.ready === 'true', undefined, { polling: 50 })
    assert.equal(await page.locator('#groudon').getAttribute('data-action'), 'walk')
    // Decode the user's GIF directly; verify all 160 transparent atlas frames
    // reproduce it exactly when composited over its original background.
    const gif = (await readFile('extensions/codex/groudon-primal-128px.gif')).toString('base64')
    assert.equal(await page.evaluate(async gif => {
      const decoder = new ImageDecoder({ data: Uint8Array.from(atob(gif), character => character.charCodeAt(0)), type: 'image/gif' })
      await decoder.tracks.ready
      const source = document.createElement('canvas'), rebuilt = document.createElement('canvas')
      source.width = rebuilt.width = source.height = rebuilt.height = 128
      const a = source.getContext('2d'), b = rebuilt.getContext('2d'), atlas = document.querySelector('#groudon-atlas')
      let same = decoder.tracks.selectedTrack.frameCount === 160
      for (let frame = 0; frame < 160 && same; frame++) {
        const decoded = await decoder.decode({ frameIndex: frame })
        a.clearRect(0, 0, 128, 128); a.drawImage(decoded.image, 0, 0); decoded.image.close()
        b.fillStyle = '#0b1925'; b.fillRect(0, 0, 128, 128)
        b.drawImage(atlas, frame % 16 * 128, Math.floor(frame / 16) * 128, 128, 128, 0, 0, 128, 128)
        const original = a.getImageData(0, 0, 128, 128).data, restored = b.getImageData(0, 0, 128, 128).data
        same = original.every((value, index) => value === restored[index])
      }
      decoder.close(); return same
    }, gif), true, 'atlas must preserve every source frame')
    const frames = new Set(), durations = { walk: 6500, sleep: 8500, roar: 5000, blades: 7000, burst: 6500, eruption: 6500 }
    for (const [action, duration] of Object.entries(durations)) {
      await page.locator(`button[data-action="${action}"]`).click(); await advance(duration * .55)
      assert.equal(await page.locator('#groudon').getAttribute('data-transition'), 'false')
      frames.add(await page.locator('#groudon').evaluate(canvas => canvas.toDataURL()))
      if (['blades', 'burst', 'eruption'].includes(action)) assert.equal(await page.locator('#groudon').getAttribute('data-effect'), 'release')
      await page.screenshot({ path: `dist/groudon-ui-${action}.png` })
    }
    assert.equal(frames.size, 6)
    await page.locator('button[data-action="original"]').click(); await advance(1500)
    const first = await page.locator('#groudon').getAttribute('data-frame'); await advance(150)
    assert.notEqual(await page.locator('#groudon').getAttribute('data-frame'), first)
    await page.locator('#groudon-pause').click()
    // Pause changes toolbar text; let ResizeObserver finish the resulting reflow.
    await page.waitForTimeout(200)
    const frozen = await page.locator('#groudon').evaluate(canvas => canvas.toDataURL()); await advance(1500)
    assert.equal(await page.locator('#groudon').evaluate(canvas => canvas.toDataURL()), frozen)
    await page.locator('button[data-action="burst"]').click()
    await page.waitForTimeout(200)
    const transition = await page.locator('#groudon').evaluate(canvas => canvas.toDataURL()); await advance(1500)
    assert.equal(await page.locator('#groudon').evaluate(canvas => canvas.toDataURL()), transition)
    for (const viewport of [{ width: 240, height: 360 }, { width: 1600, height: 230 }]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(100)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'toolbar must reflow')
      assert.ok(await page.locator('#groudon').evaluate(canvas => canvas.width > 0 && canvas.height > 0 && [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((value, index) => index % 4 === 3 && value)), 'paused resize must keep the pet visible')
    }
    await page.locator('#groudon-pause').click(); await advance(1500)
    assert.equal(await page.locator('#groudon').getAttribute('data-transition'), 'false')
    assert.deepEqual(await page.evaluate(() => window.groudonMessages), [])
    assert.deepEqual(errors, [])
    console.log('PASS: Groudon source fidelity (160 frames), six articulated actions, attacks, original loop, pause, responsive layout and no host/model requests')
  } finally { await page.close() }
}
