(() => {
'use strict';
const $ = s => document.querySelector(s);
const W=1920,H=1080,canvas=$('#scene'),ctx=canvas.getContext('2d');
const GOLD='#e7b46a',PALE='#fff2dc',MUTED='#9b968a';
const state={layout:'tracks',paused:false,time:0,last:0,nextTick:1600,selected:null,hover:null,ready:false};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sprites=[];
const nf=new Intl.NumberFormat('en-US');
let seed=41016;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
// Official track names match checkin-system/track-data.mjs. Membership is demo-only.
const tracks=[
 {id:'research',name:'科研科创',x:360,headerY:284,firstY:400},
 {id:'campus',name:'校园学习生活',x:960,headerY:284,firstY:400},
 {id:'public-good',name:'社会公益',x:1560,headerY:284,firstY:400},
 {id:'games',name:'游戏类',x:660,headerY:674,firstY:790},
 {id:'creative',name:'创意整活与数字文娱',x:1260,headerY:674,firstY:790}
];
const teams=Array.from({length:50},(_,i)=>{
 const tokens=46000+Math.floor(random()*105000),activeRequests=i%5===0?0:1;
 return {id:i+1,name:'第 '+String(i+1).padStart(2,'0')+' 组',trackId:tracks[Math.floor(i/10)].id,
 tokens:i===9||i===49?0:tokens,activeRequests:i===9||i===49?0:activeRequests,
 endsAt:2500+random()*5000,sprite:(i+Math.floor(i/6)+Math.floor(i/12)*3)%6,phase:random()*15,pulse:0};
});
const statusOf=team=>team.activeRequests>0?'active':'idle';
const fmt=n=>nf.format(n);
const short=n=>n<1000?String(n):n>=1e6?(n/1e6).toFixed(2)+'M':(n/1e3).toFixed(1)+'K';
let positions=[];
function fit(){
 const scale=Math.min(innerWidth/W,innerHeight/H);
 $('#screen').style.transform='scale('+scale+')';
 // Render directly at the final screen's physical pixel density, including browser zoom.
 const ratio=scale*(window.devicePixelRatio||1);
 const width=Math.max(1,Math.round(W*ratio)),height=Math.max(1,Math.round(H*ratio));
 if(canvas.width!==width||canvas.height!==height){
  canvas.width=backdrop.width=width;canvas.height=backdrop.height=height;
  ctx.setTransform(width/W,0,0,height/H,0,0);
  ctx.imageSmoothingEnabled=false;
  if(state.ready){buildBackdrop();draw();}
 }
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function text(s,x,y,size,color=PALE,align='center',bold=false){ctx.fillStyle=color;ctx.font=(bold?'700 ':'')+size+'px "Microsoft YaHei",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function makePositions(){
 return teams.map(team=>{
  const track=tracks.find(t=>t.id===team.trackId);
  const local=teams.filter(t=>t.trackId===team.trackId).findIndex(t=>t.id===team.id);
  return {x:track.x+[-235,-125,0,125,235][local%5],y:track.firstY+Math.floor(local/5)*170,flip:local%5>=3};
 });
}
function speaker(x,y){rect(x,y,37,91,'#080a0c');rect(x+3,y+3,31,80,'#222426');for(let i=0;i<2;i++){ellipse(x+18,y+24+i*36,11,12,'#080a0b');ellipse(x+18,y+24+i*36,6,7,'#393a35');}rect(x+3,y+87,31,4,'#8e7044');}
let planet;
const backdrop=document.createElement('canvas');backdrop.width=W;backdrop.height=H;const bctx=backdrop.getContext('2d');
function buildBackdrop(){
ctx.clearRect(0,0,W,H);rect(0,0,W,H,'#090a0c');
const sky=ctx.createRadialGradient(980,165,0,980,165,850);sky.addColorStop(0,'#38291555');sky.addColorStop(1,'#090a0c00');ctx.fillStyle=sky;ctx.fillRect(0,0,W,650);
for(let i=0;i<95;i++){const x=(Math.sin(i*77.13)*.5+.5)*W,y=(Math.cos(i*3.72)*.5+.5)*265;rect(x,y,1+(i%4===0?1:0),1,i%5?'#96876a50':'#e7b46a66');}
line(48,94,1872,94,'#e7b46a32');
// Open venue: no perimeter frame, row boxes or enclosed track panels.
const floor=ctx.createLinearGradient(0,260,0,1020);
floor.addColorStop(0,'#10121500');floor.addColorStop(.2,'#14171b');floor.addColorStop(1,'#10121500');
ctx.fillStyle=floor;ctx.fillRect(0,260,W,760);
for(const track of tracks){
 const glow=ctx.createRadialGradient(track.x,track.firstY+100,20,track.x,track.firstY+100,310);
 glow.addColorStop(0,'#e7b46a06');glow.addColorStop(1,'#e7b46a00');ctx.fillStyle=glow;
 ctx.fillRect(track.x-300,track.headerY-8,600,355);
 text(track.name,track.x,track.headerY,22,'#e8c68e','center',true);
 text('TRACK 0'+(tracks.indexOf(track)+1),track.x-266,track.headerY,10,'#7b705d','left');
 text('10 组 · 演示分配',track.x+266,track.headerY,11,'#9c917d','right');
 line(track.x-25,track.headerY+16,track.x+25,track.headerY+16,'#b4945c70');
}
ctx.save();ctx.translate(0,34);ctx.scale(1,.73);
// Wide raised stage, large wall screen, podium and speaker stacks.
poly([[530,257],[1390,257],[1426,292],[494,292]],'#41403a','#b48c4c');rect(494,292,932,14,'#1d1d1b');line(494,292,1426,292,'#e7b46a',2);
rect(590,111,740,148,'#020303');ctx.save();ctx.beginPath();ctx.rect(596,117,728,136);ctx.clip();if(planet){ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.3;ctx.drawImage(planet,880,49,450,432);ctx.globalAlpha=1;}ctx.restore();
line(590,111,1330,111,'#e7b46a99');line(590,258,1330,258,'#e7b46a99');line(590,111,590,258,'#725d3c');line(1330,111,1330,258,'#725d3c');
// Countdown is crisp DOM text positioned over this stage screen.
for(let i=0;i<7;i++){rect(640+i*105,100,30,6,'#685c43');rect(647+i*105,106,16,3,'#eed5a3');}
speaker(539,172);speaker(1347,172);
ctx.save();ctx.translate(-300,0);
poly([[922,273],[998,273],[1007,296],[913,296]],'#242622','#80704b');rect(929,246,62,46,'#2d2f2b');rect(923,242,74,7,'#d4af6c');rect(932,255,56,2,'#8b774f');text('EE',960,274,19,GOLD,'center',true);line(966,242,968,226,'#c9c3b4',2);rect(965,223,9,4,'#747a78');
ctx.restore();
// Stage approach steps and side-room details.
rect(859,307,202,7,'#4e483b');rect(878,314,164,7,'#34332e');line(860,307,1060,307,'#c5a46d');
ctx.restore();


line(48,1024,1872,1024,'#e7b46a22');
bctx.clearRect(0,0,backdrop.width,backdrop.height);bctx.drawImage(canvas,0,0);
}
function character(team,x,y,t,flip=false,scale=3){const source=sprites[team.sprite];const f=statusOf(team)==='active'?3+Math.floor(t/230+team.phase)%2:1;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,f*16,64,16,32,-8*scale,-16*scale,16*scale,32*scale);ctx.restore();}
function station(team,p,t,index){const {x,y,flip}=p;const facing=flip?-1:1;const focus=index===state.selected||index===state.hover;
ctx.save();ctx.translate(x,y);ctx.save();ctx.scale(.8,.8);
ellipse(0,56,62,13,'#0005');
// Chair with legs and cushion, then character and desk in the same depth plane.
rect(-31*facing-12,24,25,21,'#454b50');rect(-31*facing-14,19,29,6,'#646a6d');rect(-31*facing-9,43,3,15,'#757b7e');rect(-31*facing+7,43,3,15,'#757b7e');
ctx.restore();
// Draw 16 × 32 sprites at a whole 3× size; furniture scaling must not soften them.
character(team,-24*facing,-4,t,flip,3);
ctx.save();ctx.scale(.8,.8);
const dx=flip?-69:-1;
rect(dx+5,37,5,27,'#596267');rect(dx+60,37,5,27,'#596267');rect(dx+5,61,9,3,'#92948a');rect(dx+57,61,9,3,'#92948a');
poly([[dx-3,26],[dx+67,26],[dx+75,36],[dx-9,36]],'#454b50','#747b7e');rect(dx-9,36,84,6,'#2e3439');line(dx-9,36,dx+75,36,'#d0b47a');
// Monitor and a subtly animated code editor.
rect(dx+33,15,4,15,'#737b78');rect(dx+23,28,24,3,'#868c7f');rect(dx+13,-12,46,30,'#080b0c');rect(dx+16,-9,40,24,statusOf(team)==='active'?'#263334':'#1b2426');rect(dx+16,-9,40,4,'#45504a');
for(let j=0;j<4;j++){const len=8+((team.id*3+j*7)%24);rect(dx+19+(j%2)*3,-2+j*4,len,2,j===1?'#cfb97c':j===2?'#8caca0':'#b6c1ac');}
if(statusOf(team)==='active'&&Math.floor(t/460+team.phase)%2===0)rect(dx+29,10,2,3,'#f0d28b');
rect(dx+2,29,23,4,'#8e9694');for(let i=0;i<5;i++)rect(dx+4+i*4,30,2,1,'#3b4444');
rect(dx+62,21,7,10,'#d5c9a7');rect(dx+64,19,3,2,'#8a7351');
ctx.restore();
// Group number and usage share one label, attached to this character by a short stem.
const labelY=-94;
rect(-52,labelY,104,42,focus?'#25211a':'#17191c');
rect(-43,labelY+9,4,4,statusOf(team)==='active'?GOLD:'#747c86');
text(team.name,4,labelY+11,12,'#cfc8b8');
text(short(team.tokens),-8,labelY+29,17,statusOf(team)==='active'?'#f1ce8b':'#c1bba9');
text('T',36,labelY+30,10,'#99866a');
line(0,labelY+42,0,-44,focus?'#e7b46a':'#6a5a3e');
if(focus){line(-35,57,35,57,'#f1cc84',2);}
ctx.restore();}
function draw(){if(!state.ready)return;ctx.drawImage(backdrop,0,0,W,H);positions.forEach((p,i)=>station(teams[i],p,reduced?0:state.time,i));}
function updateNumbers(){
 $('#total-tokens').textContent=short(teams.reduce((sum,t)=>sum+t.tokens,0));
 if(state.selected!==null)detail(state.selected,false);
}
function tick(){
 for(const team of teams){
  if(team.activeRequests>0)continue;
  if(random()<.22){team.activeRequests=1+Number(random()>.85);team.endsAt=state.time+2200+random()*4800;}
 }
 $('#sync').textContent='模拟更新 '+new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' · 非真实数据';
}
function completeRequests(){
 let changed=false;
 for(const team of teams){
  if(team.activeRequests>0&&state.time>=team.endsAt){
   team.tokens+=(160+Math.floor(random()*1150))*team.activeRequests;
   team.activeRequests=0;changed=true;
  }
 }
 if(changed)updateNumbers();
}
function detail(index,show=true){
 state.selected=index;const t=teams[index];
 $('#detail-name').textContent=t.name;
 $('#detail-track').textContent=tracks.find(track=>track.id===t.trackId).name+' · 演示归属';
 $('#detail-state').textContent=statusOf(t)==='active'?'● API 请求进行中 · 模拟':'● 休息 · 当前没有进行中的请求';
 $('#detail-tokens').textContent=fmt(t.tokens);
 if(show){$('#detail').hidden=false;$('#team-select').value=String(index);$('#close-detail').focus();}
 draw();
}
function close(){state.selected=null;$('#detail').hidden=true;$('#team-select').value='';draw();}
function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};}
function hit(event){const p=point(event);return positions.findIndex(v=>Math.abs(p.x-v.x)<55&&p.y>v.y-94&&p.y<v.y+57);}
canvas.addEventListener('click',e=>{const i=hit(e);if(i>=0)detail(i);else close();});canvas.addEventListener('mousemove',e=>{const i=hit(e);state.hover=i>=0?i:null;canvas.style.cursor=i>=0?'pointer':'default';if(state.paused||reduced)draw();});canvas.addEventListener('mouseleave',()=>{state.hover=null;draw();});
$('#close-detail').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
teams.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=t.name+' · '+tracks.find(track=>track.id===t.trackId).name;$('#team-select').append(o);});$('#team-select').addEventListener('change',e=>{if(e.target.value!=='')detail(Number(e.target.value));else close();});
$('#pause').addEventListener('click',e=>{state.paused=!state.paused;e.currentTarget.setAttribute('aria-pressed',String(state.paused));e.currentTarget.textContent=state.paused?'▶ 继续模拟':'Ⅱ 暂停模拟';});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#sync').textContent='请使用浏览器 F11 进入全屏';}});
function clock(){
 $('#clock').textContent=new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' CST';
 const timer=window.EECountdown.at();
 $('#countdown-label').textContent=timer.label;
 $('#countdown-time').textContent=timer.display;
 $('#countdown').dataset.phase=timer.phase;
 $('#countdown').classList.toggle('urgent',timer.urgent);
 $('#countdown-time').setAttribute('aria-label',timer.label+' '+timer.display);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)clock();});
function frame(now){const delta=Math.min(100,Math.max(0,now-state.last));state.last=now;if(!state.paused&&!document.hidden){state.time+=delta;completeRequests();if(state.time>=state.nextTick){tick();if(state.selected!==null)detail(state.selected,false);state.nextTick=state.time+1600;}draw();}requestAnimationFrame(frame);}
async function load(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('无法载入 '+src));img.src=src;});}
fit();addEventListener('resize',fit);clock();setInterval(clock,250);updateNumbers();positions=makePositions();
Promise.all([Promise.all(Array.from({length:6},(_,i)=>load('./assets/characters/char_'+i+'.png'))),load('./assets/gold-planet.webp')]).then(([chars,bg])=>{sprites.push(...chars);planet=bg;state.ready=true;buildBackdrop();draw();$('#load-status').hidden=true;state.last=performance.now();requestAnimationFrame(frame);}).catch(e=>{$('#load-status').textContent=e.message+'。请刷新页面重试。';});
// Read-only debug surface supports layout and arithmetic QA without exposing credentials.
window.EEDemo={snapshot:()=>({ready:state.ready,layout:state.layout,paused:state.paused,
 tracks:tracks.map(track=>({...track,teamCount:teams.filter(t=>t.trackId===track.id).length})),
 teams:teams.map(t=>({...t,status:statusOf(t)})),positions:positions.map(p=>({...p})),
 totalTokens:teams.reduce((sum,t)=>sum+t.tokens,0)})};
})();
