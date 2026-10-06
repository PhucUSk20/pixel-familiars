// Local VSIX packaging only. No publishing, signing, credentials or native binaries.
import { readFile, realpath, mkdir, writeFile, rename, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, relative, isAbsolute, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { zipSync, strToU8 } from 'fflate'

export const files = [
  ['docs/images/legendary-duel.gif','docs/images/legendary-duel.gif'],
  ...['normal','attack','defense','speed'].map(form=>[`extensions/codex/deoxys-${form}-128px-atlas.png`,`extensions/codex/deoxys-${form}-128px-atlas.png`]),
  ['docs/images/deoxys-meteor.gif','docs/images/deoxys-meteor.gif'], ['docs/DEOXYS.md','docs/DEOXYS.md'], ['docs/images/deoxys-actions.gif','docs/images/deoxys-actions.gif'],
  ['package.json', 'package.json'], ['README.md', 'readme.md'], ['LICENSE', 'LICENSE.txt'],
  ...['extension.cjs', 'webview.js', 'legendary.js', 'groudon.js', 'arena.js', 'kyogre.js', 'deoxys.js', 'hook.cjs', 'mcp.mjs'].map(name => [`dist/${name}`, `dist/${name}`]),
  ['extensions/codex/groudon-primal-128px-atlas.png', 'extensions/codex/groudon-primal-128px-atlas.png'],
  ['extensions/codex/kyogre-primal-128px-atlas.png', 'extensions/codex/kyogre-primal-128px-atlas.png'],
  ['docs/images/kyogre-actions.gif', 'docs/images/kyogre-actions.gif'], ['docs/PRIMAL-KYOGRE.md', 'docs/PRIMAL-KYOGRE.md'],
  ['docs/images/legendary-arena.gif', 'docs/images/legendary-arena.gif'],
  ['docs/images/groudon-actions.gif', 'docs/images/groudon-actions.gif'], ['docs/PRIMAL-GROUDON.md', 'docs/PRIMAL-GROUDON.md'],
  ['extensions/codex/legendary-64px-atlas.png', 'extensions/codex/legendary-64px-atlas.png'],
  ['extensions/codex/legendary-64px.json', 'extensions/codex/legendary-64px.json'],
  ['extensions/codex/legendary-128px-atlas.png', 'extensions/codex/legendary-128px-atlas.png'],
  ['docs/images/legendary-original.gif', 'docs/images/legendary-original.gif'],
  ['docs/images/legendary-source-actions.gif', 'docs/images/legendary-source-actions.gif'],
  ['media/pet.svg', 'media/pet.svg'], ['docs/CODEX.md', 'docs/CODEX.md'],
  ['docs/DEVELOPMENT.md', 'docs/DEVELOPMENT.md'],
  ['docs/CLAUDE.md', 'docs/CLAUDE.md'], ['CLAUDE.md', 'CLAUDE.md'],
  ...['slime', 'pets', 'demo', 'codex-pet-life', 'codex-pet-actions', 'codex-pet-summoning'].map(name => [`docs/images/${name}.gif`, `docs/images/${name}.gif`]),
  ...['slime', 'duck', 'alien'].map(name => [`plugins/pixel-pet/assets/${name}.json`, `plugins/pixel-pet/assets/${name}.json`]),
  ['plugins/pixel-pet/skills/pixel-pet/FORMAT.md', 'plugins/pixel-pet/skills/pixel-pet/FORMAT.md'],
]
const xml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])

export async function packageExtension(directory) {
  const root = await realpath(directory)
  const entries = {}
  for (const [source, destination] of files) {
    const path = await realpath(join(root, source))
    const inside = relative(root, path)
    if (inside.startsWith('..') || isAbsolute(inside)) throw new Error(`Package source is outside the repository: ${source}`)
    entries[`extension/${destination}`] = await readFile(path)
  }
  const manifest = JSON.parse(Buffer.from(entries['extension/package.json']).toString('utf8'))
  for (const field of ['name', 'publisher', 'version', 'displayName', 'description']) if (typeof manifest[field] !== 'string' || !manifest[field]) throw new Error(`Missing extension metadata: ${field}`)
  if (manifest.main !== './dist/extension.cjs' || !manifest.engines?.vscode) throw new Error('Unsupported extension entry point or missing VS Code engine.')
  entries['extension.vsixmanifest'] = strToU8(`<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="${xml(manifest.name)}" Version="${xml(manifest.version)}" Publisher="${xml(manifest.publisher)}"/>
    <DisplayName>${xml(manifest.displayName)}</DisplayName>
    <Description xml:space="preserve">${xml(manifest.description)}</Description>
    <Categories>${xml((manifest.categories ?? []).join(','))}</Categories>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${xml(manifest.engines.vscode)}"/>
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="${xml((manifest.extensionKind ?? []).join(','))}"/>
      <Property Id="Microsoft.VisualStudio.Code.ExecutesCode" Value="true"/>
    </Properties>
    <License>extension/LICENSE.txt</License>
  </Metadata>
  <Installation><InstallationTarget Id="Microsoft.VisualStudio.Code"/></Installation><Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/readme.md" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.License" Path="extension/LICENSE.txt" Addressable="true"/>
  </Assets>
</PackageManifest>`)
  const types = { cjs: 'application/octet-stream', js: 'application/javascript', mjs: 'application/javascript', json: 'application/json', md: 'text/markdown', svg: 'image/svg+xml', png: 'image/png', gif: 'image/gif', txt: 'text/plain', vsixmanifest: 'text/xml' }
  entries['[Content_Types].xml'] = strToU8(`<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${Object.entries(types).map(([extension, type]) => `<Default Extension=".${extension}" ContentType="${type}"/>`).join('')}</Types>`)
  const dist = await realpath(join(root, 'dist'))
  const distRelative = relative(root, dist)
  if (distRelative.startsWith('..') || isAbsolute(distRelative)) throw new Error('Package output directory is outside the repository.')
  await mkdir(dist, { recursive: true })
  const output = join(dist, 'pixel-pet-codex.vsix')
  const temporary = join(dist, `package-${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, zipSync(entries, { level: 6 }), { flag: 'wx' })
    await rename(temporary, output)
  } finally { await rm(temporary, { force: true }) }
  return output
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Packaged: ${await packageExtension(fileURLToPath(new URL('../../', import.meta.url)))}`)
