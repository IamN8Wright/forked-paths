(() => {
  const VERSION = "2.1.0";
  const SAVE_KEY = "forkedPathsSave.v1";
  let remoteMedia={};
  const sceneVisual = scene => {
    if(!scene) return "roadFork";
    if(scene === "roadFork") return "roadFork";
    if(["wildMan","wildManArmed","wildManFight","rowanTalk","wolfPupAftermath","followerCamp"].includes(scene)) return "woods";
    if(scene.startsWith("xera")) return "cottage";
    if(scene === "riverToll") return "river";
    if(["hoodedStranger","sirenGift"].includes(scene)) return "siren";
    if(["smokeHome","princeCoterie"].includes(scene)) return "coterie";
    if(["erisGate","erisGateInfo","erisDistrict","erisMarket"].includes(scene)) return "eris";
    if(scene.startsWith("erisInn")) return "inn";
    return "roadFork";
  };
  const altFor = key => ({roadFork:"A misty road dividing into two paths",woods:"A shadowed woodland path",cottage:"A rundown cottage with smoke rising from its chimney",river:"A broad river crossing",siren:"A hooded stranger and a mysterious ring",coterie:"A group of ominous figures moving together",eris:"The walls and streets of a large medieval city",inn:"A warmly lit city inn"}[key]||"A scene from the road");
  function currentState(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null");}catch{return null;}}
  async function loadRemoteMedia(){try{const r=await fetch('/api/card-media',{cache:'no-store'});if(r.ok)remoteMedia=(await r.json()).media||{};}catch(e){console.warn('Card media unavailable',e)}}
  function mediaFor(scene){const family=sceneVisual(scene);return remoteMedia[`scene:${scene}`]||remoteMedia[`family:${family}`]||{src:window.FK21_VISUALS?.[family],alt:altFor(family)};}
  function markVersion(){const s=currentState();if(s&&s.engineVersion!==VERSION){s.engineVersion=VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(s));}document.querySelectorAll('.build').forEach(el=>el.textContent=`Engine v${VERSION}`);document.querySelectorAll('.engine-line').forEach(el=>el.textContent=`InN8 Labs · Forked Kingdoms Engine v${VERSION}`);}
  function renderVisual(){
    const chapter=document.getElementById('chapterLabel');if(chapter){chapter.textContent='';chapter.setAttribute('aria-hidden','true');chapter.style.display='none';}
    const story=document.getElementById('storyText');if(!story)return;const s=currentState();const scene=s?.scene||'roadFork';const media=mediaFor(scene);let visual=story.querySelector(':scope > .scene-visual');
    if(!media?.src){visual?.remove();return;}if(!visual){visual=document.createElement('figure');visual.className='scene-visual';story.prepend(visual);}const signature=`${scene}:${media.updatedAt||media.src.slice(0,48)}`;if(visual.dataset.visual!==signature){visual.dataset.visual=signature;visual.innerHTML=`<img src="${media.src}" alt="${String(media.alt||altFor(sceneVisual(scene))).replace(/"/g,'&quot;')}">`;}
  }
  function refresh(){renderVisual();markVersion();}
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
  async function boot(){const story=document.getElementById('storyText');const choices=document.getElementById('choices');if(story)observer.observe(story,{childList:true,subtree:true});if(choices)observer.observe(choices,{childList:true,subtree:true});await loadRemoteMedia();refresh();setInterval(markVersion,3000);setInterval(async()=>{await loadRemoteMedia();refresh();},30000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();