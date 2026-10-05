import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'

export function legendaryHtml(script: string, atlas: string, csp: string, nonce: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'">
  <style>html,body{height:100%;margin:0;color:var(--vscode-foreground,#e4f4ec);background:var(--vscode-editor-background,#0b1925);font:12px var(--vscode-font-family,sans-serif)}body{display:flex;flex-direction:column}header{padding:10px 12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}strong{color:#ffe39a}header span{opacity:.65}main{flex:1;min-height:100px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 50% 65%,#173d3e88,transparent 70%)}canvas{display:block;width:100%;height:100%;image-rendering:pixelated}footer{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap}button{background:var(--vscode-button-secondaryBackground,#263d42);color:var(--vscode-button-secondaryForeground,#e4f4ec);border:1px solid transparent;border-radius:4px;padding:5px 8px;cursor:pointer}button[aria-pressed=true]{border-color:#f6d077}button:focus-visible{outline:2px solid var(--vscode-focusBorder,#5aa9ff)}#status{padding:0 12px 8px;color:#b4d9ca;font-size:11px}img{display:none}</style></head>
  <body><header><strong>Legendary · Mega Rayquaza</strong><span>Local · No tokens</span></header><main><canvas id="legendary" aria-label="Independent legendary pixel dragon"></canvas></main>
  <footer><button data-action="original" aria-pressed="false">Hình gốc</button><button data-action="auto" aria-pressed="true">Auto</button><button data-action="fly">Bay lượn</button><button data-action="sleep">Cuộn mình ngủ</button><button data-action="roar">Gầm mở hàm</button><button data-action="pulse">Dragon Pulse</button><button data-action="dash">Lướt nhanh</button><button id="pause" aria-pressed="false">Tạm dừng</button></footer>
  <div id="status" role="status">Đang tải sprite…</div><img id="atlas" src="${atlas}" alt=""><script nonce="${nonce}" src="${script}"></script></body></html>`
}

export class Legendary implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView): void {
    const root = this.context.extensionUri
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(root, 'dist'), vscode.Uri.joinPath(root, 'extensions', 'codex')] }
    const script = view.webview.asWebviewUri(vscode.Uri.joinPath(root, 'dist', 'legendary.js')).toString()
    const atlas = view.webview.asWebviewUri(vscode.Uri.joinPath(root, 'extensions', 'codex', 'legendary-128px-atlas.png')).toString()
    view.webview.html = legendaryHtml(script, atlas, view.webview.cspSource, randomBytes(16).toString('hex'))
  }
}
