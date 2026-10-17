const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.LOCAL_ASSETS)await page.route('https://leftseinem.github.io/hackathon-live-floor/**',route=>{
   const url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname.slice('/hackathon-live-floor/'.length))||'index.html';
   const file=path.resolve(__dirname,'..',relative),root=path.resolve(__dirname,'..');
   if(!file.startsWith(root+path.sep))return route.abort();
   const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'}[path.extname(file)];return route.fulfill({body:fs.readFileSync(file),contentType:type});
  });
  const response=page.waitForResponse(r=>r.url()==='https://wenjuan.leftseinem.dpdns.org/api/live-floor'&&r.status()===200);
  await page.goto('https://leftseinem.github.io/hackathon-live-floor/?v=team-names-1018');const raw=await (await response).json();
  await page.waitForFunction(()=>window.EEDemo?.snapshot().ready&&EEDemo.snapshot().live);const state=await page.evaluate(()=>EEDemo.snapshot());
  assert.equal(state.teams.length,raw.totals.teamCount);assert.equal(state.peopleCount,raw.totals.peopleCount);assert.equal(state.totalTokens,raw.totals.totalTokens);
  assert.equal(state.positions.length,state.teams.length);assert(state.positions.every(p=>p.visible));
  assert.equal(await page.locator('.appearance-choice').count(),6);assert(state.teams.every(t=>Number.isInteger(t.sprite)&&t.sprite>=0&&t.sprite<6));
  assert.deepEqual(state.tracks.map(t=>[t.teamCount,t.peopleCount]),raw.tracks.map(t=>[t.teamCount,t.peopleCount]));
  if(!raw.usageEnabled)assert(state.teams.every(t=>t.tokens===0&&t.activeRequests===0));
  for(const forbidden of ['apiKey','claimToken','student_id','actual_cost','quota','phone','email'])assert(!JSON.stringify(raw).includes(forbidden));
  const stage=await page.locator('#countdown').boundingBox(),stats=await page.locator('.stage-stats').boundingBox();assert(stats.x>=stage.x+stage.width,'statistics overlap countdown');
  fs.mkdirSync(path.resolve(__dirname,'../qa'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../qa/live-public.png')});
  const summary={pass:true,source:process.env.LOCAL_ASSETS?'local assets with real public data':'deployed public page',teams:state.teams.length,people:state.peopleCount,tracks:state.tracks.map(t=>({name:t.name,teams:t.teamCount,people:t.peopleCount})),usageEnabled:raw.usageEnabled,totalTokens:state.totalTokens,errors};
  assert.deepEqual(errors,[]);fs.writeFileSync(path.resolve(__dirname,'../qa/live-public.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
