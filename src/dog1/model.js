// DOG1 is a fictional tabletop model. All distances, fuel and power are abstract game units.
export const WIDTH = 42, HEIGHT = 32;
export const wrap = x => ((x % WIDTH) + WIDTH) % WIDTH;
export function columnName(index) {
  if (!Number.isInteger(index) || index < 0 || index >= WIDTH) throw new Error('Column outside A–AP');
  let n = index + 1, label = '';
  while (n) { n--; label = String.fromCharCode(65 + n % 26) + label; n = Math.floor(n / 26); }
  return label;
}
export function address(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || y < 0 || y >= HEIGHT) throw new Error('Invalid cell position');
  return columnName(Math.floor(wrap(x))) + (Math.floor(y) + 1);
}
export function parseAddress(value) {
  const match = /^([A-Z]{1,2})([1-9]|[12][0-9]|3[0-2])$/.exec(value);
  if (!match) throw new Error('Use a cell address from A1 to AP32');
  let col = 0; for (const letter of match[1]) col = col * 26 + letter.charCodeAt(0) - 64;
  if (col > WIDTH) throw new Error('Column outside A–AP');
  return { x: col - .5, y: Number(match[2]) - .5 };
}
export function wrappedDistance(a, b) {
  const dx = Math.abs(wrap(a.x) - wrap(b.x));
  return Math.hypot(Math.min(dx, WIDTH - dx), a.y - b.y);
}
export function tileDistance(a, b) {
  const dx = Math.abs(Math.floor(wrap(a.x)) - Math.floor(wrap(b.x)));
  return Math.max(Math.min(dx, WIDTH - dx), Math.abs(Math.floor(a.y) - Math.floor(b.y)));
}
function ellipse(x, y, cx, cy, rx, ry) { return ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1; }
export function terrainAt(x, y) {
  x = wrap(x);
  const region = ellipse(x,y,8,11,7,8) || ellipse(x,y,11,21,4,7) ? 'R1' :
    ellipse(x,y,23,9,8,5) || ellipse(x,y,23,18,5,8) ? 'R2' :
    ellipse(x,y,35,17,5,10) || ellipse(x,y,39,26,3,3) ? 'R3' : 'R0';
  const plateau = region !== 'R0' && (ellipse(x,y,8,10,3,3) || ellipse(x,y,23,17,2,3) || ellipse(x,y,35,16,2,4));
  return { region, plateau, plateauId: plateau ? 'P'+region.slice(1) : null };
}
export const NODE_CELLS = ['B14','H9','N12','U17','AB21','AI16','AO12'];
export const NODES = NODE_CELLS.map((cell,i)=>({id:'N'+(i+1),cell,...parseAddress(cell),refuel:[0,2,4,6].includes(i)}));
export const FACTIONS = ['F1','F2','F3'];
const TOKEN_CELLS = ['E11','H10','J10','N13','Q14','U17','X19','AB21','AE19','AI16','AK15','AO12','A13'];
export function makeTokens() {
  return TOKEN_CELLS.map((cell,i)=>({id:'T'+(i+1),cell,...parseAddress(cell),faction:FACTIONS[i%3],
    defense:2+i%5,status:'hidden',discoveredAt:null,neutralizedAt:null,by:null,...terrainAt(...Object.values(parseAddress(cell)))}));
}
// This rule only removes a synthetic tabletop token. It does not model weapons, damage, or people.
export function interaction(unit, token) {
  if (token.status === 'neutralized') return { allowed:false, reason:'already-cleared' };
  if (token.status === 'hidden') return { allowed:false, reason:'unseen' };
  if (unit.faction === token.faction) return { allowed:false, reason:'same-allegiance' };
  if (tileDistance(unit, token) > 1) return { allowed:false, reason:'position' };
  if (unit.power < token.defense) return { allowed:false, reason:'power' };
  return { allowed:true, reason:'abstract-game-rule' };
}
export class Dog1 {
  constructor({ speedScale=1, limit=240 }={}) {
    if (!Number.isFinite(speedScale) || speedScale < .5 || speedScale > 2) throw new Error('Speed allocation must be 0.5–2');
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid run length');
    this.tick=0;this.limit=limit;this.speedScale=speedScale;this.tokens=makeTokens();this.events=[];this.history=[];this.visited=new Set();
    this.units=[0,2,4,6].map((start,i)=>{
      const n=NODES[start];return { id:'M'+(i+1), faction:FACTIONS[i%3], x:n.x,y:n.y,ux:n.x,startUx:n.x,
        baseSpeed:[.56,.70,.84,.98][i],power:[4,6,3,5][i],capacity:34,fuel:34,fuelUsed:0,fuelAdded:0,
        distance:0,next:(start+1)%NODES.length,state:'moving',refuels:0,lap:0,trail:[],inspection:null };
    });
  }
  setSpeed(value) { if (!Number.isFinite(value)||value<.5||value>2)throw new Error('Speed allocation must be 0.5–2');this.speedScale=value; }
  setPower(id,value) {
    const unit=this.units.find(u=>u.id===id);
    if(!unit||!Number.isInteger(value)||value<0||value>9)throw new Error('Use a unit ID and 0–9 game power points');
    unit.power=value;this.event('power-allocation',unit,{value});
  }
  event(type,unit,extra={}) { this.events.push({tick:this.tick,type,unit:unit.id,...extra}); }
  nextPoint(unit) {
    const node=NODES[unit.next];let ux=node.x+Math.floor(unit.ux/WIDTH)*WIDTH;
    if (ux < unit.ux-1e-8) ux+=WIDTH;
    return {...node,ux};
  }
  scanAndInteract(unit) {
    const col=Math.floor(unit.x),row=Math.floor(unit.y);
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(dx*dx+dy*dy<=4&&row+dy>=0&&row+dy<HEIGHT)this.visited.add(address(col+dx+.5,row+dy+.5));
    for(const token of this.tokens) {
      // A fixed two-cell reveal radius is a tabletop visibility rule, not a sensor-performance model.
      if(token.status==='hidden'&&wrappedDistance(unit,token)<=2){token.status='identified';token.discoveredAt=this.tick;this.event('identify',unit,{token:token.id,cell:token.cell});}
      if(token.status!=='identified'||tileDistance(unit,token)>1)continue;
      const rule=interaction(unit,token);unit.inspection={token:token.id,...rule};
      if(rule.allowed){token.status='neutralized';token.neutralizedAt=this.tick;token.by=unit.id;this.event('neutralize',unit,{token:token.id,cell:token.cell,unitCell:address(unit.x,unit.y),faction:unit.faction,tokenFaction:token.faction,power:unit.power,defense:token.defense});}
    }
  }
  moveUnit(unit, dt) {
    let remaining=dt;unit.inspection=null;
    // Continuous integration is split at refuelling and waypoint boundaries.
    while(remaining>1e-9) {
      if(unit.state==='stranded')break;
      if(unit.state==='refueling') {
        const missing=unit.capacity-unit.fuel,used=Math.min(remaining,missing/5),added=used*5;
        unit.fuel+=added;unit.fuelAdded+=added;remaining-=used;
        if(unit.fuel>=unit.capacity-1e-8){unit.fuel=unit.capacity;unit.state='moving';unit.refuels++;this.event('refuel-complete',unit);}
        else break;
        continue;
      }
      const goal=this.nextPoint(unit),d=Math.hypot(goal.ux-unit.ux,goal.y-unit.y),speed=unit.baseSpeed*this.speedScale;
      if(d<1e-8){
        unit.next=(unit.next+1)%NODES.length;
        if(goal.refuel && unit.fuel<unit.capacity-1e-8){unit.state='refueling';this.event('refuel-start',unit,{node:goal.id,cell:goal.cell});}
        continue;
      }
      if(unit.fuel<=1e-9){unit.state='stranded';this.event('fuel-empty',unit);break;}
      // Small spatial steps ensure token interaction and visibility never jump over cells.
      const travelled=Math.min(d,speed*remaining,unit.fuel,.15),used=travelled/speed;
      unit.ux+=(goal.ux-unit.ux)/d*travelled;unit.y+=(goal.y-unit.y)/d*travelled;unit.x=wrap(unit.ux);
      unit.distance+=travelled;unit.fuel-=travelled;unit.fuelUsed+=travelled;remaining-=used;
      unit.lap=Math.floor((unit.ux-unit.startUx+1e-8)/WIDTH);this.scanAndInteract(unit);
    }
    unit.trail.push({ux:unit.ux,y:unit.y});if(unit.trail.length>96)unit.trail.shift();
  }
  step(dt=1) {
    if (!Number.isFinite(dt)||dt<=0||dt>1)throw new Error('Step duration must be greater than 0 and at most 1');
    if(this.tick>=this.limit)return false;
    dt=Math.min(dt,this.limit-this.tick);this.tick+=dt;
    for(const unit of this.units)this.moveUnit(unit,dt);
    if(this.events.length>512)this.events.splice(0,this.events.length-512);
    return true;
  }
  run(steps=this.limit) { for(let n=0;n<steps;n++)if(!this.step())break;return this; }
  cells() {
    // The public map exposes only identified tokens; hidden ones remain A-cells until revealed.
    const active=new Map(this.tokens.filter(t=>t.status==='identified').map(t=>[t.cell,t]));
    return Array.from({length:WIDTH*HEIGHT},(_,i)=>{const x=i%WIDTH+.5,y=Math.floor(i/WIDTH)+.5,cell=address(x,y),token=active.get(cell);
      return {cell,x,y,kind:token?'T':'A',token:token?.id??null,visited:this.visited.has(cell),...terrainAt(x,y)};});
  }
  snapshot() {
    return {format:'DOG1/game-v1',tick:this.tick,limit:this.limit,speedScale:this.speedScale,
      units:this.units.map(u=>({...u,trail:u.trail.map(p=>({...p})),cell:address(u.x,u.y),nextCell:NODES[u.next].cell,
        legRemaining:Math.hypot(this.nextPoint(u).ux-u.ux,this.nextPoint(u).y-u.y),speed:u.baseSpeed*this.speedScale})),
      tokens:this.tokens.map(t=>({...t})),events:this.events.slice(-12),visited:[...this.visited],
      totals:{identified:this.tokens.filter(t=>t.status!=='hidden').length,neutralized:this.tokens.filter(t=>t.status==='neutralized').length,
        activeT:this.tokens.filter(t=>t.status==='identified').length,areaCells:WIDTH*HEIGHT-this.tokens.filter(t=>t.status==='identified').length,
        distance:this.units.reduce((n,u)=>n+u.distance,0),refuels:this.units.reduce((n,u)=>n+u.refuels,0)},
      scope:'Fictional tabletop world; cell distances, fuel and power points have no real-world calibration. Plateau terrain does not establish allegiance.'};
  }
}
