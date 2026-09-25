import {Dog1,address,parseAddress,terrainAt,NODES} from './model.js';
import {drawMap,COLORS} from './map.js';
const $=id=>document.getElementById(id);
let simulation=new Dog1(),selected='N1',running=false,last=0,credit=0,frame=0,geometry;
const units=new Map();
function say(message){$('message').textContent=message;}
function render(){
 const s=simulation.snapshot();geometry=drawMap($('map'),s,selected);
 $('status').textContent=running?'RUNNING':simulation.tick>=simulation.limit?'RUN COMPLETE':simulation.tick?'PAUSED':'READY';
 $('run').textContent=running?'Pause':simulation.tick>=simulation.limit?'Run again':simulation.tick?'Resume':'Run DOG1';
 $('tcells').textContent=s.totals.activeT;$('cleared').textContent=s.totals.neutralized;$('distance').textContent=s.totals.distance.toFixed(1);$('refuels').textContent=s.totals.refuels;
 $('tick').textContent=`STEP ${s.tick.toFixed(0)} / ${s.limit}`;$('cell-title').textContent=selected;
 const c=parseAddress(selected),terrain=terrainAt(c.x,c.y),token=s.tokens.find(t=>t.cell===selected&&t.status==='identified'),station=NODES.find(n=>n.cell===selected);
 const rows=[['Type',token?'T-cell':'A-cell'],['Region',terrain.region],['Plateau',terrain.plateauId||'—'],['Node',station?station.id+(station.refuel?' / refuel':''):'—']];
 if(token)rows.push(['Token',token.id],['Allegiance',token.faction],['Defense',token.defense+' points']);
 $('cell-details').replaceChildren(...rows.map(([key,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;div.append(dt,dd);return div;}));
 for(const u of s.units){let el=units.get(u.id);if(!el){el=document.createElement('div');el.className='unit';el.innerHTML='<div><strong></strong><div class="details"></div></div><label>Power <input type="number" min="0" max="9" step="1"></label><div class="fuel"><span></span></div>';const input=el.querySelector('input');input.setAttribute('aria-label',u.id+' abstract power');input.value=u.power;input.addEventListener('change',()=>{try{simulation.setPower(u.id,Number(input.value));say('');render();}catch(e){say(e.message);input.value=simulation.units.find(x=>x.id===u.id).power;}});el.style.setProperty('--faction',COLORS[u.faction]);$('units').append(el);units.set(u.id,el);}
  if(document.activeElement!==el.querySelector('input'))el.querySelector('input').value=u.power;el.querySelector('strong').textContent=`${u.id} / ${u.faction} / ${u.cell}`;el.querySelector('.details').textContent=`${u.speed.toFixed(2)} cells/step · ${u.distance.toFixed(1)} travelled\n→ ${u.nextCell}: ${u.legRemaining.toFixed(1)} cells remaining\n${u.fuel.toFixed(1)}/${u.capacity} fuel · ${u.lap} circuits · ${u.state}`;el.querySelector('.fuel span').style.transform=`scaleX(${u.fuel/u.capacity})`;}
 $('tokens').replaceChildren(...s.tokens.filter(t=>t.status!=='hidden').map(t=>{const tr=document.createElement('tr');for(const value of [t.id,t.cell,t.faction,t.defense,t.status]){const td=document.createElement('td');td.textContent=value;tr.append(td);}tr.className=t.status;tr.addEventListener('click',()=>{selected=t.cell;$('lookup').value=selected;render();});return tr;}));
 $('events').replaceChildren(...s.events.slice(-7).reverse().map(e=>{const p=document.createElement('p');p.textContent=`${e.tick.toFixed(0).padStart(3,'0')}  ${e.unit}  ${e.type}  ${e.token||e.node||''} ${e.cell||''}`;return p;}));
}
function pause(){running=false;cancelAnimationFrame(frame);render();}
function reset(){pause();simulation=new Dog1({speedScale:Number($('allocation').value)});credit=0;units.clear();$('units').replaceChildren();say('');render();}
function animate(now){if(!running)return;credit+=Math.min(200,now-last)/500*Number($('playback').value);last=now;while(credit>=.1){simulation.step(.1);credit-=.1;if(simulation.tick>=simulation.limit){pause();return;}}render();frame=requestAnimationFrame(animate);}
$('run').addEventListener('click',()=>{if(running){pause();return;}if(simulation.tick>=simulation.limit)reset();running=true;last=performance.now();frame=requestAnimationFrame(animate);render();});
$('reset').addEventListener('click',reset);$('allocation').addEventListener('change',()=>{simulation.setSpeed(Number($('allocation').value));render();});
function lookup(){try{const value=$('lookup').value.trim().toUpperCase();parseAddress(value);selected=value;$('lookup').value=value;say('');render();}catch(e){say(e.message);}}
$('find').addEventListener('click',lookup);$('lookup').addEventListener('keydown',e=>{if(e.key==='Enter')lookup();});
$('map').addEventListener('click',e=>{if(!geometry)return;const box=$('map').getBoundingClientRect(),x=(e.clientX-box.left-geometry.left)/geometry.cell,y=(e.clientY-box.top-geometry.top)/geometry.cell;if(x<0||x>=42||y<0||y>=32)return;selected=address(x,y);$('lookup').value=selected;render();});
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(simulation.snapshot(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='DOG1-state.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
new ResizeObserver(render).observe($('map').parentElement);document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause();});
window.DOG1={get simulation(){return simulation;},render,pause};render();
