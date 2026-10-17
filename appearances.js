(function(root){
'use strict';
const STORAGE_KEY='ee-hackathon-20261018-appearances-v1',COUNT=6;
function createAppearanceStore({storage=null,random=Math.random}={}){
 const choices=new Map();let persistent=!!storage;
 const valid=n=>Number.isInteger(n)&&n>=0&&n<COUNT;
 try{const data=JSON.parse(storage?.getItem(STORAGE_KEY)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))for(const [id,value] of Object.entries(data))if(/^[1-9][0-9]*$/.test(id)&&Number.isSafeInteger(Number(id))&&valid(value))choices.set(id,value);}catch{}
 function save(){try{if(!storage)throw Error('storage unavailable');storage.setItem(STORAGE_KEY,JSON.stringify(Object.fromEntries(choices)));persistent=true;}catch{persistent=false;}}
 function get(id){const key=String(id);if(!choices.has(key)){choices.set(key,Math.floor(random()*COUNT));save();}return choices.get(key);}
 function set(id,value){if(!valid(value))throw Error('Invalid appearance');choices.set(String(id),value);save();return value;}
 function reroll(id){const current=get(id),next=Math.floor(random()*(COUNT-1));return set(id,next>=current?next+1:next);}
 return {get,set,reroll,get persistent(){return persistent;}};
}
const api={createAppearanceStore,STORAGE_KEY,COUNT};
if(typeof module==='object'&&module.exports)module.exports=api;else root.EEAppearances=api;
})(typeof window==='object'?window:globalThis);
