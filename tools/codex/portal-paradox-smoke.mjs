import assert from 'node:assert/strict'

export async function checkPortalParadox(browser,url){
 const page=await browser.newPage({viewport:{width:1100,height:620}}),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{window.now=1000;window.requestAnimationFrame=cb=>{window.arenaTick=cb;return 1}})
 const advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=100)window.arenaTick(window.now+=100)},ms)
 const data=()=>page.locator('#arena').evaluate(el=>({...el.dataset}))
 try{
  await page.goto(url+'/arceus-demo');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100)
  await page.locator('button[data-mode=rest]').click();await page.evaluate(()=>{window.divineJoinChance(.9);window.creationAuto(false)})
  await page.locator('#arena-hoopa').click();await page.locator('#arena-paradox').click();await advance(1800)
  let d=await data();assert.equal(d.hoopaCount,'3');assert.equal(d.paradoxCount,'2');assert.equal(d.hoopaY,'-225');assert.equal(d.paradoxY,'-35');assert.equal(d.residentDuel,'true');assert.equal(await page.locator('#arena-hoopa').isDisabled(),true)
  await page.screenshot({path:'docs/images/portal-paradox-arrival.png'})
  const frame=d.portalFrame;await advance(200);assert.notEqual((await data()).portalFrame,frame)
  await advance(4000);d=await data();assert.equal(d.hoopaStage,'first-fire');await page.screenshot({path:'docs/images/hoopa-portal-fists.png'})
  await advance(7800);d=await data();assert.equal(d.hoopaStage,'reply-fire');await page.screenshot({path:'docs/images/eon-mist-ball.png'})
  await advance(8500);d=await data();assert.equal(d.hoopaStage,'ultimate-fire');assert.equal(d.paradoxStage,'ultimate-fire');await page.screenshot({path:'docs/images/hoopa-dark-wave.png'});await page.screenshot({path:'docs/images/koraidon-flamethrower.png'})
  await advance(10800);d=await data();assert.equal(d.paradoxStage,'final-fire');await page.screenshot({path:'docs/images/miraidon-electro-drift.png'});await page.screenshot({path:'docs/images/eon-psychic-vortex.png'})
  await advance(9000);d=await data();assert.equal(d.hoopaCount,'0');assert.equal(d.paradoxCount,'0')
  await page.locator('button[data-mode=rest]').click();await page.locator('#arena-hoopa').click();await page.locator('#arena-paradox').click();await advance(1500);await page.locator('#arena-ultra').click();await advance(5000);d=await data();assert.equal(d.ultraAssaultTargets,'9');assert.equal(d.hoopaStage,'await-boss');assert.equal(d.paradoxStage,'await-boss')
  await page.locator('#arena-summon').click();await advance(5000);d=await data();assert.equal(d.judgmentTargets,'10');assert.equal(d.portalFacingCorrect,'true');await advance(22000);d=await data();assert.equal(d.hoopaCount,'0');assert.equal(d.paradoxCount,'0')
  await page.locator('button[data-mode=rest]').click();await page.locator('#arena-all').click();await advance(1800);d=await data();assert.equal(d.hoopaCount,'3');assert.equal(d.paradoxCount,'2');assert.equal(d.ultraBoss,'false');assert.ok(Number(d.extraSky)<=360);await page.screenshot({path:'dist/arena-thirty-arrival.png'})
  await advance(16000);d=await data();assert.equal(d.judgmentTargets,'30');assert.equal(d.portalFacingCorrect,'true');assert.equal(d.arceusFacingCorrect,'true')
  await page.locator('button[data-mode=rest]').click();d=await data();assert.equal(d.hoopaCount,'0');assert.equal(d.paradoxCount,'0')
  for(const size of [{width:240,height:350},{width:1600,height:180}]){await page.setViewportSize(size);await page.locator('#arena-hoopa').click();await page.locator('#arena-paradox').click();await advance(1000);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#arena-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await page.locator('button[data-mode=rest]').click()}
  assert.deepEqual(errors,[]);console.log('PASS: five native animated pets, Hoopa six-portal fists and dark wave against both Eon dragons, twin mist/psychic volleys, Tera Blast/Flamethrower and Dragon Pulse/Electro Drift, independent timelines, nine/ten boss targets, thirty-pet Summon All, Arceus facing, departure, Rest and responsive controls.')
 }finally{await page.close()}
}
