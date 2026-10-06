import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
/** Compare actual source anatomy with articulated and transformation poses in Chromium. */
export async function checkDeoxysRig(browser) {
 const bundle=await build({bundle:true,write:false,platform:'browser',stdin:{resolveDir:process.cwd(),contents:`import {DeoxysTexture,deoxysPose} from './extensions/codex/deoxys-rig';window.rig={DeoxysTexture,deoxysPose};`}})
 const page=await browser.newPage({viewport:{width:1152,height:940}})
 try {
  await page.setContent('<body style="margin:0;background:#111"><canvas id="review" width="1152" height="940"></canvas></body>')
  await page.addScriptTag({content:bundle.outputFiles[0].text})
  const sources=await Promise.all(['normal','attack','defense','speed'].map(async form=>({form,png:(await readFile(`extensions/codex/deoxys-${form}-128px-atlas.png`)).toString('base64')})))
  const metrics=await page.evaluate(async sources=>{
   const canvas=document.querySelector('#review'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false
   const source=document.createElement('canvas');source.width=source.height=128;const pen=source.getContext('2d')
   const sprite=document.createElement('canvas');sprite.width=sprite.height=192;const pix=sprite.getContext('2d')
   const results=[]
   for(let col=0;col<sources.length;col++) {
    const {form,png}=sources[col],image=new Image();image.src='data:image/png;base64,'+png;await image.decode()
    pen.clearRect(0,0,128,128);pen.drawImage(image,0,0,128,128,0,0,128,128)
    const original=pen.getImageData(0,0,128,128).data,texture=new window.rig.DeoxysTexture(original)
    const base=original.filter((v,i)=>i%4===3&&v>0).length
    for(const [row,action,ms] of [[0,'float',0],[1,'skill',2600],[2,'skill',4200],[3,'transform',1150]]) {
     const data=texture.render(window.rig.deoxysPose(form,action,ms))
     const count=data.filter((v,i)=>i%4===3&&v>0).length
     results.push({form,action,ratio:count/base})
     pix.putImageData(new ImageData(data,192,192),0,0)
     ctx.fillStyle='#aee7f2';ctx.font='14px monospace';ctx.fillText(`${form} · ${action} ${ms}`,col*288+12,row*235+18)
     ctx.drawImage(sprite,col*288+36,row*235+20,216,216)
    }
   }
   return results
  },sources)
  await page.screenshot({path:'dist/deoxys-rig-review.png'})
  for(const metric of metrics)assert.ok(metric.ratio>.8&&metric.ratio<1.2,`${metric.form}/${metric.action} must not collapse or stretch its source silhouette (${metric.ratio})`)
  console.log('PASS: all four Deoxys source silhouettes retain area during articulation and stable transformation poses')
 } finally {await page.close()}
}
