/* Fit every registered team into the open floor; no seat cap or pagination. */
(function(root){
'use strict';
function arrangeFloor(tracks){
 const left=48,top=274,width=1824,height=738,gap=24,heading=58;
 const pitchX=116,pitchY=164,deskHeight=153;
 const count=t=>Math.max(0,Math.floor(t.teamCount||0));
 const minWidth=t=>Math.max(210,Array.from(t.name||'').reduce((n,c)=>n+(c.charCodeAt(0)>255?22:12),0)+24);
 function band(group,scale){
  const maxCount=Math.max(0,...group.map(count));
  for(let rows=maxCount?1:0;rows<=maxCount;rows++){
   const columns=group.map(t=>rows?Math.ceil(count(t)/rows):0);
   const widths=group.map((t,i)=>Math.max(minWidth(t),columns[i]*pitchX*scale));
   const used=widths.reduce((a,b)=>a+b,0)+gap*(group.length-1);
   if(used<=width+.001)return {group,rows,columns,widths,width:used,height:heading+(rows?((rows-1)*pitchY+deskHeight)*scale:40)};
  }
  return null;
 }
 const preferred=Math.ceil(tracks.length/2),splits=[preferred,...Array.from({length:tracks.length-1},(_,i)=>i+1).filter(i=>i!==preferred),tracks.length];
 let best=null;
 for(const split of splits){
  const groups=split===tracks.length?[tracks]:[tracks.slice(0,split),tracks.slice(split)];
  const fit=scale=>{const bands=groups.map(g=>band(g,scale));return bands.every(Boolean)&&bands.reduce((n,b)=>n+b.height,0)+gap*(bands.length-1)<=height?bands:null;};
  let low=0,high=1;for(let i=0;i<24;i++){const mid=(low+high)/2;if(fit(mid))low=mid;else high=mid;}
  const scale=fit(1)?1:low,bands=fit(scale);if(bands&&(!best||scale>best.scale+.0001))best={scale,bands};
 }
 if(!best)throw Error('Track headings do not fit floor');
 const result=[],scale=best.scale,totalHeight=best.bands.reduce((n,b)=>n+b.height,0);
 const bandGap=best.bands.length>1?(height-totalHeight)/(best.bands.length-1):0;
 let y=top;
 for(const b of best.bands){let x=left+(width-b.width)/2;
  b.group.forEach((t,i)=>{
   const center=x+b.widths[i]/2,cols=b.columns[i],seats=[];
   for(let j=0;j<count(t);j++){
    const row=Math.floor(j/cols),col=j%cols,inRow=Math.min(cols,count(t)-row*cols);
    seats.push({x:center+(col-(inRow-1)/2)*pitchX*scale,y:y+heading+94*scale+row*pitchY*scale,scale,flip:col>=(inRow/2),visible:true});
   }
   result.push({id:t.id,x:center,headerY:y+12,firstY:y+heading+94*scale,width:b.widths[i],height:b.height,scale,seats});x+=b.widths[i]+gap;
  });y+=b.height+bandGap;
 }
 return result;
}
if(typeof module==='object'&&module.exports)module.exports={arrangeFloor};
else root.EEFloorLayout={arrangeFloor};
})(typeof window==='object'?window:globalThis);
