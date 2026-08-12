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
  let meta = read(META_KEY,{id:crypto.randomUUID(),claimToken:crypto.randomUUID()});
  let selectedChoice = null;
  let selectedChoiceHtml = "";
  let playerAccount = null;
  let playerCharacters = [];

  if(!meta.id) meta.id = crypto.randomUUID();
  if(!meta.claimToken) meta.claimToken = crypto.randomUUID();
  write(META_KEY,meta);

  function read(key,fallback){
    try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}
  }
  function write(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function state(){return read(SAVE_KEY,null);}
  function escapeHtml(value){
    return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  }
  function pretty(value){
    return String(value||"Unknown")
      .replace(/([a-z])([A-Z])/g,"$1 $2")
      .replace(/[_-]+/g," ")
      .replace(/\b\w/g,c=>c.toUpperCase());
  }
  function avatarMarkup(value=avatar,size="normal"){
    const cls=size==="small"?"hub-avatar small":"hub-avatar";
    if(value?.type==="upload"&&/^data:image\//.test(value.value||"")){
      return `<span class="${cls}"><img src="${escapeHtml(value.value)}" alt=""></span>`;
    }
    return `<span class="${cls}">${escapeHtml(value?.value||"✦")}</span>`;
  }
  async function api(url,options={}){
    const response=await fetch(url,{
      headers:{"Content-Type":"application/json",...(options.headers||{})},
      ...options
    });
    let body={};
    try{body=await response.json();}catch{}
    if(!response.ok)throw new Error(body.error||"Request failed");
    return body;
  }
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
    if(!current)return false;
    try{
      const result=await api("/api/save",{
        method:"POST",
        body:JSON.stringify({id:meta.id,claimToken:meta.claimToken,state:current,avatar,history})
      });
      meta.id=result.id;
      write(META_KEY,meta);
      return true;
    }catch(error){
      console.warn("Server save unavailable; local save retained.",error);
      return false;
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
      editor.innerHTML=`<label>Initials<input id="avatarInitials" maxlength="2" value="${avatar.type==="initials"?escapeHtml(avatar.value):""}" placeholder="NW"></label>`;
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
    marker.innerHTML=`<b>${avatar.type==="upload"?"●":escapeHtml(avatar.value||"◆")}</b><span>YOU ARE HERE</span>`;
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

  function openHubShell(){
    const drawer=document.getElementById("drawer");
    document.getElementById("drawerTitle").textContent="Player Hub";
    document.getElementById("drawerBody").innerHTML=`<div class="hub-loading">Opening your traveler ledger…</div>`;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
  }
  async function loadPlayerAccount(){
    try{
      const session=await api("/api/player/session");
      playerAccount={email:session.email};
      const result=await api("/api/player/characters");
      playerCharacters=result.characters||[];
    }catch{
      playerAccount=null;
      playerCharacters=[];
    }
  }
  function currentIsLinked(){
    return !!playerCharacters.find(character=>character.id===meta.id);
  }
  function currentStatsHtml(){
    const current=state();
    if(!current){
      return `<section class="hub-section"><h3>Current Character</h3><p class="muted">No character is active on this device.</p></section>`;
    }
    const p=current.player||{},w=current.world||{};
    const affinities=Object.entries(p.affinities||{}).map(([name,value])=>`<div class="hub-stat"><span>${escapeHtml(name)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
    const linked=currentIsLinked();
    return `<section class="hub-section current-character">
      <div class="hub-character-head">${avatarMarkup(avatar)}<div><div class="eyebrow">${linked?"ACCOUNT CHARACTER":"LOCAL CHARACTER"}</div><h3>${escapeHtml(p.name||"Traveler")}</h3><p>${escapeHtml(pretty(p.origin))} · ${escapeHtml(pretty(p.style))}</p></div></div>
      <div class="hub-stat-grid">
        <div class="hub-stat"><span>Health</span><strong>${escapeHtml(p.health??0)} / ${escapeHtml(p.maxHealth??100)}</strong></div>
        <div class="hub-stat"><span>Gold</span><strong>${escapeHtml(p.gold??0)}</strong></div>
        <div class="hub-stat"><span>Location</span><strong>${escapeHtml(pretty(w.location))}</strong></div>
        <div class="hub-stat"><span>Reputation</span><strong>${escapeHtml(p.reputation??0)}</strong></div>
        <div class="hub-stat"><span>Day</span><strong>${escapeHtml(w.day??1)}</strong></div>
        <div class="hub-stat"><span>Companion</span><strong>${escapeHtml(current.companion?.name||current.companion?.kind||"None")}</strong></div>
      </div>
      <div class="hub-affinities"><div class="eyebrow">Elemental Affinity</div>${affinities||'<p class="muted">None discovered.</p>'}</div>
      ${playerAccount&&!linked?`<div class="link-callout"><strong>Bring this character into your account.</strong><p>This keeps your existing adventure and makes it available on your other devices.</p><button class="primary" data-player-action="link">Link This Character</button></div>`:""}
      ${!playerAccount?`<p class="muted hub-note">Sign in or create an account below to link this existing character without restarting.</p>`:""}
    </section>`;
  }
  function accountHtml(){
    if(playerAccount){
      return `<section class="hub-section">
        <div class="hub-section-title"><div><div class="eyebrow">PLAYER ACCOUNT</div><h3>${escapeHtml(playerAccount.email)}</h3></div><button class="ghost-btn" data-player-action="logout">Sign Out</button></div>
        <p class="muted">Characters linked to this account can be retrieved on another device after signing in.</p>
      </section>`;
    }
    return `<section class="hub-section">
      <div class="eyebrow">PLAYER ACCOUNT</div>
      <h3>Sign in to retrieve your travelers</h3>
      <p class="muted">Existing games are safe. After signing in, use <strong>Link This Character</strong> to attach the character already on this device.</p>
      <div class="player-login-form">
        <label>Email<input id="playerAccountEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
        <label>Password<input id="playerAccountPassword" type="password" autocomplete="current-password" minlength="8" maxlength="128"></label>
        <div class="hub-actions"><button class="primary" data-player-action="login">Sign In</button><button class="secondary" data-player-action="register">Create Account</button></div>
      </div>
    </section>`;
  }
  function characterLibraryHtml(){
    if(!playerAccount)return "";
    const current=playerCharacters.find(character=>character.id===meta.id);
    const shelved=playerCharacters.filter(character=>character.id!==meta.id);
    const currentHtml=current?`<div class="account-character active">${avatarMarkup(current.avatar,"small")}<div><strong>${escapeHtml(current.name)}</strong><small>${escapeHtml(pretty(current.location))} · Day ${escapeHtml(current.day||1)}</small></div><span class="character-badge">Playing</span></div>`:"";
    const shelves=shelved.length?shelved.map(character=>`<div class="account-character">${avatarMarkup(character.avatar,"small")}<div><strong>${escapeHtml(character.name)}</strong><small>${escapeHtml(pretty(character.location))} · Day ${escapeHtml(character.day||1)}<br>Last played ${escapeHtml(new Date(character.updatedAt).toLocaleString())}</small></div><button class="secondary compact" data-player-action="switch" data-character-id="${escapeHtml(character.id)}">Play</button></div>`).join(""):`<p class="muted">No other characters are shelved on this account yet.</p>`;
    return `<section class="hub-section"><div class="eyebrow">YOUR CHARACTERS</div><h3>Traveler Shelf</h3>${currentHtml}<div class="shelf-list">${shelves}</div></section>`;
  }
  async function refreshPlayerHub(message=""){
    await loadPlayerAccount();
    const body=document.getElementById("drawerBody");
    if(!body||document.getElementById("drawerTitle")?.textContent!=="Player Hub")return;
    body.innerHTML=`<div class="player-hub">${message?`<div class="hub-message">${escapeHtml(message)}</div>`:""}${currentStatsHtml()}${accountHtml()}${characterLibraryHtml()}<section class="hub-section hub-footer-actions"><button class="secondary" data-player-action="title">Return to Title</button><button class="danger-outline" data-player-action="clear-local">Clear Local Character</button><div class="engine-line">InN8 Labs · Forked Paths Engine v0.3.0</div></section></div>`;
  }
  async function openPlayerHub(){
    openHubShell();
    await refreshPlayerHub();
  }
  async function accountAction(action,button){
    if(action==="login"||action==="register"){
      const email=document.getElementById("playerAccountEmail")?.value||"";
      const password=document.getElementById("playerAccountPassword")?.value||"";
      if(!email||!password){await refreshPlayerHub("Enter your email and password.");return;}
      try{
        await api(`/api/player/${action}`,{method:"POST",body:JSON.stringify({email,password})});
        await sync();
        await refreshPlayerHub(action==="register"?"Account created. Link your current character below, or start a new traveler.":"Signed in. Your account characters are ready.");
      }catch(error){await refreshPlayerHub(error.message);}
      return;
    }
    if(action==="logout"){
      await api("/api/player/logout",{method:"POST"}).catch(()=>{});
      playerAccount=null;playerCharacters=[];
      await refreshPlayerHub("Signed out. Your current local save remains on this device.");
      return;
    }
    if(action==="link"){
      if(!state())return;
      const saved=await sync();
      if(!saved){await refreshPlayerHub("The current character could not be synchronized. Try again.");return;}
      try{
        await api("/api/player/claim",{method:"POST",body:JSON.stringify({id:meta.id,claimToken:meta.claimToken})});
        await refreshPlayerHub("Character linked. This traveler now follows your account.");
      }catch(error){await refreshPlayerHub(error.message);}
      return;
    }
    if(action==="switch"){
      const id=button.dataset.characterId;
      if(!id||id===meta.id)return;
      if(state()&&!currentIsLinked()){
        alert("Link the current local character first so it is not left behind when you switch.");
        return;
      }
      await sync();
      try{
        const record=await api(`/api/player/characters/${encodeURIComponent(id)}`);
        write(SAVE_KEY,record.state);
        avatar=record.avatar||{type:"icon",value:"✦"};
        history=Array.isArray(record.history)?record.history:[];
        meta={id:record.id,claimToken:crypto.randomUUID()};
        write(AVATAR_KEY,avatar);
        write(HISTORY_KEY,history);
        write(META_KEY,meta);
        location.reload();
      }catch(error){await refreshPlayerHub(error.message);}
      return;
    }
    if(action==="title"){
      location.href="/";
      return;
    }
    if(action==="clear-local"){
      if(confirm("Clear the character stored on this device? Linked account characters remain on the server.")){
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(AVATAR_KEY);
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(META_KEY);
        location.reload();
      }
    }
  }

  document.addEventListener("click",event=>{
    const menuButton=event.target.closest("#menuBtn");
    if(menuButton){
      event.preventDefault();
      event.stopImmediatePropagation();
      openPlayerHub();
      return;
    }

    const playerAction=event.target.closest("[data-player-action]");
    if(playerAction){
      event.preventDefault();
      event.stopImmediatePropagation();
      accountAction(playerAction.dataset.playerAction,playerAction);
      return;
    }

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
      meta={id:crypto.randomUUID(),claimToken:crypto.randomUUID()};
      write(META_KEY,meta);
      setTimeout(()=>{renderAvatar();sync();},120);
    }
    if(event.target.closest("#saveBtn"))setTimeout(sync,80);
  },true);

  document.addEventListener("keydown",event=>{
    if(event.key==="Enter"&&event.target.id==="playerAccountPassword"){
      event.preventDefault();
      const button=document.querySelector('[data-player-action="login"]');
      if(button)accountAction("login",button);
    }
  },true);

  window.addEventListener("load",()=>{
    installCreator();
    renderAvatar();
    applySettings();
    setTimeout(sync,500);
  });
})();
