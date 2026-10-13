import test from 'node:test'
import assert from 'node:assert/strict'
import {ArenaLife} from '../arena-life'
import {UNOVA_FORMS,UnovaLife} from '../unova-life'
import {UnovaTexture,unovaPose} from '../unova-rig'
import {unovaMissile,reshiramCharge} from '../unova-effects'
test('White and Black branches absorb only the matching host then restore all three',()=>{
 for(const random of [()=>0,()=>.499,()=>.5,()=>.9]){const l=new UnovaLife(random);l.begin();assert.equal(l.white,random()<.5);assert.equal(l.kyurem.right,l.opponent.x>l.kyurem.x);assert.equal(l.opacityFor(2),0);l.elapsed=33000;assert.equal(l.stage,'absorb');assert.ok(l.opacityFor(l.white?0:1)<1);l.elapsed=36000;assert.equal(l.form,l.white?'kyurem-white':'kyurem-black');assert.equal(l.opacityFor(l.white?0:1),0);assert.equal(l.opacityFor(l.white?1:0),1);l.elapsed=44000;assert.equal(l.stage,'release');assert.equal(l.form,'kyurem');assert.ok(l.opacityFor(l.white?0:1)>.5);assert.equal(l.advance(4000,48000),true);assert.equal(l.stage,'absent');assert.ok(l.nextVisit>48000)}
})
test('Reshiram ordinary charge hovers above the attached mouth anchor',()=>{assert.deepEqual(reshiramCharge({x:120,y:50}),{x:120,y:20})})
test('missiles fan outward then home to exact endpoints with matching trail paths',()=>{
 const a={x:120,y:-110},b={x:40,y:50};for(let i=0;i<4;i++){assert.deepEqual(unovaMissile(a,b,0,i),a);const end=unovaMissile(a,b,1,i);assert.ok(Math.hypot(end.x-b.x,end.y-b.y)<1e-9);assert.ok(unovaMissile(a,b,.4,i).y<a.y);assert.deepEqual(unovaMissile(a,b,2,i),end)}
})
test('all five source bodies retain their colors and bounded articulated anchors',()=>{
 const src=new Uint8ClampedArray(128*128*4);for(let y=25;y<100;y++)for(let x=20;x<105;x++)src.set([120,190,214,255],(y*128+x)*4)
 const life=new UnovaLife(()=>0);life.begin();for(const form of UNOVA_FORMS){const texture=new UnovaTexture(form,src),seen=new Set<string>();for(const elapsed of [1200,9800,13500,26500,36000,38500]){life.elapsed=elapsed;const pose=unovaPose(life,form.startsWith('kyurem')?2:form==='reshiram'?0:1),pixels=texture.render(pose);let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]){count++;assert.deepEqual([...pixels.slice(i,i+3)],[120,190,214])}assert.ok(count>5000&&count<9000);seen.add(Buffer.from(pixels).toString('base64'));for(const kind of ['mouth','tail','back']as const){const at=texture.anchor(pose,kind);assert.ok(at.x>0&&at.x<192&&at.y>0&&at.y<192)}}assert.ok(seen.size>3)}
})
test('Unova visitor battle keeps residents active, prevents repeat and Rest cancels fusion',()=>{
 const l=new ArenaLife(()=>.9);l.select('rest');assert.equal(l.summonUnova(),true);assert.equal(l.summonUnova(),false);for(let i=0;i<36000;i+=100)l.advance(100);assert.ok(l.residentDuel);assert.equal(l.unova.form,'kyurem-black');l.select('rest');assert.equal(l.unova.active,false);assert.equal(l.state,'rest')
})
test('inactive cancellation preserves resident randomness; active visits randomize their next cooldown',()=>{
 let calls=0;const l=new UnovaLife(()=>{calls++;return .4});assert.equal(calls,0);l.cancel(1000);assert.equal(calls,0);assert.equal(l.nextVisit,181000);l.begin();assert.equal(calls,1);l.cancel(10000);assert.equal(calls,2);assert.equal(l.nextVisit,178000)
})
test('Auto summons the eligible trio and Rest suppresses later automatic visits',()=>{
 const l=new ArenaLife(()=>.9);l.unova.nextVisit=0;l.advance(100);assert.equal(l.unova.active,true);assert.equal(l.unova.stage,'arrival');l.select('rest');l.advance(300000);assert.equal(l.unova.active,false);assert.equal(l.mode,'rest')
})
test('Kyurem stays above its two nearby Unova partners',()=>{const l=new UnovaLife(()=>.9);l.begin();assert.equal(l.kyurem.y,-185);assert.equal(l.reshiram.y,-120);assert.equal(l.zekrom.y,-120);assert.ok(Math.abs(l.kyurem.x-l.reshiram.x)>=35);assert.ok(Math.abs(l.kyurem.x-l.zekrom.x)>=35)})
test('all thirteen pets remain finite through camera changes and Arceus interruption',()=>{
 const l=new ArenaLife(()=>.9);l.resize(1200);l.summonCreation(true);l.summonSunMoon();l.summonUnova();l.unova.elapsed=36000;l.summonUltra();l.summonArceus();assert.equal(l.unova.form,'kyurem');assert.equal(l.unova.stage,'await-boss');assert.equal(l.ultraTargetIndex,12);l.resizeCamera(1440,1.2);for(let i=0;i<19000;i+=100)l.advance(100);for(const pet of [...l.unova.pets,l.ray,l.deoxys,l.kyogre,l.groudon,l.necrozma.actor])assert.ok(Number.isFinite(pet.x)&&Number.isFinite(pet.y));for(let i=0;i<8000;i+=100)l.advance(100);assert.equal(l.unova.active,false)
})
