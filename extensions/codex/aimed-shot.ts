export type ShotPoint = { x:number; y:number }
/** A ballistic shot locks the actual target and origin at release, then follows that line. */
export class AimedShot {
  origin?:ShotPoint
  target?:ShotPoint
  reset():void {this.origin=undefined;this.target=undefined}
  sample(elapsed:number,release:number,arrival:number,origin:ShotPoint,target:ShotPoint):ShotPoint|undefined {
    if(elapsed<release)return undefined
    if(!this.origin||!this.target){this.origin={...origin};this.target={...target}}
    const progress=Math.max(0,(elapsed-release)/(arrival-release))
    return {x:this.origin.x+(this.target.x-this.origin.x)*progress,y:this.origin.y+(this.target.y-this.origin.y)*progress}
  }
}
