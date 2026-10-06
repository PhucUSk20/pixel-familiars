import { DeoxysLife } from './deoxys-life'
import { DeoxysRenderer } from './deoxys-renderer'
import { DEOXYS_FORMS } from './deoxys-rig'
const canvas=document.querySelector<HTMLCanvasElement>('#deoxys')!, ctx=canvas.getContext('2d')!, status=document.querySelector<HTMLElement>('#deoxys-status')!
const world=document.createElement('canvas');world.width=480;world.height=224;const pen=world.getContext('2d')!
const life=new DeoxysLife(), renderer=new DeoxysRenderer(DEOXYS_FORMS.map(form=>document.querySelector<HTMLImageElement>(`#deoxys-${form}`)!))
let ready=false, paused=false, original=false, last=0,paint=0
function draw():void {
  if(!ready)return
  const rect=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(rect.width));canvas.height=Math.max(1,Math.round(rect.height))
  const scale=Math.min(canvas.width/480,canvas.height/224), width=Math.max(480,Math.ceil(canvas.width/scale));if(world.width!==width){world.width=width;life.resize(width)}
  pen.fillStyle='#000';pen.fillRect(0,0,width,224)
  for(let i=0;i<60;i++){pen.fillStyle=i%3?'#55727f':'#c3d6eb';pen.fillRect(i*79%width,i*37%150,1,1)}
  pen.fillStyle='#161522';pen.fillRect(0,195,width,29)
  for(let i=0;i<width/26;i++){pen.fillStyle=i%2?'#353044':'#252535';pen.fillRect(i*26,196+(i*7%20),18,2)}
  renderer.draw(pen,life,56,original)
  ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(world,0,(canvas.height-224*scale)/2,width*scale,224*scale)
  status.textContent=`${life.form.toUpperCase()} · ${life.state} · ${life.action==='skill'?({normal:'Psychic Pulse',attack:'Psycho Boost',defense:'Barrier / Reflect',speed:'Extreme Speed'}[life.form]):original?'Sprite gốc · 160 frame':'Thiên thạch đổi dạng ngẫu nhiên · Local'}`
  Object.assign(canvas.dataset,{ready:'true',form:life.form,state:life.state,action:life.action,x:String(life.x),y:String(life.y),meteorY:String(life.meteorY),meteorVisible:String(life.meteorVisible),meteorX:String(life.meteorX),elapsed:String(life.elapsed),clock:String(life.clock),original:String(original),worldWidth:String(width)})
}
document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button=>button.addEventListener('click',()=>{
  original=button.dataset.action==='original'
  if(button.dataset.action==='meteor')life.meteor()
  else if(button.dataset.action==='skill')life.skill()
  else life.rest(button.dataset.action==='rest'||original)
  document.querySelectorAll('[data-action]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));draw()
}))
document.querySelector('#deoxys-pause')!.addEventListener('click',event=>{paused=!paused;const button=event.currentTarget as HTMLButtonElement;button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Tiếp tục':'Tạm dừng'})
new ResizeObserver(draw).observe(canvas)
void renderer.load().then(()=>{ready=true;draw()}).catch(()=>{status.textContent='Không tải được sprite Deoxys. Hãy cài lại extension.'})
function tick(now:number):void {const delta=last?Math.max(0,Math.min(100,now-last)):0;last=now;if(ready&&!paused&&!document.hidden){life.advance(delta);if(now-paint>=50){paint=now;draw()}}requestAnimationFrame(tick)}
requestAnimationFrame(tick)
