import type { Usage } from './protocol'

/** Only numeric usage metadata crosses into the Arena; no activity or transcript data. */
export function arenaUsage(value:unknown):Usage {
 const input=value&&typeof value==='object'?value as Record<string,unknown>:{}
 const result:Usage={}
 for(const key of ['hp','mp','st','mpReset','stReset'] as const){
  const v=input[key]
  if(typeof v==='number'&&Number.isFinite(v)&&v>=0)result[key]=key.endsWith('Reset')?v:Math.max(0,Math.min(100,v))
 }
 return result
}
export function arenaReset(timestamp:number|undefined,now:number):string {
 if(timestamp===undefined)return 'reset —'
 const minutes=Math.max(0,Math.ceil((timestamp*1000-now)/60000))
 const days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60
 return 'reset '+(days?`${days}d ${hours}h`:hours?`${hours}h ${mins}m`:`${mins}m`)
}
export function arenaUsageRows(value:unknown,now:number){
 const usage=arenaUsage(value)
 return [
  {key:'hp',label:'CTX',value:usage.hp,reset:''},
  {key:'mp',label:'5h',value:usage.mp,reset:arenaReset(usage.mpReset,now)},
  {key:'st',label:'Week',value:usage.st,reset:arenaReset(usage.stReset,now)},
 ] as const
}
