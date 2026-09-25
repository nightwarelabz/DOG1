import {WIDTH,HEIGHT,NODES,address,columnName,terrainAt,wrap} from './model.js';
export const COLORS={F1:'#adebbf',F2:'#b9b6f5',F3:'#efbb73'};
export const world=Array.from({length:WIDTH*HEIGHT},(_,i)=>{const x=i%WIDTH+.5,y=Math.floor(i/WIDTH)+.5;return {x,y,cell:address(x,y),...terrainAt(x,y)};});
export function drawMap(canvas,state,selectedCell=null) {
 const ctx=canvas.getContext('2d'),width=canvas.clientWidth;if(width<60)return;
 const dpr=window.devicePixelRatio||1,left=30,top=25,cell=(width-44)/WIDTH,height=top+HEIGHT*cell+24;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.height=height+'px';}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#091218';ctx.fillRect(0,0,width,height);
 const seen=new Set(state.visited),p=(x,y)=>({x:left+x*cell,y:top+y*cell});
 for(const c of world){const q=p(c.x-.5,c.y-.5);ctx.fillStyle=c.plateau?'#5c5130':c.region==='R0'?'#102631':c.region==='R1'?'#263f3d':c.region==='R2'?'#304939':'#373f50';ctx.fillRect(q.x+.7,q.y+.7,cell-1.4,cell-1.4);
  if(seen.has(c.cell)){ctx.fillStyle='#b9f7d015';ctx.fillRect(q.x+.7,q.y+.7,cell-1.4,cell-1.4);}
  if(cell>=19){ctx.font='8px ui-monospace,monospace';ctx.fillStyle='#a8c5b643';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.cell,q.x+cell/2,q.y+cell/2);}}
 ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#91aaab';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let x=0;x<WIDTH;x++)if(cell>=16||x%3===0||x===41)ctx.fillText(columnName(x),left+(x+.5)*cell,12);
 ctx.textAlign='right';for(let y=0;y<HEIGHT;y++)if(cell>=17||y%4===0||y===31)ctx.fillText(String(y+1),left-8,top+(y+.5)*cell);
 ctx.save();ctx.beginPath();ctx.rect(left,top,WIDTH*cell,HEIGHT*cell);ctx.clip();
 function segment(a,b,color,lineWidth=1){const base=Math.floor(a.ux/WIDTH)*WIDTH;for(const shift of [-WIDTH,0,WIDTH]){const q=p(a.ux-base+shift,a.y),r=p(b.ux-base+shift,b.y);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}}
 ctx.setLineDash([4,5]);for(let i=0;i<NODES.length;i++){const a=NODES[i],b=NODES[(i+1)%NODES.length];segment({ux:a.x,y:a.y},{ux:b.x+(b.x<a.x?WIDTH:0),y:b.y},'#a3cbd080',1.2);}ctx.setLineDash([]);
 for(const u of state.units)for(let i=1;i<u.trail.length;i++)segment(u.trail[i-1],u.trail[i],COLORS[u.faction]+'55',1.5);
 for(const n of NODES){const q=p(n.x,n.y);ctx.strokeStyle=n.refuel?'#d4eced':'#69888c';ctx.lineWidth=1.4;ctx.strokeRect(q.x-5,q.y-5,10,10);if(n.refuel){ctx.fillStyle='#cde5ea';ctx.fillRect(q.x-2,q.y-2,4,4);}ctx.font='10px ui-monospace,monospace';ctx.textAlign=q.x>width-80?'right':'left';ctx.fillStyle='#c2dfe0';ctx.fillText(n.id,q.x+(q.x>width-80?-9:9),q.y+13);}
 for(const t of state.tokens){if(t.status==='hidden')continue;const q=p(t.x,t.y),active=t.status==='identified';ctx.strokeStyle=active?'#f4c66e':'#799890';ctx.fillStyle=active?'#f4c66e':'#7da38d';ctx.lineWidth=1.5;
  if(active){ctx.beginPath();ctx.moveTo(q.x,q.y-6);ctx.lineTo(q.x+6,q.y);ctx.lineTo(q.x,q.y+6);ctx.lineTo(q.x-6,q.y);ctx.closePath();ctx.stroke();}
  else{ctx.beginPath();ctx.moveTo(q.x-4,q.y);ctx.lineTo(q.x-1,q.y+3);ctx.lineTo(q.x+5,q.y-4);ctx.stroke();}
  ctx.font='10px ui-monospace,monospace';ctx.textAlign=q.x>width-105?'right':'left';ctx.fillText(t.id+' '+t.cell,q.x+(q.x>width-105?-9:9),q.y-13);}
 for(const u of state.units){const q=p(u.x,u.y);ctx.fillStyle=COLORS[u.faction];ctx.strokeStyle=COLORS[u.faction];
  for(const shift of [-WIDTH*cell,0,WIDTH*cell]){ctx.beginPath();ctx.arc(q.x+shift,q.y,2*cell,0,Math.PI*2);ctx.strokeStyle=COLORS[u.faction]+'25';ctx.stroke();}
  ctx.beginPath();ctx.moveTo(q.x+7,q.y);ctx.lineTo(q.x-5,q.y-5);ctx.lineTo(q.x-5,q.y+5);ctx.closePath();ctx.fill();ctx.font='bold 11px ui-monospace,monospace';ctx.textAlign=q.x>width-50?'right':'left';ctx.fillText(u.id,q.x+(q.x>width-50?-10:10),q.y+17);
  if(u.state==='refueling'){ctx.strokeStyle=COLORS[u.faction];ctx.lineWidth=2;ctx.beginPath();ctx.arc(q.x,q.y,10,0,Math.PI*2*u.fuel/u.capacity);ctx.stroke();}}
 if(selectedCell){const c=world.find(c=>c.cell===selectedCell);if(c){const q=p(c.x-.5,c.y-.5);ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(q.x+1,q.y+1,cell-2,cell-2);}}
 ctx.restore();ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#8da7a3';ctx.textAlign='left';ctx.fillText('AP ↔ A',left,height-8);ctx.textAlign='right';ctx.fillText('42 × 32',width-15,height-8);
 canvas.setAttribute('aria-label',`DOG1 global grid. ${state.totals.activeT} active T-cells. ${state.totals.neutralized} synthetic tokens neutralized. ${selectedCell?'Selected '+selectedCell:''}`);
 return {left,top,cell};
}
