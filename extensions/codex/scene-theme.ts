import { object } from './protocol'

/** Add a meadow without overwriting any colors used by the pet or its props. */
export function meadowTheme(value: unknown): Record<string, unknown> {
  const theme = object(value)
  const palette = { ...object(theme.palette) }
  const colors = { g: '#508b46', e: '#315b35', r: '#78838c', s: '#b6c1c9', y: '#ffe28a', w: '#e3f4ff', f: '#ef98ba' }
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
    sky: rows(['...yyy...', '..yyyyy..', '...yyy...']),
    obstacles: [rows(['.ss.', 'srrs', 'rrrr'])],
    decor: [rows(['.f.', 'fgf', '.g.']), rows(['..www...', '.wwwww..', '........', '........', '........', '........', '........', '........', '........', '........', '........', '........'])],
    every: 40,
  } }
}

/** Only bundled defaults get a scene; imported/MCP themes remain authoritative. */
export function bundledTheme(value: unknown): Record<string, unknown> {
  const theme = object(value)
  return theme.scene === undefined ? meadowTheme(theme) : theme
}
