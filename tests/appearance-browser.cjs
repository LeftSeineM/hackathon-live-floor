const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(__dirname,'..'),origin='https://leftseinem.github.io/hackathon-live-floor/';
const names=['科研科创','校园学习生活','社会公益','游戏类','创意整活与数字文娱'];
let rows=[{id:7,trackId:1,peopleCount:2},{id:12,trackId:2,peopleCount:3},{id:26,trackId:5,peopleCount:2}],revision=0;
function snapshot(){const teams=rows.map(t=>({...t,displayName:'外观测试小组 '+t.id,totalTokens:t.id*100+revision,activeRequests:null,usageState:'ok',updatedAt:new Date().toISOString()}));return {version:1,generatedAt:new Date().toISOString(),usageEnabled:true,teams,tracks:names.map((name,i)=>({id:i+1,name,teamCount:teams.filter(t=>t.trackId===i+1).length,peopleCount:teams.filter(t=>t.trackId===i+1).reduce((n,t)=>n+t.peopleCount,0)})),totals:{teamCount:teams.length,peopleCount:teams.reduce((n,t)=>n+t.peopleCount,0),totalTokens:teams.reduce((n,t)=>n+t.totalTokens,0),knownUsageTeams:teams.length,staleTeams:0}};}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 await page.route(origin+'**',r=>{const relative=new URL(r.request().url()).pathname.slice('/hackathon-live-floor/'.length)||'index.html',file=path.resolve(root,relative);if(!file.startsWith(root+path.sep))return r.abort();const contentType={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'}[path.extname(file)];return r.fulfill({body:fs.readFileSync(file),contentType});});
 await page.route('https://wenjuan.leftseinem.dpdns.org/api/live-floor',r=>r.fulfill({json:snapshot(),headers:{'Access-Control-Allow-Origin':'https://leftseinem.github.io'}}));
 await page.goto(origin);await page.waitForFunction(()=>EEDemo.snapshot().live&&EEDemo.snapshot().ready);
 let state=await page.evaluate(()=>EEDemo.snapshot());const before=state.teams.map(t=>({...t})),p=state.positions[0];
 // Click the character itself, not just the number label.
 await page.mouse.click(p.x-24*(p.flip?-1:1)*p.scale,p.y-10*p.scale);
 assert.equal(await page.locator('#detail-name').textContent(),before[0].name);assert.equal(await page.locator('.appearance-choice').count(),6);
 assert.equal(await page.locator('.appearance-choice[aria-pressed=true]').count(),1);
 for(let sprite=0;sprite<6;sprite++){
  await page.locator('.appearance-choice').nth(sprite).click();state=await page.evaluate(()=>EEDemo.snapshot());assert.equal(state.teams[0].sprite,sprite);
  assert.equal(await page.locator('.appearance-choice').nth(sprite).getAttribute('aria-pressed'),'true');assert.deepEqual(state.teams.slice(1),before.slice(1));assert.equal(state.totalTokens,before.reduce((n,t)=>n+t.tokens,0));
 }
 assert.match(await page.locator('#appearance-save').textContent(),/当前浏览器/);
 fs.mkdirSync(path.join(root,'qa'),{recursive:true});await page.mouse.move(0,0);await page.screenshot({path:path.join(root,'qa/appearance-picker.png')});
 const panel=await page.locator('#detail').boundingBox(),picker=await page.locator('#appearance-options').boundingBox();assert(panel.y+panel.height<=1017);assert(picker.x>=panel.x&&picker.x+picker.width<=panel.x+panel.width);
 // Reorder rows and add a team during the normal 10-second poll.
 rows=[rows[2],{id:33,trackId:3,peopleCount:2},rows[0],rows[1]];revision=11;
 await page.clock.runFor(11000);await page.waitForFunction(()=>EEDemo.snapshot().teams.length===4);
 state=await page.evaluate(()=>EEDemo.snapshot());assert.equal(state.teams.find(t=>t.id===7).sprite,5);assert.equal(state.teams.find(t=>t.id===7).tokens,711);assert.equal(await page.locator('#detail-name').textContent(),before[0].name);
 const saved=Object.fromEntries(state.teams.map(t=>[t.id,t.sprite]));
 await page.reload();await page.waitForFunction(()=>EEDemo.snapshot().live&&EEDemo.snapshot().ready);state=await page.evaluate(()=>EEDemo.snapshot());assert.deepEqual(Object.fromEntries(state.teams.map(t=>[t.id,t.sprite])),saved);
 await page.locator('#team-select').selectOption(String(state.teams.findIndex(t=>t.id===7)));await page.locator('#appearance-random').click();const rerolled=(await page.evaluate(()=>EEDemo.snapshot())).teams.find(t=>t.id===7).sprite;assert.notEqual(rerolled,5);
 await page.keyboard.press('Escape');assert(await page.locator('#detail').isHidden());
 await page.setViewportSize({width:1366,height:768});await page.waitForFunction(()=>document.querySelector('#screen').getBoundingClientRect().width<1367);await page.locator('#team-select').selectOption('2');assert(await page.locator('#appearance-random').isVisible());
 await page.locator('.appearance-choice').nth(1).focus();await page.keyboard.press('Enter');assert.equal((await page.evaluate(()=>EEDemo.snapshot())).teams.find(t=>t.id===7).sprite,1);
 const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem(EEAppearances.STORAGE_KEY)));assert.deepEqual(Object.keys(persisted).sort(),['12','26','33','7']);assert(Object.values(persisted).every(v=>Number.isInteger(v)&&v>=0&&v<6));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,clickCharacter:true,sixChoices:true,initialRandom:true,keepsChoiceAcrossPollingAndReload:true,stableTeamIds:true,newTeams:true,randomButton:true,keyboard:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
