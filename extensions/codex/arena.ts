import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { arenaUsage } from './arena-hud'
import type { Usage } from './protocol'

export function arenaHtml(script: string, ray: string, groudon: string, csp: string, nonce: string, kyogre: string, deoxys: string[] = []): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp}; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'"><style>
  html,body{margin:0;height:100%;background:var(--vscode-editor-background,#111111);color:var(--vscode-foreground,#e5eef5);font:12px sans-serif}body{display:flex;flex-direction:column}header,footer{padding:8px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}header span{opacity:.6}main{position:relative;background:#000;flex:1;min-height:80px;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated}button{background:#263b4e;color:#eee;border:1px solid #405369;padding:5px 9px;border-radius:4px;cursor:pointer}button[aria-pressed=true]{border-color:#ffc978}button:focus-visible{outline:2px solid #5aa9ff}#arena-status{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  header{flex-shrink:0;justify-content:space-between;padding:6px 12px}header>span{font-size:10px}
  #arena-hud{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;border-top:1px solid #33424b;padding:6px 12px;flex-shrink:0;font:11px monospace;width:100%;max-width:620px;box-sizing:border-box;white-space:nowrap}.quota{display:flex;gap:5px;align-items:center;min-width:0}.quota label{flex-shrink:0}.meter{height:7px;background:#363a43;position:relative;overflow:hidden;flex:1;min-width:6px;max-width:52px}.meter:after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 5px,#1115 5px 7px)}.meter i{display:block;height:100%;background:var(--quota-color);width:0}.quota[data-key=hp]{--quota-color:#49b77c}.quota[data-key=mp]{--quota-color:#7d81ee}.quota[data-key=st]{--quota-color:#e9b33c}.quota[data-low=true]{--quota-color:#e15b59}.quota output{color:var(--quota-color);font-weight:bold;flex-shrink:0}.reset{color:#9ba6b6;font-size:9px;flex-shrink:0}.reset:empty{display:none}
  #arena-controls{display:flex;gap:6px;padding:0 12px 6px;flex-shrink:0}#arena-controls button{font-size:11px;padding:3px 10px}
  @media(max-width:360px){#arena-hud{padding:5px 8px;gap:6px;font-size:9px}.quota{gap:3px}.reset{font-size:8px}.meter{max-width:18px}header{padding:5px 8px}header>span{display:none}#arena-controls{padding:0 8px 5px}}
  @media(max-height:180px){header{padding:3px 8px}#arena-hud{padding:4px 8px}main{min-height:40px}#arena-controls{padding-bottom:4px}}img{display:none}</style></head><body>
  <header><strong>Legendary Arena</strong><span>Local · No AI tokens</span></header><main><canvas id="arena" aria-label="Mega Rayquaza, Primal Groudon, Primal Kyogre and Deoxys sharing a pixel arena"></canvas></main>
  <footer id="arena-hud" role="group" aria-label="Remaining context, five-hour and weekly token quotas">${['hp','mp','st'].map(key=>`<div class="quota" data-key="${key}"><label></label><div class="meter" role="progressbar"><i></i></div><output>—</output><span class="reset"></span></div>`).join('')}</footer>
  <div id="arena-controls" role="group" aria-label="Arena actions"><button data-mode="play" aria-pressed="true">Auto</button><button data-mode="duel" aria-pressed="false">Duel</button><button data-mode="rest" aria-pressed="false">Rest</button></div><div id="arena-status" role="status">Loading pets…</div>
  <img id="arena-ray" src="${ray}" alt=""><img id="arena-groudon" src="${groudon}" alt=""><img id="arena-kyogre" src="${kyogre}" alt="">${deoxys.map((url,i)=>`<img id="arena-deoxys-${['normal','attack','defense','speed'][i]}" src="${url}" alt="">`).join('')}<script nonce="${nonce}" src="${script}"></script></body></html>`
}
export class Arena implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext,private observer?:{subscribe:(listener:(usage:Usage)=>void)=>vscode.Disposable;visible:(visible:boolean)=>void}) {}
  resolveWebviewView(view: vscode.WebviewView): void {
    const root = this.context.extensionUri
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(root, 'dist'), vscode.Uri.joinPath(root, 'extensions', 'codex')] }
    const asset = (folder: string, name: string) => view.webview.asWebviewUri(vscode.Uri.joinPath(root, folder, name)).toString()
    let usage:Usage={},ready=false
    const send=()=>{if(ready&&view.visible)void view.webview.postMessage({type:'arena-usage',usage})}
    const subscription=this.observer?.subscribe(value=>{usage=arenaUsage(value);send()})
    this.observer?.visible(view.visible)
    this.context.subscriptions.push(view.webview.onDidReceiveMessage((message:unknown)=>{
      if(message&&typeof message==='object'&&(message as {type?:unknown}).type==='arena-ready'){ready=true;send()}
    }),view.onDidChangeVisibility(()=>{this.observer?.visible(view.visible);send()}),view.onDidDispose(()=>{subscription?.dispose();this.observer?.visible(false)}))
    view.webview.html = arenaHtml(asset('dist', 'arena.js'), asset('extensions/codex', 'legendary-128px-atlas.png'), asset('extensions/codex', 'groudon-primal-128px-atlas.png'), view.webview.cspSource, randomBytes(16).toString('hex'), asset('extensions/codex','kyogre-primal-128px-atlas.png'), ['normal','attack','defense','speed'].map(form=>asset('extensions/codex',`deoxys-${form}-128px-atlas.png`)))
  }
}
