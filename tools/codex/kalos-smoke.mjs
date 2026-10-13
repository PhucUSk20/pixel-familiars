import assert from 'node:assert/strict'
export async function checkKalos(browser,url){
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};window.now=1000;window.requestAnimationFrame=cb=>{window.arenaTick=cb;return 1};window.acquireVsCodeApi=()=>({postMessage:()=>{}})})
 const data=()=>page.locator('#arena').evaluate(el=>({...el.dataset})),advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=50){window.now+=50;window.arenaTick(window.now)}},ms),rest=()=>page.locator('button[data-mode="rest"]').click()
 try{
  await page.goto(url+'/arceus-demo');await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true');await advance(100);await rest();await page.evaluate(()=>window.divineJoinChance(.9));await page.locator('#arena-kalos').click()
  assert.equal(await page.locator('#arena-kalos').isDisabled(),true);assert.equal((await data()).kalosGuardianOpacity,'0')
  let elapsed=0
  for(const [time,stage]of [[1800,'arrival'],[5000,'ordinary-fire'],[12000,'signature-fire'],[16500,'guardian-arrival'],[19500,'extreme-speed'],[24500,'core-fire'],[29500,'mega-evolution'],[33500,'mega-charge'],[37000,'mega-fire'],[42500,'departure']]){await advance(time-elapsed);elapsed=time;assert.equal((await data()).kalosStage,stage);await page.screenshot({path:`dist/kalos-${stage}.png`})}
  assert.equal((await data()).kalosForm,'mega-zygarde-complete');await advance(2500);assert.equal((await data()).kalosCount,'0')
  for(const time of [2000,33000]){await rest();await page.locator('#arena-kalos').click();await advance(time);await page.locator('#arena-summon').click();const d=await data();assert.equal(d.kalosStage,'await-boss');assert.equal(d.judgmentTargets,'7');assert.equal(d.kalosForm,time<30000?'zygarde-complete':'mega-zygarde-complete');await advance(6500);await page.screenshot({path:`dist/kalos-arceus-${time}.png`});await advance(11300);assert.ok(Number((await data()).kalosHit)>0);await advance(8000);assert.equal((await data()).kalosCount,'0')}
  await rest();await page.evaluate(()=>{window.creationScenario(true);window.creationChance(.9)});for(const id of ['arena-creation','arena-celestial','arena-unova','arena-kalos'])await page.locator('#'+id).click();await advance(2000);await page.locator('#arena-ultra').click();await advance(5000);assert.equal((await data()).ultraAssaultTargets,'15');await page.locator('#arena-summon').click();assert.equal((await data()).judgmentTargets,'16');await advance(6500);await page.screenshot({path:'dist/kalos-sixteen-assault.png'});await rest();assert.equal((await data()).kalosCount,'0')
  for(const size of [{width:240,height:350},{width:1600,height:180}]){await page.setViewportSize(size);await page.waitForTimeout(100);await page.locator('#arena-kalos').click();await advance(1600);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.ok(await page.locator('#arena-controls').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));await rest()}
  assert.deepEqual(errors,[]);console.log('PASS: Kalos native bodies, rainbow/red duel, guardian Extreme Speed and Core Enforcer, Mega hexagonal cannon, departure, seven/sixteen Arceus targets, fifteen Ultra targets, interruption and responsive controls.')
 }finally{await page.close()}
}
