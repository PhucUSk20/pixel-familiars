import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {runInNewContext} from 'node:vm'
import {posix,win32} from 'node:path'

const source=await readFile(new URL('../install-all.mjs',import.meta.url),'utf8')
// Execute the installer control flow with fake subprocesses; no installation or trust changes.
const script=source.replace(/\r\n/g,'\n').replace(/^import .*\n/gm,'').replace(/^const root = .*$/m,"const root = fixtureRoot")
function install(platform,isTTY,noReview=false,options={}){
 const calls=[],messages=[],paths=platform==='win32'?win32:posix,root=platform==='win32'?'C:\\fixture':'/fixture'
 const extension=platform==='win32'?'C:\\extension':'/extension'
 const process={platform,arch:options.arch||'x64',versions:{node:'24.11.1'},execPath:'/node',argv:['node','installer',...(noReview?['--no-review']:[])],stdin:{isTTY},env:{}}
 runInNewContext(script,{fixtureRoot:root,join:paths.join,homedir:()=>'/Users/Mac User',existsSync:path=>options.noApplication?false:options.userApplicationOnly?!path.startsWith('/Applications/'):true,process,console:{log:text=>messages.push(text),error:text=>messages.push(text)},spawnSync:(command,args)=>{calls.push({command,args});if(options.missingCode&&command==='code')return {error:Object.assign(new Error('code not found'),{code:options.codeError||'ENOENT'})};return {status:0,stdout:args.some(arg=>arg.includes('--locate-extension'))?extension:'codex fixture',stderr:''}}})
 if(options.expectedFailure){assert.equal(process.exitCode,1);assert.equal(calls.length,1,'stop before dependency or hook installation');return {calls,messages}}
 assert.equal(process.exitCode,undefined,'installer succeeds')
 const codex=calls.filter(call=>call.command.endsWith(platform==='win32'?'codex.exe':'/codex'))
 assert.ok(calls.some(call=>call.args.some(arg=>arg.includes('install.ts'))),'observer installation still runs')
 return {codex,messages,root,calls}
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

test('macOS selects the bundled Codex CLI for Intel and Apple Silicon',()=>{
 for(const [arch,directory] of [['x64','macos-x86_64'],['arm64','macos-aarch64']]){
  const result=install('darwin',false,false,{arch})
  assert.equal(result.codex[0].command,`/extension/bin/${directory}/codex`)
 }
})

test('macOS can install with the application CLI when code is missing from PATH',()=>{
 for(const userApplicationOnly of [false,true]){
  const result=install('darwin',false,false,{missingCode:true,userApplicationOnly})
  const directory=userApplicationOnly?'/Users/Mac User/Applications':'/Applications'
  const command=`${directory}/Visual Studio Code.app/Contents/Resources/app/bin/code`
  assert.ok(result.calls.some(call=>call.command===command&&call.args.includes('--version')))
  assert.ok(result.calls.some(call=>call.command===command&&call.args.includes('--locate-extension')))
  assert.ok(result.calls.some(call=>call.command===command&&call.args.includes('--install-extension')))
 }
})

test('macOS reports missing VS Code before installing dependencies or hooks',()=>{
 const result=install('darwin',false,false,{missingCode:true,noApplication:true,expectedFailure:true})
 assert.ok(result.messages.some(text=>text.includes("Install 'code' command in PATH")))
})

test('macOS does not replace a code command that fails with a permission error',()=>{
 install('darwin',false,false,{missingCode:true,codeError:'EACCES',expectedFailure:true})
})
