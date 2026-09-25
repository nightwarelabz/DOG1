import test from 'node:test';
import assert from 'node:assert/strict';
import {Dog1,address,parseAddress,interaction,wrappedDistance,NODES} from '../src/dog1/model.js';
test('DOG1 addresses uniquely cover A1 through AP32',()=>{
 const names=new Set();for(let y=0;y<32;y++)for(let x=0;x<42;x++){const id=address(x+.5,y+.5);names.add(id);assert.deepEqual(parseAddress(id),{x:x+.5,y:y+.5});}
 assert.equal(names.size,1344);assert.equal(address(41.5,31.5),'AP32');assert.equal(address(42.5,.5),'A1');assert.throws(()=>parseAddress('AQ1'));
});
test('DOG1 continuous motion respects speed, distance and fuel across the global seam',()=>{
 const sim=new Dog1({speedScale:2});let crossings=0;
 for(let n=0;n<240;n++){
  const before=sim.snapshot().units;sim.step();
  for(const [i,u] of sim.units.entries()){
   const p=before[i],travel=u.distance-p.distance;
   assert.ok(travel<=u.baseSpeed*2+1e-7);assert.ok(Math.abs(u.ux-p.ux)<=travel+1e-7);
   assert.ok(Math.abs(u.y-p.y)<=travel+1e-7);assert.ok(wrappedDistance(u,p)<=travel+1e-7);
   assert.ok(Math.abs(u.capacity-u.fuelUsed+u.fuelAdded-u.fuel)<1e-7);
   assert.ok(Math.abs(u.distance-u.fuelUsed)<1e-7);assert.ok(u.fuel>=-1e-9&&u.fuel<=u.capacity);
   if(u.x<p.x-20){crossings++;assert.ok(u.ux>p.ux);}
   if(u.state==='refueling')assert.ok(NODES.some(n=>n.refuel&&wrappedDistance(u,n)<1e-7));
  }
 }
 assert.ok(crossings>=4);assert.ok(sim.units.every(u=>u.refuels>0));
});
test('DOG1 refuelling consumes time; fuel exhaustion cannot teleport a unit',()=>{
 const sim=new Dog1().run(70);
 for(const u of sim.units)assert.ok(Math.abs(u.distance/u.baseSpeed+u.fuelAdded/5-sim.tick)<1e-6);
 const u=sim.units[0];u.fuel=0;u.state='moving';const position={x:u.x,y:u.y,ux:u.ux,distance:u.distance};sim.step();
 assert.equal(u.state,'stranded');for(const k of Object.keys(position))assert.equal(u[k],position[k]);
});
test('DOG1 token outcomes require position, opposing allegiance and sufficient abstract power',()=>{
 const unit={x:7.5,y:9.5,faction:'F1',power:4};const token={x:8.5,y:9.5,faction:'F2',defense:4,status:'identified',plateau:true};
 assert.equal(interaction(unit,token).allowed,true);
 assert.equal(interaction({...unit,x:5.5},token).reason,'position');
 assert.equal(interaction({...unit,power:3},token).reason,'power');
 assert.equal(interaction(unit,{...token,faction:'F1'}).reason,'same-allegiance');
 assert.equal(interaction(unit,{...token,status:'hidden'}).reason,'unseen');
 assert.equal(interaction(unit,{...token,status:'neutralized'}).reason,'already-cleared');
});
test('DOG1 separates visible T-cells from A-cells and retains uncleared tokens',()=>{
 const sim=new Dog1();assert.equal(sim.cells().filter(c=>c.kind==='T').length,0);sim.run();
 const snapshot=sim.snapshot();assert.equal(snapshot.totals.identified,13);assert.equal(snapshot.totals.neutralized,12);
 assert.equal(snapshot.totals.activeT,1);assert.equal(sim.cells().filter(c=>c.kind==='A').length,1343);
 const remaining=sim.tokens.find(t=>t.status==='identified');assert.equal(remaining.id,'T5');
 for(const e of sim.events.filter(e=>e.type==='neutralize')){assert.notEqual(e.faction,e.tokenFaction);assert.ok(e.power>=e.defense);}
 assert.throws(()=>sim.setPower('M1',10));assert.throws(()=>sim.setSpeed(3));
});
