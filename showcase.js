(function(root){
'use strict';
function createShowcase(panel){
 let catalog=null,pending=null,failed=false,teamId=null,projectIndex=0;
 const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;};
 function picturePath(value){
  if(typeof value!=='string'||!/^\.\/assets\/showcase\/[a-z0-9-]+\.(webp|png|jpg)$/.test(value))return null;
  return new URL(value,document.baseURI).href;
 }
 function validate(data){
  if(data?.version!==1||!Array.isArray(data.projects))throw Error('Invalid showcase');
  const ids=new Set();
  for(const p of data.projects){
   if(typeof p.id!=='string'||ids.has(p.id)||!Number.isSafeInteger(p.teamId)||typeof p.title!=='string'||typeof p.summary!=='string'||!Array.isArray(p.images)||p.images.some(i=>!picturePath(i.src)||typeof i.alt!=='string'))throw Error('Invalid project');
   ids.add(p.id);
  }
  return data;
 }
 function empty(title,message,retry=false){
  const box=el('div','project-empty');box.append(el('strong','',title),el('p','',message));
  if(retry){const button=el('button','','重新加载作品');button.type='button';button.addEventListener('click',()=>{failed=false;load();render();});box.append(button);}
  panel.append(box);
 }
 function render(){
  panel.replaceChildren();panel.append(el('div','project-eyebrow','PROJECT SHOWCASE / 作品展示'));
  panel.setAttribute('aria-busy',String(!!pending));
  if(!catalog){empty(failed?'作品暂时未能加载':'正在打开作品',failed?'网络暂未连接，点击重试。小组用量与形象仍可查看。':'正在读取这支队伍的成果资料。',failed);return;}
  const projects=catalog.projects.filter(p=>p.teamId===teamId);
  if(!projects.length){empty('暂未发布作品','这支队伍暂时没有已确认的公开作品，后续补充后会在这里展示。');return;}
  projectIndex=Math.min(projectIndex,projects.length-1);
  if(projects.length>1){const tabs=el('div','project-switcher');projects.forEach((project,i)=>{const b=el('button','',project.title);b.type='button';b.setAttribute('aria-pressed',String(i===projectIndex));b.addEventListener('click',()=>{projectIndex=i;render();});tabs.append(b);});panel.append(tabs);}
  const project=projects[projectIndex],heading=el('div','project-heading'),title=el('h3','',project.title);title.id='project-title';
  heading.append(title);if(project.award)heading.append(el('span','project-award',project.trackName+'获奖'));
  panel.dataset.projectId=project.id;panel.append(heading,el('p','project-summary',project.summary));
  const figure=el('figure','project-figure'),stage=el('div','project-image-stage'),footer=el('figcaption','project-image-footer');
  figure.append(stage,footer);panel.append(figure);
  if(!project.images.length){stage.append(el('div','project-no-image','已收录作品介绍 · 主界面截图待补充'));footer.append(el('span','','截图补齐后将在这里展示'));}
  else {
   const image=el('img'),placeholder=el('div','project-no-image','截图加载中…'),label=el('span'),full=el('a','','打开大图 ↗'),thumbnails=el('div','project-thumbnails');
   image.decoding='async';full.target='_blank';full.rel='noopener noreferrer';stage.append(image,placeholder);footer.append(label,full);
   const choose=index=>{
    const item=project.images[index];image.hidden=true;placeholder.hidden=false;placeholder.textContent='截图加载中…';
    image.onload=()=>{image.hidden=false;placeholder.hidden=true;};image.onerror=()=>{image.hidden=true;placeholder.hidden=false;placeholder.textContent='截图暂时无法加载，可打开大图重试。';};
    image.alt=item.alt;image.src=picturePath(item.src);full.href=picturePath(item.src);label.textContent=(index+1)+' / '+project.images.length+' · '+item.alt;
    [...thumbnails.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
   };
   project.images.forEach((item,i)=>{const button=el('button','project-thumbnail'),thumb=el('img');button.type='button';button.setAttribute('aria-label','查看截图 '+(i+1)+'：'+item.alt);thumb.alt='';thumb.loading='lazy';thumb.src=picturePath(item.src);button.append(thumb);button.addEventListener('click',()=>choose(i));thumbnails.append(button);});
   if(project.images.length>1)panel.append(thumbnails);choose(0);
  }
  panel.append(el('p','project-note','根据已归档提交材料整理 · '+catalog.updatedAt+' · 简介及截图不代表在线试玩或完整运行验收。'));
 }
 async function load(){
  if(pending)return pending;
  pending=(async()=>{try{const r=await fetch('./data/showcase.json?v=showcase-1019',{cache:'no-cache',credentials:'omit',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP');catalog=validate(await r.json());failed=false;}catch{failed=true;}finally{pending=null;if(teamId!==null)render();}})();
  return pending;
 }
 return {show(team){if(teamId===team.id)return;teamId=team.id;projectIndex=0;panel.scrollTop=0;delete panel.dataset.projectId;if(!catalog&&!failed)load();render();}};
}
root.EEShowcase={create:createShowcase};
})(globalThis);
