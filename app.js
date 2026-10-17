(() => {
'use strict';
const $ = s => document.querySelector(s);
const W=1920,H=1080,canvas=$('#scene'),ctx=canvas.getContext('2d');
const GOLD='#e7b46a',PALE='#fff2dc',MUTED='#9b968a';
const state={layout:'tracks',time:0,last:0,frame:0,selected:null,hover:null,ready:false,live:false,stale:false,snapshot:null};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sprites=[];
const nf=new Intl.NumberFormat('en-US');
let appearanceStorage=null;try{appearanceStorage=window.localStorage;}catch{}
const appearances=window.EEAppearances.createAppearanceStore({storage:appearanceStorage});
// Real track membership and counts come from the questionnaire's sanitized snapshot.
const tracks=[
 {id:'research',name:'科研科创',x:360,headerY:284,firstY:400},
 {id:'campus',name:'校园学习生活',x:960,headerY:284,firstY:400},
 {id:'public-good',name:'社会公益',x:1560,headerY:284,firstY:400},
 {id:'games',name:'游戏类',x:660,headerY:674,firstY:790},
 {id:'creative',name:'创意整活与数字文娱',x:1260,headerY:674,firstY:790}
];
tracks.forEach((t,i)=>{t.sourceId=i+1;t.teamCount=0;t.peopleCount=0;});
const teams=[];
const statusOf=team=>team.activeRequests===null?'unknown':team.activeRequests>0?'active':'idle';
const fmt=n=>n===null?'—':nf.format(n);
const short=n=>n===null?'—':n<1000?String(n):n>=1e6?(n/1e6).toFixed(2)+'M':(n/1e3).toFixed(1)+'K';
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
 const arranged=window.EEFloorLayout.arrangeFloor(tracks);
 for(const track of tracks)Object.assign(track,arranged.find(t=>t.id===track.id));
 const cursors=new Map();
 return teams.map(team=>{
  const track=tracks.find(t=>t.id===team.trackId);
  const local=cursors.get(team.trackId)||0;cursors.set(team.trackId,local+1);
  return track.seats[local];
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
 ctx.fillRect(track.x-track.width/2,track.headerY-8,track.width,track.height);
 text(track.name,track.x,track.headerY,22,'#e8c68e','center',true);
 text(state.live?track.teamCount+' 组 · '+track.peopleCount+' 人':'等待登记数据',track.x,track.headerY+29,15,'#cbb68b');
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
ctx.save();ctx.translate(x,y);ctx.scale(p.scale,p.scale);ctx.save();ctx.scale(.8,.8);
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
text('第 '+String(team.id).padStart(2,'0')+' 组',4,labelY+11,12,'#cfc8b8');
text(short(team.tokens),-8,labelY+29,17,statusOf(team)==='active'?'#f1ce8b':'#c1bba9');
text('T',36,labelY+30,10,'#99866a');
line(0,labelY+42,0,-44,focus?'#e7b46a':'#6a5a3e');
if(focus){line(-35,57,35,57,'#f1cc84',2);}
ctx.restore();}
function draw(){if(!state.ready)return;ctx.drawImage(backdrop,0,0,W,H);
 for(const track of tracks)if(!track.teamCount)text(state.live?'暂无登记小组':'等待登记数据',track.x,track.headerY+62,12,'#6f706c');
 positions.forEach((p,i)=>{if(p.visible)station(teams[i],p,reduced?0:state.time,i);});}
function updateNumbers(){
 const totals=state.snapshot?.totals;
 $('#total-tokens').textContent=totals?short(totals.totalTokens):'0';
 $('#total-teams').textContent=totals?String(totals.teamCount):'—';
 $('#total-people').textContent=totals?String(totals.peopleCount):'—';
 $('#tokens-caption').textContent=!state.snapshot?.usageEnabled?'累计 TOKENS · 开场后同步':totals.knownUsageTeams<totals.teamCount?'累计 TOKENS · 已知部分':totals.staleTeams?'累计 TOKENS · 含待更新数据':'累计 TOKENS';
 if(state.selected!==null)detail(state.selected,false);
}
function detail(index,show=true){
 state.selected=index;const t=teams[index];
 $('#detail-name').textContent=t.name;
 $('#detail-track').textContent=tracks.find(track=>track.id===t.trackId).name+' · '+t.peopleCount+' 人 · 第 '+t.id+' 组';
 $('#detail-state').textContent=statusOf(t)==='unknown'?'● 实时请求状态未知':statusOf(t)==='active'?'● API 请求进行中':'● 休息';
 $('#detail-tokens').textContent=fmt(t.tokens);
 updateAppearancePicker(t);
 const notes={held:'开场且后台开放 API 发放后同步，当前按要求显示 0。',unassigned:'本组尚未分配 API，当前显示 0。',pending:'等待首次有效用量，请稍后。',stale:'查询暂未更新，保留上次有效累计值。',invalid:'已分配密钥暂时无法查询。',unsupported:'该 API 来源暂未接入用量统计。',limited:'上游查询限流，等待重试。',error:'上游查询失败，等待重试。',ok:'密钥自上游记录以来的累计 Token；实时并发暂未接入。'};
 $('.detail-note').textContent=(notes[t.usageState]||'等待同步')+(t.updatedAt?' 更新：'+new Date(t.updatedAt).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'');
 if(show){$('#detail').hidden=false;$('#team-select').value=String(index);$('#close-detail').focus();}
 draw();
}
function close(){state.selected=null;$('#detail').hidden=true;$('#team-select').value='';draw();}
function updateAppearancePicker(team){
 for(const button of document.querySelectorAll('.appearance-choice'))button.setAttribute('aria-pressed',String(Number(button.dataset.sprite)===team.sprite));
 $('#appearance-current').textContent='形象 '+String(team.sprite+1).padStart(2,'0');
 $('#appearance-save').textContent=appearances.persistent?'已记住形象 · 仅保存在当前浏览器':'本次页面内有效 · 浏览器未允许保存';
}
function changeAppearance(value){
 const team=teams[state.selected];if(!team)return;
 team.sprite=value==='random'?appearances.reroll(team.id):appearances.set(team.id,value);
 updateAppearancePicker(team);draw();
 $('#appearance-feedback').textContent='第 '+team.id+' 组已切换为形象 '+(team.sprite+1)+(appearances.persistent?'，已保存':'，仅本次页面有效');
}
function buildAppearancePicker(){
 const grid=$('#appearance-options');
 sprites.forEach((source,index)=>{
  const button=document.createElement('button');button.type='button';button.className='appearance-choice';button.dataset.sprite=String(index);button.setAttribute('aria-label','切换为形象 '+(index+1));button.setAttribute('aria-pressed','false');
  const preview=document.createElement('canvas');preview.width=48;preview.height=96;preview.setAttribute('aria-hidden','true');const c=preview.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(source,16,64,16,32,0,0,48,96);
  const label=document.createElement('span');label.textContent=String(index+1).padStart(2,'0');button.append(preview,label);button.addEventListener('click',()=>changeAppearance(index));grid.append(button);
 });
 if(state.selected!==null)updateAppearancePicker(teams[state.selected]);
}
$('#appearance-random').addEventListener('click',()=>changeAppearance('random'));
function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};}
function hit(event){const p=point(event);return positions.findIndex(v=>Math.abs(p.x-v.x)<55*v.scale&&p.y>v.y-94*v.scale&&p.y<v.y+57*v.scale);}
canvas.addEventListener('click',e=>{const i=hit(e);if(i>=0)detail(i);else close();});canvas.addEventListener('mousemove',e=>{const i=hit(e);state.hover=i>=0?i:null;canvas.style.cursor=i>=0?'pointer':'default';if(state.frame===0||reduced)draw();});canvas.addEventListener('mouseleave',()=>{state.hover=null;draw();});
$('#close-detail').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
function rebuildSelect(){const select=$('#team-select');select.replaceChildren(new Option('查看小组…',''));teams.forEach((t,i)=>select.append(new Option('第 '+t.id+' 组 · '+t.name,i)));select.value=state.selected===null?'':String(state.selected);}
$('#team-select').addEventListener('change',e=>{if(e.target.value!=='')detail(Number(e.target.value));else close();});
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
function frame(now){
 if(document.hidden){state.frame=0;state.last=0;return;}
 const delta=Math.min(100,Math.max(0,now-state.last));state.last=now;state.time+=delta;draw();
 if(teams.some(team=>team.activeRequests>0))state.frame=requestAnimationFrame(frame);else state.frame=0;
}
function animateActiveRequests(){
 if(!state.frame&&teams.some(team=>team.activeRequests>0)){state.last=0;state.frame=requestAnimationFrame(frame);}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock();animateActiveRequests();}});
function applySnapshot(data){
 if(data?.version!==1||!Array.isArray(data.teams)||!Array.isArray(data.tracks)||!data.totals||!data.tracks.length||data.tracks.length>6)throw Error('snapshot');
 const ids=new Set(),trackIds=new Set(data.tracks.map(t=>t.id));
 for(const t of data.teams){if(!Number.isSafeInteger(t.id)||ids.has(t.id)||!trackIds.has(t.trackId)||typeof t.displayName!=='string'||!Number.isSafeInteger(t.peopleCount)||t.peopleCount<0||!(t.totalTokens===null||typeof t.totalTokens==='number'&&Number.isFinite(t.totalTokens)&&t.totalTokens>=0))throw Error('snapshot');ids.add(t.id);}
 const previousId=teams[state.selected]?.id;
 tracks.splice(0,tracks.length,...data.tracks.map(t=>({...t,sourceId:t.id,id:String(t.id),teamCount:data.teams.filter(team=>team.trackId===t.id).length})));
 teams.splice(0,teams.length,...data.teams.map(t=>({id:t.id,name:t.displayName,trackId:String(t.trackId),peopleCount:t.peopleCount,tokens:t.totalTokens,activeRequests:t.activeRequests===0?0:null,usageState:t.usageState,updatedAt:t.updatedAt,sprite:appearances.get(t.id),phase:0})));
 state.snapshot=data;state.live=true;state.stale=false;state.selected=previousId===undefined?null:teams.findIndex(t=>t.id===previousId);if(state.selected===-1){state.selected=null;$('#detail').hidden=true;}state.hover=null;
 $('.demo-label').textContent='LIVE / 真实登记';positions=makePositions();rebuildSelect();updateNumbers();if(state.ready){buildBackdrop();draw();}
 const pending=data.totals.teamCount-data.totals.knownUsageTeams;
 $('#sync').textContent='问卷同步 '+new Date(data.generatedAt).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+(data.usageEnabled?' · Token 约 30 秒/轮'+(pending?' · '+pending+' 组待同步':'')+(data.totals.staleTeams?' · '+data.totals.staleTeams+' 组待更新':''):' · Token 待开场与发放');
}
async function poll(){
 if(!document.hidden)try{const r=await fetch('https://wenjuan.leftseinem.dpdns.org/api/live-floor',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP');applySnapshot(await r.json());}
 catch{state.stale=true;$('#sync').textContent=state.live?'连接暂未更新 · 保留上次数据':'等待连接问卷系统 · 当前 Token 为 0';$('.demo-label').textContent=state.live?'LIVE / 数据待更新':'LIVE / 等待连接';}
 setTimeout(poll,10000);
}
async function load(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('无法载入 '+src));img.src=src;});}
fit();addEventListener('resize',fit);clock();setInterval(clock,250);updateNumbers();positions=makePositions();
Promise.all([Promise.all(Array.from({length:6},(_,i)=>load('./assets/characters/char_'+i+'.png'))),load('./assets/gold-planet.webp')]).then(([chars,bg])=>{sprites.push(...chars);buildAppearancePicker();planet=bg;state.ready=true;buildBackdrop();draw();$('#load-status').hidden=true;state.last=performance.now();requestAnimationFrame(frame);}).catch(e=>{$('#load-status').textContent=e.message+'。请刷新页面重试。';});
poll();
// Read-only debug surface supports layout and arithmetic QA without exposing credentials.
window.EEDemo={snapshot:()=>({ready:state.ready,layout:state.layout,live:state.live,stale:state.stale,peopleCount:state.snapshot?.totals.peopleCount??null,
 tracks:tracks.map(track=>({...track,teamCount:teams.filter(t=>t.trackId===track.id).length})),
 teams:teams.map(t=>({...t,status:statusOf(t)})),positions:positions.map(p=>({...p})),
 totalTokens:teams.reduce((sum,t)=>sum+t.tokens,0)})};
})();
