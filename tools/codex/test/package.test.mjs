import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { unzipSync, strFromU8 } from 'fflate'
import { files, packageExtension } from '../package.mjs'

test('VSIX contains install metadata and all runtime assets, excludes repository secrets, and replaces an older archive', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pixel-pet-vsix-'))
  try {
    for (const [source] of files) {
      await mkdir(dirname(join(root, source)), { recursive: true })
      await writeFile(join(root, source), 'fixture')
    }
    const manifest = { name: 'pet', publisher: 'test', version: '1.0.0', displayName: 'Pet & Friends', description: '<pet>', main: './dist/extension.cjs', engines: { vscode: '^1.96.0' }, extensionKind: ['workspace'] }
    await writeFile(join(root, 'package.json'), JSON.stringify(manifest))
    await writeFile(join(root, '.env'), 'secret must not ship')
    const output = await packageExtension(root)
    const archive = unzipSync(await readFile(output))
    assert.equal(Object.keys(archive).length, files.length + 2)
    assert.ok(archive['extension/dist/mcp.mjs'])
    assert.ok(archive['extension/plugins/pixel-pet/skills/pixel-pet/FORMAT.md'])
    assert.ok(archive['extension/docs/images/codex-pet-life.gif'])
    assert.ok(archive['extension/docs/images/codex-pet-actions.gif'])
    assert.ok(strFromU8(archive['[Content_Types].xml']).includes('ContentType="image/gif"'), 'README demos must ship with a GIF content type')
    assert.equal(Object.keys(archive).some(path => path.includes('.env') || path.includes('node_modules') || path.includes('package-lock')), false)
    const xml = strFromU8(archive['extension.vsixmanifest'])
    assert.ok(xml.includes('Pet &amp; Friends'))
    assert.ok(xml.includes('&lt;pet&gt;'))
    assert.ok(xml.includes('Microsoft.VisualStudio.Code.Manifest'))
    assert.deepEqual(JSON.parse(strFromU8(archive['extension/package.json'])), manifest)
    manifest.version = '1.0.1'
    await writeFile(join(root, 'package.json'), JSON.stringify(manifest))
    await packageExtension(root)
    assert.ok(strFromU8(unzipSync(await readFile(output))['extension.vsixmanifest']).includes('Version="1.0.1"'))
    const before = await readFile(output)
    await rm(join(root, 'dist/mcp.mjs'))
    await assert.rejects(() => packageExtension(root), { code: 'ENOENT' })
    assert.deepEqual(await readFile(output), before, 'a missing runtime must not replace the last valid VSIX')
  } finally { await rm(root, { recursive: true, force: true }) }
})
