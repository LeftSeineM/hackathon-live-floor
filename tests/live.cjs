const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const names=['科研科创','校园学习生活','社会公益','游戏类','创意整活与数字文娱'];
function sample(counts=[2,8,0,1,2],enabled=false){
 let id=1;const teams=counts.flatMap((count,i)=>Array.from({length:count},()=>{const n=id++;return {id:n,displayName:'测试队伍 '+n,trackId:i+1,peopleCount:n%2?3:2,totalTokens:enabled?n*100:0,activeRequests:enabled?null:0,usageState:enabled?'ok':'held',updatedAt:enabled?new Date().toISOString():null};}));
 const tracks=counts.map((count,i)=>{const group=teams.filter(t=>t.trackId===i+1);return {id:i+1,name:names[i],teamCount:count,peopleCount:group.reduce((n,t)=>n+t.peopleCount,0),totalTokens:group.reduce((n,t)=>n+t.totalTokens,0),knownUsageTeams:count,staleTeams:0};});
 return {version:1,generatedAt:new Date().toISOString(),usageEnabled:enabled,tracks,teams,totals:{teamCount:teams.length,peopleCount:teams.reduce((n,t)=>n+t.peopleCount,0),totalTokens:teams.reduce((n,t)=>n+t.totalTokens,0),knownUsageTeams:teams.length,staleTeams:0}};
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let data=sample(),offline=false;
  await page.route('https://wenjuan.leftseinem.dpdns.org/api/live-floor',r=>offline?r.abort():r.fulfill({json:data,headers:{'Access-Control-Allow-Origin':'*'}}));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await page.waitForFunction(()=>EEDemo.snapshot().ready&&EEDemo.snapshot().live);
  let state=await page.evaluate(()=>EEDemo.snapshot());assert.equal(state.teams.length,13);assert.equal(state.peopleCount,data.totals.peopleCount);assert.equal(await page.locator('#total-teams').textContent(),'13');assert(state.teams.every(t=>t.tokens===0&&t.status==='idle'));
  assert.deepEqual(state.tracks.map(t=>t.teamCount),[2,8,0,1,2]);
  for(let i=0;i<state.positions.length;i++){const p=state.positions[i];assert(p.visible);await page.mouse.click(p.x,p.y-73);assert.equal(await page.locator('#detail-name').textContent(),state.teams[i].name);await page.keyboard.press('Escape');}
  fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../qa/live-registration.png')});
  // A crowded track must page without squeezing rows or losing teams.
  data=sample([22,2,0,1,2],true);await page.reload();await page.waitForFunction(()=>EEDemo.snapshot().ready&&EEDemo.snapshot().live);state=await page.evaluate(()=>EEDemo.snapshot());
  assert.equal(state.teams.length,27);assert.equal(state.tracks[0].teamCount,22);assert.equal(state.positions.filter(p=>p.visible).length,15);assert.equal(state.totalTokens,data.totals.totalTokens);assert(state.teams.every(t=>t.status==='unknown'));
  for(let i=0;i<state.positions.length;i++)for(let j=i+1;j<state.positions.length;j++){const a=state.positions[i],b=state.positions[j];if(a.visible&&b.visible)assert(Math.abs(a.x-b.x)>=106||Math.abs(a.y-b.y)>=151,'overlapping desks');}
  await page.locator('#team-select').selectOption('21');await page.waitForFunction(()=>EEDemo.snapshot().positions[21].visible);assert.equal(await page.locator('#detail-tokens').textContent(),'2,200');assert.match(await page.locator('#detail-state').textContent(),/未知/);
  assert.equal(await page.locator('#detail-track').textContent(),'科研科创 · 2 人 · 第 22 组');await page.keyboard.press('Escape');
  await page.screenshot({path:path.resolve(__dirname,'../qa/live-tokens-paged.png')});
  await page.setViewportSize({width:1366,height:768});await page.waitForFunction(()=>document.querySelector('#screen').getBoundingClientRect().width<1367);const box=await page.locator('#screen').boundingBox();assert(box.width<=1367&&box.height<=769);
  assert(!/账户余额|累计消费|金额/.test(await page.locator('body').innerText()));
  // Clock acceleration only tests refresh/error paths; usage remains real snapshot data.
  await page.clock.install();offline=true;await page.clock.runFor(11000);await page.waitForFunction(()=>EEDemo.snapshot().stale);assert.equal((await page.evaluate(()=>EEDemo.snapshot())).totalTokens,data.totals.totalTokens);assert.match(await page.locator('#sync').textContent(),/保留上次数据/);
  offline=false;data=sample([0,0,0,0,0]);await page.clock.runFor(11000);await page.waitForFunction(()=>EEDemo.snapshot().live&&!EEDemo.snapshot().stale&&EEDemo.snapshot().teams.length===0);assert.equal(await page.locator('#total-teams').textContent(),'0');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,realCounts:true,tokenMapping:true,unknownConcurrency:true,crowdedTrackPaging:true,allVisibleSeatsClickable:true,disconnectPreservesSnapshot:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
