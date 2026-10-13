import {portalPunch,type EffectPoint as Point,type PortalParadoxLife} from './portal-paradox-life'

export type EncounterAnchor={mouth:Point;body:Point}
export function drawPortalParadox(ctx:CanvasRenderingContext2D,life:PortalParadoxLife,anchors:EncounterAnchor[],behind=false):void {
  if(!life.active||anchors.length!==life.pets.length||life.held)return
  const stage=life.stage,p=life.progress,t=life.elapsed/1000
  const line=(a:Point,b:Point,color:string,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  const ring=(at:Point,r:number,color:string,flat=1)=>{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(at.x,at.y,Math.max(1,r),Math.max(1,r*flat),0,0,Math.PI*2);ctx.stroke()}
  const orb=(at:Point,r:number,color:string,dark=false)=>{r=Math.max(1,r);ctx.fillStyle=dark?'#160d2c':color;ctx.beginPath();ctx.arc(at.x,at.y,r,0,Math.PI*2);ctx.fill();ring(at,r,color);if(!dark){ctx.fillStyle='#ffffff';ctx.fillRect(at.x-r*.3,at.y-r*.3,Math.max(2,r*.3),Math.max(2,r*.3))}}
  const burst=(at:Point,q:number,color:string)=>{if(q<0||q>=1)return;ctx.save();ctx.globalAlpha*=1-q;orb(at,5+(1-q)*24,color);ring(at,8+q*48,color);for(let i=0;i<12;i++){const a=i*Math.PI/6;line({x:at.x+Math.cos(a)*q*55,y:at.y+Math.sin(a)*q*55},{x:at.x+Math.cos(a)*(q*55+8),y:at.y+Math.sin(a)*(q*55+8)},color)}ctx.restore()}
  const bolt=(a:Point,b:Point,color:string)=>{let last=a;for(let i=1;i<=10;i++){const q=i/10,at={x:a.x+(b.x-a.x)*q+Math.sin(i*17+t*26)*5*Math.sin(q*Math.PI),y:a.y+(b.y-a.y)*q};line(last,at,color);last=at}}
  const travel=(a:Point,b:Point,q:number)=>({x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q})
  ctx.save();ctx.globalAlpha*=life.opacity
  if(behind){
    if(stage==='arrival'||stage==='departure')for(const [i,at] of anchors.entries()){
      const q=stage==='arrival'?1-p:p
      if(life.kind==='hoopa'){orb(at.body,32*q,'#813fa9',true);ring(at.body,33*q,'#ffcf67',.65);ring(at.body,37*q,'#d989ef',.65)}
      else if(i===0){for(let j=0;j<15;j++)orb({x:at.body.x+Math.sin(j*2.4)*40*q,y:at.body.y+35-Math.abs(Math.cos(j))*28*q},2+q*3,'#dba377')}
      else {ring(at.body,30*q,'#b8f7ff');for(let j=0;j<6;j++)bolt(at.body,{x:at.body.x+Math.cos(j)*45*q,y:at.body.y+Math.sin(j)*45*q},'#b4baff')}
    }
    if(life.kind==='hoopa'&&['first-charge','first-fire'].includes(stage))for(const at of anchors.slice(1))for(let i=0;i<6;i++){const fist=portalPunch(at.body,i,stage==='first-charge'?0:p);orb(fist.origin,10,'#431b51',true);ring(fist.origin,11,'#ffd25b',.65)}
    ctx.restore();return
  }
  if(life.kind==='hoopa'){
    const hoopa=anchors[0]
    if(stage==='first-fire')for(const at of anchors.slice(1))for(let i=0;i<6;i++){
      const fist=portalPunch(at.body,i,p);if(!fist.reach)continue
      line(fist.origin,fist.tip,'#5e324e',10);line(fist.origin,fist.tip,'#c181a1',5)
      ctx.fillStyle='#b76b91';ctx.fillRect(fist.tip.x-6,fist.tip.y-5,12,10)
      for(let j=0;j<3;j++){ctx.fillStyle='#e8a4bb';ctx.fillRect(fist.tip.x-5+j*4,fist.tip.y-6,3,4)}
      if(fist.reach>.92)burst(at.body,(fist.reach-.92)/.08,'#fff0a6')
    }
    if(stage==='reply-charge'||stage==='final-charge')for(const at of anchors.slice(1)){orb(at.mouth,4+p*15,'#d4b5ff',stage==='final-charge');for(let i=0;i<12;i++){const angle=i*2.399+t*3;ring({x:at.mouth.x+Math.cos(angle)*22*(1-p),y:at.mouth.y+Math.sin(angle)*22*(1-p)},2,'#f1eaff')}}
    if(stage==='reply-fire'||stage==='final-fire')for(const [i,at] of anchors.slice(1).entries()){
      const q=Math.min(1,p/.8),ball=travel(at.mouth,hoopa.body,q),ultimate=stage==='final-fire'
      for(let j=1;j<=8;j++){const trail=travel(at.mouth,hoopa.body,Math.max(0,q-j*.03));ctx.save();ctx.globalAlpha*=.5*(1-j/9);orb(trail,ultimate?22:12,ultimate?'#a767e2':'#d8d3ed',ultimate);ctx.restore()}
      orb(ball,ultimate?25:15,ultimate?'#b875f1':'#dfdcf5',ultimate)
      if(ultimate)for(let j=0;j<6;j++){const a=t*5+j*Math.PI/3+i;orb({x:ball.x+Math.cos(a)*28,y:ball.y+Math.sin(a)*28},3,'#e0b3ff')}
    }
    if(stage==='reply-impact'||stage==='final-impact')burst(hoopa.body,p,stage==='final-impact'?'#c884ff':'#e8e1ff')
    if(stage==='ultimate-charge'){orb(hoopa.mouth,5+p*22,'#8c4dad',true);ring(hoopa.body,30+p*13,'#ffd566');for(let i=0;i<6;i++){const a=i*Math.PI/3+t;ring({x:hoopa.body.x+Math.cos(a)*50,y:hoopa.body.y+Math.sin(a)*35},10,'#e9b64b',.6)}}
    if(stage==='ultimate-fire')for(const at of anchors.slice(1)){
      const q=Math.min(1,p/.7),wave=travel(hoopa.mouth,at.body,q)
      line(hoopa.mouth,wave,'#3d173f',16);line(hoopa.mouth,wave,'#a060b5',5);orb(wave,22,'#ac70d0',true);ring(at.body,35*q,'#f4c562',.65)
      for(let i=0;i<12;i++){const a=i*2.399+t*3;orb({x:wave.x+Math.cos(a)*25,y:wave.y+Math.sin(a)*25},3,'#dfafff')}
    }
    if(stage==='ultimate-impact')for(const at of anchors.slice(1)){burst(at.body,p,'#d5a0f7');ring(at.body,20+p*30,'#edbd51',.65)}
  }else {
    const [koraidon,miraidon]=anchors
    if(stage==='first-charge'||stage==='reply-charge'){
      const at=stage==='first-charge'?koraidon:miraidon,color=stage==='first-charge'?'#8ce9ff':'#c3aaff'
      orb(at.mouth,4+p*13,color);for(let i=0;i<8;i++){const a=i*Math.PI/4+t*2;line(at.mouth,{x:at.mouth.x+Math.cos(a)*(15+p*20),y:at.mouth.y+Math.sin(a)*(15+p*20)},color)}
    }
    if(stage==='first-fire'||stage==='reply-fire'){
      const tera=stage==='first-fire',a=tera?koraidon:miraidon,b=tera?miraidon:koraidon,q=Math.min(1,p/.75),at=travel(a.mouth,b.body,q),color=tera?'#9cefff':'#b7a0ff'
      line(a.mouth,at,color,tera?8:4);line(a.mouth,at,'#ffffff',2)
      for(let j=0;j<10;j++){const f=j/10,point=travel(a.mouth,at,f);ring(point,6+Math.sin(f*12-t*8)*3,color,.7)}orb(at,12,color)
    }
    if(stage==='first-impact')burst(miraidon.body,p,'#c9faff')
    if(stage==='reply-impact')burst(koraidon.body,p,'#c7afff')
    if(stage==='ultimate-charge'){orb(koraidon.mouth,4+p*13,'#ffbd69');for(let i=0;i<10;i++)orb({x:koraidon.body.x+Math.sin(i*2.399+t)*30,y:koraidon.body.y+30-(i*8+t*24)%65},2,'#ffb452')}
    if(stage==='ultimate-fire'){
      const q=Math.min(1,p/.3),end=travel(koraidon.mouth,miraidon.body,q)
      for(let i=0;i<30;i++){const f=i/29,at=travel(koraidon.mouth,end,f),spread=f*15;orb({x:at.x,y:at.y+Math.sin(i*2.4+t*14)*spread},4+f*6,i%3?'#ff8a36':'#ffe5a1')}
      if(q===1)burst(miraidon.body,(p*5)%1,'#ffc46a')
    }
    if(stage==='ultimate-impact')burst(miraidon.body,p,'#ffae59')
    if(stage==='final-charge'||stage==='final-fire'){
      const charge=stage==='final-charge'?p:1,r=12+charge*25
      orb(miraidon.body,r,'#c9f6ff');ring(miraidon.body,r+4,'#fae77f');ring(miraidon.body,r+8,'#a8bbff')
      for(let i=0;i<9;i++){const a=i*2.399+t*5,edge={x:miraidon.body.x+Math.cos(a)*(r+13),y:miraidon.body.y+Math.sin(a)*(r+13)};bolt(miraidon.body,edge,'#efffff')}
      if(stage==='final-fire'){line({x:life.pets[1].x+96,y:life.pets[1].y+88},miraidon.body,'#9bdcff',5);if(p>.25&&p<.8)burst(koraidon.body,(p*5)%1,'#c6f7ff')}
    }
    if(stage==='final-impact'){burst(koraidon.body,p,'#c5faff');line({x:koraidon.body.x,y:koraidon.body.y-90},{x:koraidon.body.x,y:koraidon.body.y+30},'#e3fbff',Math.max(2,(1-p)*18));for(let i=0;i<6;i++)bolt(koraidon.body,{x:koraidon.body.x+Math.cos(i)*55,y:koraidon.body.y+Math.sin(i)*45},'#c6eaff')}
  }
  ctx.restore()
}
