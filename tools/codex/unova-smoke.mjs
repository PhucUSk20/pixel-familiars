import assert from 'node:assert/strict'
export async function checkUnova(browser,url){
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};window.now=1000;window.requestAnimationFrame=cb=>{window.arenaTick=cb;return 1};window.acquireVsCodeApi=()=>({postMessage:()=>{}})})
 const data=()=>page.locator('#arena').evaluate(el=>({...el.dataset})),advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=50){window.now+=50;window.arenaTick(window.now)}},ms)
 try{
  await page.goto(url+'/arceus-demo');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100)
  for(const white of [true,false]){
   await page.locator('button[data-mode="rest"]').click();await page.evaluate(white=>{window.unovaScenario(white);window.divineJoinChance(.9)},white);await page.locator('#arena-unova').click();assert.equal(await page.locator('#arena-unova').isDisabled(),true);assert.equal((await data()).unovaKyuremOpacity,'0')
   await advance(2000);assert.equal((await data()).unovaStage,'arrival');await page.screenshot({path:`dist/unova-${white?'white':'black'}-arrival.png`})
   await advance(4200);assert.equal((await data()).unovaStage,'ordinary-fire');assert.equal((await data()).residentDuel,'true');await page.screenshot({path:'dist/unova-ordinary.png'})
   await advance(6500);assert.equal((await data()).unovaStage,'signature-fire');await page.screenshot({path:'dist/unova-blue-flare-bolt.png'})
   await advance(5000);assert.equal((await data()).unovaStage,'kyurem-arrival');await page.screenshot({path:'dist/unova-kyurem-arrival.png'})
   await advance(5100);assert.equal((await data()).unovaStage,'missile-fire');assert.equal((await data()).unovaMissiles,'4');await page.screenshot({path:'dist/unova-homing-missiles.png'})
   await advance(6400);assert.equal((await data()).unovaStage,'kyurem-fire');await page.screenshot({path:'dist/unova-kyurem-orb.png'})
   await advance(4400);assert.equal((await data()).unovaStage,'absorb');assert.ok(Number((await data()).unovaHostOpacity)<.5);await page.screenshot({path:'dist/unova-absorb.png'})
   await advance(5100);const fused=await data();assert.equal(fused.unovaStage,'fusion-fire');assert.equal(fused.unovaForm,white?'kyurem-white':'kyurem-black');assert.equal(fused.unovaHostOpacity,'0');assert.ok(Number(fused.extraSky)<=360);await page.screenshot({path:`dist/unova-${white?'white':'black'}-fusion.png`})
   await advance(5000);assert.equal((await data()).unovaStage,'release');assert.equal((await data()).unovaForm,'kyurem');assert.ok(Number((await data()).unovaHostOpacity)>.5)
   await advance(4200);assert.equal((await data()).unovaCount,'0');assert.equal(await page.locator('#arena-unova').isEnabled(),true)
  }
  await page.locator('button[data-mode="rest"]').click();await page.locator('#arena-unova').click();await advance(36000);await page.locator('#arena-summon').click();assert.equal((await data()).unovaStage,'await-boss');assert.equal((await data()).unovaForm,'kyurem');assert.equal((await data()).judgmentTargets,'7');await advance(6500);assert.equal((await data()).arceusStage,'assault');await page.screenshot({path:'dist/unova-arceus-assault.png'});await advance(11300);assert.ok(Number((await data()).unovaKyuremHit)>0);await advance(8000);assert.equal((await data()).unovaCount,'0')
  await page.locator('button[data-mode="rest"]').click();await page.evaluate(()=>{window.creationScenario(true);window.creationChance(.9)});await page.locator('#arena-creation').click();await page.locator('#arena-celestial').click();await page.locator('#arena-unova').click();await advance(2000);await page.locator('#arena-ultra').click();await advance(5000);assert.equal((await data()).ultraAssaultTargets,'12');await page.locator('#arena-summon').click();assert.equal((await data()).judgmentTargets,'13');assert.ok(Number((await data()).unovaKyuremY)===-185,'Kyurem stays in the middle-tier Unova group');await advance(6500);await page.screenshot({path:'dist/unova-thirteen-assault.png'});await page.locator('button[data-mode="rest"]').click();assert.equal((await data()).unovaCount,'0')
  for(const size of [{width:240,height:350},{width:1600,height:180}]){await page.setViewportSize(size);await page.waitForTimeout(100);await page.locator('#arena-unova').click();await advance(1600);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#arena-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await page.locator('button[data-mode="rest"]').click()}
  assert.deepEqual(errors,[]);console.log('PASS: native Unova trio, flame/electric charge and clash, four homing missiles, Kyurem orb, both 50/50 White/Black fusions, restored host/departure, concurrent residents, seven/thirteen-pet Arceus alliance, twelve-pet Ultra assault, cancellation and responsive controls.')
 }finally{await page.close()}
}
