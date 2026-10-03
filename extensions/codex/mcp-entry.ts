import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { ThemeTools } from './theme-tools'

const argument = (key: string) => { const index = process.argv.indexOf(key); return index >= 0 ? process.argv[index + 1] : undefined }
const home = argument('--home') || process.env.CODEX_HOME || join(homedir(), '.codex')
const assets = argument('--assets') || join(dirname(process.argv[1]), '..', 'plugins', 'pixel-pet')
const tools = new ThemeTools(home, assets)
const server = new Server({ name: 'pixel-pet', version: '0.2.0' }, { capabilities: { tools: {}, resources: {} } })
const schema = { type: 'object' as const, properties: { theme: { type: 'object' as const, description: 'Pixel Pet theme JSON in the supplied theme format.' } }, required: ['theme'] }
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
  { name: 'get_theme', description: 'Get the current Pixel Pet theme. Start changes from it to preserve unspecified fields.', inputSchema: { type: 'object', properties: {} } },
  { name: 'get_theme_format', description: 'Read the complete Pixel Pet theme JSON format before customizing.', inputSchema: { type: 'object', properties: {} } },
  { name: 'preview_theme', description: 'Validate a theme and write an HTML preview of every motion, face, prop, scene and HUD. Returns its local path; does not apply it. Show the preview before applying.', inputSchema: schema },
  { name: 'set_theme', description: 'Apply and persist the theme to the VS Code companion. Omit theme to apply the last preview in this MCP connection, or pass null for the default slime. Apply when the user requests it.', inputSchema: { type: 'object', properties: { theme: { type: ['object', 'null'] } } } },
] }))
server.setRequestHandler(CallToolRequestSchema, async request => {
  try { return { content: [{ type: 'text', text: JSON.stringify(await tools.call(request.params.name, request.params.arguments)) }] } }
  catch (error) { return { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Pixel Pet tool failed.' }] } }
})
server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [{ uri: 'pixel-pet://theme-format', name: 'Pixel Pet theme format', mimeType: 'text/markdown' }] }))
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  if (request.params.uri !== 'pixel-pet://theme-format') throw new Error('Unknown resource')
  return { contents: [{ uri: request.params.uri, mimeType: 'text/markdown', text: await tools.format() }] }
})
await server.connect(new StdioServerTransport())
