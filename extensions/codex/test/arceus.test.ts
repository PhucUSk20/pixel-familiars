import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ArenaLife } from '../arena-life'
import { ArceusLife, ARCEUS_VISIT_MS } from '../arceus-life'
import { arceusContact, judgmentShots } from '../arceus-effects'
import { arceusPose, ArceusTexture } from '../arceus-rig'

test('rare Arceus visits have descent, awe, blocked assault, Judgment and departure before scheduling another visit', () => {
  const life = new ArceusLife(() => .5)
  assert.equal(life.stage, 'absent'); assert.ok(life.nextVisit >= 150000)
  life.begin(); assert.equal(life.stage, 'arrival'); assert.equal(life.opacity, 0)
  life.advance(3000, 3000); assert.equal(life.stage, 'awe')
  life.advance(2500, 5500); assert.equal(life.stage, 'assault'); assert.equal(life.castElapsed, 0)
  life.advance(4000, 9500); assert.equal(life.stage, 'cast'); assert.equal(life.castElapsed, 500)
  life.advance(12000, 21500); assert.equal(life.stage, 'departure')
  assert.ok(life.advance(ARCEUS_VISIT_MS, 50000)); assert.equal(life.stage, 'absent'); assert.ok(life.nextVisit > 160000)
  const skills = new Set(['judgment'])
  for (let i = 0; i < 3; i++) { life.begin(); assert.equal(life.skill,'judgment'); life.advance(22000,22000); skills.add(life.skill); life.cancel(0) }
  assert.equal(skills.size, 1)
})
test('nearby pets retreat gently, distant pets stay put, and only Judgment contact adds bounded knockback', () => {
  const life = new ArenaLife(() => .5);life.avian.nextVisit=Infinity; life.resize(1000)
  life.ray.x = 390; life.ray.y=10;life.deoxys.y=10; life.deoxys.x = 470; life.groudon.x = 365
  const pets = [life.ray,life.deoxys,life.kyogre,life.groudon], starts = pets.map(p=>({x:p.x,y:p.y}))
  assert.ok(life.summonArceus()); assert.equal(life.summonArceus(),false)
  for (let i=0;i<32;i++) life.advance(100)
  assert.ok(Math.abs(life.ray.x-(starts[0].x-16))<.01)
  assert.ok(Math.abs(life.deoxys.x-(starts[1].x+16))<.01)
  assert.ok(Math.abs(life.groudon.x-(starts[3].x+16))<.01)
  assert.equal(life.kyogre.x,starts[2].x,'distant Kyogre must not be pulled towards an edge')
  assert.deepEqual(pets.map(p=>p.y),starts.map(p=>p.y))
  for(let i=0;i<120;i++)life.advance(100)
  assert.equal(life.kyogre.x,starts[2].x,'no push before actual Judgment contact')
  for(let i=0;i<19;i++)life.advance(100)
  assert.ok(life.kyogre.x<starts[2].x-2 && life.kyogre.x>starts[2].x-24)
  for(let i=0;i<55;i++)life.advance(100)
  assert.ok(Math.abs(life.ray.x-(starts[0].x-40))<.01)
  assert.ok(Math.abs(life.kyogre.x-(Math.max(-40,starts[2].x-72)))<.01,'one twenty-four-pixel displacement per volley, no per-frame accumulation')
  for(let i=0;i<20;i++)life.advance(100)
  assert.equal(life.state,'roam'); assert.equal(life.arceus.active,false)
  for(const mode of ['rest','duel'] as const){life.select(mode);life.arceus.nextVisit=0;life.advance(1000);assert.equal(life.arceus.active,false)}
})
test('manual summon works from Rest and Duel without teleporting, survives resize and cancels with Rest',()=>{
  const life=new ArenaLife(()=>.5)
  for(const mode of ['rest','duel'] as const){
    life.select(mode); const starts=[life.ray.x,life.deoxys.x,life.kyogre.x,life.groudon.x]
    assert.ok(life.summonArceus()); assert.equal(life.mode,'play');assert.equal(life.airDuel.active,false)
    assert.deepEqual([life.ray.x,life.deoxys.x,life.kyogre.x,life.groudon.x],starts)
    life.advance(100);life.resize(1400);const x=life.groudon.x;life.advance(100)
    assert.ok(Math.abs(life.groudon.x-x)<24,'resized pet continues its bounded retreat without teleporting')
    life.select('rest');assert.equal(life.arceus.stage,'absent')
  }
})
test('Arceus descends smoothly and blocks all four attacks before Judgment; later visits leave after Judgment',()=>{
  const life=new ArenaLife(()=>.5);life.summonArceus()
  const top=life.arceus.heightOffset;life.advance(1400)
  assert.ok(life.arceus.heightOffset>top && life.arceus.heightOffset<0)
  life.advance(1400);assert.equal(life.arceus.heightOffset,0)
  life.advance(2200);assert.equal(life.arceus.stage,'assault')
  assert.equal(life.ray.action,'pulse');assert.equal(life.groudon.action,'burst');assert.equal(life.kyogre.action,'pulse');assert.equal(life.deoxys.action,'skill')
  for(let i=0;i<4;i++)assert.equal(arceusContact(life.arceus,i),0)
  life.advance(4000);assert.equal(life.arceus.stage,'cast');assert.equal(life.arceus.skill,'judgment')
  life.advance(15000);assert.equal(life.arceus.active,false)
  life.summonArceus();life.advance(22000);assert.equal(life.arceus.skill,'judgment');assert.equal(life.arceus.stage,'departure')
})
test('Judgment produces three volleys that land at every actual target, with no premature contact', () => {
  const targets = [{ x: 75, y: 70, surface: 189 }, { x: 405, y: 75, surface: 189 }, { x: 85, y: 152, surface: 189, water: true }, { x: 390, y: 123, surface: 189 }]
  assert.equal(judgmentShots(240, 3000, targets).length, 0)
  const life = new ArceusLife(); life.begin()
  for (let wave = 0; wave < 3; wave++) for (let i = 0; i < 4; i++) {
    const elapsed = (.65 + wave * .08 + i * .008) * 12000
    const shots = judgmentShots(240, elapsed, targets).filter(s => s.progress === 1 && s.target === targets[i])
    assert.ok(shots.some(s => s.x === targets[i].x && s.y === targets[i].y))
    life.elapsed = 9000 + elapsed; assert.ok(arceusContact(life, i) > 0)
  }
  life.elapsed = 9000 + 5000; assert.equal(arceusContact(life, 0), 0)
})
test('every Arceus visit ends after Judgment without later skills',()=>{
 const life=new ArceusLife(()=>.5)
 for(let visit=0;visit<8;visit++){
  life.begin();life.advance(17000,17000);assert.equal(life.skill,'judgment');assert.equal(life.stage,'cast')
  life.advance(4100,21100);assert.equal(life.stage,'departure');assert.equal(arceusContact(life,0),0)
  assert.ok(life.advance(2500,23600));assert.equal(life.active,false)
 }
})

test('source-textured Arceus joints move independently while the torso and golden ring stay attached', () => {
  const data = new Uint8ClampedArray(128 * 128 * 4)
  for (let y = 25; y < 110; y++) for (let x = 35; x < 100; x++) data.set([240, 230, 190, 255], (y * 128 + x) * 4)
  const texture = new ArceusTexture(data), idle = texture.render(arceusPose('judgment', 2000, false)), cast = texture.render(arceusPose('judgment', 2000, true))
  const area = (image: Uint8ClampedArray) => image.filter((n, i) => i % 4 === 3 && n > 0).length
  assert.notDeepEqual(idle, cast); assert.ok(area(cast) / area(idle) > .88 && area(cast) / area(idle) < 1.12)
})

test('the gold torso ring remains rigid while the head and legs articulate',()=>{
 const source=new Uint8ClampedArray(128*128*4)
 source.set([218,182,60,255],(78*128+92)*4)
 const texture=new ArceusTexture(source)
 const neutral={head:0,front:0,back:0,lift:0,angle:0,glow:0}
 assert.deepEqual(texture.render(neutral),texture.render({...neutral,head:.2,front:.2,back:-.2}))
})
