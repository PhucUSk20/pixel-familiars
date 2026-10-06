import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'

export function kyogreHtml(script: string, atlas: string, csp: string, nonce: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
  html,body{margin:0;height:100%;background:var(--vscode-editor-background,#111);color:var(--vscode-foreground,#dceff6);font:12px sans-serif}body{display:flex;flex-direction:column}header,footer{padding:8px 12px;display:flex;gap:7px;align-items:center;flex-wrap:wrap}header span{opacity:.6}main{position:relative;flex:1;min-height:80px;background:#000;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}button{background:#203646;color:#e4f4ff;border:1px solid transparent;border-radius:4px;padding:5px 8px;cursor:pointer}button[aria-pressed=true]{border-color:#73dafa}button:focus-visible{outline:2px solid #5aa9ff}#kyogre-status{padding:0 12px 8px;font-size:11px;color:#a3d1e2}img{display:none}</style></head><body>
  <header><strong>Legendary · Primal Kyogre</strong><span>Local · No AI tokens</span></header><main><canvas id="kyogre" aria-label="Articulated Primal Kyogre pixel companion"></canvas></main><footer>
  <button data-action="original">Hình gốc</button><button data-action="auto" aria-pressed="true">Auto</button><button data-action="swim">Bơi</button><button data-action="dive">Lặn</button><button data-action="sleep">Nghỉ</button><button data-action="roar">Gầm</button><button data-action="pulse">Cầu sáng / tia nước</button><button data-action="wave">Sóng lớn</button><button data-action="rain">Mưa giông</button><button id="kyogre-pause">Tạm dừng</button></footer><div id="kyogre-status" role="status">Đang tải sprite…</div><img id="kyogre-atlas" src="${atlas}" alt=""><script nonce="${nonce}" src="${script}"></script></body></html>`
}
export class Kyogre implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView): void {
    const root = this.context.extensionUri
    view.webview.options = { enableScripts:true, localResourceRoots:[vscode.Uri.joinPath(root,'dist'),vscode.Uri.joinPath(root,'extensions','codex')] }
    const script = view.webview.asWebviewUri(vscode.Uri.joinPath(root,'dist','kyogre.js')).toString()
    const atlas = view.webview.asWebviewUri(vscode.Uri.joinPath(root,'extensions','codex','kyogre-primal-128px-atlas.png')).toString()
    view.webview.html = kyogreHtml(script,atlas,view.webview.cspSource,randomBytes(16).toString('hex'))
  }
}
