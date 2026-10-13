import assert from 'node:assert/strict'
export async function checkSunMoon(browser,url){
 const page=await browser.newPage({viewport:{width:960,height:500}}),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};window.now=1000;window.requestAnimationFrame=cb=>{window.arenaTick=cb;return 1};window.celestialMessages=[];window.acquireVsCodeApi=()=>({postMessage:m=>window.celestialMessages.push(m)})})
 const data=()=>page.locator('#arena').evaluate(c=>({...c.dataset})),advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=50){window.now+=50;window.arenaTick(window.now)}},ms)
 try{
  await page.goto(url+'/arena');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100)
  await page.locator('button[data-mode="rest"]').click();await page.locator('#arena-celestial').click();assert.equal((await data()).celestialCount,'2');assert.equal(await page.locator('#arena-celestial').isDisabled(),true)
  await advance(200);assert.equal(Number((await data()).celestialOpacity),0);await page.screenshot({path:'dist/sun-moon-spatial-cut.png'})
  await advance(1600);const arrival=await data();assert.equal(arrival.celestialStage,'arrival');assert.ok(Number.isFinite(Number(arrival.rayScreenX)));await page.screenshot({path:'dist/sun-moon-arrival.png'})
  await advance(2800);assert.equal((await data()).celestialStage,'ordinary-charge');assert.ok(Number((await data()).lunalaFold)>.8);await page.screenshot({path:'dist/sun-moon-ordinary-charge.png'})
  await advance(1500);assert.equal((await data()).celestialStage,'ordinary-fire');assert.equal(Number((await data()).lunalaFold),0);await page.screenshot({path:'dist/sun-moon-plasma.png'})
  await advance(1600);assert.equal((await data()).celestialStage,'ordinary-impact');await page.screenshot({path:'dist/sun-moon-plasma-impact.png'})
  await advance(2800);assert.equal((await data()).celestialStage,'signature-charge');const charge=await data();assert.ok(Number(charge.solgaleoX)<Number(charge.lunalaX));assert.ok(Number(charge.solgaleoMane)>.5);await page.screenshot({path:'dist/sun-moon-ultimate-charge.png'})
  await advance(1400);assert.ok(Number((await data()).solgaleoMane)>.95);await page.screenshot({path:'dist/sun-moon-mane-open.png'})
  await advance(2700);assert.equal((await data()).celestialStage,'signature-fire');const front=await data();assert.equal(front.solgaleoX,charge.solgaleoX,'solar beam must not lunge');await page.screenshot({path:'dist/sun-moon-ultimate-clash.png'})
  await advance(1600);assert.equal((await data()).celestialStage,'signature-impact');assert.equal((await data()).celestialFrontX,front.celestialFrontX);assert.equal((await data()).celestialFrontY,front.celestialFrontY);await page.screenshot({path:'dist/sun-moon-ultimate-impact.png'})
  await advance(3000);assert.equal((await data()).celestialStage,'departure');await advance(1700);assert.equal((await data()).celestialCount,'0');assert.equal(await page.locator('#arena-celestial').isDisabled(),false)
  await page.locator('#arena-celestial').click();await advance(4000);await page.locator('button[data-mode="rest"]').click();assert.equal((await data()).celestialCount,'0');await advance(22000);assert.equal((await data()).celestialCount,'0')
  for(const size of [{width:240,height:350},{width:1600,height:180}]){await page.setViewportSize(size);await page.waitForTimeout(100);await page.locator('#arena-celestial').click();await advance(1400);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#arena-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await page.locator('button[data-mode="rest"]').click()}
  await page.setViewportSize({width:960,height:500});await page.goto(url+'/arceus-demo');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100)
  await page.locator('button[data-mode="rest"]').click();await page.evaluate(()=>{window.creationScenario(true);window.creationChance(.9)})
  await page.locator('#arena-creation').click();await advance(2000);assert.equal(await page.locator('#arena-celestial').isEnabled(),true);await page.locator('#arena-celestial').click();await advance(6000)
  const together=await data();assert.equal(together.celestialCount,'2');assert.equal(together.visitorCount,'3');assert.equal(together.residentDuel,'true');assert.equal(together.creationStage,'ordinary-impact');assert.ok(Number(together.lunalaY)===-290);await page.screenshot({path:'dist/sun-moon-coexist.png'})
  assert.ok(Number(together.extraSky)<=360,'combined visitors must share the 360px three-tier sky cap')
  await advance(4500);const corners=await data();assert.equal(corners.celestialStage,'signature-charge');assert.equal(Number(corners.sunBackdropX),88);assert.equal(Number(corners.moonBackdropX),Number(corners.worldWidth)-70);assert.equal(Number(corners.sunBackdropY),Number(corners.skyTop)+88);assert.equal(Number(corners.moonBackdropY),Number(corners.skyTop)+70);assert.ok(Number(corners.extraSky)<=360);await page.screenshot({path:'dist/sun-moon-compact-coexist.png'})
  await page.locator('#arena-summon').click();assert.equal((await data()).celestialStage,'await-arceus');assert.equal((await data()).judgmentTargets,'9');const starts=await data();await advance(6500);assert.equal((await data()).arceusStage,'assault');await page.screenshot({path:'dist/sun-moon-nine-assault.png'})
  await advance(11600);const hit=await data();assert.ok(Number(hit.lunalaHit)>0&&Number(hit.solgaleoHit)>0);assert.ok(Math.abs(Number(hit.lunalaX)-Number(starts.lunalaX))>10);assert.ok(Math.abs(Number(hit.solgaleoX)-Number(starts.solgaleoX))>10);await page.screenshot({path:'dist/sun-moon-nine-judgment.png'})
  await advance(7000);assert.equal((await data()).celestialCount,'0');assert.equal((await data()).visitorCount,'0');assert.equal((await data()).arceusStage,'absent')
  assert.deepEqual(await page.evaluate(()=>window.celestialMessages),[{type:'arena-ready'}]);assert.deepEqual(errors,[])
  console.log('PASS: spatial cuts, folded wing charge/release, stationary solar/lunar beams, celestial backdrops, fixed front, concurrent five visitors and resident battles, nine-pet Arceus assault/Judgment/departure, responsive controls and no model messages.')
 }finally{await page.close()}
}
