import { AimedShot, type ShotPoint } from './aimed-shot'
import { DeoxysLife } from './deoxys-life'
import { DeoxysTexture, DEOXYS_FORMS, deoxysPose, type DeoxysPose, type DeoxysForm } from './deoxys-rig'
const colors:Record<DeoxysForm,string>={normal:'#cda4ff',attack:'#ff867d',defense:'#77e9ff',speed:'#b6ff83'}
const px=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
function ring(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,c:string,flat=1,turn=0):void {for(let i=0;i<64;i++){const a=i*Math.PI/32+turn;px(ctx,x+Math.cos(a)*r,y+Math.sin(a)*r*flat,2,2,c)}}
function orb(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,c:string):void {for(let dy=-r;dy<=r;dy++) {const w=Math.floor(Math.sqrt(r*r-dy*dy));px(ctx,x-w,y+dy,w*2+1,1,c)}ring(ctx,x,y,r+2,'#fff3da');px(ctx,x-r/3,y-r/3,Math.max(2,r/2),Math.max(2,r/2),'#fff')}
export class DeoxysRenderer {
  private shot=new AimedShot()
  get projectile():AimedShot {return this.shot}
  private textures:DeoxysTexture[]=[]
  private sprite=document.createElement('canvas')
  private previous?:DeoxysPose; private shown?:DeoxysPose; private revision=-1; private form:DeoxysForm='normal'
  constructor(private images:HTMLImageElement[]) {this.sprite.width=this.sprite.height=192}
  async load():Promise<void> {
    await Promise.all(this.images.map(image=>image.complete&&image.naturalWidth?Promise.resolve():new Promise<void>((resolve,reject)=>{image.addEventListener('load',()=>resolve(),{once:true});image.addEventListener('error',reject,{once:true})})))
    const source=document.createElement('canvas');source.width=source.height=128; const ctx=source.getContext('2d')!
    this.textures=this.images.map(image=>{ctx.clearRect(0,0,128,128);ctx.drawImage(image,0,0,128,128,0,0,128,128);return new DeoxysTexture(ctx.getImageData(0,0,128,128).data)})
  }
  draw(ctx:CanvasRenderingContext2D,life:DeoxysLife,groundBase=52,original=false,externalEffects=false,skillTarget?:ShotPoint):void {
    const t=life.clock/1000, x=life.x, y=life.y, mx=life.meteorX, color=colors[life.form], floor=groundBase+132
    const meteorOffset=life.state==='meteor'?-(1-Math.min(1,life.elapsed/1500))*42:0
    const meteorFloor=life.state==='meteor'?-32+(floor+32)*Math.min(1,life.elapsed/1500)**2:floor
    if(life.meteorVisible) {
    ctx.save();ctx.translate(meteorOffset,0);if(life.state==='transform')ctx.globalAlpha=Math.min(1,(2400-life.elapsed)/500)
    // Chunky meteorite with mineral seams, inset craters and a hovering psychic crystal.
    px(ctx,mx-20,meteorFloor+9,40,3,'#14121d');px(ctx,mx-16,meteorFloor-7,31,16,'#302d3e');px(ctx,mx-12,meteorFloor-16,23,23,'#51434f');px(ctx,mx-7,meteorFloor-20,13,13,'#796056')
    px(ctx,mx-12,meteorFloor-9,9,7,'#211f30');px(ctx,mx+4,meteorFloor-4,7,6,'#282338');px(ctx,mx-9,meteorFloor-15,3,7,'#b89274');px(ctx,mx+5,meteorFloor-13,2,8,color)
    px(ctx,mx-3,meteorFloor-14,7,2,color);px(ctx,mx-3,meteorFloor-12,2,9,color);px(ctx,mx-1,meteorFloor-5,5,2,'#e7deff');px(ctx,mx+2,meteorFloor-11,2,6,color)
    for(let i=0;i<4;i++) {const a=t*.7+i*Math.PI/2;px(ctx,mx+Math.cos(a)*18,meteorFloor-20+Math.sin(a)*5,2,2,color)}
    if(life.state==='meteor') {
      const f=Math.min(1,life.elapsed/1500)
      if(f<1)for(let i=12;i>0;i--){const fade=1-i/15;px(ctx,mx-i*2,meteorFloor-15-i*5,2+fade*6,4,i>6?'#795491':i>3?'#dc9ac1':'#fff2cb')}
      if(f<1){ring(ctx,mx,meteorFloor-10,13,'#ffd59b');ring(ctx,mx,meteorFloor-10,18,'#b789e5')}
      else {const impact=(life.elapsed-1500)/600;ring(ctx,mx,floor+5,9+impact*32,'#dfa1ff',.25);for(let i=0;i<10;i++){const a=i*Math.PI/5;px(ctx,mx+Math.cos(a)*impact*36,floor+3-Math.sin(impact*Math.PI)*12-Math.abs(Math.sin(a))*8,3,2,i%2?'#8d7a86':'#d8b9a1')}}
    }
    ctx.restore()
    }
    const target=deoxysPose(life.form,life.action,life.action==='float'||life.action==='rest'?life.clock:life.elapsed)
    if(this.revision!==life.revision||this.form!==life.form){
      this.previous=this.form===life.form?this.shown:undefined
      this.shot.reset();this.revision=life.revision;this.form=life.form
    }
    const pose={...target}, amount=Math.min(1,life.elapsed/700)
    if(this.previous&&amount<1)for(const key of Object.keys(pose) as (keyof DeoxysPose)[])pose[key]=this.previous[key]+(target[key]-this.previous[key])*(amount*amount*(3-2*amount))
    this.shown=pose
    const index=DEOXYS_FORMS.indexOf(life.form), spriteCtx=this.sprite.getContext('2d')!
    spriteCtx.clearRect(0,0,192,192)
    if(original) {const frame=Math.floor(life.clock/50)%160;spriteCtx.drawImage(this.images[index],frame%16*128,Math.floor(frame/16)*128,128,128,32,24,128,128)}
    else spriteCtx.putImageData(new ImageData(this.textures[index].render(pose),192,192),0,0)
    if(life.action==='skill'&&life.form==='speed') for(let i=4;i>0;i--){ctx.save();ctx.globalAlpha=.08+(4-i)*.035;ctx.drawImage(this.sprite,Math.round(x-i*pose.x*.5),Math.round(y+i*3));ctx.restore()}
    ctx.drawImage(this.sprite,Math.round(x),Math.round(y))
    const cx=x+96+pose.x, cy=y+72+pose.y, phase=life.elapsed/6500
    if(original)return
    if(life.action==='rest') {px(ctx,cx+23,cy-22,6,2,'#9bcddc');px(ctx,cx+27,cy-20,2,5,'#9bcddc');px(ctx,cx+23,cy-15,6,2,'#9bcddc')}
    if(life.state==='touch'){for(let i=0;i<10;i++){const f=i/10;px(ctx,x+153+(mx-x-153)*f,y+104+(floor-17-y-104)*f,2,2,color)}const f=Math.min(1,life.elapsed/1700);ring(ctx,mx,floor-13,7+f*9,color,.6,t);for(let i=0;i<12;i++){const a=t*3+i*.5;px(ctx,mx+Math.cos(a)*14,floor-18-i*3,2,2,color)}}
    if(life.state==='transform') {
      const f=life.elapsed/2400, energy=Math.sin(f*Math.PI)
      ring(ctx,mx,floor+3,32*energy,color,.25,t);ring(ctx,cx,cy-14,45*energy,color,.55,-t)
      for(let i=0;i<30;i++){const a=i*.8+t*6;px(ctx,cx+Math.sin(a)*(20+energy*20),cy-60+i*4,2,3,i%3?'#bda7ff':'#fff4ce')}
      ctx.save();ctx.globalAlpha=Math.max(0,1-Math.abs(f-.5)*10);ctx.globalCompositeOperation='screen';spriteCtx.save();spriteCtx.globalCompositeOperation='source-in';spriteCtx.fillStyle='#fff5ed';spriteCtx.fillRect(0,0,192,192);spriteCtx.restore();ctx.drawImage(this.sprite,Math.round(x),Math.round(y));ctx.restore()
    }
    if(externalEffects||life.action!=='skill')return
    if(life.form==='defense') {
      const strength=Math.sin(Math.min(1,phase)*Math.PI), radius=43*strength
      for(let j=0;j<3;j++)ring(ctx,cx,cy+12,radius+j*3,color,1,t*.2)
      for(let i=0;i<6;i++){const a=i*Math.PI/3;ring(ctx,cx+Math.cos(a)*radius,cy+12+Math.sin(a)*radius,5,'#ddffff',1,t)}
      if(phase>.32&&phase<.85)for(let i=0;i<3;i++){const f=(phase*3+i/3)%1;const travel=f<.5?f*2:(1-f)*2;orb(ctx,cx+115-travel*65,cy-20+i*22,3,f<.5?'#ff937b':color)}
    } else if(life.form==='speed') {
      if(phase>.3&&phase<.83)for(let i=0;i<20;i++)px(ctx,cx-55+i*6,cy-22+(i*17%48),12,1,i%2?color:'#355961')
    } else {
      if(phase<.49) {
        const r=3+Math.min(1,phase/.45)*12
        for(let i=0;i<3;i++){const a=t*4+i*Math.PI*2/3;ring(ctx,cx,cy,r+9,color,.35,a);orb(ctx,cx+Math.cos(a)*(r+9),cy+Math.sin(a)*(r+9)*.35,2,color)}
        orb(ctx,cx,cy,r,color)
      } else if(phase<.77) {
        const distance=Math.min(150,life.width-cx-18), at=this.shot.sample(life.elapsed,.49*6500,.77*6500,{x:cx,y:cy},skillTarget??{x:cx+distance,y:cy})!,tx=at.x,ty=at.y
        const length=Math.max(1,Math.hypot(this.shot.target!.x-this.shot.origin!.x,this.shot.target!.y-this.shot.origin!.y)),dx=(this.shot.target!.x-this.shot.origin!.x)/length,dy=(this.shot.target!.y-this.shot.origin!.y)/length
        for(let i=7;i>0;i--){ctx.save();ctx.globalAlpha=(8-i)/14;orb(ctx,tx-dx*i*6,ty-dy*i*6,life.form==='attack'?12:7,color);ctx.restore()}
        orb(ctx,tx,ty,life.form==='attack'?17:10,color)
      } else if(phase<.95) {const f=(phase-.77)/.18,target=this.shot.target??skillTarget??{x:Math.min(life.width-20,cx+150),y:cy};ring(ctx,target.x,target.y,8+f*32,color);for(let i=0;i<12;i++){const a=i*Math.PI/6;px(ctx,target.x+Math.cos(a)*f*42,target.y+Math.sin(a)*f*42,3,3,color)}}
    }
  }
}
