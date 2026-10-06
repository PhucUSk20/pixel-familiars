type Point={x:number;y:number}
export type MeteorFrame={position:Point;stage:'rise'|'sky'|'fall'|'impact';progress:number}
/** Each fireball leaves the mouth diagonally, travels above view, then falls over its target. */
export function meteorFlight(index:number,phase:number,mouth:Point,target:Point):MeteorFrame|undefined {
 const dir=target.x<mouth.x?-1:1, launch=mouth.x+dir*75, entry=target.x-dir*65
 const age=phase-(.22+index*.025), offset=(index%4-1.5)*13
 if(age<0||age>.57)return undefined
 if(age<.16)return {position:{x:mouth.x+dir*75*age/.16,y:mouth.y+(-20-mouth.y)*age/.16},stage:'rise',progress:age/.16}
 if(age<.23)return {position:{x:launch+(entry+offset-launch)*(age-.16)/.07,y:-20},stage:'sky',progress:(age-.16)/.07}
 if(age<.47){const f=(age-.23)/.24;return {position:{x:entry+offset+dir*65*f*f,y:-20+(target.y+20)*f*f},stage:'fall',progress:f}}
 return {position:{x:target.x+offset,y:target.y},stage:'impact',progress:(age-.47)/.1}
}
const pixel=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
function ring(ctx:CanvasRenderingContext2D,at:Point,r:number,c:string,flat=1):void {for(let i=0;i<48;i++){const a=i*Math.PI/24;pixel(ctx,at.x+Math.cos(a)*r,at.y+Math.sin(a)*r*flat,2,2,c)}}
function orb(ctx:CanvasRenderingContext2D,at:Point,r:number,c:string):void {for(let y=-r;y<=r;y++){const w=Math.floor(Math.sqrt(r*r-y*y));pixel(ctx,at.x-w,at.y+y,w*2+1,1,c)}pixel(ctx,at.x-r/3,at.y-r/3,r/2,r/2,'#fff6d8')}
function beam(ctx:CanvasRenderingContext2D,a:Point,b:Point,c:string,width=6):void {const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let i=0;i<=n;i++){const f=i/Math.max(1,n);pixel(ctx,a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f-width/2,4,width,c)}}
export function drawMeteorRain(ctx:CanvasRenderingContext2D,phase:number,mouth:Point,target:Point):void {
 if(phase<.22){ring(ctx,mouth,4+phase*28,'#ffd078');orb(ctx,mouth,2+phase*12,'#ff773b')}
 for(let i=0;i<8;i++) {
  const frame=meteorFlight(i,phase,mouth,target);if(!frame||frame.stage==='sky')continue
  const at=frame.position
  if(frame.stage==='impact') {
   ring(ctx,at,4+frame.progress*21,'#ffc968',.3)
   for(let j=0;j<8;j++){const a=j*Math.PI/4;pixel(ctx,at.x+Math.cos(a)*frame.progress*18,at.y-Math.sin(frame.progress*Math.PI)*15+Math.sin(a)*5,2,3,j%2?'#fff0ae':'#ff863c')}
  } else {
   const travel=target.x<mouth.x?-1:1,dy=frame.stage==='rise'?1:-1
   for(let j=7;j>0;j--)pixel(ctx,at.x-travel*j*2-2,at.y+dy*j*4,4,5,j>4?'#9a3b30':j>2?'#f3782e':'#ffd773')
   orb(ctx,at,5,'#ff7d32');ring(ctx,at,7,'#ffd273')
  }
 }
}
/** Successive magma blades travel from the caster to the opponent, including beneath the target. */
export function drawPrecipiceBlades(ctx:CanvasRenderingContext2D,phase:number,origin:Point,target:Point,surface=189):void {
 if(phase<.18||phase>.96)return
 const t=phase*7,dir=target.x<origin.x?-1:1
 const decay=phase>.85?Math.max(0,1-(phase-.85)/.11):1
 const front=Math.min(1,Math.max(0,(phase-.18)/.36))
 for(let f=0;f<=front;f+=.012){const x=origin.x+(target.x-origin.x)*f,y=surface+Math.sin(f*38)*3;pixel(ctx,x,y,4,2,'#ee612b');pixel(ctx,x,y,2,1,'#ffdc78')}
 for(let i=0;i<6;i++){
  const onset=.3+i*.045,rise=Math.min(1,Math.max(0,(phase-onset)/.065))
  if(!rise)continue
  const x=origin.x+(target.x-origin.x)*(i+1)/6,h=(68+i*7)*rise*decay,lean=dir*(10+i*2),width=12+i
  ring(ctx,{x,y:surface},12+rise*14,'#ff913a',.2)
  // Stepped jagged rock shell with a broad incandescent magma core.
  for(let row=0;row<h;row++){
   const f=row/h,half=width*(1-f)+2,c=x+lean*f,notch=Math.sin(row*.3+i)*2
   pixel(ctx,c-half+notch,surface-row,half*2,2,'#5c302e')
   pixel(ctx,c-half*.68,surface-row,half*1.2,2,'#b34930')
   pixel(ctx,c-half*.4,surface-row,half*.75,2,'#ff7931')
   pixel(ctx,c-half*.12,surface-row,Math.max(2,half*.25),2,'#fff1a0')
   if(row%17<3)pixel(ctx,c-half,surface-row,half*.6,2,'#34282c')
  }
  for(let j=0;j<18;j++){const age=(t*1.7+j/18+i*.13)%1,a=j*2.4;pixel(ctx,x+Math.cos(a)*age*34,surface-Math.sin(age*Math.PI)*(24+i*4),3,4,j%3?'#f7a245':'#ffe7a0')}
  if(i>=4&&phase>.58&&phase<.85){
   ring(ctx,target,18+(phase-.58)*95,'#ffd58b',.65)
   for(let j=0;j<20;j++){const age=(t+j/20)%1,a=j*2.4;pixel(ctx,target.x+Math.cos(a)*age*40,target.y+Math.sin(a)*age*29-age*18,3,3,j%2?'#ffc778':'#b8e4e9')}
  }
 }
}
/** Ground battle effects always originate at the articulated mouths of both pets. */
export function drawGroundDuel(ctx:CanvasRenderingContext2D,turn:number,elapsed:number,water:Point,fire:Point,waterTarget:Point,groundX:number,surface=189):string {
 const p=elapsed/7000,t=elapsed/1000
 if(turn===3){drawMeteorRain(ctx,p,fire,waterTarget);return p<.22?'charge':p<.49?'meteor-rise':p<.92?'meteor-rain':'recover'}
 if(turn===4) {
  const mid={x:(water.x+fire.x)/2,y:(water.y+fire.y)/2}
  if(p<.4){orb(ctx,water,3+p*22,'#67d6ff');orb(ctx,fire,3+p*22,'#ff9854')}
  else if(p<.85){const f=Math.min(1,(p-.4)/.14);const tip=(a:Point)=>({x:a.x+(mid.x-a.x)*f,y:a.y+(mid.y-a.y)*f})
   beam(ctx,water,tip(water),'#258ebd',9);beam(ctx,water,tip(water),'#d3ffff',3)
   beam(ctx,fire,tip(fire),'#f27838',9);beam(ctx,fire,tip(fire),'#fff0b5',3)
   if(f===1){orb(ctx,mid,9+Math.abs(Math.sin(t*14))*6,'#fff3d1');ring(ctx,mid,21+Math.sin(t*8)*3,'#a5eaff');ring(ctx,mid,25,'#ffb36c')}
  } else if(p<.96){ring(ctx,mid,12+(p-.85)*190,'#fff0b5');for(let i=0;i<16;i++){const a=i*Math.PI/8;pixel(ctx,mid.x+Math.cos(a)*(p-.85)*250,mid.y+Math.sin(a)*(p-.85)*170,3,3,i%2?'#7cddff':'#ffb35f')}}
  return p<.4?'charge':p<.54?'projectile':p<.85?'clash':'recover'
 }
 if(turn===1) {
  if(p<.43){ring(ctx,fire,4+p*24,'#ffbe85');orb(ctx,fire,3+p*17,'#f8937d')}
  else if(p<.7){const f=(p-.43)/.27,at={x:fire.x+(water.x-fire.x)*f,y:fire.y+(water.y-fire.y)*f};beam(ctx,fire,at,'#884d72',3);orb(ctx,at,8,'#ff9d8d')}
  else if(p<.88)ring(ctx,water,12+(p-.7)*65,'#b7efff')
 }
 if(turn===2)drawPrecipiceBlades(ctx,p,{x:fire.x,y:surface},waterTarget,surface)
 return p<.43?'charge':p<.7?'projectile':p<.88?'impact':'recover'
}
