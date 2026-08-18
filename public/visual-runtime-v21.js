(() => {
  const VERSION = "2.1.0";
  const SAVE_KEY = "forkedPathsSave.v1";
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
  function markVersion(){
    const s=currentState();
    if(s && s.engineVersion!==VERSION){s.engineVersion=VERSION;localStorage.setItem(SAVE_KEY,JSON.stringify(s));}
    document.querySelectorAll(".build").forEach(el=>el.textContent=`Engine v${VERSION}`);
    document.querySelectorAll(".engine-line").forEach(el=>el.textContent=`InN8 Labs · Forked Kingdoms Engine v${VERSION}`);
  }
  function renderVisual(){
    const chapter=document.getElementById("chapterLabel");
    if(chapter){chapter.textContent="";chapter.setAttribute("aria-hidden","true");chapter.style.display="none";}
    const story=document.getElementById("storyText");
    if(!story)return;
    const s=currentState();
    const key=sceneVisual(s?.scene);
    const src=window.FK21_VISUALS?.[key];
    let visual=story.querySelector(":scope > .scene-visual");
    if(!src){visual?.remove();return;}
    if(!visual){visual=document.createElement("figure");visual.className="scene-visual";story.prepend(visual);}
    if(visual.dataset.visual!==key){visual.dataset.visual=key;visual.innerHTML=`<img src="${src}" alt="${altFor(key)}">`;}
  }
  function refresh(){renderVisual();markVersion();}
  const observer=new MutationObserver(()=>requestAnimationFrame(refresh));
  function boot(){
    const story=document.getElementById("storyText");
    const choices=document.getElementById("choices");
    if(story)observer.observe(story,{childList:true,subtree:true});
    if(choices)observer.observe(choices,{childList:true,subtree:true});
    refresh();
    setInterval(markVersion,3000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();