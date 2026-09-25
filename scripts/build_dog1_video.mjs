import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {Dog1,NODES,terrainAt,address} from '../src/dog1/model.js';
const dir=path.resolve(process.argv[2]);await mkdir(dir,{recursive:true});
const sim=new Dog1(),frames=[],audio=[];let changed=false,previousEvents=0;
for(let frame=0;frame<=1200;frame++){
 if(frame){if(!changed&&sim.tick>=120-1e-6){sim.setPower('M1',6);changed=true;}sim.step(.2);}
 const state=sim.snapshot();state.units=state.units.map(u=>({...u,trail:u.trail.slice(-48)}));frames.push(state);
 for(const event of sim.events.slice(previousEvents))if(['identify','neutralize','refuel-start','power-allocation'].includes(event.type))audio.push({time:3+event.tick/4.8,type:event.type,unit:event.unit,token:event.token});
 previousEvents=sim.events.length;
}
const terrain=Array.from({length:1344},(_,i)=>{const x=i%42+.5,y=Math.floor(i/42)+.5;return {x,y,cell:address(x,y),...terrainAt(x,y)};});
const result={format:'DOG1/video-v1',duration:60,fps:24,intro:3,stepsPerSecond:4.8,frames,nodes:NODES,terrain,audio,
 notes:'Fictional tabletop game. M1 receives a scripted power allocation from 4 to 6 at step 120. Continuous movement is integrated at 0.2-step intervals. Terrain never determines allegiance.'};
await writeFile(path.join(dir,'frames.json'),JSON.stringify(result));
await writeFile(path.join(dir,'manifest.json'),JSON.stringify({format:result.format,duration:60,fps:24,width:1920,height:1080,notes:result.notes,final:frames.at(-1),audio},null,2)+'\n');
console.log(JSON.stringify({frames:frames.length,final:frames.at(-1).totals,allocation:changed,audioEvents:audio.length}));
