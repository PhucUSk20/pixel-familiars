import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'
import {posix,win32} from 'node:path'

const source=await readFile(new URL('../install-all.mjs',import.meta.url),'utf8')
// Execute the installer control flow with fake subprocesses; no installation or trust changes.
const script=source.replace(/\r\n/g,'\n').replace(/^import .*\n/gm,'').replace(/^const root = .*$/m,"const root = fixtureRoot")
function install(platform,isTTY,noReview=false){
 const calls=[],messages=[],paths=platform==='win32'?win32:posix,root=platform==='win32'?'C:\\fixture':'/fixture'
 const extension=platform==='win32'?'C:\\extension':'/extension'
 const process={platform,arch:'x64',versions:{node:'24.11.1'},execPath:'/node',argv:['node','installer',...(noReview?['--no-review']:[])],stdin:{isTTY},env:{}}
 runInNewContext(script,{fixtureRoot:root,join:paths.join,existsSync:()=>true,process,console:{log:text=>messages.push(text),error:text=>messages.push(text)},spawnSync:(command,args)=>{calls.push({command,args});return {status:0,stdout:args.some(arg=>arg.includes('--locate-extension'))?extension:'codex fixture',stderr:''}}})
 assert.equal(process.exitCode,undefined,'installer succeeds')
 const codex=calls.filter(call=>call.command.endsWith(platform==='win32'?'codex.exe':'/codex'))
 assert.ok(calls.some(call=>call.args.some(arg=>arg.includes('install.ts'))),'observer installation still runs')
 return {codex,messages,root}
}
test('noninteractive Windows, macOS and Linux installers skip opening Codex but explain manual hook review',()=>{
 for(const platform of ['win32','darwin','linux']){const result=install(platform,false);assert.equal(result.codex.length,1);assert.deepEqual(Array.from(result.codex[0].args),['--version']);assert.ok(result.messages.some(text=>text.includes('Review Codex Hooks')))}
})
test('interactive installers open Codex in the project without a daemon override',()=>{
 for(const platform of ['win32','darwin','linux']){const result=install(platform,true);assert.equal(result.codex.length,2);assert.deepEqual(Array.from(result.codex[1].args),['-C',result.root]);assert.ok(result.messages.some(text=>text.includes('/hooks')))}
})
test('explicit no-review suppresses interactive launch even with a TTY',()=>{
 for(const platform of ['win32','darwin','linux'])assert.equal(install(platform,true,true).codex.length,1)
})
