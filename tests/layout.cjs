const assert=require('node:assert/strict');
const {arrangeFloor}=require('../layout.js');
assert.deepEqual(arrangeFloor([]),[]);
const names=['科研科创','校园学习生活','社会公益','游戏类','创意整活与数字文娱','待确认赛道'];
const scenarios=[[1],[50],[1,1],[22,2],[2,8,1],[2,11,7,6],[0,0,0,0,0],[2,8,0,1,2],[22,2,0,1,2],[10,10,10,10,10],[50,0,0,0,0],[0,60,0,0,0],[1,2,37,3,7],[25,25,25,25,25],[80,6,4,3,7],[11,12,13,14,15,4]];
let seed=7;for(let i=0;i<80;i++){const counts=[];for(let j=0;j<5;j++){seed=(seed*16807)%2147483647;counts.push(seed%31);}scenarios.push(counts);}
for(const counts of scenarios){
 const input=counts.map((n,i)=>({id:String(i+1),name:names[i],teamCount:n}));
 const layout=arrangeFloor(input),seats=layout.flatMap(t=>t.seats);
 assert.equal(seats.length,counts.reduce((a,b)=>a+b,0));assert.deepEqual(arrangeFloor(input),layout,'stable layout for repeated snapshots');
 for(const track of layout){assert.equal(track.seats.length,counts[Number(track.id)-1]);assert(track.scale>0&&track.scale<=1);
  for(const p of track.seats){assert(p.visible);assert(p.x-55*p.scale>=48-0.01&&p.x+55*p.scale<=1872+.01);assert(p.y-94*p.scale>=track.headerY+42);assert(p.y+58*p.scale<=1012+.01);}
 }
 for(let i=0;i<seats.length;i++)for(let j=i+1;j<seats.length;j++){const a=seats[i],b=seats[j];assert(Math.abs(a.x-b.x)>=55*(a.scale+b.scale)-.01||a.y+58*a.scale<=b.y-94*b.scale+.01||b.y+58*b.scale<=a.y-94*a.scale+.01,'overlap '+counts+': '+i+','+j);}
}
console.log('All-team layout: '+scenarios.length+' distributions, no hidden teams, overlap, clipping or ten-team cap.');
