import {test} from 'node:test'
import assert from 'node:assert/strict'
import {CreationLife} from '../creation-life'
import {ArenaLife} from '../arena-life'
import {CreationTexture,creationPose} from '../creation-rig'
import {arceusContact,judgmentShots} from '../arceus-effects'

test('a rival-only appearance guarantees Giratina next time, with history surviving cancellation',()=>{
 const life=new CreationLife(()=>.9)
 for(const expected of [false,true,false,true,false,true]){assert.ok(life.begin());assert.equal(life.trio,expected);assert.equal(life.begin(),false);life.cancel(0)}
 const alwaysTrio=new CreationLife(()=>.1);for(let i=0;i<4;i++){alwaysTrio.begin();assert.equal(alwaysTrio.trio,true);alwaysTrio.cancel(0)}
})
test('Giratina guarantee applies across manual, Rest and automatic Arena appearances',()=>{
 const life=new ArenaLife(()=>.9);life.arceus.nextVisit=life.sunMoon.nextVisit=Infinity;life.summonCreation();assert.equal(life.creation.trio,false)
 life.select('rest');life.summonCreation();assert.equal(life.creation.trio,true)
 life.select('rest');life.summonCreation();assert.equal(life.creation.trio,false)
 for(let i=0;i<25000;i+=100)life.advance(100);assert.equal(life.creation.active,false);life.creation.nextVisit=life.clock;life.advance(100);assert.equal(life.creation.trio,true)
})

test('rivals complete two distinct attacks, leave a rupture and depart without intervention',()=>{
 const life=new CreationLife(()=>.9);life.begin(false)
 for(const [elapsed,stage] of [[1000,'arrival'],[4000,'ordinary-charge'],[6000,'ordinary-fire'],[8300,'ordinary-impact'],[11000,'signature-charge'],[15000,'signature-fire'],[17500,'signature-impact'],[20000,'aftershock'],[23000,'departure']] as const){life.advance(elapsed-life.elapsed,elapsed);assert.equal(life.stage,stage)}
 assert.ok(life.riftVisible);assert.ok(life.opacity>0&&life.opacity<1)
 assert.equal(life.advance(2000,25000),'finished');assert.equal(life.stage,'absent');assert.ok(life.nextVisit>=70000)
})
test('Arceus probability is rolled once only after the signature explosion and pauses departure',()=>{
 let rolls=0;const life=new CreationLife(()=>{rolls++;return .1});life.begin(false)
 life.advance(19000,19000);assert.equal(rolls,2);assert.equal(life.stage,'signature-impact')
 assert.equal(life.advance(300,19300),'arceus');assert.equal(rolls,3);assert.equal(life.stage,'await-arceus')
 const elapsed=life.elapsed;for(let i=0;i<100;i++)life.advance(100,20000+i*100)
 assert.equal(life.elapsed,elapsed);assert.equal(rolls,3)
 life.leave();assert.equal(life.stage,'departure');assert.equal(life.advance(3200,50000),'finished')
})
test('temporary visitors join six-pet assault and Judgment; their knockback completes before they depart',()=>{
 const life=new ArenaLife(()=>.1);life.avian.nextVisit=Infinity;assert.ok(life.summonCreation(false));assert.equal(life.summonCreation(false),false)
 for(let i=0;i<200;i++)life.advance(100)
 assert.equal(life.creation.stage,'await-arceus');assert.ok(life.arceus.active)
 const start=[life.creation.palkia.x,life.creation.dialga.x]
 while(life.arceus.elapsed<17300)life.advance(100)
 for(let i=0;i<6;i++)assert.ok(arceusContact(life.arceus,i)>0)
 assert.ok(life.creation.palkia.x<start[0]);assert.ok(life.creation.dialga.x>start[1])
 while(life.arceus.active||life.creation.active)life.advance(100)
 assert.equal(life.state,'roam');assert.equal(life.deoxys.state,'roam')
})
test('summoning preserves resident positions, resize keeps visitors visible and Rest cancels both events',()=>{
 const life=new ArenaLife(()=>.9),start=[life.ray.x,life.groudon.x,life.kyogre.x,life.deoxys.x]
 life.summonCreation(false);life.advance(2200)
 assert.deepEqual([life.ray.x,life.groudon.x,life.kyogre.x,life.deoxys.x],start)
 for(const width of [1600,480,1000]){life.resize(width);assert.ok(life.creation.palkia.x>=0);assert.ok(life.creation.dialga.x<=width-192)}
 life.summonArceus();assert.ok(life.creation.held);assert.equal(life.summonCreation(false),false)
 life.select('rest');life.advance(40000);assert.equal(life.creation.active,false);assert.equal(life.arceus.active,false)
})
test('native source joints move the Palkia hand and Dialga mouth while preserving attached body area',()=>{
 const source=new Uint8ClampedArray(128*128*4)
 for(let y=20;y<110;y++)for(let x=23;x<105;x++)source.set([225,190,210,255],(y*128+x)*4)
 const life=new CreationLife(()=>.9);life.begin(false)
 for(const species of ['palkia','dialga'] as const){
  const texture=new CreationTexture(species,source),idle=creationPose(species,life)
  life.elapsed=12500;const charge=creationPose(species,life)
  life.elapsed=14700;const fire=creationPose(species,life)
  const area=(pixels:Uint8ClampedArray)=>pixels.filter((n,i)=>i%4===3&&n>0).length
  assert.ok(area(texture.render(fire))/area(texture.render(idle))>.85)
  assert.notDeepEqual(texture.anchor(species==='palkia'?'hand':'mouth',charge),texture.anchor(species==='palkia'?'hand':'mouth',fire))
  life.elapsed=0
 }
})

test('Judgment launches above the upper visitors and descends into all six actual targets',()=>{
 const targets=[{x:90,y:70,surface:189},{x:420,y:80,surface:189},{x:110,y:150,surface:189},{x:400,y:130,surface:189},{x:170,y:-25,surface:30},{x:350,y:-27,surface:30}]
 const skyY=Math.min(22,...targets.map(at=>at.y-30))
 for(const shot of judgmentShots(250,6600,targets,skyY))assert.ok(shot.y>=skyY&&shot.y<=shot.target.y)
 for(const target of targets)assert.ok(judgmentShots(250,8300,targets,skyY).some(shot=>shot.target===target&&shot.progress===1&&shot.x===target.x&&shot.y===target.y))
})

test('camera resizing during Arceus does not add a new retreat on every rendered frame',()=>{
 const life=new ArenaLife(()=>.9);life.resize(1000);life.ray.x=390;life.ray.y=10;life.summonArceus()
 for(let i=0;i<35;i++)life.advance(100)
 const x=life.ray.x
 for(let i=0;i<30;i++){life.resize(1001+i%2);life.advance(50)}
 assert.ok(Math.abs(life.ray.x-x)<.01,'finished sixteen-pixel retreat must remain finished across camera frames')
})


test('camera opening and closing preserves every resident screen centre and pending retreat',()=>{
 const life=new ArenaLife(()=>.9);life.resize(900);life.summonCreation(false)
 const centres=()=>[life.ray.x+96,life.deoxys.x+96,life.kyogre.x+128,life.groudon.x+154]
 const before=centres();let scale=1
 for(const next of [.94,.83,.7, .8,.91,1]){
  life.resizeCamera(Math.ceil(900/next),scale/next);scale=next
  centres().forEach((x,i)=>assert.ok(Math.abs(x*scale-before[i])<.0001))
 }
 life.summonArceus();life.advance(3500)
 const after=centres();life.resizeCamera(1200,.75);life.advance(50)
 centres().forEach((x,i)=>assert.ok(Math.abs(x/.75-after[i])<.01))
})

test('rivals are more frequent than Arceus and the ordinary hand orb is a one-time 50/50 choice',()=>{
 for(const value of [.1,.49,.5,.9]){
  const life=new ArenaLife(()=>value)
  assert.ok(life.creation.nextVisit<life.arceus.nextVisit)
  life.summonCreation(false);assert.equal(life.creation.ordinary,value<.5?'mouth':'orb')
  life.advance(6000);assert.equal(life.creation.ordinary,value<.5?'mouth':'orb')
 }
})

test('Arceus can be followed by rival arrivals before the six-pet assault and without a false rift',()=>{
 const life=new ArenaLife(()=>.1);life.resize(1000);life.ray.x=390;life.ray.y=10;life.summonArceus()
 life.advance(1500);assert.ok(life.creation.active);assert.equal(life.creation.stage,'arrival')
 life.advance(2500);assert.equal(life.creation.stage,'await-arceus');assert.equal(life.creation.riftVisible,false)
 assert.equal(life.arceus.stage,'awe');assert.ok(Math.abs(life.ray.x-374)<.01,'late visitors cannot add another retreat to residents');assert.deepEqual(life.creation.shields,[true,true])
 while(life.arceus.active||life.creation.active){life.advance(100);assert.equal(life.creation.riftVisible,false)}
 assert.equal(life.state,'roam')
})

test('Judgment visibly pushes unshielded pets farther than shielded visitors, once per volley',()=>{
 const life=new ArenaLife(()=>.1);life.resize(1000);life.ray.x=400;life.summonCreation(false)
 life.creation.palkia.x=220;life.creation.dialga.x=650;life.summonArceus()
 life.resize(1001);life.advance(14000)
 const start=[life.groudon.x,life.creation.palkia.x,life.creation.dialga.x]
 life.advance(6800);for(let i=0;i<7;i++)life.advance(20)
 const movement=[Math.abs(life.groudon.x-start[0]),Math.abs(life.creation.palkia.x-start[1]),Math.abs(life.creation.dialga.x-start[2])]
 assert.ok(movement[0]>50);assert.ok(movement[1]>17&&movement[1]<27);assert.ok(movement[2]>17&&movement[2]<27)
})


test('both visitor barriers are guaranteed and Rest cancels a scheduled reverse arrival',()=>{
 const values=[.9,.4,.1,.9];const creation=new CreationLife(()=>values.shift()??.9)
 creation.begin(false);creation.prepareShields();assert.deepEqual(creation.shields,[true,true])
 const life=new ArenaLife(()=>.1);life.summonArceus();life.select('rest');life.advance(5000)
 assert.equal(life.creation.active,false);assert.equal(life.arceus.active,false)
})
