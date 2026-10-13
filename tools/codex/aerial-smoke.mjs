import assert from 'node:assert/strict'
export async function checkAerial(browser,url){
 const page=await browser.newPage({viewport:{width:960,height:450}}),errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.addInitScript(()=>{window.now=1000;window.requestAnimationFrame=callback=>{window.arenaTick=callback;return 1}})
 try{
  await page.goto(`${url}/arceus-demo`);await page.waitForFunction(()=>document.querySelector('#arena')?.dataset.ready==='true')
  const data=()=>page.locator('#arena').evaluate(c=>({...c.dataset}))
  const advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=100){window.now+=100;window.arenaTick(window.now)}},ms)
  await advance(100)
  await page.evaluate(()=>window.previewAirMeteor());const altitude=(await data()).deoxysY;await advance(600);assert.equal((await data()).deoxysState,'meteor');await page.screenshot({path:'dist/deoxys-air-meteor.png'});await advance(100);assert.equal((await data()).deoxysState,'touch');assert.equal((await data()).deoxysY,altitude);await page.screenshot({path:'dist/deoxys-air-touch.png'});await advance(400);assert.equal((await data()).deoxysState,'transform');await advance(500);assert.equal((await data()).deoxys,'speed');assert.equal((await data()).deoxysY,altitude);await page.screenshot({path:'dist/deoxys-air-transform.png'});await advance(400);assert.equal((await data()).deoxysY,altitude)
  await page.evaluate(()=>window.previewAerial(0));await advance(4000);await page.screenshot({path:'dist/aerial-flamethrower.png'})
  await page.evaluate(()=>window.previewAerial(1));await advance(4000);assert.ok(Math.abs(Number((await data()).rayY)+120)<=3);const meeting=await data();assert.ok(Number(meeting.shotTargetX)>Number(meeting.rayAimX)&&Number(meeting.shotTargetX)<Number(meeting.deoxysX)+96);await page.screenshot({path:'dist/aerial-orb-meeting.png'});await advance(1000);assert.equal((await data()).phase,'impact');await page.screenshot({path:'dist/aerial-orb-explosion.png'})
  await page.evaluate(()=>window.previewAerial(2));await advance(3400)
  assert.equal((await data()).rayScale,'1.1');assert.equal((await data()).deoxysScale,'0.9')
  assert.equal((await data()).phase,'chase')
  assert.ok(Math.abs(Number((await data()).rayX)+96-(Number((await data()).kyogreX)+128))>45)
  await page.screenshot({path:'dist/aerial-tentacle-frenzy.png'})
  await page.evaluate(()=>window.previewAerial(4))
  await advance(5100);assert.equal((await data()).deoxysShield,'true');await page.screenshot({path:'dist/aerial-early-shield.png'})
  let elapsed=5100
  for(const [time,phase] of [[6500,'ultimate-clash'],[8300,'orb-break'],[10500,'meteor-shield'],[13400,'shield-break'],[16300,'destroyed'],[18500,'waiting'],[20400,'rebirth-impact'],[22000,'rebirth']]){
   await advance(time-elapsed);elapsed=time;assert.equal((await data()).airFinale,phase)
   if(['destroyed','waiting','rebirth-impact'].includes(phase))assert.equal(Number((await data()).deoxysOpacity),0)
   if(phase==='rebirth')assert.ok(Number((await data()).deoxysOpacity)>0)
   await page.screenshot({path:`dist/aerial-${phase}.png`})
  }
  await advance(1700);assert.equal((await data()).deoxysOpacity,'1')
  await page.evaluate(()=>window.previewAerial(4));await advance(18500);await page.locator('button[data-mode="rest"]').click();assert.equal((await data()).deoxysOpacity,'1')
  assert.deepEqual(errors,[]);console.log('PASS: aerial scales and offset lane, articulated tentacle frenzy, golden Dragon Ascent / red-black psychic orb, meteor shield destruction, disappearance, falling meteor and rebirth; cancellation restores visibility.')
 }finally{await page.close()}
}
