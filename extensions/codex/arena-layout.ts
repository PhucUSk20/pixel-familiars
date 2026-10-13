export type ArenaGroup='creation'|'unova'|'kalos'|'celestial'|'galar'
type Point={x:number;y:number}
/** Each group fills its own column; the outer bodies retain a small edge inset. */
export function groupPositions(width:number,group:ArenaGroup):[Point,Point,Point]{
 const upper=group==='celestial'||group==='galar'||group==='creation'
 const columns=3,index={unova:0,creation:1,kalos:2,celestial:0,galar:2}[group]
 const center=width*(index+.5)/columns-96,spread=width*(.5/columns-.085)
 return[{x:center-spread,y:upper?-290:-120},{x:center+spread,y:upper?-290:-120},{x:center,y:upper?-355:-185}]
}
export function placeGroup(pets:readonly Point[],width:number,group:ArenaGroup):void{const slots=groupPositions(width,group);pets.forEach((pet,i)=>Object.assign(pet,slots[i]))}
export function resizeGroup(pets:readonly Point[],oldWidth:number,newWidth:number):void{pets.forEach(pet=>{pet.x=(pet.x+96)*newWidth/oldWidth-96})}
