const assert=require('node:assert/strict');
const {createAppearanceStore,STORAGE_KEY}=require('../appearances.js');
let raw=null,calls=0;
const storage={getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,STORAGE_KEY);raw=value;}};
const store=createAppearanceStore({storage,random:()=>{calls++;return .99;}});
assert.equal(store.get(9),5);assert.equal(store.get(9),5);assert.equal(calls,1);
store.set(9,2);assert.equal(store.get(9),2);assert.equal(store.get(14),5);assert.equal(store.persistent,true);
assert.deepEqual(JSON.parse(raw),{'9':2,'14':5});
const reloaded=createAppearanceStore({storage,random:()=>{throw Error('saved choices must not rerandomize');}});assert.equal(reloaded.get(9),2);assert.equal(reloaded.get(14),5);
for(let current=0;current<6;current++)for(const random of [0,.3,.5,.999]){const s=createAppearanceStore({random:()=>random});s.set(1,current);const next=s.reroll(1);assert.notEqual(next,current);assert(next>=0&&next<6);}
raw='{broken';assert.equal(createAppearanceStore({storage,random:()=>0}).get(3),0);
raw='{"1":999,"2":null,"3":-1,"4":1.5,"5":4,"__proto__":0}';const validated=createAppearanceStore({storage,random:()=>0});for(const id of [1,2,3,4])assert.equal(validated.get(id),0);assert.equal(validated.get(5),4);
const blocked=createAppearanceStore({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},random:()=>.5});assert.equal(blocked.get(1),3);blocked.set(1,0);assert.equal(blocked.get(1),0);assert.equal(blocked.persistent,false);
console.log('Appearances: random initial choice, stable team IDs, reload persistence, different reroll, malformed/blocked storage passed.');
