import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
export function deoxysHtml(script:string, atlases:string[], csp:string, nonce:string):string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
html,body{margin:0;height:100%;background:#111;color:#eee;font:12px sans-serif}body{display:flex;flex-direction:column}header,footer{padding:8px 12px;display:flex;gap:8px;flex-wrap:wrap}header span{opacity:.6}main{position:relative;flex:1;min-height:80px;background:#000}canvas{position:absolute;width:100%;height:100%;image-rendering:pixelated}button{background:#263b4e;color:#eee;border:1px solid #526780;border-radius:4px;padding:5px 8px;cursor:pointer}button:focus-visible{outline:2px solid #b4a0ff}button[aria-pressed=true]{border-color:#d0b6ff}img{display:none}#deoxys-status{padding:0 12px 8px;color:#d1b5e7}</style></head><body>
<header><strong>Deoxys · Meteorite Sanctuary</strong><span>Local · No AI tokens</span></header><main><canvas id="deoxys" aria-label="Deoxys transforming through meteorite contact"></canvas></main>
<footer><button data-action="auto" aria-pressed="true">Tự do · Auto</button><button data-action="meteor">Chạm thiên thạch</button><button data-action="skill">Thi triển kỹ năng</button><button data-action="rest">Nghỉ</button><button data-action="original">Sprite gốc</button><button id="deoxys-pause">Tạm dừng</button></footer><div id="deoxys-status" role="status">Đang tải bốn dạng…</div>
${atlases.map((url,i)=>`<img id="deoxys-${['normal','attack','defense','speed'][i]}" src="${url}" alt="">`).join('')}<script nonce="${nonce}" src="${script}"></script></body></html>`
}
export class Deoxys implements vscode.WebviewViewProvider {
  constructor(private context:vscode.ExtensionContext){}
  resolveWebviewView(view:vscode.WebviewView):void {
    const root=this.context.extensionUri
    view.webview.options={enableScripts:true,localResourceRoots:[vscode.Uri.joinPath(root,'dist'),vscode.Uri.joinPath(root,'extensions','codex')]}
    const asset=(folder:string,name:string)=>view.webview.asWebviewUri(vscode.Uri.joinPath(root,folder,name)).toString()
    view.webview.html=deoxysHtml(asset('dist','deoxys.js'),['normal','attack','defense','speed'].map(form=>asset('extensions/codex',`deoxys-${form}-128px-atlas.png`)),view.webview.cspSource,randomBytes(16).toString('hex'))
  }
}
