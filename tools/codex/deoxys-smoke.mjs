import { checkDeoxysRig } from './deoxys-rig-smoke.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
export async function checkDeoxys(browser,url) {
 await checkDeoxysRig(browser)
 const page=await browser.newPage({viewport:{width:700,height:420}}), errors=[]
 page.on('pageerror',error=>errors.push(String(error)))
 await page.addInitScript(()=>{let seed=31;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};window.deoxysMessages=[];window.acquireVsCodeApi=()=>({postMessage:message=>window.deoxysMessages.push(message)});window.deoxysNow=1000;window.requestAnimationFrame=callback=>{window.deoxysTick=callback;return 1}})
 const advance=ms=>page.evaluate(ms=>{for(let i=0;i<ms;i+=100){window.deoxysNow+=100;window.deoxysTick(window.deoxysNow)}},ms)
 try {
  await page.goto(`${url}/deoxys`);await page.waitForFunction(()=>document.querySelector('#deoxys').dataset.ready==='true',undefined,{polling:50})
  await advance(100);assert.equal(await page.locator('#deoxys').getAttribute('data-form'),'normal')
  for(const form of ['normal','attack','defense','speed']) {
   const gif=(await readFile(`extensions/codex/deoxys-${form}-128px.gif`)).toString('base64')
   assert.equal(await page.evaluate(async ({gif,form})=>{
    const decoder=new ImageDecoder({data:Uint8Array.from(atob(gif),c=>c.charCodeAt(0)),type:'image/gif'});await decoder.tracks.ready
    const source=document.createElement('canvas'), restored=document.createElement('canvas');source.width=source.height=restored.width=restored.height=128
    const a=source.getContext('2d'),b=restored.getContext('2d'),atlas=document.querySelector(`#deoxys-${form}`)
    let same=decoder.tracks.selectedTrack.frameCount===160
    for(let frame=0;frame<160&&same;frame++) {
     const decoded=await decoder.decode({frameIndex:frame});a.clearRect(0,0,128,128);a.drawImage(decoded.image,0,0);decoded.image.close()
     b.fillStyle='#101524';b.fillRect(0,0,128,128);b.drawImage(atlas,frame%16*128,Math.floor(frame/16)*128,128,128,0,0,128,128)
     const original=a.getImageData(0,0,128,128).data,rebuilt=b.getImageData(0,0,128,128).data;same=original.every((value,index)=>value===rebuilt[index])
    }
    decoder.close();return same
   },{gif,form}),true,`${form} atlas preserves all 160 source frames`)
  }
  await page.locator('[data-action="meteor"]').click();await advance(900);assert.equal(await page.locator('#deoxys').getAttribute('data-state'),'meteor');assert.ok(Number(await page.locator('#deoxys').getAttribute('data-meteor-y'))<184);await advance(1500)
  assert.equal(await page.locator('#deoxys').getAttribute('data-state'),'approach')
  const forms=new Set(), skills=new Set()
  for(let i=0;i<210;i++) {await advance(1000);const data=await page.locator('#deoxys').evaluate(c=>({...c.dataset}));forms.add(data.form);if(data.action==='skill')skills.add(data.form)}
  assert.equal(forms.size,4);assert.equal(skills.size,4,'all four forms perform their own skill automatically')
  await page.locator('[data-action="rest"]').click();await advance(1000);const before=await page.locator('#deoxys').evaluate(c=>({...c.dataset}))
  await advance(5000);const after=await page.locator('#deoxys').evaluate(c=>({...c.dataset}));assert.equal(after.x,before.x);assert.equal(after.y,before.y);assert.equal(after.form,before.form)
  await page.locator('#deoxys-pause').click();const frozen=await page.locator('#deoxys').evaluate(c=>c.toDataURL());await advance(3000);assert.equal(await page.locator('#deoxys').evaluate(c=>c.toDataURL()),frozen)
  await page.locator('#deoxys-pause').click();await page.locator('[data-action="meteor"]').click();await advance(11000)
  assert.notEqual(await page.locator('#deoxys').getAttribute('data-form'),before.form)
  await page.locator('[data-action="original"]').click();await advance(100);const original=await page.locator('#deoxys').evaluate(c=>c.toDataURL());await advance(1500);assert.notEqual(await page.locator('#deoxys').evaluate(c=>c.toDataURL()),original,'original 160-frame source animates')
  for(const viewport of [{width:250,height:180},{width:1600,height:250}]) {await page.setViewportSize(viewport);await advance(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  assert.deepEqual(await page.evaluate(()=>window.deoxysMessages),[]);assert.equal(errors.length,0,errors.join('\n'));console.log('Deoxys UI: autonomous four-form skills, meteorite contact, rest, pause, original and resize passed')
 } finally {await page.close()}
}
