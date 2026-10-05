import { stamp, type Canvas } from '../../plugins/pixel-pet/hooks/pixels'
import type { ToolState } from './protocol'
import { layScene, type Scene, type SceneLayout } from '../../plugins/pixel-pet/hooks/scene'

type ZoneMode = 'read' | 'edit' | 'bash' | 'web'
export type WorkZone = { name: string; mode: ZoneMode; x: number; width: number; top: number; dock: number; kind: 'building' | 'station' | 'lodge'; group: string }
const names = { read: 'Library', edit: 'Writing desk', bash: 'Terminal', web: 'Observatory' }

/** Reflow complete buildings into small stations, then one shared three-bay lodge. */
export function layoutWorkZones(width: number): WorkZone[] {
  const modes: ZoneMode[] = width >= 240 ? ['read', 'edit', 'web', 'bash'] : ['read', 'edit', 'bash']
  if (width < 70) {
    const size = Math.min(34, width - 4), x = 2
    return modes.map((mode, index) => ({ name: names[mode], mode, x, width: size, top: 2, dock: x + 2 + index * 10, kind: 'lodge', group: 'lodge' }))
  }
  const kind = width < 144 ? 'station' : 'building'
  const size = kind === 'station' ? 16 : 30
  const margin = kind === 'station' ? 5 : 8
  // Leave a clear skyline on the right for the theme's sun or moon.
  const right = kind === 'building' ? 26 : margin
  const gap = (width - margin - right - modes.length * size) / (modes.length - 1)
  return modes.map((mode, index) => {
    const x = Math.round(margin + index * (size + gap))
    return { name: names[mode], mode, x, width: size, top: kind === 'station' ? 6 : 2, dock: x + (kind === 'station' ? 2 : 9), kind, group: mode }
  })
}

const scenery = new WeakMap<Scene, Map<number, SceneLayout>>()
/** Keep plants clear of buildings and preserve the theme's foreground obstacle positions. */
export function layWorkScene(scene: Scene, width: number): SceneLayout {
  const cached = scenery.get(scene)?.get(width)
  if (cached) return cached
  const original = layScene(scene, width)
  const occupied = [...new Map(layoutWorkZones(width).map(zone => [zone.group, { x: zone.x, w: zone.width }])).values()]
  const place = <T extends { x: number; rows: string[] }>(item: T): T | undefined => {
    const size = Math.max(...item.rows.map(row => row.length))
    let best: number | undefined, distance = Infinity
    for (let x = 0; x + size <= width; x++) {
      const delta = Math.abs(x - item.x)
      if (delta >= distance || occupied.some(other => x + size > other.x - 1 && x < other.x + other.w + 1)) continue
      best = x; distance = delta
    }
    if (best === undefined) return
    occupied.push({ x: best, w: size })
    return { ...item, x: best }
  }
  const obstacles = original.obstacles
  occupied.push(...obstacles.map(item => ({ x: item.x, w: Math.max(...item.rows.map(row => row.length)) })))
  const decor = [...original.decor].sort((a, b) => b.rows.length - a.rows.length).flatMap(item => {
    if (item.drift !== undefined) return [item]
    const placed = place(item); return placed ? [placed] : []
  })
  const result = { ...original, obstacles, decor }
  let widths = scenery.get(scene)
  if (!widths) { widths = new Map(); scenery.set(scene, widths) }
  if (widths.size >= 8) widths.delete(widths.keys().next().value!)
  widths.set(width, result)
  return result
}

export function stationAnchor(width: number, mode: ToolState['mode']): number {
  const zones = layoutWorkZones(width)
  const target = mode === 'search' || mode === 'web' ? 'web' : mode === 'agent' ? 'bash' : mode
  return (zones.find(zone => zone.mode === target) ?? zones.find(zone => zone.mode === 'bash'))!.dock
}

const C = { outline: 0x243445, shadow: 0x23372f, wall: 0xf2d7a6, shade: 0xc99d70, wood: 0x9e624a, trim: 0x6d4438, roof: 0xbd604c, roofLight: 0xe48965, cream: 0xffecc6, glass: 0x6abfc0, teal: 0x367e81, navy: 0x344c68, blue: 0x6c9ed7, light: 0xb4dcf2, green: 0x9acb83, gold: 0xf4c36a }
const letters: Record<string, string[]> = {
  L: ['X..', 'X..', 'X..', 'X..', 'XXX'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'],
  A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'], R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'], U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  N: ['X.X', 'XXX', 'XXX', 'XXX', 'X.X'], W: ['X.X', 'X.X', 'XXX', 'XXX', 'X.X'], E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'], K: ['X.X', 'X.X', 'XX.', 'X.X', 'X.X'],
}

export function drawWorkZones(band: Canvas, now: number, terrain?: SceneLayout, palette?: Record<string, number>): WorkZone[] {
  const zones = layoutWorkZones(band.w)
  const rect = (x: number, y: number, w: number, h: number, color: number) => {
    for (let yy = Math.max(0, y); yy < Math.min(band.h, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(band.w, x + w); xx++) band.px[yy * band.w + xx] = color
  }
  const text = (word: string, x: number, y: number, color: number) => [...word].forEach((letter, index) => stamp(band, x + index * 4, y, letters[letter], { X: color }))
  const foreground = () => { if (palette) for (const rock of terrain?.obstacles ?? []) stamp(band, rock.x, 20 - rock.rows.length, rock.rows, palette) }
  const roof = (x: number, width: number, main: number, light: number) => {
    for (let row = 0; row < 6; row++) {
      const span = Math.round(width * (row + 1) / 6), left = x + Math.floor((width - span) / 2)
      rect(left, 2 + row, span, 1, main); rect(left, 2 + row, Math.max(1, Math.floor(span / 2)), 1, light)
    }
    rect(x, 8, width, 1, C.trim)
  }
  const book = (x: number, y: number) => {
    rect(x, y, 5, 6, C.trim); rect(x + 1, y + 1, 1, 4, C.roofLight); rect(x + 2, y + 1, 1, 4, C.cream); rect(x + 3, y + 2, 1, 3, C.glass)
  }
  if (zones[0].kind === 'lodge') {
    const { x, width } = zones[0]
    rect(x, 19, width, 1, C.shadow); rect(x + 1, 8, width - 2, 11, C.wood)
    roof(x, width, C.teal, C.glass)
    rect(x + Math.floor((width - 17) / 2), 7, 17, 7, C.outline)
    text('WORK', x + Math.floor((width - 15) / 2), 8, C.cream)
    for (let index = 0; index < 3; index++) {
      const bay = x + 2 + index * 10
      rect(bay, 14, 9, 5, C.trim); rect(bay + 1, 15, 7, 3, [C.gold, C.glass, C.blue][index])
      rect(bay + 2, 16, 3, 1, C.outline)
    }
    foreground()
    return zones
  }
  for (const zone of zones) {
    const { x, width, mode, kind } = zone
    rect(x, 19, width, 1, C.shadow)
    rect(x + Math.floor(width / 2) - 2, 20, 4, 2, C.shade)
    if (kind === 'station') {
      rect(x + 1, 9, 14, 10, C.trim); rect(x + 2, 10, 12, 8, C.wall)
      const color = mode === 'read' ? C.roof : mode === 'edit' ? C.teal : C.navy
      rect(x + 2, 6, 12, 1, color); rect(x + 1, 7, 14, 1, color); rect(x, 8, 16, 1, color)
      if (mode === 'read') { book(x + 3, 11); book(x + 8, 11); rect(x + 2, 17, 12, 1, C.wood) }
      else if (mode === 'edit') {
        rect(x + 3, 11, 9, 5, C.cream); rect(x + 8, 10, 1, 5, C.gold); rect(x + 2, 16, 12, 2, C.wood)
      } else {
        rect(x + 3, 11, 10, 6, C.outline); rect(x + 4, 12, 3, 1, C.green); rect(x + 5, 14, 5, 1, C.blue); rect(x + 10, 15, 1, 1, C.light)
      }
      continue
    }
    if (mode === 'read') {
      rect(x + 2, 8, 26, 11, C.shade); rect(x + 4, 8, 22, 11, C.wall)
      roof(x, 30, C.roof, C.roofLight)
      rect(x + 9, 8, 13, 6, C.trim); text('LIB', x + 10, 9, C.cream)
      book(x + 5, 12); book(x + 21, 12)
      rect(x + 12, 15, 6, 4, C.trim); rect(x + 13, 15, 4, 4, C.cream); rect(x + 16, 17, 1, 1, C.wood)
      rect(x + 10, 19, 10, 1, C.shade)
      rect(x + 2, 18, 3, 1, C.green); rect(x + 25, 18, 3, 1, C.green)
    } else if (mode === 'edit') {
      rect(x + 2, 8, 26, 11, C.wood); rect(x + 4, 9, 22, 10, C.wall)
      rect(x + 3, 5, 24, 1, C.glass); rect(x + 1, 6, 28, 3, C.teal)
      for (let stripe = 0; stripe < 7; stripe++) rect(x + 1 + stripe * 4, 8, 2, 1, C.glass)
      rect(x + 9, 4, 13, 7, C.outline); text('LAB', x + 10, 5, C.light)
      rect(x + 5, 11, 20, 6, C.teal); rect(x + 6, 12, 18, 4, C.glass)
      rect(x + 9, 13, 6, 3, C.cream); rect(x + 16, 11, 1, 5, C.gold); rect(x + 17, 11, 2, 1, C.gold)
      rect(x + 4, 17, 22, 1, C.wood); rect(x + 6, 18, 2, 2, C.trim); rect(x + 22, 18, 2, 2, C.trim)
    } else if (mode === 'bash') {
      rect(x + 2, 7, 26, 12, C.navy); rect(x + 4, 8, 22, 10, C.outline)
      rect(x + 1, 6, 28, 1, C.blue); rect(x + 3, 7, 1, 10, C.light); rect(x + 26, 7, 1, 10, C.blue)
      rect(x + 9, 2, 13, 6, C.outline); text('RUN', x + 10, 3, C.light)
      rect(x + 6, 10, 16, 6, 0x172734); rect(x + 7, 11, 3, 1, C.green); rect(x + 9, 13, 8, 1, C.blue)
      rect(x + 9, 15, 5, 1, C.glass); rect(x + 18, 15, 1, 1, Math.floor(now / 700) % 2 ? C.light : C.outline)
      for (let row = 0; row < 3; row++) rect(x + 24, 10 + row * 3, 1, 1, [C.green, C.gold, C.roofLight][row])
      rect(x + 1, 18, 28, 1, C.blue)
    } else {
      for (let row = 0; row < 11; row++) {
        const span = Math.round(Math.sqrt(121 - (10 - row) ** 2))
        rect(x + 15 - span, 2 + row, span * 2, 1, C.navy)
        rect(x + 15 - span, 2 + row, Math.max(1, Math.floor(span * 0.7)), 1, C.blue)
      }
      rect(x + 3, 13, 24, 6, C.shade); rect(x + 4, 13, 22, 1, C.cream)
      rect(x + 9, 14, 13, 5, C.outline); text('WEB', x + 10, 14, C.cream)
      for (let step = 0; step < 7; step++) rect(x + 11 + step, 11 - step, 3, 2, C.light)
      rect(x + 18, 4, 3, 3, C.glass); rect(x + 10, 12, 7, 1, C.gold)
    }
  }
  foreground()
  return zones
}
