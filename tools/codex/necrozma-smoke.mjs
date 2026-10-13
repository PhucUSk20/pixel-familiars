import assert from 'node:assert/strict'
export async function checkNecrozma(browser,url){
 const page=await browser.newPage({viewport:{width:960,height:560}}),errors=[];page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{window.now=1000;window.requestAnimationFrame=cb=>{window.arenaTick=cb;return 1}})
 const data=()=>page.locator('#arena').evaluate(c=>({...c.dataset})),advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=50){window.now+=50;window.arenaTick(window.now)}},ms)
 try{
  await page.goto(url+'/arceus-demo');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100);await page.evaluate(()=>window.divineJoinChance(.9));await page.locator('button[data-mode=rest]').click();await page.locator('#arena-necrozma').click()
  assert.equal((await data()).celestialStage,'await-necrozma');assert.ok(await page.locator('#arena-necrozma').isDisabled());assert.ok(await page.locator('#arena-creation').isDisabled())
  let elapsed=0
  for(const [ms,form,stage,luna,solar]of [[1800,'normal','arrival',1,1],[6400,'dawn','first-charge',0,1],[14700,'dawn','first-ultimate-fire',0,1],[17500,'normal','release-first',null,1],[22400,'dusk','second-charge',1,0],[29600,'dusk','second-ultimate-fire',1,0],[34500,'normal','restoration-charge',1,1],[37500,'normal','restoration-fire',1,1],[41500,'ultra','ultra-burst',1,1],[51000,'ultra','ultra-charge',1,1],[55400,'ultra','ultra-fire',1,1]]){
   await advance(ms-elapsed);elapsed=ms;const d=await data();assert.equal(d.necrozmaForm,form);assert.equal(d.necrozmaStage,stage);if(luna!==null)assert.equal(Number(d.lunalaVisible),luna);assert.equal(Number(d.solgaleoVisible),solar);assert.equal(d.residentDuel,ms>=42400?'false':'true');await page.screenshot({path:`dist/necrozma-${stage}.png`})
  }
  await advance(12000);assert.equal((await data()).necrozmaStage,'absent');assert.equal((await data()).celestialCount,'0')
  await page.locator('#arena-necrozma').click();await advance(7000);await page.locator('#arena-summon').click();assert.equal((await data()).necrozmaStage,'absent');assert.equal((await data()).celestialStage,'await-arceus')
  await page.locator('button[data-mode=rest]').click();assert.equal((await data()).celestialCount,'0');assert.equal((await data()).necrozmaStage,'absent')
  for(const size of [{width:240,height:350},{width:1600,height:180}]){await page.setViewportSize(size);await page.waitForTimeout(100);await page.locator('#arena-necrozma').click();await advance(1000);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#arena-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await page.locator('button[data-mode=rest]').click()}
  assert.deepEqual(errors,[]);console.log('PASS: Necrozma arrival, both native fusions, freed hosts, light restoration, Ultra sky burst, resident battles, Arceus interruption, cancellation and responsive controls.')
 }finally{await page.close()}
}
