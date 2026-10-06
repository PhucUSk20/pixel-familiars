import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'

export function groudonHtml(script: string, atlas: string, csp: string, nonce: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">
  <style>html,body{height:100%;margin:0;color:var(--vscode-foreground,#f5e1cc);background:var(--vscode-editor-background,#15151c);font:12px var(--vscode-font-family,sans-serif)}body{display:flex;flex-direction:column}header{padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}strong{color:#ffca75}header span{opacity:.65}main{flex:1;min-height:100px;overflow:hidden;background:radial-gradient(ellipse at 65% 75%,#6b221c66,transparent 70%)}canvas{display:block;width:100%;height:100%;image-rendering:pixelated}footer{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap}button{background:var(--vscode-button-secondaryBackground,#352a31);color:var(--vscode-button-secondaryForeground,#f5e1cc);border:1px solid transparent;border-radius:4px;padding:5px 8px;cursor:pointer}button[aria-pressed=true]{border-color:#ffab54}button:focus-visible{outline:2px solid var(--vscode-focusBorder,#5aa9ff)}#groudon-status{padding:0 12px 8px;color:#edbb9c;font-size:11px}img{display:none}</style></head>
  <body><header><strong>Legendary · Primal Groudon</strong><span>Local · No tokens</span></header><main><canvas id="groudon" aria-label="Primal Groudon pixel companion"></canvas></main>
  <footer><button data-action="original" aria-pressed="false">Hình gốc</button><button data-action="auto" aria-pressed="true">Auto</button><button data-action="walk">Đi nặng</button><button data-action="sleep">Ngủ</button><button data-action="roar">Gầm</button><button data-action="blades">Precipice Blades</button><button data-action="burst">Energy Burst</button><button data-action="eruption">Eruption</button><button id="groudon-pause" aria-pressed="false">Tạm dừng</button></footer>
  <div id="groudon-status" role="status">Đang tải sprite…</div><img id="groudon-atlas" src="${atlas}" alt=""><script nonce="${nonce}" src="${script}"></script></body></html>`
}
export class Groudon implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView): void {
    const root = this.context.extensionUri
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(root, 'dist'), vscode.Uri.joinPath(root, 'extensions', 'codex')] }
    const script = view.webview.asWebviewUri(vscode.Uri.joinPath(root, 'dist', 'groudon.js')).toString()
    const atlas = view.webview.asWebviewUri(vscode.Uri.joinPath(root, 'extensions', 'codex', 'groudon-primal-128px-atlas.png')).toString()
    view.webview.html = groudonHtml(script, atlas, view.webview.cspSource, randomBytes(16).toString('hex'))
  }
}
