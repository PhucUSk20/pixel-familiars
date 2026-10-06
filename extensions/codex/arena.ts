import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'

export function arenaHtml(script: string, ray: string, groudon: string, csp: string, nonce: string, kyogre: string, deoxys: string[] = []): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
  html,body{margin:0;height:100%;background:var(--vscode-editor-background,#111111);color:var(--vscode-foreground,#e5eef5);font:12px sans-serif}body{display:flex;flex-direction:column}header,footer{padding:8px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}header span{opacity:.6}main{position:relative;background:#000;flex:1;min-height:80px;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated}button{background:#263b4e;color:#eee;border:1px solid #405369;padding:5px 9px;border-radius:4px;cursor:pointer}button[aria-pressed=true]{border-color:#ffc978}button:focus-visible{outline:2px solid #5aa9ff}#arena-status{padding:0 12px 8px;font-size:11px;color:#b8ccd9}img{display:none}</style></head><body>
  <header><strong>Legendary Arena</strong><span>Local · No AI tokens</span></header><main><canvas id="arena" aria-label="Mega Rayquaza, Primal Groudon Primal Kyogre and Deoxys sharing a pixel arena"></canvas></main>
  <footer><button data-mode="play" aria-pressed="true">Tự do · Auto</button><button data-mode="duel" aria-pressed="false">Đấu chiêu · Rayquaza vs Deoxys</button><button data-mode="rest" aria-pressed="false">Cùng nghỉ</button><button id="arena-pause" aria-pressed="false">Tạm dừng</button></footer><div id="arena-status" role="status">Đang tải các pet…</div>
  <img id="arena-ray" src="${ray}" alt=""><img id="arena-groudon" src="${groudon}" alt=""><img id="arena-kyogre" src="${kyogre}" alt="">${deoxys.map((url,i)=>`<img id="arena-deoxys-${['normal','attack','defense','speed'][i]}" src="${url}" alt="">`).join('')}<script nonce="${nonce}" src="${script}"></script></body></html>`
}
export class Arena implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView): void {
    const root = this.context.extensionUri
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(root, 'dist'), vscode.Uri.joinPath(root, 'extensions', 'codex')] }
    const asset = (folder: string, name: string) => view.webview.asWebviewUri(vscode.Uri.joinPath(root, folder, name)).toString()
    view.webview.html = arenaHtml(asset('dist', 'arena.js'), asset('extensions/codex', 'legendary-128px-atlas.png'), asset('extensions/codex', 'groudon-primal-128px-atlas.png'), view.webview.cspSource, randomBytes(16).toString('hex'), asset('extensions/codex','kyogre-primal-128px-atlas.png'), ['normal','attack','defense','speed'].map(form=>asset('extensions/codex',`deoxys-${form}-128px-atlas.png`)))
  }
}
