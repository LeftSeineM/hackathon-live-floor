(() => {
'use strict';
const $ = s => document.querySelector(s);
const W=1920,H=1080,canvas=$('#scene'),ctx=canvas.getContext('2d');
const GOLD='#e7b46a',PALE='#fff2dc',MUTED='#9b968a';
const state={layout:'auditorium',paused:false,time:0,last:0,nextTick:1600,selected:null,hover:null,ready:false};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sprites=[];
const nf=new Intl.NumberFormat('en-US');
let seed=41016;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const teams=Array.from({length:48},(_,i)=>{const input=34000+Math.floor(random()*73000),output=12000+Math.floor(random()*32000);return {id:i+1,name:'第 '+String(i+1).padStart(2,'0')+' 组',input,output,requests:28+Math.floor(random()*90),status:i%11===0?'idle':i%7===0?'thinking':'active',sprite:(i+Math.floor(i/6)+Math.floor(i/12)*3)%6,phase:random()*15,accent:i%3===0?'#d8b882':i%3===1?'#c6c9c6':'#a1aaa8',pulse:0};});
const fmt=n=>nf.format(n);
const short=n=>n>=1e6?(n/1e6).toFixed(2)+'M':(n/1e3).toFixed(1)+'K';
let positions=[];
function fit(){const scale=Math.min(innerWidth/W,innerHeight/H);$('#screen').style.transform='scale('+scale+')';}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function text(s,x,y,size,color=PALE,align='center',bold=false){ctx.fillStyle=color;ctx.font=(bold?'700 ':'')+size+'px "Microsoft YaHei",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function makePositions(){const p=[];if(state.layout==='auditorium'){for(let r=0;r<4;r++)for(let c=0;c<12;c++){p.push({x:363+Math.floor(c/4)*595+[-210,-78,78,210][c%4],y:395+r*161,flip:c%4>=2});}}
else {const offsets=[[-210,-64],[-78,-64],[78,-64],[210,-64],[-210,94],[-78,94],[78,94],[210,94]];for(let r=0;r<2;r++)for(let c=0;c<3;c++)for(const [x,y] of offsets)p.push({x:363+c*595+x,y:447+r*327+y,flip:x>0});}return p;}
function plant(x,y){ellipse(x,y+14,27,8,'#0007');rect(x-12,y-6,24,22,'#282a27');rect(x-14,y-8,28,5,'#62634f');line(x,y-6,x,y-49,'#736c49',3);poly([[x,y-20],[x-25,y-43],[x-18,y-57],[x-4,y-39]],'#555d49');poly([[x,y-30],[x+16,y-62],[x+27,y-52],[x+9,y-26]],'#737b5d');poly([[x-2,y-18],[x-28,y-25],[x-26,y-38],[x-8,y-31]],'#6d7454');poly([[x+2,y-9],[x+23,y-28],[x+31,y-20],[x+8,y-4]],'#85896a');}
function rack(x,y){rect(x,y,32,70,'#0e1012');rect(x+2,y,28,66,'#24272b');for(let i=0;i<6;i++){rect(x+5,y+6+i*9,22,6,'#111416');rect(x+7,y+7+i*9,2,2,i%2?GOLD:'#8a9b8e');line(x+13,y+9+i*9,x+23,y+9+i*9,'#555b5d');}rect(x-2,y+68,36,4,'#41423e');}
function speaker(x,y){rect(x,y,37,91,'#080a0c');rect(x+3,y+3,31,80,'#222426');for(let i=0;i<2;i++){ellipse(x+18,y+24+i*36,11,12,'#080a0b');ellipse(x+18,y+24+i*36,6,7,'#393a35');}rect(x+3,y+87,31,4,'#8e7044');}
let planet;
const backdrop=document.createElement('canvas');backdrop.width=W;backdrop.height=H;const bctx=backdrop.getContext('2d');
function buildBackdrop(){
ctx.clearRect(0,0,W,H);rect(0,0,W,H,'#090a0c');
const sky=ctx.createRadialGradient(980,165,0,980,165,850);sky.addColorStop(0,'#38291555');sky.addColorStop(1,'#090a0c00');ctx.fillStyle=sky;ctx.fillRect(0,0,W,650);
for(let i=0;i<95;i++){const x=(Math.sin(i*77.13)*.5+.5)*W,y=(Math.cos(i*3.72)*.5+.5)*265;rect(x,y,1+(i%4===0?1:0),1,i%5?'#96876a50':'#e7b46a66');}
line(48,94,1872,94,'#e7b46a32');
// Architectural floor and low walls. Charcoal surfaces, restrained gold edges.
poly([[57,307],[1863,307],[1878,965],[42,965]],'#191c20','#434139');
for(let y=322;y<963;y+=32)line(49,y,1871,y,'#ffffff04');for(let x=64;x<1875;x+=32)line(x,307,x,965,'#ffffff03');
rect(47,292,1826,14,'#2d3031');line(47,292,1873,292,'#7f6c46',2);rect(42,304,12,661,'#2b2e30');rect(1866,304,12,661,'#2b2e30');
line(58,309,58,952,'#b18a4b33');line(1862,309,1862,952,'#b18a4b33');
if(state.layout==='auditorium'){
for(let k=0;k<3;k++){rect(83+k*595,331,560,615,'#212326');line(83+k*595,331,643+k*595,331,'#8c744f66');for(let r=0;r<4;r++){rect(90+k*595,358+r*161,546,121,'#24272b');line(90+k*595,479+r*161,636+k*595,479+r*161,'#0005');}}
for(const x of [660,1255]){line(x,340,x,932,'#bf96554a');for(let y=357;y<930;y+=64)rect(x-1,y,2,18,'#c5a36577');}
}else{
for(let r=0;r<2;r++)for(let c=0;c<3;c++){const x=363+c*595,y=447+r*327;rect(x-280,y-133,560,310,'#22262a');line(x-280,y-133,x+280,y-133,'#ae895457');rect(x-205,y+32,410,15,'#33332e');}}
// Wide raised stage, large wall screen, podium and speaker stacks.
poly([[530,257],[1390,257],[1426,292],[494,292]],'#41403a','#b48c4c');rect(494,292,932,14,'#1d1d1b');line(494,292,1426,292,'#e7b46a',2);
rect(590,111,740,148,'#020303');ctx.save();ctx.beginPath();ctx.rect(596,117,728,136);ctx.clip();if(planet){ctx.globalAlpha=.52;ctx.drawImage(planet,880,49,450,432);ctx.globalAlpha=1;}ctx.restore();
line(590,111,1330,111,'#e7b46a99');line(590,258,1330,258,'#e7b46a99');line(590,111,590,258,'#725d3c');line(1330,111,1330,258,'#725d3c');
text('EE黑客松',955,178,48,'#fff2dc','center',true);text('48 TEAMS.  ONE ROOM.  LIMITLESS IDEAS.',955,222,12,'#c1a272');
for(let i=0;i<7;i++){rect(640+i*105,100,30,6,'#685c43');rect(647+i*105,106,16,3,'#eed5a3');}
speaker(539,172);speaker(1347,172);
poly([[922,273],[998,273],[1007,296],[913,296]],'#242622','#80704b');rect(929,246,62,46,'#2d2f2b');rect(923,242,74,7,'#d4af6c');rect(932,255,56,2,'#8b774f');text('EE',960,274,19,GOLD,'center',true);line(966,242,968,226,'#c9c3b4',2);rect(965,223,9,4,'#747a78');
// Stage approach steps and side-room details.
rect(859,307,202,7,'#4e483b');rect(878,314,164,7,'#34332e');line(860,307,1060,307,'#c5a46d');
for(const x of [91,1829]){plant(x,263);}
rack(160,238);rack(1728,238);
text('CODE · CREATE · CONNECT',315,272,11,'#837762');text('FROM ZERO TO SOMETHING REAL',1603,272,11,'#837762');
line(48,987,1872,987,'#e7b46a33');text('EE HACKATHON  /  DEVELOPMENT FLOOR',48,1036,11,'#776e5d','left');
bctx.clearRect(0,0,W,H);bctx.drawImage(canvas,0,0);
}
function character(team,x,y,t,flip=false,scale=3){const source=sprites[team.sprite];const f=team.status==='active'?3+Math.floor(t/230+team.phase)%2:team.status==='thinking'?5+Math.floor(t/900+team.phase)%2:1;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,f*16,64,16,32,-8*scale,-16*scale,16*scale,32*scale);ctx.restore();}
function station(team,p,t,index){const {x,y,flip}=p;const facing=flip?-1:1;const focus=index===state.selected||index===state.hover;
ctx.save();ctx.translate(x,y);
ellipse(0,56,62,13,'#0005');
// Chair with legs and cushion, then character and desk in the same depth plane.
rect(-31*facing-12,24,25,21,'#454b50');rect(-31*facing-14,19,29,6,'#646a6d');rect(-31*facing-9,43,3,15,'#757b7e');rect(-31*facing+7,43,3,15,'#757b7e');
character(team,-30*facing,-4,t,flip,3);
const dx=flip?-69:-1;
rect(dx+5,37,5,27,'#596267');rect(dx+60,37,5,27,'#596267');rect(dx+5,61,9,3,'#92948a');rect(dx+57,61,9,3,'#92948a');
poly([[dx-3,26],[dx+67,26],[dx+75,36],[dx-9,36]],'#454b50','#747b7e');rect(dx-9,36,84,6,'#2e3439');line(dx-9,36,dx+75,36,'#d0b47a');
// Monitor and a subtly animated code editor.
rect(dx+33,15,4,15,'#737b78');rect(dx+23,28,24,3,'#868c7f');rect(dx+13,-12,46,30,'#080b0c');rect(dx+16,-9,40,24,team.status==='active'?'#263334':'#1b2426');rect(dx+16,-9,40,4,'#45504a');
for(let j=0;j<4;j++){const len=8+((team.id*3+j*7)%24);rect(dx+19+(j%2)*3,-2+j*4,len,2,j===1?'#cfb97c':j===2?'#8caca0':'#b6c1ac');}
if(team.status==='active'&&Math.floor(t/460+team.phase)%2===0)rect(dx+29,10,2,3,'#f0d28b');
rect(dx+2,29,23,4,'#8e9694');for(let i=0;i<5;i++)rect(dx+4+i*4,30,2,1,'#3b4444');
rect(dx+62,21,7,10,'#d5c9a7');rect(dx+64,19,3,2,'#8a7351');
// Head label is a small game-world speech bubble, not a dashboard card.
const labelY=-75;
rect(-54,labelY,108,26,'#101214');line(-54,labelY,-54,labelY+26,focus?'#f3cc81':'#6a5a3e');line(-54,labelY,54,labelY,focus?'#f3cc81':'#6a5a3e');line(54,labelY,54,labelY+26,focus?'#f3cc81':'#6a5a3e');line(-54,labelY+26,54,labelY+26,focus?'#f3cc81':'#6a5a3e');poly([[-3,labelY+26],[3,labelY+26],[0,labelY+30]],'#6a5a3e');
text(short(team.input+team.output),-8,labelY+13,16,team.status==='active'?'#f1ce8b':'#bcb8a8');text('T',38,labelY+13,10,'#99866a');
text(team.name,2,74,14,'#ddd5c4');rect(-46,71,4,4,team.status==='active'?GOLD:team.status==='thinking'?'#d8d7c8':'#626976');
if(focus){ctx.strokeStyle='#f1cc84';ctx.lineWidth=1.5;ctx.strokeRect(-62,-83,124,163);}
if(!reduced&&team.pulse>t){const alpha=Math.min(1,(team.pulse-t)/400);ctx.globalAlpha=alpha;text('+ API',42,-91-(1500-(team.pulse-t))/80,10,'#e7b46a');ctx.globalAlpha=1;}
ctx.restore();}
function draw(){if(!state.ready)return;ctx.drawImage(backdrop,0,0);positions.forEach((p,i)=>station(teams[i],p,reduced?0:state.time,i));}
function updateNumbers(){const tokens=teams.reduce((s,t)=>s+t.input+t.output,0),calls=teams.reduce((s,t)=>s+t.requests,0);$('#total-tokens').textContent=short(tokens);$('#total-requests').textContent=fmt(calls);if(state.selected!==null)detail(state.selected,false);}
function tick(){for(const team of teams){if(random()>.17)continue;if(random()>.9)team.status=['active','active','thinking','idle'][Math.floor(random()*4)];if(team.status!=='active')continue;team.input+=120+Math.floor(random()*900);team.output+=30+Math.floor(random()*330);team.requests++;team.pulse=state.time+1500;}updateNumbers();$('#sync').textContent='模拟更新 '+new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' · 未连接真实 API';}
function detail(index,show=true){state.selected=index;const t=teams[index];$('#detail-name').textContent=t.name;$('#detail-state').textContent={active:'● 正在敲码 · 模拟',thinking:'● 思考中 · 模拟',idle:'● 暂时休息 · 模拟'}[t.status];$('#detail-tokens').textContent=fmt(t.input+t.output);$('#detail-input').textContent=fmt(t.input);$('#detail-output').textContent=fmt(t.output);$('#detail-requests').textContent=fmt(t.requests);if(show){$('#detail').hidden=false;$('#team-select').value=String(index);$('#close-detail').focus();}draw();}
function close(){state.selected=null;$('#detail').hidden=true;$('#team-select').value='';draw();}
function point(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};}
function hit(event){const p=point(event);return positions.findIndex(v=>Math.abs(p.x-v.x)<62&&p.y>v.y-79&&p.y<v.y+81);}
canvas.addEventListener('click',e=>{const i=hit(e);if(i>=0)detail(i);else close();});canvas.addEventListener('mousemove',e=>{const i=hit(e);state.hover=i>=0?i:null;canvas.style.cursor=i>=0?'pointer':'default';if(state.paused||reduced)draw();});canvas.addEventListener('mouseleave',()=>{state.hover=null;draw();});
$('#close-detail').addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
teams.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=t.name;$('#team-select').append(o);});$('#team-select').addEventListener('change',e=>{if(e.target.value!=='')detail(Number(e.target.value));else close();});
document.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>{state.layout=button.dataset.layout;document.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));positions=makePositions();if(state.ready){buildBackdrop();draw();}}));
$('#pause').addEventListener('click',e=>{state.paused=!state.paused;e.currentTarget.setAttribute('aria-pressed',String(state.paused));e.currentTarget.textContent=state.paused?'▶ 继续':'Ⅱ 暂停';});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#sync').textContent='请使用浏览器 F11 进入全屏';}});
function clock(){$('#clock').textContent=new Date().toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' CST';}
function frame(now){const delta=Math.min(100,Math.max(0,now-state.last));state.last=now;if(!state.paused&&!document.hidden){state.time+=delta;if(state.time>=state.nextTick){tick();state.nextTick=state.time+1600;}draw();}requestAnimationFrame(frame);}
async function load(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('无法载入 '+src));img.src=src;});}
fit();addEventListener('resize',fit);clock();setInterval(clock,1000);updateNumbers();positions=makePositions();
Promise.all([Promise.all(Array.from({length:6},(_,i)=>load('./assets/characters/char_'+i+'.png'))),load('./assets/gold-planet.webp')]).then(([chars,bg])=>{sprites.push(...chars);planet=bg;state.ready=true;buildBackdrop();draw();$('#load-status').hidden=true;state.last=performance.now();requestAnimationFrame(frame);}).catch(e=>{$('#load-status').textContent=e.message+'。请刷新页面重试。';});
// Read-only debug surface supports layout and arithmetic QA without exposing credentials.
window.EEDemo={snapshot:()=>({ready:state.ready,layout:state.layout,paused:state.paused,teams:teams.map(t=>({...t})),positions:positions.map(p=>({...p})),totalTokens:teams.reduce((s,t)=>s+t.input+t.output,0),totalRequests:teams.reduce((s,t)=>s+t.requests,0)} )};
})();
