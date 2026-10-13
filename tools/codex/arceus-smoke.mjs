import assert from 'node:assert/strict'
export async function checkArceus(browser, url) {
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } }), errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await page.addInitScript(() => { window.divineNow = 1000; window.requestAnimationFrame = callback => { window.arenaTick = callback; return 1 } })
  const advance = async duration => page.evaluate(duration => { for (let t = 0; t < duration; t += 100) window.arenaTick(window.divineNow += 100) }, duration)
  const data=()=>page.locator('#arena').evaluate(c=>({...c.dataset}))
  try {
    await page.goto(`${url}/arceus-demo`)
    await page.waitForFunction(() => document.querySelector('#arena')?.dataset.ready === 'true')
    await page.evaluate(() => window.arenaTick(window.divineNow))
    assert.equal(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=128;const pen=c.getContext('2d');pen.drawImage(document.querySelector('#arena-arceus'),0,0,128,128,0,0,128,128);return pen.getImageData(0,0,1,1).data[3]}),0)
    await page.evaluate(()=>{window.divineJoinChance(.9);window.creationAuto(false)})
    for(const skill of ['judgment','judgment','judgment','judgment']){
      const starts=await data()
      await page.locator('#arena-summon').click()
      assert.equal(await page.locator('#arena-summon').isDisabled(),true)
      assert.equal(await page.locator('button[data-mode=play]').getAttribute('aria-pressed'),'true')
      await advance(900);const falling=await data();assert.ok(Number(falling.arceusY)<7)
      await advance(2300);const afraid=await data()
      assert.equal(afraid.arceusStage,'awe');assert.equal(Number(afraid.arceusY),7);assert.equal(Number(afraid.arceusPlates),18)
      assert.equal(Number(afraid.arceusX),Number(afraid.worldWidth)/2)
      for(const key of ['rayX','deoxysX','kyogreX','groundX'])assert.ok(Math.abs(Number(afraid[key])-Number(starts[key]))<25,'no flight to panel edges')
      await advance(3500);const shield=await data();assert.equal(shield.arceusStage,'assault');assert.equal(shield.arceusShield,'true')
      for(const key of ['rayHit','deoxysHit','fireHit','divineGroundHit'])assert.equal(Number(shield[key]),0)
      await page.screenshot({path:'dist/arceus-combined-assault.png'})
      await advance(5600);assert.equal((await data()).arceusSkill,'judgment')
      await page.screenshot({path:'dist/arceus-judgment-charge.png'})
      await advance(4800);const hit=await data()
      for(const key of ['rayHit','deoxysHit','fireHit','divineGroundHit'])assert.ok(Number(hit[key])>0,`${key} reacts to counter Judgment`)
      await page.screenshot({path:'dist/arceus-judgment-impact.png'})
      await advance(7100);assert.equal((await data()).arceusStage,'absent');assert.equal((await data()).state,'roam')
      assert.equal(await page.locator('#arena-summon').isEnabled(),true)
    }
    await page.locator('button[data-mode=rest]').click();await page.locator('#arena-summon').click();await advance(3200)
    await page.setViewportSize({width:1600,height:180});await advance(100)
    const wide=await data();assert.equal(Number(wide.arceusX),Number(wide.worldWidth)/2)
    await page.locator('button[data-mode=rest]').click();assert.equal((await data()).arceusStage,'absent')
    await page.locator('button[data-mode=duel]').click();await page.locator('#arena-summon').click()
    assert.equal((await data()).mode,'play');assert.equal((await data()).arceusStage,'arrival')
    assert.deepEqual(errors,[])
    console.log('PASS: manual Arceus summon from Auto/Rest/Duel, disabled repeat, descending orbit of 18 plates, gentle nearby-only retreat, four blocked attacks, counter Judgment and bounded knockback, departure directly after Judgment, resize, departure and cancellation.')
  } finally { await page.close() }
}
