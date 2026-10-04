import { canvas, compose, crop, stamp, type Body, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import type { Mode } from '../../plugins/pixel-pet/types'

export const INTERACTIONS = ['feed', 'play', 'chase', 'hide', 'seesaw', 'trampoline', 'dance', 'umbrella', 'bubbles', 'gift', 'tug', 'stargaze', 'highfive', 'paperplane', 'fishing', 'magic', 'stack', 'pillow', 'boat', 'photo'] as const
export type Interaction = typeof INTERACTIONS[number]
export const INTERACTION_TEXT: Record<Interaction, string> = {
  feed: 'Mini shares a snack. The AI pet saves the last bite for Mini.',
  play: 'Mini and the AI pet play together: catch that bouncing ball!',
  chase: 'Tag! Mini runs away, then chases the AI pet back.',
  hide: 'Where is Mini? Peekaboo! Right behind the AI pet.',
  seesaw: 'Tiny passenger, big launch! The seesaw needs a little balance.',
  trampoline: 'Boing! The AI pet becomes a trampoline for Mini.',
  dance: 'Disco time! One big wiggle, one tiny wiggle.',
  umbrella: 'A tiny raincloud! The AI pet shares its umbrella with Mini.',
  bubbles: 'Mini blows bubbles. The AI pet catches one on its nose.',
  gift: 'A present for you! Surprise: Mini pops out of the box.',
  tug: 'Tug of war! Mini wins and both tumble over.',
  stargaze: 'A shooting star! Mini and the AI pet make a wish.',
  highfive: 'High five! Mini jumps up for the tiniest fist bump.',
  paperplane: 'Air Mini takes off! The AI pet waves at its paper pilot.',
  fishing: 'Gone fishing! Mini caught a boot. The AI pet looks impressed anyway.',
  magic: 'Ta-da! Mini disappears through a portal and pops out on the other side.',
  stack: 'One more block! Mini balances on a wobbling tower.',
  pillow: 'Pillow fight! So many feathers for such tiny pillows.',
  boat: 'All aboard the leaf boat! Mini is the captain of this puddle.',
  photo: 'Say pixels! The pets pose for a photo and blink at the flash.',
}
export type Pose = { x: number; lift: number; mode: Mode; dir: 1 | -1; squash: number; tilt: number; hidden?: boolean }
export type Prop = { x: number; y: number; rows: string[]; color: number }
export type InteractionFrame = { kind: Interaction; text: string; elapsed: number; main: Pose; mini: Pose; props: Prop[] }

/** A shuffled local playlist. Real work, manual placement and Rest pause it. */
export class InteractionClock {
  private bag: Interaction[] = []
  private last?: Interaction
  private current?: { kind: Interaction; since: number; duration: number }
  private next = 0
  constructor(private random = Math.random) {}
  request(kind: Interaction, now: number): void {
    this.current = { kind, since: now, duration: kind === 'feed' ? 7000 : 7600 }
    this.last = kind
    this.next = now + this.current.duration + this.delay()
  }
  cancel(now: number): void { this.current = undefined; this.next = now + this.delay() }
  private delay(): number { return 10000 + this.random() * 14000 }
  private choose(): Interaction {
    if (!this.bag.length) {
      this.bag = [...INTERACTIONS]
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1))
        ;[this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]
      }
    }
    if (this.bag.at(-1) === this.last && this.bag.length > 1) [this.bag[0], this.bag[this.bag.length - 1]] = [this.bag[this.bag.length - 1], this.bag[0]]
    return this.bag.pop()!
  }
  update(now: number, available: boolean, width: number, mainLeft: number): InteractionFrame | undefined {
    if (!available) { this.cancel(now); return undefined }
    if (this.current && now >= this.current.since + this.current.duration) this.current = undefined
    if (!this.next) this.next = now + 8000 + this.random() * 8000
    if (!this.current && now >= this.next) this.request(this.choose(), now)
    return this.current ? interactionFrame(this.current.kind, now - this.current.since, width, mainLeft) : undefined
  }
}

/** Every scene has a different trajectory and pixel prop, rather than a shared heart overlay. */
export function interactionFrame(kind: Interaction, elapsed: number, width: number, mainLeft: number): InteractionFrame {
  const anchor = Math.max(2, Math.min(width - 40, mainLeft))
  const main: Pose = { x: anchor, lift: 0, mode: 'idle', dir: 1, squash: 1, tilt: 0 }
  const mini: Pose = { x: anchor + 29, lift: 0, mode: 'idle', dir: -1, squash: 1, tilt: 0 }
  const props: Prop[] = []
  const phase = elapsed / 1000
  const wave = Math.sin(phase * 4)
  const cycle = (elapsed % 2400) / 2400
  const add = (x: number, y: number, rows: string[], color: number) => props.push({ x: Math.round(x), y: Math.round(y), rows, color })
  const heart = ['.P.P.', 'PPPPP', '.PPP.', '..P..']
  switch (kind) {
    case 'feed': {
      // A picnic cloth, a cookie passed across, then crumbs and chewing squashes.
      const bite = Math.min(3, Math.floor(elapsed / 1700))
      add(anchor + 19, 18, ['PPPPPPPPP', '.P.P.P.P.'], 0xffa6ae)
      add(anchor + 21 + Math.sin(phase * 1.6) * 6, 13, bite < 2 ? ['.PPP.', 'PPPPP', 'P.P.P', '.PPP.'] : ['.PP', 'P.P', '.P.'], 0xe7b35c)
      main.squash = 1 - Math.abs(wave) * 0.08; mini.squash = 1 - Math.abs(Math.cos(phase * 4)) * 0.18
      if (elapsed > 3300) for (let i = 0; i < 3; i++) add(anchor + 17 + i * 4, 15 + (phase * 2 + i) % 4, ['P'], 0xe7b35c)
      break
    }
    case 'play': {
      const transit = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2
      const ballX = anchor + 17 + transit * 15
      add(ballX, 16 - Math.sin(transit * Math.PI) * 10, ['.PP.', 'P.PP', 'PPP.', '.PP.'], 0xff9b63)
      main.lift = transit < 0.18 ? Math.sin(transit / 0.18 * Math.PI) * 2 : 0
      mini.lift = transit > 0.78 ? Math.sin((transit - 0.78) / 0.22 * Math.PI) * 4 : 0
      mini.tilt = wave * 0.2
      break
    }
    case 'chase': {
      const run = Math.sin(phase * 1.7)
      main.x = anchor + 7 + run * 7; mini.x = anchor + 25 + run * 8
      main.mode = 'run'; main.dir = run > Math.sin((phase - 0.1) * 1.7) ? 1 : -1
      mini.dir = main.dir; mini.lift = Math.abs(Math.sin(phase * 9)) * 2
      for (let i = 0; i < 3; i++) add(main.x + (main.dir === 1 ? -2 - i * 2 : 20 + i * 2), 18 - i % 2, ['PP'], 0xc5bda4)
      break
    }
    case 'hide': {
      const peek = cycle > 0.48
      mini.x = anchor + (peek ? 18 + Math.sin(cycle * Math.PI) * 4 : 9)
      mini.hidden = !peek; mini.lift = peek ? 3 : 0
      main.dir = cycle > 0.6 ? 1 : -1; main.tilt = wave * 0.09
      add(anchor + 8, 5, peek ? ['P...P', '.P.P.', '..P..'] : ['P.P.P'], 0xffdc8a)
      break
    }
    case 'seesaw': {
      add(anchor + 20, 17, ['..P..', '.PPP.', 'PPPPP'], 0xb98855)
      for (let i = 0; i < 31; i++) add(anchor + 3 + i, 16 + (i - 15) * wave * 0.17, ['P'], 0xe8b56d)
      main.x = anchor + 1; main.lift = 4 + wave * 2; main.tilt = wave * 0.1
      mini.x = anchor + 30; mini.lift = 5 - wave * 4
      break
    }
    case 'trampoline': {
      const jump = Math.abs(Math.sin(phase * 2.3))
      main.squash = 0.68 + jump * 0.3; mini.x = anchor + 7; mini.lift = 6 + jump * 7
      main.mode = 'idle'; mini.tilt = wave * 0.3
      if (jump < 0.35) add(anchor + 18, 11, ['P.P', '.P.', 'P.P'], 0xffe88a)
      break
    }
    case 'dance': {
      main.tilt = wave * 0.3; main.squash = 0.85 + Math.abs(wave) * 0.15
      mini.tilt = -wave * 0.65; mini.lift = Math.abs(Math.cos(phase * 4)) * 3
      for (let i = 0; i < 3; i++) add(anchor + 5 + i * 11, 3 + Math.sin(phase * 3 + i) * 2, ['.PP', '.P.', 'PP.'], [0xff99ca, 0x99e8ff, 0xffe879][i])
      break
    }
    case 'umbrella': {
      mini.x = anchor + 17; main.squash = 0.88
      add(anchor + 8, 2, ['....PPP....', '..PPPPPPP..', '.PPPPPPPPP.', 'PPPPPPPPPPP', '.....P.....', '.....P.....', '.....P.....'], 0xd49bff)
      add(anchor + 27, 1, ['..PPPP...', '.PPPPPPP.', 'PPPPPPPPP'], 0xa3bacd)
      for (let i = 0; i < 5; i++) add(anchor + 27 + i * 2, 5 + (phase * 8 + i * 3) % 12, ['P', 'P'], 0x8bceff)
      break
    }
    case 'bubbles': {
      mini.x = anchor + 26
      add(mini.x - 3, 13, ['PP', 'PP', '.P', '.P'], 0xffd891)
      for (let i = 0; i < 4; i++) {
        const drift = (phase * 0.3 + i * 0.24) % 1
        add(anchor + 25 - drift * 18, 12 - drift * 10, i === 0 ? ['.PP.', 'P..P', 'P..P', '.PP.'] : ['.P.', 'P.P', '.P.'], i % 2 ? 0xabecff : 0xe5c1ff)
      }
      main.tilt = -Math.abs(wave) * 0.1
      break
    }
    case 'gift': {
      const reveal = elapsed > 3000
      mini.x = anchor + 26; mini.hidden = !reveal; mini.lift = reveal ? Math.max(0, 6 - (elapsed - 3000) / 650) : 0
      add(anchor + 25, 15, ['PPPPPPP', 'P.P.P.P', 'P.P.P.P', 'PPPPPPP'], 0xff9bca)
      add(anchor + 25 + (reveal ? 4 : 0), reveal ? 8 - wave * 2 : 14, ['PPPPPPP', '..PPP..'], 0xffe178)
      main.tilt = reveal ? wave * 0.1 : 0
      if (reveal) add(anchor + 20, 6, heart, 0xffb1ca)
      break
    }
    case 'tug': {
      const tumble = elapsed > 4800
      main.x += wave * 2; mini.x += wave * 2; main.dir = -1; mini.dir = 1
      main.tilt = tumble ? -0.5 : -0.1; mini.tilt = tumble ? 1.2 : 0.4
      main.squash = tumble ? 0.65 : 0.9
      for (let i = 0; i < 13; i++) add(anchor + 17 + i + wave * 2, 16 + Math.sin(i / 4 + phase * 3), ['P'], 0xe8d1a1)
      if (tumble) add(anchor + 15, 8, ['P.P', '.P.', 'P.P'], 0xffe178)
      break
    }
    case 'stargaze': {
      mini.x = anchor + 20; main.squash = 0.68; mini.squash = 0.65
      for (let i = 0; i < 5; i++) add(anchor + i * 8, 2 + i % 3 * 2, Math.floor(phase * 2 + i) % 2 ? ['.P.', 'PPP', '.P.'] : ['P'], 0xffe8ac)
      const shooting = (elapsed % 3300) / 3300
      add(anchor + shooting * 33, 1 + shooting * 5, ['PPP.P.P'], 0xdcf7ff)
      break
    }
    case 'highfive': {
      mini.x = anchor + 18; mini.lift = Math.abs(Math.sin(phase * 2)) * 9
      main.tilt = -Math.abs(wave) * 0.12; main.mode = 'cheer'
      if (mini.lift > 7) add(anchor + 16, 8, ['P.P', '.P.', 'P.P'], 0xffe675)
      break
    }
    case 'paperplane': {
      mini.x = anchor + 21 + Math.sin(phase * 1.5) * 6; mini.lift = 7 + Math.sin(phase * 2) * 3
      mini.tilt = Math.cos(phase * 1.5) * 0.25
      add(mini.x - 3, 20 - mini.lift, ['PPPPPPPPPPP', '..PPPPPP...', '....PP.....'], 0xdcf0ff)
      main.tilt = wave * 0.12
      for (let i = 0; i < 3; i++) add(mini.x - 5 - i * 3, 19 - mini.lift, ['PP'], 0xbdd6e2)
      break
    }
    case 'fishing': {
      add(anchor + 22, 19, ['PPPPPPPPPPPPPP'], 0x70c7f3)
      add(anchor + 17, 6, ['P....', '.P...', '..P..', '...P.', '....P', '....P'], 0xd9b577)
      for (let y = 7; y < 17; y++) add(anchor + 26, y, ['P'], 0xe1eaff)
      const caught = elapsed > 3000
      mini.lift = caught ? Math.abs(wave) * 2 : 0
      add(anchor + 25, caught ? 10 + wave * 2 : 17, caught ? ['PP..', 'PP..', 'PPPP', 'PPPP'] : ['P'], caught ? 0xbf7b57 : 0xffb192)
      main.tilt = caught ? -0.12 : 0
      break
    }
    case 'magic': {
      const portal = cycle > 0.25 && cycle < 0.55
      mini.x = anchor + (cycle < 0.55 ? 28 : 18); mini.hidden = portal; mini.lift = portal ? 0 : Math.abs(wave) * 3
      add(anchor + 26, 10, ['.PPP.', 'P...P', 'P...P', 'P...P', '.PPP.'], 0xbe95ff)
      add(anchor + 18, 12, ['P.P', '.P.', 'P.P'], 0xffe88f)
      add(anchor + 16, 14, ['PP.P'], 0xd7e7ff)
      main.tilt = wave * 0.07
      break
    }
    case 'stack': {
      const sway = Math.sin(phase * 2)
      mini.x = anchor + 24 + sway * 2; mini.lift = 8; mini.tilt = -sway * 0.25
      for (let i = 0; i < 4; i++) add(anchor + 23 + sway * i / 2, 18 - i * 2, ['PPPPPPP', 'P.....P'], [0xffaa9c, 0xffdb7a, 0xa3d7ff, 0xc7a4ff][i])
      main.tilt = sway * 0.1
      add(anchor + 16, 8, ['P', 'P', '.', 'P'], 0xffe29a)
      break
    }
    case 'pillow': {
      main.squash = 0.8 + Math.abs(wave) * 0.2; mini.tilt = -wave * 0.6; mini.lift = Math.abs(wave) * 2
      add(anchor + 18 + wave * 5, 13, ['.PPPP.', 'PPPPPP', '.PPPP.'], 0xffd9e9)
      add(anchor + 27 - wave * 4, 16, ['PPPP', 'PPPP'], 0xd8ecff)
      for (let i = 0; i < 5; i++) add(anchor + 15 + i * 4 + Math.sin(phase + i) * 2, 4 + (phase * 2 + i * 3) % 10, ['PP', '.P'], 0xf8f3e4)
      break
    }
    case 'boat': {
      const drift = Math.sin(phase) * 2
      main.x += drift; mini.x += drift; main.lift = 3 + Math.sin(phase * 3); mini.lift = main.lift
      main.tilt = Math.sin(phase * 3) * 0.04; mini.tilt = -main.tilt * 2
      add(anchor, 17 + Math.sin(phase * 3), ['.PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.', '..PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP..', '.....PPPPPPPPPPPPPPPPPPPPPPPPPPP.....'], 0x91c56d)
      for (let i = 0; i < 8; i++) add(anchor + i * 5, 20, Math.floor(phase * 3 + i) % 2 ? ['PPP'] : ['.PP'], 0x76bdf2)
      break
    }
    case 'photo': {
      const flash = elapsed % 2200 > 1700
      mini.x = anchor + 19; mini.tilt = -0.2; main.tilt = 0.1
      add(anchor + 28, 13, ['.PPPPP.', 'PP...PP', 'PP.P.PP', 'PP...PP', '.PPPPP.', '...P...', '..P.P..'], 0xa1b3c7)
      if (flash) add(anchor + 27, 5, ['P..P..P', '.P.P.P.', '..PPP..', 'PPPPPPP', '..PPP..', '.P.P.P.', 'P..P..P'], 0xfff1b2)
      else add(anchor + 8, 6, heart, 0xffa9c6)
      main.squash = flash ? 0.82 : 1; mini.squash = flash ? 0.6 : 1
      break
    }
  }
  return { kind, text: INTERACTION_TEXT[kind], elapsed, main, mini, props }
}

/** Transform existing custom-theme sprites around their feet; all writes are clipped. */
export function transformPose(source: Canvas, pose: Pose): Canvas {
  const out = canvas(source.w, source.h)
  for (let y = 0; y < source.h; y++) for (let x = 0; x < source.w; x++) {
    const yy = Math.round(source.h - 1 - (source.h - 1 - y) * pose.squash - pose.lift)
    const xx = Math.round(x + (source.h - 1 - y) * pose.tilt)
    if (xx >= 0 && xx < out.w && yy >= 0 && yy < out.h && source.px[y * source.w + x] >= 0) out.px[yy * out.w + xx] = source.px[y * source.w + x]
  }
  return out
}

export function drawInteraction(body: Body, band: Canvas, frame: Pick<InteractionFrame, 'mini' | 'props'>): void {
  const rows = body.miniSprite
  const small = canvas(6, 7)
  if (rows) stamp(small, 0, 7 - rows.length, rows, body.palette)
  else {
    stamp(small, 0, 2, ['..T..', '.TTT.', 'BEBEB', 'BBBBB', '.DDD.'], { T: body.mini.top, B: body.mini.body, E: 0, D: body.mini.edge })
  }
  const posed = transformPose(small, { ...frame.mini, lift: 0 })
  if (!frame.mini.hidden) for (let y = 0; y < posed.h; y++) for (let x = 0; x < posed.w; x++) {
    const xx = Math.round(frame.mini.x) + (frame.mini.dir === -1 ? posed.w - 1 - x : x)
    const yy = 13 + y - Math.round(frame.mini.lift)
    const color = posed.px[y * posed.w + x]
    if (xx >= 0 && xx < band.w && yy >= 0 && yy < band.h && color >= 0) band.px[yy * band.w + xx] = color
  }
  for (const prop of frame.props) stamp(band, prop.x, prop.y, prop.rows, { P: prop.color })
}

export function interactionMain(body: Body, frame: Pick<InteractionFrame, 'main' | 'elapsed'>): Canvas {
  return transformPose(crop(compose(body, frame.main.mode, frame.elapsed, frame.main.dir), 0, 0, 19, 20), frame.main)
}
