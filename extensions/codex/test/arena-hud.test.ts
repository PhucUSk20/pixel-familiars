import {test} from 'node:test'
import assert from 'node:assert/strict'
import {arenaUsage,arenaReset,arenaUsageRows} from '../arena-hud'

test('Arena retains only bounded numeric usage and reset timestamps',()=>{
 assert.deepEqual(arenaUsage({hp:180,mp:-5,st:NaN,mpReset:7200,stReset:Infinity,prompt:'private',tools:3}),{hp:100,mpReset:7200})
 assert.deepEqual(arenaUsage(null),{})
})
test('Arena always shows three remaining metrics and preserves unknown usage',()=>{
 const rows=arenaUsageRows({hp:75,mp:80,st:63,mpReset:10800,stReset:86400*3},3600000)
 assert.deepEqual(rows.map(r=>r.value),[75,80,63]);assert.equal(rows[1].reset,'reset 2h 0m');assert.equal(rows[2].reset,'reset 2d 23h')
 assert.ok(arenaUsageRows({},0).every(r=>r.value===undefined))
})
test('Arena reset countdown advances independently of pet animation and never goes negative',()=>{
 assert.equal(arenaReset(7200,3600000),'reset 1h 0m');assert.equal(arenaReset(7200,7140000),'reset 1m');assert.equal(arenaReset(7200,7300000),'reset 0m');assert.equal(arenaReset(undefined,0),'reset —')
})
