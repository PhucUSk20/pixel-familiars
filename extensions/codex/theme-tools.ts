import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { animate, readTheme, restingFrame } from '../../plugins/pixel-pet/hooks/theme'
import { previewPage } from '../../plugins/pixel-pet/hooks/preview'
import { object } from './protocol'
import { bridgeRoot, readJson, saveTheme, storedTheme, atomicJson } from './bridge'

export class ThemeTools {
  private previewed: unknown
  constructor(private home: string, private assets: string) {}
  async current(): Promise<unknown> {
    // The extension publishes the actual rendered theme, including a configured themeFile.
    const active = object(await readJson(join(bridgeRoot(this.home), 'active-theme.json')))
    const saved = await storedTheme(this.home)
    if ((!saved || active.revision === saved.revision) && active.theme) return active.theme
    if (saved?.theme) return saved.theme
    return JSON.parse(await readFile(join(this.assets, 'assets', 'slime.json'), 'utf8'))
  }
  async format(): Promise<string> { return readFile(join(this.assets, 'skills', 'pixel-pet', 'FORMAT.md'), 'utf8') }
  async call(name: string, argumentsValue: unknown): Promise<Record<string, unknown>> {
    const args = object(argumentsValue)
    if (args.theme !== undefined && Buffer.byteLength(JSON.stringify(args.theme), 'utf8') > 1024 * 1024) throw new Error('Theme exceeds 1 MB.')
    if (name === 'get_theme') return { theme: await this.current(), formatResource: 'pixel-pet://theme-format' }
    if (name === 'get_theme_format') return { format: await this.format() }
    if (name === 'preview_theme') {
      const read = readTheme(args.theme)
      if (read.errors) throw new Error(read.errors.join(' '))
      const body = animate(read.theme)
      const directory = join(bridgeRoot(this.home), 'previews')
      await mkdir(directory, { recursive: true })
      const path = join(directory, randomUUID() + '.html')
      // The agent cannot supply an arbitrary destination path.
      const page = previewPage(body, read.notes)
        .replaceAll('"note":"Claude is idle"', '"note":"Codex is idle"')
        .replaceAll('"note":"Claude thinks longer"', '"note":"Codex thinks longer"')
        .replace('. Approve it in Claude Code, or say what to change.</p>', '. Ask Codex to apply it, or say what to change.</p>')
      await writeFile(path, page, { mode: 0o600 })
      await atomicJson(join(bridgeRoot(this.home), 'latest-preview.json'), { path })
      this.previewed = read.theme
      return { path, notes: read.notes, restingFrame: restingFrame(body), applied: false }
    }
    if (name === 'set_theme') {
      const theme = 'theme' in args ? args.theme : this.previewed
      if (theme === undefined) throw new Error('Provide theme, null for the default, or preview_theme first.')
      const saved = await saveTheme(this.home, theme)
      return { applied: true, revision: saved.revision, default: theme === null }
    }
    throw new Error(`Unknown Pixel Pet tool: ${name}`)
  }
}
