import {drawAvianEffects,hoohRainbow} from '../avian-effects'
import test from 'node:test'
import assert from 'node:assert/strict'
import {AvianLife} from '../avian-life'
import {ArenaLife} from '../arena-life'
import {AvianTexture,avianPose} from '../avian-rig'
test('birds remain a pair regardless of the optional independent rider encounter',()=>{
 for(const value of [0,.9]){const life=new AvianLife(()=>value);life.resize(1000);life.begin(true);assert.equal(life.visiblePets.length,2);assert.equal(life.hooh.y,0);assert.equal(life.lugia.right,false);life.advance(24000,24000);assert.equal(life.stage,'soar');life.hold();const elapsed=life.elapsed;life.advance(5000,29000);assert.equal(life.elapsed,elapsed);life.leave();life.advance(3000,32000);assert.equal(life.active,false)}
})
test('Avian encounter coexists with residents and joins Arceus/Ultra without dropped targets',()=>{
 const l=new ArenaLife(()=>.9);l.resize(1100);l.select('rest');assert.ok(l.summonAvian(true));for(let i=0;i<6000;i+=100)l.advance(100);assert.ok(l.residentDuel);assert.equal(l.avian.stage,'ordinary-fire');l.summonUltra();assert.equal(l.ultraTargetIndex,10);l.summonArceus();assert.ok(l.avian.held&&l.necrozma.battle.allied);l.select('rest');assert.equal(l.avian.active,false);l.summonAll();assert.equal(l.ultraTargetIndex,29);assert.ok(l.avian.active)
})
test('all five native bodies preserve source colors with finite articulated anchors',()=>{
 for(const form of ['ho-oh','lugia','mewtwo','mega-mewtwo-x','mega-mewtwo-y']as const){const source=new Uint8ClampedArray(128*128*4);for(let y=25;y<100;y++)for(let x=25;x<105;x++)source.set([155,120,211,255],(y*128+x)*4);const texture=new AvianTexture(form,source);const l=new AvianLife(()=>.9);l.begin(true);l.elapsed=5000;const pose=avianPose(l,2),render=texture.render(pose);assert.ok(render.filter((_,i)=>i%4===3&&render[i]>0).length>1000);for(const kind of ['mouth','hand']as const){const p=texture.anchor(pose,kind);assert.ok(p.x>0&&p.x<192&&p.y>0&&p.y<192)}}
})

test('Auto can summon the left trio, Rest suppresses future visits and late Ultra recruits preserve resident retreat',()=>{const l=new ArenaLife(()=>.9);l.avian.nextVisit=0;l.advance(100);assert.ok(l.avian.active);l.select('rest');l.advance(400000);assert.equal(l.avian.active,false);l.select('play');l.summonUltra();l.advance(1000);const x=l.ray.x;l.summonAvian(true);assert.ok(l.avian.held);l.advance(100);assert.ok(Math.abs(l.ray.x-x)<1)})

test('frequent bird visits choose optional Mewtwo and leave rather than occupying the default frame',()=>{
 for(const value of [0,.9]){const life=new AvianLife(()=>value);assert.equal(life.visiblePets.length,0);life.begin();assert.equal(life.hasMewtwo,value===0);assert.equal(life.visiblePets.length,2);assert.equal(life.opacity,0);life.advance(1800,1800);assert.ok(life.opacity>0);assert.ok(life.offset(1).y>0);life.elapsed=4000;const before=life.offset(0);life.advance(1500,5500);assert.notDeepEqual(life.offset(0),before);life.advance(40000,45000);assert.equal(life.visiblePets.length,0);assert.ok(life.nextVisit>=90000&&life.nextVisit<=120000)}
 const arena=new ArenaLife(()=>.9);assert.equal(arena.ultraTargetIndex,4);arena.summonAvian();assert.equal(arena.ultraTargetIndex,6);arena.summonArceus();assert.equal(arena.ultraTargetIndex,6);arena.select('rest');assert.equal(arena.ultraTargetIndex,4)
})
test('bird wings visibly flap while soaring and Rest cancels future visits',()=>{
 const life=new AvianLife(()=>.9);life.begin();life.elapsed=20000;assert.equal(life.stage,'soar');assert.ok(Math.abs(avianPose(life,0,0).wing-avianPose(life,0,350).wing)>.4)
 const arena=new ArenaLife(()=>.9);arena.advance(13000);assert.ok(arena.avian.active);arena.select('rest');arena.advance(100000);assert.equal(arena.avian.active,false)
})

test('bird visit preserves an already active resident battle instead of restarting it',()=>{
 const life=new ArenaLife(()=>.9);life.select('duel');life.airDuel.stage='fight';life.airDuel.turn=2;life.airDuel.elapsed=1700;life.summonAvian();assert.equal(life.airDuel.turn,2);assert.equal(life.airDuel.elapsed,1700)
})


test('rainbow stays fixed while Ho-Oh flies, recoils or turns, below the upper residents',()=>{
 const life=new AvianLife(()=>.9);life.resize(1100);life.begin();life.elapsed=24000
 const ellipses:number[][]=[]
 const ctx={save(){},restore(){},beginPath(){},stroke(){},fillRect(){},ellipse(...args:number[]){ellipses.push(args)}} as unknown as CanvasRenderingContext2D
 const anchors=[{mouth:{x:100,y:80},hand:{x:90,y:90}},{mouth:{x:200,y:80},hand:{x:190,y:90}}]
 drawAvianEffects(ctx,life,anchors,true);const before=ellipses.splice(0)
 life.hooh.x+=90;life.hooh.y-=20;life.hooh.right=!life.hooh.right;life.elapsed+=1500
 drawAvianEffects(ctx,life,anchors,true);assert.deepEqual(ellipses,before);assert.equal(before.length,7)
 for(const [,,rx,ry,rotation] of before){assert.ok(rx<=80&&ry<=65);assert.equal(rotation,0)}
 assert.equal(hoohRainbow(1100).top,93)
 life.elapsed=36500;assert.ok(life.offset(0).y>=0)
})
