/** Keep the scene and HUD together when the webview has little vertical room. */
export const RESPONSIVE_CSS = `
  .worker-error{position:absolute;padding:0;background:transparent;border:0;cursor:pointer;z-index:2}
  .worker-error:focus-visible{outline:2px solid #ff8585;background:#ff858530}
  #worker-result{border:1px solid var(--vscode-panel-border,#555);padding:8px;margin-top:8px;font-size:12px}
  #worker-result p{overflow-wrap:anywhere}
  #overview{display:grid;grid-template-areas:"scene" "status" "activity" "tasks" "hud";min-width:0}
  #scene-stage{grid-area:scene;min-width:0}#status{grid-area:status;min-width:0}
  #activity{grid-area:activity}#task-minis{grid-area:tasks;min-width:0}#hud{grid-area:hud;min-width:0}
  @media(max-height:420px){
    body{padding:8px}header{gap:6px}header button{padding:4px 8px}
    #connection{margin:4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #overview{grid-template-columns:minmax(0,1fr) 148px;grid-template-areas:"scene hud" "status status" "activity activity" "tasks tasks";column-gap:8px;align-items:start}
    #overview.without-hud{grid-template-columns:minmax(0,1fr);grid-template-areas:"scene" "status" "activity" "tasks"}
    #stage{height:clamp(48px,calc(100vh - 124px),120px)}
    #hud{padding:3px 6px;border-width:1px;margin-top:4px;box-sizing:border-box}
    #hud .bar{display:grid;grid-template-columns:minmax(0,42px) minmax(20px,1fr) 33px;gap:4px;margin:5px 0;align-items:center}
    #hud .bar label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
    #hud .bar canvas{width:100%;height:8px}#hud .hud-value{font-size:11px;white-space:nowrap;grid-column:3}
    #hud .hud-detail{display:none}
    #status{font-size:11px;min-height:16px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #activity{font-size:10px;margin:3px 0}#task-minis{margin:3px 0}
    #mini-pet{margin-top:6px;padding-top:6px}footer{margin-top:6px}
  }
  @media(max-height:420px) and (max-width:340px){
    #overview{grid-template-columns:minmax(0,1fr) 120px;column-gap:6px}
    #hud{padding:3px 4px}#hud .bar{grid-template-columns:minmax(0,38px) minmax(16px,1fr) 29px;gap:3px}
    #hud .bar label,#hud .hud-value{font-size:10px}
  }
  @media(max-height:180px){
    #connection{display:none}h2{font-size:12px}#stage{height:clamp(48px,calc(100vh - 64px),96px)}
  }
`
