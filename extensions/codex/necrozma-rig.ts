import {CelestialTexture,type CelestialPose} from './sun-moon-rig'
import type {NecrozmaForm,NecrozmaLife} from './necrozma-life'
export class NecrozmaTexture extends CelestialTexture {
 constructor(readonly form:NecrozmaForm,source:Uint8ClampedArray){super(form==='dusk'?'solgaleo':'lunala',source)}
}
export function necrozmaPose(life:NecrozmaLife,clock?:number):CelestialPose {
 const stage=life.stage,t=(clock??(life.battle.active?life.battle.elapsed:life.elapsed))/1000,p=life.progress,charge=stage.endsWith('charge')||stage==='ultra-burst'?p:stage.endsWith('fire')?1:0
 return{wing:stage.startsWith('absorb')?-.45*p:life.form==='ultra'?-.3*charge+Math.sin(t*2)*.04:Math.sin(t*2)*.06-charge*.12,fold:0,mane:life.form==='dusk'?charge:0,head:life.form==='dusk'?charge*.27:-charge*.1,leg:-charge*.14,tail:Math.sin(t*1.8)*.08,lean:Math.sin(t)*.01,lift:Math.sin(t*1.7)*2}
}
