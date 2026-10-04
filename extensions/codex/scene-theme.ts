import { object } from './protocol'

/** Add a meadow without overwriting any colors used by the pet or its props. */
export function meadowTheme(value: unknown): Record<string, unknown> {
  const theme = object(value)
  const palette = { ...object(theme.palette) }
  const colors = { g: '#508b46', e: '#315b35', r: '#78838c', s: '#b6c1c9', y: '#ffe28a', w: '#e3f4ff', f: '#ef98ba', o: '#f2ad46', z: '#fff4ba', t: '#80ba63', b: '#8d623d' }
  const keys = Object.keys(colors)
  const available = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'].filter(key => !(key in palette))
  const mapping: Record<string, string> = {}
  for (const key of keys) {
    const color = colors[key as keyof typeof colors]
    const existing = Object.keys(palette).find(key => key.length === 1 && !'.*+@'.includes(key) && palette[key] === color)
    const character = existing ?? available.shift()
    if (!character) throw new Error('Not enough unused palette characters for the meadow scene.')
    mapping[key] = character
    palette[character] = color
  }
  const rows = (drawing: string[]) => drawing.map(row => [...row].map(key => mapping[key] ?? key).join(''))
  return { ...theme, palette, scene: {
    ground: rows(['gggegggggegg', 'eeeeeeeeeeee']),
    sky: rows(['.....y.....', '..y..y..y..', '...yyyyy...', '..yyzzzyy..', '..yzzzzyo..', 'yyyzzzzyoyy', '..yyyyyoo..', '..yyooooo..', '...yoooy...', '..y..y..y..', '.....y.....']),
    obstacles: [rows(['.ss.', 'srrs', 'rrrr'])],
    decor: [rows(['.f.', 'fgf', '.g.']), rows(['..ttt..', '.ttttg.', 'tttgggg', 'ttgggge', '.gggge.', '..ggg..', '..bbb..', '..bbb..', 'f.bbb.f', 'tgbbbgt']), rows(['..www...', '.wwwww..', '........', '........', '........', '........', '........', '........', '........', '........', '........', '........']), rows(['.t.t.', 'gtgtg', 'ggggg'])],
    every: 40,
  } }
}

/** Only bundled defaults get a scene; imported/MCP themes remain authoritative. */
export function bundledTheme(value: unknown): Record<string, unknown> {
  const theme = object(value)
  return theme.scene === undefined ? meadowTheme(theme) : theme
}

/** Upgrade only the exact old generated meadow; preserve custom scene drawings and colors. */
export function upgradeMeadow(value: unknown): unknown {
  const theme = object(value), scene = object(theme.scene), palette = object(theme.palette)
  const colors: Record<string, string> = { g: '#508b46', e: '#315b35', r: '#78838c', s: '#b6c1c9', y: '#ffe28a', w: '#e3f4ff', f: '#ef98ba' }
  const drawings = { ground: ['gggegggggegg', 'eeeeeeeeeeee'], sky: ['...yyy...', '..yyyyy..', '...yyy...'], obstacles: [['.ss.', 'srrs', 'rrrr']], decor: [['.f.', 'fgf', '.g.'], ['..www...', '.wwwww..', ...new Array<string>(10).fill('........')]], every: 40 }
  const decode = (value: unknown, colors: Record<string, unknown>): unknown => Array.isArray(value) ? value.map(row => decode(row, colors)) : typeof value === 'string' ? [...value].map(key => key === '.' ? '.' : colors[key] ?? `unknown:${key}`) : value
  if (Object.keys(scene).sort().join(',') !== Object.keys(drawings).sort().join(',')) return value
  for (const key of Object.keys(drawings) as (keyof typeof drawings)[]) if (JSON.stringify(decode(scene[key], palette)) !== JSON.stringify(decode(drawings[key], colors))) return value
  return meadowTheme(theme)
}
