const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(__dirname,'..'),origin='https://leftseinem.github.io/hackathon-live-floor/';
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/showcase.json'),'utf8'));
const tracks=['科研科创','校园学习生活','社会公益','游戏类','创意整活与数字文娱'];
function snapshot(rows){return {version:1,generatedAt:new Date().toISOString(),usageEnabled:true,tracks:tracks.map((name,i)=>({id:i+1,name,teamCount:rows.filter(r=>r.trackId===i+1).length,peopleCount:rows.filter(r=>r.trackId===i+1).length*2})),teams:rows.map(r=>({id:r.teamId,displayName:r.teamName,trackId:r.trackId,peopleCount:2,totalTokens:r.teamId*100,activeRequests:null,usageState:'ok',updatedAt:null})),totals:{teamCount:rows.length,peopleCount:rows.length*2,totalTokens:rows.reduce((n,r)=>n+r.teamId*100,0),knownUsageTeams:rows.length,staleTeams:0}};}
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let rows=[...catalog.projects,{teamId:24,teamName:'未发布测试队伍',trackId:2}],dataRequests=0,failCatalog=false,failImage=false,delayCatalog=false,resolveCatalog;
  const catalogGate=new Promise(resolve=>{resolveCatalog=resolve;});
  await page.route(origin+'**',async route=>{
   const relative=new URL(route.request().url()).pathname.slice('/hackathon-live-floor/'.length)||'index.html',file=path.resolve(root,relative);
   if(!file.startsWith(root+path.sep))return route.abort();
   if(relative==='data/showcase.json'){dataRequests++;if(delayCatalog)await catalogGate;if(failCatalog)return route.fulfill({status:503,body:'temporarily unavailable'});}
   if(failImage&&relative.startsWith('assets/showcase/'))return route.abort();
   if(!fs.existsSync(file))return route.fulfill({status:404,body:'not found'});
   return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
  });
  await page.route('https://wenjuan.leftseinem.dpdns.org/api/live-floor',r=>r.fulfill({json:snapshot(rows),headers:{'Access-Control-Allow-Origin':'https://leftseinem.github.io'}}));
  await page.goto(origin);await page.waitForFunction(()=>EEDemo.snapshot().live&&EEDemo.snapshot().ready);
  assert.equal(dataRequests,0,'catalog should load only when a team is opened');
  async function open(id){if(await page.locator('#detail').isVisible())await page.keyboard.press('Escape');const s=await page.evaluate(()=>EEDemo.snapshot()),i=s.teams.findIndex(t=>t.id===id),p=s.positions[i];assert(p);const box=await page.locator('#scene').boundingBox();await page.mouse.click(box.x+(p.x-24*(p.flip?-1:1)*p.scale)*box.width/1920,box.y+(p.y-10*p.scale)*box.height/1080);await page.waitForFunction(()=>!document.querySelector('#detail').hidden);}
  for(const project of catalog.projects){
   await open(project.teamId);await page.waitForFunction(()=>document.querySelector('#project-panel').dataset.projectId);
   assert.equal(await page.locator('#project-title').textContent(),project.title);
   assert.equal(await page.locator('#detail-name').textContent(),project.teamName);
   assert.equal(await page.locator('.project-award').count(),project.award?1:0);
   if(project.images.length)await page.waitForFunction(()=>{const im=document.querySelector('.project-image-stage img');return im?.complete&&im.naturalWidth>0&&!im.hidden;});
   else assert.match(await page.locator('.project-no-image').textContent(),/待补充/);
  }
  assert.equal(dataRequests,1);assert.equal(catalog.projects.length,42);
  assert.equal(catalog.projects.find(p=>p.teamId===29).title,'知行 · 校园通知到行动助手');
  assert.equal(catalog.projects.find(p=>p.teamId===29).images.length,1,'user confirmed Zhixing as team 29');
  assert.equal(catalog.projects.find(p=>p.teamId===41).title,'留白 · 日程助手');
  assert.equal(catalog.projects.find(p=>p.teamId===27).images.length,4);
  assert.equal(catalog.projects.filter(p=>p.images.length).length,40);
  await open(27);
  for(let i=0;i<4;i++){await page.locator('.project-thumbnail').nth(i).click();await page.waitForFunction(()=>{const im=document.querySelector('.project-image-stage img');return im?.complete&&im.naturalWidth>0&&!im.hidden;});assert.match(await page.locator('.project-image-footer').textContent(),new RegExp((i+1)+' / 4'));}
  await page.screenshot({path:path.join(root,'qa/showcase-team-27.png')});
  await open(41);await page.waitForFunction(()=>{const im=document.querySelector('.project-image-stage img');return im?.complete&&im.naturalWidth>0&&!im.hidden;});
  await page.screenshot({path:path.join(root,'qa/showcase-team-41.png')});
  const payload=JSON.stringify(catalog);for(const forbidden of ['student_id','claimToken','apiKey','phone','email','members','C:/Users','D:/EEclaw'])assert(!payload.includes(forbidden));
  for(const project of catalog.projects)for(const item of project.images)assert(fs.existsSync(path.join(root,item.src)));
  await open(22);await page.locator('.project-thumbnail').nth(2).click();assert.equal(await page.locator('.project-thumbnail[aria-pressed=true]').getAttribute('aria-label'),'查看截图 3：黑洞关卡');
  const before=await page.locator('.project-image-stage img').getAttribute('src');
  const full=await page.locator('.project-image-footer a').getAttribute('href');assert(full.includes('/hackathon-live-floor/assets/showcase/'));
  await page.locator('#close-detail').focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'appearance-random');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'close-detail');
  await page.clock.install();rows.reverse();await page.clock.runFor(11000);await page.waitForFunction(()=>EEDemo.snapshot().teams[0].id===24);
  assert.equal(await page.locator('#detail-name').textContent(),'XOR396');assert.equal(await page.locator('.project-image-stage img').getAttribute('src'),before,'poll must not reset selected screenshot');
  await page.screenshot({path:path.join(root,'qa/showcase-modal.png')});
  rows=rows.filter(r=>r.teamId!==22);await page.clock.runFor(11000);await page.waitForFunction(()=>document.querySelector('#detail').hidden);
  assert.equal(await page.locator('#scene').evaluate(n=>n.inert),false);
  await open(24);assert.match(await page.locator('.project-empty').textContent(),/暂未发布作品/);await page.mouse.click(70,400);assert(await page.locator('#detail').isHidden());
  await page.setViewportSize({width:1366,height:768});await open(14);const dialog=await page.locator('#detail').boundingBox();assert(dialog.x>=0&&dialog.y>=0&&dialog.x+dialog.width<=1366&&dialog.y+dialog.height<=768);
  await page.locator('.appearance-choice').nth(4).click();assert.equal((await page.evaluate(()=>EEDemo.snapshot())).teams.find(t=>t.id===14).sprite,4);
  await page.screenshot({path:path.join(root,'qa/showcase-modal-scaled.png')});
  // Failed catalog, explicit retry and failed screenshot have distinct recoverable states.
  failCatalog=true;await page.reload();await page.waitForFunction(()=>EEDemo.snapshot().live&&EEDemo.snapshot().ready);await open(14);
  await page.waitForFunction(()=>document.querySelector('.project-empty button'));assert.match(await page.locator('.project-empty').textContent(),/暂时未能加载/);
  failCatalog=false;await page.locator('.project-empty button').click();await page.waitForFunction(()=>document.querySelector('#project-title')?.textContent==='哪吃');
  failImage=true;await open(7);await page.waitForFunction(()=>document.querySelector('.project-no-image')?.textContent.includes('暂时无法加载'));failImage=false;
  // A delayed response renders the latest selected team, not a previously opened one.
  delayCatalog=true;await page.reload();await page.waitForFunction(()=>EEDemo.snapshot().live&&EEDemo.snapshot().ready);await open(7);await open(14);resolveCatalog();
  await page.waitForFunction(()=>document.querySelector('#project-title')?.textContent==='哪吃');assert.equal(await page.locator('#detail-name').textContent(),'给给队');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,projects:42,allMappings:true,lazyLoad:true,galleryPreservedOnPoll:true,modalFocus:true,removedTeamCloses:true,emptyAndErrorStates:true,scaledLayout:true,appearancePreserved:true,delayedResponseCorrectTeam:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
