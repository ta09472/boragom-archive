import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const root=new URL(existsSync(new URL('../inventory/catalog.json',import.meta.url))?'../':'../../outputs/boragom-archive/',import.meta.url);
const read=async path=>JSON.parse(await fs.readFile(new URL(path,root),'utf8'));
const cat=await read('inventory/catalog.json');
const manifest=await read('inventory/media-manifest.json');
const videos=await read('inventory/videos.json');
const posts=await read('raw/blog-public-posts.json');
const byUrl=new Map();
for(const a of manifest.assets)for(const u of [a.url,...a.variants])byUrl.set(u,a);
const media=(url,alt='')=>{const a=byUrl.get(url);return {src:a?.status==='saved'?a.local_path:'',original:url||'',alt,kind:a?.kind||'image',width:a?.width||0,height:a?.height||0}};
function sanitizeHtml(html,post){
 const {document}=parseHTML(html);const content=document.querySelector('.se-main-container');
 if(!content)return '';
 content.querySelectorAll('script,iframe,link,style,object,embed,form,input,meta,base,noscript,svg').forEach(el=>el.remove());
 for(const el of content.querySelectorAll('*'))for(const a of [...el.attributes])if(a.name.startsWith('on')||['srcset','style'].includes(a.name))el.removeAttribute(a.name);
 for(const img of content.querySelectorAll('img')){
  const candidates=[img.getAttribute('data-lazy-src'),img.getAttribute('data-src'),img.getAttribute('src')].filter(Boolean);
  const found=candidates.map(u=>media(u,img.getAttribute('alt')||'블로그 사진')).find(m=>m.src);
  if(found){img.setAttribute('src',found.src);img.setAttribute('loading','lazy');img.setAttribute('alt',found.alt);if(found.width)img.setAttribute('width',String(found.width));if(found.height)img.setAttribute('height',String(found.height));}
  else {const text=document.createElement('span');text.className='unavailable-inline';text.textContent='원본 링크 이미지 접근 불가';img.replaceWith(text);}
  for(const a of [...img.attributes])if(a.name.startsWith('data-'))img.removeAttribute(a.name);
 }
 for(const v of content.querySelectorAll('video')){const m=media(v.getAttribute('src'));if(m.src){v.setAttribute('src',m.src);v.setAttribute('controls','');v.setAttribute('preload','none');v.removeAttribute('autoplay');const p=media(v.getAttribute('poster'));if(p.src)v.setAttribute('poster',p.src);else v.removeAttribute('poster');}else v.remove();for(const a of [...v.attributes])if(a.name.startsWith('data-'))v.removeAttribute(a.name);}
 for(const a of content.querySelectorAll('a')){const href=a.getAttribute('href')||'';if(/^https?:/.test(href)){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');}else a.removeAttribute('href');a.removeAttribute('onclick');}
 for(const el of content.querySelectorAll('[data-module]'))el.removeAttribute('data-module');
 return content.innerHTML;
}
function decodeText(value){const {document}=parseHTML("<div></div>");const el=document.querySelector("div");el.innerHTML=value||"";return el.textContent;}
const blogPosts=[];
for(const post of posts){let html='';try{html=await fs.readFile(new URL('raw/blog-public-posts/'+post.reviewId+'.html',root),'utf8');}catch{}
 const list=cat.blogs.find(b=>b.reviewId===post.reviewId);
 blogPosts.push({id:post.reviewId,title:decodeText(list?.title||post.title),author:list?.name||'',date:list?.date||'',preview:list?.contents||'',thumb:media(list?.thumbnailUrl),text:post.text,html:sanitizeHtml(html,post),images:post.images.map(i=>media(i.originalUrl||i.lazySrc||i.src,i.alt||'블로그 사진')),videos:videos.filter(v=>v.sourcePage?.includes(post.reviewId)).map(v=>({src:v.local_path||v.localPath,original:v.url,alt:v.title||'블로그 영상',kind:'video',width:v.width,height:v.height}))});
}
const place=cat.place;const base=place.base;
const reviews=cat.reviews.map(r=>({id:r.id,author:r.author.nickname,avatar:media(r.author.imageUrl),authorReviews:r.author.review?.totalCount||0,body:r.body||'',visited:r.visited,visitCount:r.visitCount,originType:r.originType,created:r.created,sortDate:r.representativeVisitDateTime||'',keywords:(r.votedKeywords||[]).map(k=>({name:k.name,icon:media(k.iconUrl)})),visitCategories:(r.visitCategories||[]).flatMap(v=>v.keywords.map(k=>k.name)),reply:r.reply?.body?{body:r.reply.body,date:r.reply.date||r.reply.created}:null,media:(r.media||[]).map((m,i)=>media(m.thumbnail,`${r.author.nickname}님의 리뷰 사진 ${i+1}`))}));
const clip=videos.find(v=>v.kind==='clip-full-video');
const photos=cat.photos.map((p,i)=>({...media(p.originalUrl,p.title||p.description||'보라곰 케이크 사진'),id:String(i),category:p.mediaSource==='business'?'business':p.mediaSource==='clip'?'clip':'review',author:p.author?.nickname||'',caption:p.description||'',date:p.date||'',video:p.mediaSource==='clip'?{src:clip.local_path,kind:'video',alt:'Asha Life 클립',original:clip.url,width:clip.width,height:clip.height}:null}));
const photoSrcs=new Set(photos.map(p=>p.src));
for(const r of reviews)for(const m of r.media)if(m.src&&!photoSrcs.has(m.src)){photos.push({...m,id:`extra-${photos.length}`,category:'review',author:r.author,caption:r.body,date:r.visited,video:null});photoSrcs.add(m.src);}
const data={place:{name:base.name,category:base.category,address:base.roadAddress,jibun:base.address,road:base.road,phone:base.virtualPhone,description:place.description,micro:base.microReviews?.[0]||'',conveniences:base.conveniences,keywords:place.informationTab?.keywordList||[],hours:place.newBusinessHours?.[0]?.businessHours?.map(h=>({day:h.day,text:h.businessHours?`${h.businessHours.start} - ${h.businessHours.end}`:h.description}))||[]},topPhotos:place.topPhotos.items.map(p=>media(p.originalUrl,p.title||'보라곰 사진')),menus:cat.menus.map(m=>({id:m.id,name:m.name,description:m.description,price:m.price.displayText,images:m.images.map(i=>media(i.url,m.name))})),menuBoards:place.menuImages.map(i=>media(i.imageUrl,'보라곰 메뉴판')),feeds:cat.feeds.map(f=>({id:f.id,title:f.title,body:f.desc,date:f.relativeCreated,category:f.category,images:f.media.map(m=>media(m.thumbnail,f.title))})),reviews,blogs:blogPosts,photos,clip:{src:clip.local_path,kind:'video',alt:'Asha Life 클립',original:clip.url,width:clip.width,height:clip.height},clipDescription:clip.description,counts:{images:manifest.assets.filter(a=>a.kind==='image'&&a.status==='saved').length,videos:videos.length,missing:manifest.assets.filter(a=>a.status!=='saved').length}};
await fs.writeFile(new URL('src/data.json',import.meta.url),JSON.stringify(data));
console.log({reviews:reviews.length,photos:photos.length,blogs:blogPosts.length,blogHtml:blogPosts.filter(b=>b.html).length});
