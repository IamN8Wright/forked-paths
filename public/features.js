(() => {
  const SAVE_KEY = "forkedPathsSave.v1";
  const META_KEY = "forkedPathsMeta.v1";
  const AVATAR_KEY = "forkedPathsAvatar.v1";
  const HISTORY_KEY = "forkedPathsHistory.v1";
  const markers = {
    roadToWestwood:[38,27], highlandWatch:[58,16], westwood:[41,26], xeraCottage:[45,28],
    eridyn:[54,46], eris:[60,91], ironvale:[84,13], thievesRun:[23,74],
    whisperingMeadow:[38,42], velorGrove:[36,34], crumblingObelisk:[92,58], eastRoad:[47,29]
  };

  let avatar = read(AVATAR_KEY,{type:"icon",value:"✦"});
  let history = read(HISTORY_KEY,[]);
  let meta = read(META_KEY,{id:crypto.randomUUID()});
  let selectedChoice = null;
  let selectedChoiceHtml = "";

  if(!meta.id){
    meta.id = crypto.randomUUID();
    write(META_KEY,meta);
  }

  function read(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}
  }
  function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function state(){return read(SAVE_KEY,null);}
  function stripChoiceText(button){
    const clone=button.cloneNode(true);
    clone.querySelectorAll(".choice-confirmation").forEach(x=>x.remove());
    return clone.textContent.replace(/^\s*\d+\.\s*/,"").trim();
  }
  function logChoice(text,before){
    history.push({
      at:new Date().toISOString(),
      day:before?.world?.day||1,
      scene:before?.scene||"unknown",
      location:before?.world?.location||"unknown",
      choice:text
    });
    history=history.slice(-500);
    write(HISTORY_KEY,history);
  }
  async function sync(){
    const current=state();
    if(!current)return;
    try{
      const response=await fetch("/api/save",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:meta.id,state:current,avatar,history})
      });
      if(response.ok){
        const result=await response.json();
        meta.id=result.id;
        write(META_KEY,meta);
      }
    }catch(error){
      console.warn("Server save unavailable; local save retained.",error);
    }
  }
  function renderAvatar(){
    const ring=document.querySelector(".portrait-ring");
    if(!ring)return;
    if(avatar.type==="upload"){
      const current=ring.querySelector("img");
      if(current?.src===avatar.value)return;
      ring.replaceChildren();
      const img=document.createElement("img");
      img.src=avatar.value;
      img.alt="Character portrait";
      ring.appendChild(img);
      return;
    }
    const value=avatar.value||"✦";
    if(ring.childElementCount===0 && ring.textContent===value)return;
    ring.textContent=value;
  }
  function installCreator(){
    const name=document.getElementById("playerName");
    if(!name||document.getElementById("avatarCreator"))return;
    const wrap=document.createElement("div");
    wrap.id="avatarCreator";
    wrap.className="field-group avatar-creator";
    wrap.innerHTML=`<h3>Character Appearance</h3><p class="muted">Choose an icon, upload a picture, or use up to two initials.</p><div class="avatar-tabs"><button type="button" data-avatar-tab="icon">Icons</button><button type="button" data-avatar-tab="initials">Initials</button><button type="button" data-avatar-tab="upload">Upload</button></div><div id="avatarEditor"></div>`;
    name.closest("label").after(wrap);
    const initialTab=["icon","initials","upload"].includes(avatar.type)?avatar.type:"icon";
    renderEditor(initialTab);
    wrap.addEventListener("click",event=>{
      const tab=event.target.closest("[data-avatar-tab]");
      if(tab)renderEditor(tab.dataset.avatarTab);
      const icon=event.target.closest("[data-avatar-icon]");
      if(icon){
        avatar={type:"icon",value:icon.dataset.avatarIcon};
        write(AVATAR_KEY,avatar);
        renderAvatar();
        renderEditor("icon");
      }
    });
  }
  function renderEditor(tab){
    const editor=document.getElementById("avatarEditor");
    if(!editor)return;
    if(tab==="icon"){
      const icons=["✦","⚔","🛡","♜","🐺","🗝","☾","🔥","🌊","⛰","🪶","📖"];
      editor.innerHTML=`<div class="icon-grid">${icons.map(icon=>`<button type="button" class="avatar-icon ${avatar.type==="icon"&&avatar.value===icon?"selected":""}" data-avatar-icon="${icon}">${icon}</button>`).join("")}</div>`;
    }else if(tab==="initials"){
      editor.innerHTML=`<label>Initials<input id="avatarInitials" maxlength="2" value="${avatar.type==="initials"?avatar.value:""}" placeholder="NW"></label>`;
      editor.querySelector("input").addEventListener("input",event=>{
        const value=event.target.value.replace(/[^a-z0-9]/gi,"").slice(0,2).toUpperCase();
        event.target.value=value;
        if(value){
          avatar={type:"initials",value};
          write(AVATAR_KEY,avatar);
          renderAvatar();
        }
      });
    }else{
      editor.innerHTML=`<label>Portrait image<input id="avatarUpload" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="muted">Images are resized before saving.</p>`;
      editor.querySelector("input").addEventListener("change",handleUpload);
    }
  }
  function handleUpload(event){
    const file=event.target.files?.[0];
    if(!file)return;
    if(file.size>8*1024*1024){alert("Please choose an image under 8 MB.");return;}
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      canvas.width=canvas.height=256;
      const ctx=canvas.getContext("2d");
      const scale=Math.max(256/img.width,256/img.height);
      const width=img.width*scale,height=img.height*scale;
      ctx.drawImage(img,(256-width)/2,(256-height)/2,width,height);
      avatar={type:"upload",value:canvas.toDataURL("image/jpeg",.82)};
      write(AVATAR_KEY,avatar);
      renderAvatar();
      URL.revokeObjectURL(img.src);
    };
    img.src=URL.createObjectURL(file);
  }
  function enhanceMap(){
    if(document.getElementById("drawerTitle")?.textContent!=="World Map")return;
    const stage=document.querySelector("#drawerBody .map-stage");
    if(!stage||stage.querySelector(".player-map-marker"))return;
    const location=state()?.world?.location||"roadToWestwood";
    const position=markers[location]||markers.westwood;
    const marker=document.createElement("div");
    marker.className="player-map-marker";
    marker.style.left=position[0]+"%";
    marker.style.top=position[1]+"%";
    marker.innerHTML=`<b>${avatar.type==="upload"?"●":avatar.value||"◆"}</b><span>YOU ARE HERE</span>`;
    stage.appendChild(marker);
  }
  async function applySettings(){
    try{
      const settings=await fetch("/api/settings").then(response=>response.json());
      if(settings.accent)document.documentElement.style.setProperty("--gold",settings.accent);
      if(settings.storySize)document.documentElement.style.setProperty("--story-size",settings.storySize+"px");
      document.documentElement.dataset.choiceConfirm=settings.choiceConfirm===false?"off":"on";
    }catch{
      document.documentElement.dataset.choiceConfirm="on";
    }
  }
  function clearChoice(){
    if(selectedChoice&&selectedChoice.isConnected){
      selectedChoice.innerHTML=selectedChoiceHtml;
      selectedChoice.classList.remove("awaiting-confirmation");
      selectedChoice.setAttribute("aria-pressed","false");
    }
    selectedChoice=null;
    selectedChoiceHtml="";
  }

  document.addEventListener("click",event=>{
    const button=event.target.closest("#choices button");
    if(button&&document.documentElement.dataset.choiceConfirm!=="off"){
      if(button===selectedChoice){
        const text=stripChoiceText(button),before=state();
        button.innerHTML=selectedChoiceHtml;
        button.classList.remove("awaiting-confirmation");
        button.setAttribute("aria-pressed","false");
        selectedChoice=null;
        selectedChoiceHtml="";
        logChoice(text,before);
        setTimeout(()=>{renderAvatar();sync();enhanceMap();},100);
      }else{
        event.preventDefault();
        event.stopImmediatePropagation();
        clearChoice();
        selectedChoice=button;
        selectedChoiceHtml=button.innerHTML;
        button.classList.add("awaiting-confirmation");
        button.setAttribute("aria-pressed","true");
        button.insertAdjacentHTML("beforeend",'<span class="choice-confirmation">Click again to confirm</span>');
        return;
      }
    }else if(button){
      logChoice(stripChoiceText(button),state());
      setTimeout(()=>{sync();enhanceMap();},100);
    }
    if(event.target.closest('[data-panel="map"]'))setTimeout(enhanceMap,60);
    if(event.target.closest("#beginBtn")){
      history=[];
      write(HISTORY_KEY,history);
      meta={id:crypto.randomUUID()};
      write(META_KEY,meta);
      setTimeout(()=>{renderAvatar();sync();},120);
    }
    if(event.target.closest("#saveBtn"))setTimeout(sync,80);
  },true);

  window.addEventListener("load",()=>{
    installCreator();
    renderAvatar();
    applySettings();
    setTimeout(sync,500);
  });
})();
