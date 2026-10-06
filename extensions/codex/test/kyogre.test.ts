import { test } from 'node:test'
import assert from 'node:assert/strict'
import { KyogreAnimator, KyogreTexture, KYOGRE_ACTIONS, KYOGRE_DURATION, KYOGRE_WIDTH, KYOGRE_HEIGHT, kyogrePose, kyogreMouth } from '../primal-kyogre'

test('Kyogre swims with independent fin/tail articulation, dives and recoils from its mouth', () => {
  const a = kyogrePose('swim',500), b = kyogrePose('swim',1400)
  assert.notEqual(a.leftFin,b.leftFin); assert.notEqual(a.rightFin,b.rightFin); assert.notEqual(a.tail,b.tail)
  assert.notEqual(a.leftFin,-a.rightFin,'fins have a phase lag')
  assert.ok(kyogrePose('dive',3500).depth>.9 && kyogrePose('dive',3500).y>20)
  assert.ok(kyogrePose('roar',1600).jaw>.2)
  assert.equal(kyogrePose('sleep',2500).eyes,1)
  const charge = kyogrePose('pulse',2600), recoil = kyogrePose('pulse',3600)
  assert.ok(recoil.x>charge.x+5)
  assert.notDeepEqual(kyogreMouth(charge),kyogreMouth(recoil))
  assert.ok(kyogrePose('wave',2200).y<-9 && kyogrePose('rain',2200).glow>.8)
  assert.deepEqual(kyogreMouth(kyogrePose('original',0)),{x:102,y:118})
})
test('Kyogre texture retains source colours in seven distinct bounded actions', () => {
  const source = new Uint8ClampedArray(128*128*4), palette = new Set<string>()
  for (let y = 20; y<110; y++) for (let x = 20; x<110; x++) { source.set([x,y,70,255],(y*128+x)*4); palette.add(`${x},${y},70`) }
  const texture = new KyogreTexture(source), frames = new Set<string>()
  for (const action of KYOGRE_ACTIONS) {
    const frame = texture.render(kyogrePose(action,2500)); assert.equal(frame.length,KYOGRE_WIDTH*KYOGRE_HEIGHT*4)
    let visible = 0
    for (let i = 0; i<frame.length; i+=4) if (frame[i+3]) { visible++; assert.ok(palette.has(`${frame[i]},${frame[i+1]},${frame[i+2]}`)) }
    assert.ok(visible>5000); frames.add(Buffer.from(frame).toString('base64'))
  }
  assert.equal(frames.size,7)
})
test('Kyogre interrupted motions start at the current pose; automatic cycle visits all seven', () => {
  const animator = new KyogreAnimator(); animator.select('swim'); animator.advance(1800,false)
  let before = animator.pose(); animator.select('dive'); assert.deepEqual(animator.pose(),before)
  animator.advance(400,false); before = animator.pose(); animator.select('pulse'); assert.deepEqual(animator.pose(),before)
  animator.advance(1100,false); assert.equal(animator.transitioning,false)
  animator.select('swim')
  for (const action of KYOGRE_ACTIONS) { assert.equal(animator.action,action); animator.advance(KYOGRE_DURATION[action],true) }
  assert.equal(animator.action,'swim')
  const elapsed = animator.elapsed; animator.advance(NaN,true); animator.advance(-1,true); assert.equal(animator.elapsed,elapsed)
})
