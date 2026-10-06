import assert from 'node:assert/strict'

export async function checkArena(browser, url) {
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.addInitScript(() => {
    let seed = 42
    Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
    window.arenaNow = 1000
    window.requestAnimationFrame = callback => { window.arenaTick = callback; return 1 }
    window.arenaMessages = []
    window.acquireVsCodeApi = () => ({ postMessage: message => window.arenaMessages.push(message) })
  })
  try {
    await page.goto(`${url}/arena`)
    await page.waitForFunction(() => document.querySelector('#arena')?.dataset.ready === 'true', undefined, { polling: 50 })
    const advance = ms => page.evaluate(ms => { for (let t = 0; t <= ms; t += 50) { window.arenaNow += 50; window.arenaTick(window.arenaNow) } }, ms)
    await advance(1600)
    assert.deepEqual(await page.evaluate(() => [...document.querySelector('#arena').getContext('2d').getImageData(0, 0, 1, 1).data]), [0, 0, 0, 255], 'arena and letterboxing must be black')
    assert.equal(await page.locator('#arena').getAttribute('data-ray'), 'fly')
    assert.equal(await page.locator('#arena').getAttribute('data-groudon'), 'walk')
    assert.equal(await page.locator('#arena').getAttribute('data-kyogre'), 'swim')
    assert.ok(Number(await page.locator('#arena').getAttribute('data-kyogre-x')) > -15)
    assert.ok(Number(await page.locator('#arena').getAttribute('data-ray-x')) > 16)
    assert.ok(Number(await page.locator('#arena').getAttribute('data-ground-x')) < 224)
    await page.locator('button[data-mode="duel"]').click()
    for (let i = 0; i < 60 && await page.locator('#arena').getAttribute('data-air-stage') !== 'fight'; i++) await advance(250)
    assert.equal(await page.locator('#arena').getAttribute('data-state'),'duel')
    assert.equal(await page.locator('#arena').getAttribute('data-opponent'),'deoxys')
    assert.equal(await page.locator('#arena').getAttribute('data-deoxys'),'defense')
    assert.equal(await page.locator('#arena').getAttribute('data-ground-state'),'fight')
    assert.notEqual(await page.locator('#arena').getAttribute('data-kyogre'),'sleep')
    assert.notEqual(await page.locator('#arena').getAttribute('data-groudon'),'sleep')
    const groundTurns=new Set([await page.locator('#arena').getAttribute('data-ground-turn')])
    for(let i=0;i<5;i++){await advance(7000);groundTurns.add(await page.locator('#arena').getAttribute('data-ground-turn'))}
    assert.equal(groundTurns.size,5,'ground pair cycles independently during meteorite interludes')
    // Capture the ground pair at its three corrected signature effects.
    for(const [turn,elapsed,effect] of [[0,4200,'projectile'],[0,5800,'impact'],[2,2100,'charge'],[2,3700,'projectile'],[2,4500,'projectile'],[2,5800,'impact'],[3,2000,'meteor-rise'],[3,3500,'meteor-rain'],[3,4300,'meteor-rain'],[4,4200,'clash']]) {
      for(let i=0;i<160;i++) {const d=await page.locator('#arena').evaluate(c=>({...c.dataset}));if(Number(d.groundTurn)===turn&&Number(d.groundElapsed)<elapsed)break;await advance(250)}
      const at=Number(await page.locator('#arena').getAttribute('data-ground-elapsed'))
      await advance(Math.max(0,elapsed-at))
      assert.equal(await page.locator('#arena').getAttribute('data-ground-turn'),String(turn))
      assert.equal(await page.locator('#arena').getAttribute('data-ground-effect'),effect)
      if(turn===2&&elapsed===5800){assert.equal(await page.locator('#arena').getAttribute('data-vortex-hit'),'true');assert.equal(await page.locator('#arena').getAttribute('data-blades-hit'),'true')}
      if(turn===3&&elapsed===3500)assert.equal(await page.locator('#arena').getAttribute('data-thunder-hit'),'true')
      if(turn===0&&elapsed===5800)assert.equal(await page.locator('#arena').getAttribute('data-water-hit'),'true')
      await page.screenshot({path:`dist/arena-ground-${turn===2?'vortex-'+elapsed:turn===3&&elapsed===3500?'thunder':effect}.png`})
    }
    // Restart both pairs for the aerial phase assertions.
    await page.locator('button[data-mode="duel"]').click()
    for(let i=0;i<120&&await page.locator('#arena').getAttribute('data-air-stage')!=='fight';i++)await advance(250)
    await advance(3300)
    assert.equal(await page.locator('#arena').getAttribute('data-phase'),'projectile')
    await page.screenshot({path:'dist/arena-duel.png'})
    await advance(1700)
    assert.equal(await page.locator('#arena').getAttribute('data-phase'),'shield')
    for(const [turn,form,phase] of [[1,'attack','dodge'],[2,'speed','chase'],[3,'normal','impact']]) {
      for(let i=0;i<120;i++) {if(await page.locator('#arena').getAttribute('data-air-turn')===String(turn)&&await page.locator('#arena').getAttribute('data-air-stage')==='fight')break;await advance(250)}
      assert.equal(await page.locator('#arena').getAttribute('data-air-turn'),String(turn))
      assert.equal(await page.locator('#arena').getAttribute('data-deoxys'),form)
      if(turn===1) {
        while(Number(await page.locator('#arena').getAttribute('data-air-elapsed'))<2700)await advance(50)
        for(let i=0;i<10&&!await page.locator('#arena').getAttribute('data-shot-target-x');i++)await advance(50)
        const aimed=await page.locator('#arena').evaluate(c=>({...c.dataset}))
        assert.ok(Math.abs(Number(aimed.shotTargetX)-Number(aimed.rayAimX))<8)
        assert.ok(Math.abs(Number(aimed.shotTargetY)-Number(aimed.rayAimY))<8,'shot must lock the actual articulated Rayquaza head, not a fixed altitude')
        await advance(1000)
        assert.equal(await page.locator('#arena').getAttribute('data-shot-target-y'),aimed.shotTargetY,'ballistic aim stays locked while Rayquaza dodges')
        assert.ok(Math.abs(Number(await page.locator('#arena').getAttribute('data-ray-aim-y'))-Number(aimed.shotTargetY))>10)
        await advance(Math.max(0,5000-Number(await page.locator('#arena').getAttribute('data-air-elapsed'))))
      } else await advance(turn===2?3500:5000)
      assert.equal(await page.locator('#arena').getAttribute('data-phase'),phase)
      await page.screenshot({path:`dist/arena-air-round-${turn}.png`})
    }
    await page.locator('button[data-mode="play"]').click()
    for (let i = 0; i < 70 && await page.locator('#arena').getAttribute('data-state') !== 'duel'; i++) await advance(1000)
    assert.equal(await page.locator('#arena').getAttribute('data-state'), 'duel', 'free mode starts battles without user input')
    await advance(30000)
    assert.equal(await page.locator('#arena').getAttribute('data-state'), 'roam', 'autonomous battle ends and returns to roaming')
    await page.screenshot({ path: 'dist/arena-life.png' })
    let autoAim=false
    for(let i=0;i<200;i++) {
      await advance(500)
      const shot=await page.locator('#arena').evaluate(c=>({...c.dataset}))
      if(shot.shotTargetX&&['normal','attack'].includes(shot.deoxys)&&shot.deoxysState==='skill') {
        assert.ok(Math.abs(Number(shot.shotTargetX)-Number(shot.rayAimX))<35)
        assert.ok(Math.abs(Number(shot.shotTargetY)-Number(shot.rayAimY))<35)
        await page.screenshot({path:'dist/arena-auto-aim.png'});autoAim=true;break
      }
    }
    assert.ok(autoAim,'autonomous Deoxys spells target Rayquaza too')
    await page.locator('button[data-mode="rest"]').click()
    await advance(1600)
    assert.equal(await page.locator('#arena').getAttribute('data-ray'), 'sleep')
    assert.equal(await page.locator('#arena').getAttribute('data-groudon'), 'sleep')
    assert.equal(await page.locator('#arena').getAttribute('data-kyogre'), 'sleep')
    assert.equal(await page.locator('#arena').getAttribute('data-deoxys-state'),'rest')
    await page.locator('#arena-pause').click()
    const frozenImage = await page.evaluate(() => document.querySelector('#arena').toDataURL())
    const frozen = await page.locator('#arena').getAttribute('data-elapsed')
    await advance(2000)
    assert.equal(await page.locator('#arena').getAttribute('data-elapsed'), frozen)
    assert.equal(await page.evaluate(() => document.querySelector('#arena').toDataURL()), frozenImage, 'pause freezes eruption, lava and stars too')
    for (const viewport of [{ width: 240, height: 350 }, { width: 1600, height: 180 }]) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(100)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      assert.ok(await page.evaluate(() => document.querySelector('#arena').width > 0))
      if (viewport.width > 1000) {
        assert.ok(Number(await page.locator('#arena').getAttribute('data-world-width')) > 1000, 'wide panels add world space rather than letterboxing')
        const edges = await page.evaluate(() => {
          const c = document.querySelector('#arena'), ctx = c.getContext('2d')
          return [1, c.width - 2].map(x => [...ctx.getImageData(x, c.height - 2, 1, 1).data])
        })
        assert.ok(edges.every(rgba => rgba.slice(0, 3).some(channel => channel > 0)), 'sea and land cover both panel edges')
        await page.screenshot({ path: 'dist/arena-wide.png' })
      }
    }
    assert.deepEqual(errors, [])
    assert.deepEqual(await page.evaluate(() => window.arenaMessages), [])
    console.log('PASS: shared legendary arena, four pets including ocean-bounded Kyogre and meteorite Deoxys, independent roaming, automatic battle and return, Rayquaza/Deoxys defense, dodge, pursuit and clash, rest, pause, responsive layout and no AI messages.')
  } finally { await page.close() }
}
