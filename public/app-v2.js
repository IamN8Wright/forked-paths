(() => {
  const DATA = window.FORKED_PATHS_DATA || {locations:{}};
  const CARDS = window.FK2_DECISION_CARDS || {};
  const SAVE_KEY = "forkedPathsSave.v1"; // kept for account/server compatibility
  const VERSION = "2.0.0";

  const $ = id => document.getElementById(id);
  const els = {
    start:$("startScreen"), create:$("createScreen"), game:$("gameScreen"), newGame:$("newGameBtn"), continueBtn:$("continueBtn"),
    playerName:$("playerName"), originChoices:$("originChoices"), styleChoices:$("styleChoices"), begin:$("beginBtn"), back:$("backToTitle"),
    story:$("storyText"), choices:$("choices"), chapter:$("chapterLabel"), statusName:$("statusName"), health:$("healthVal"),
    healthBar:$("healthBar"), gold:$("goldVal"), location:$("locationVal"), rep:$("repVal"), affinities:$("affinityList"), companion:$("companionVal"),
    saveBtn:$("saveBtn"), drawer:$("drawer"), drawerTitle:$("drawerTitle"), drawerBody:$("drawerBody"), closeDrawer:$("closeDrawer")
  };

  const origins = [
    {id:"forgotten",name:"Forgotten Memories",desc:"Your past is fractured. The body may know things the mind cannot explain."},
    {id:"roadborn",name:"Child of the Road",desc:"Survival, observation, and travel have been your teachers."},
    {id:"oath",name:"Bound by Oath",desc:"A promise, service, or failure still follows your name."},
    {id:"wanderer",name:"Wanderer",desc:"No special legacy. Your identity will be built through play."}
  ];
  const styles = [
    {id:"blade",name:"Blade Discipline",desc:"Measured footwork, single-weapon fundamentals, reliable counters."},
    {id:"brawler",name:"Close-Quarters",desc:"Pressure, grappling, leverage, and durability."},
    {id:"polearm",name:"Reach Discipline",desc:"Distance control, sweeping defense, deliberate commitment."},
    {id:"dual",name:"Twin-Weapon",desc:"Speed, risk, feints, and rapid transitions."},
    {id:"unarmed",name:"Open-Hand",desc:"Balance, timing, redirection, and disciplined body mechanics."}
  ];
  const starts = [
    {id:"roadFork",name:"The Fork",desc:"Begin on the old road where the original beta stories first split."},
    {id:"hoodedStranger",name:"Hometown",desc:"Begin with the scarred stranger, Siren Ring, and Prince’s Coterie mystery."},
    {id:"erisGate",name:"Eris",desc:"Begin at the rebuilt city hub and stress-test the new anti-loop navigation."}
  ];

  let createSelection={origin:null,style:null,start:"roadFork"};
  let state=null;
  let transientCard=null;

  function blankState(){return {
    version:2,
    engineVersion:VERSION,
    player:{name:"Traveler",origin:null,style:null,health:100,maxHealth:100,gold:20,reputation:0,affinities:{Fire:0,Water:0,Earth:0,Wind:0},hiddenForms:[],inventory:[],boons:[],traits:[],skills:{Tracking:0,Survival:0,Persuasion:0,Stealth:0,Investigation:0},knownLocations:[],knowledge:[],falseIdentity:null},
    world:{location:"roadFork",locationStack:["world","roadFork"],day:1,hour:7,discovered:{},flags:{},crime:{wanted:false,warrants:[],heat:0},rumors:[]},
    companion:null,familiars:[],relationships:{},journal:[],scene:"roadFork",
    engine:{visited:{},recent:[],decisions:[],tendencies:{mercy:0,violence:0,curiosity:0,greed:0,loyalty:0,recklessness:0,caution:0,deception:0,compassion:0,vengeance:0,honor:0,cruelty:0,restraint:0,courage:0,diplomacy:0},resolvedObstacles:{},freeformCount:0,loopBreaks:0}
  }};

  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
  function addJournal(title,text){state.journal.unshift({day:state.world.day,title,text});state.journal=state.journal.slice(0,100);}
  function uniquePush(arr,val){if(!arr.includes(val))arr.push(val);}
  function card(id){return transientCard?.id===id?transientCard:CARDS[id];}

  function setLocation(c){
    if(!c)return;
    state.world.location=c.location||state.world.location;
    const stack=[];let cur=c,guard=0;
    while(cur&&guard++<8){stack.unshift(cur.location||cur.id);cur=cur.parent?Object.values(CARDS).find(x=>x.location===cur.parent||x.id===cur.parent):null;}
    if(stack[0]!=="world")stack.unshift("world");
    state.world.locationStack=stack;
    state.world.discovered[state.world.location]=true;
    uniquePush(state.player.knownLocations,state.world.location);
  }

  function applyTendency(obj={}){for(const [k,v] of Object.entries(obj)){state.engine.tendencies[k]=(state.engine.tendencies[k]||0)+Number(v||0);}deriveTraits();}
  function deriveTraits(){
    const t=state.engine.tendencies,p=state.player.traits;
    if((t.courage||0)>=3) uniquePush(p,"Fearless");
    if((t.cruelty||0)>=3||(t.violence||0)>=6) uniquePush(p,"Cold Heart");
    if((t.vengeance||0)>=4&&(t.violence||0)>=3) uniquePush(p,"Zealous Rage");
    if(state.familiars.some(f=>/hawk|falcon/i.test(f.kind||""))) uniquePush(p,"Falconer");
  }

  function applyEffects(e={}){
    if(e.gold)state.player.gold=Math.max(0,state.player.gold+e.gold);
    if(e.reputation)state.player.reputation+=e.reputation;
    if(e.item)uniquePush(state.player.inventory,e.item);
    if(e.trait)uniquePush(state.player.traits,e.trait);
    if(e.knowledge)uniquePush(state.player.knowledge,e.knowledge);
    if(e.flag){state.world.flags[e.flag[0]]=e.flag[1];if(/Resolved$/i.test(e.flag[0]))state.engine.resolvedObstacles[e.flag[0]]=true;}
    if(e.companion){state.companion={...e.companion};state.relationships[e.companion.name]={trust:1,fear:0,affection:0,resentment:0,respect:0,suspicion:0};addJournal("Companion",`${e.companion.name} joined your road.`);}
    if(e.familiar&&!state.familiars.some(f=>f.name===e.familiar.name)){state.familiars.push({...e.familiar});addJournal("Familiar",`${e.familiar.name}, a ${e.familiar.kind}, became part of your story.`);}
  }

  function recordDecision(c,kind="card",raw=null){
    state.engine.decisions.push({at:new Date().toISOString(),day:state.world.day,scene:state.scene,cardId:card(state.scene)?.id||state.scene,kind,text:raw||c?.text||""});
    state.engine.decisions=state.engine.decisions.slice(-500);
  }

  function meaningfulSignature(scene){return JSON.stringify({scene,loc:state.world.location,flags:state.world.flags,items:state.player.inventory,comp:state.companion?.name,traits:state.player.traits});}
  function noteVisit(scene){
    const sig=meaningfulSignature(scene);state.engine.recent.push(sig);state.engine.recent=state.engine.recent.slice(-6);
    state.engine.visited[scene]=(state.engine.visited[scene]||0)+1;
  }
  function loopDetected(){const r=state.engine.recent;if(r.length<5)return false;const last=r[r.length-1];return r.slice(-5).filter(x=>x===last).length>=3;}

  function transition(next){
    if(!CARDS[next]&&next!=="freeformResolution")return;
    state.scene=next;transientCard=null;noteVisit(next);
    render();save(false);
  }

  function resolveChoice(c){
    recordDecision(c);applyTendency(c.tendency);applyEffects(c.effects);
    if(c.action){handleAction(c.action);return;}
    if(c.next)transition(c.next);
  }

  function resolveFreeform(raw){
    const text=String(raw||"").trim();if(!text)return;
    recordDecision(null,"freeform",text);state.engine.freeformCount++;
    const q=text.toLowerCase(),here=state.scene;
    if(/burn|torch|set .*fire/.test(q)&&here.startsWith("xera")){applyEffects({trait:"Pyro"});applyTendency({recklessness:2});return transition("riverToll");}
    if(/recruit|join me|come with|travel with/.test(q)&&here==="riverToll"){applyEffects({companion:{name:"Vernel",kind:"River Nymph",affinity:1}});return transition("erisGate");}
    if(/recruit|join me|come with|travel with/.test(q)&&["wildMan","wildManArmed","rowanTalk"].includes(here)){applyEffects({companion:{name:"Rowan",kind:"Woodsman",affinity:1}});return transition("roadFork");}
    if(/leave|exit|go outside/.test(q)&&here.startsWith("erisInn"))return transition("erisDistrict");
    if(/go.*eris|enter.*eris/.test(q))return transition(state.world.flags.erisEntryResolved?"erisDistrict":"erisGate");
    if(/right fork|go right|take right/.test(q))return transition("wildMan");
    if(/left fork|go left|take left/.test(q))return transition("xeraDoor");
    if(/turn back|go back|return/.test(q)){const c=card(here);const parent=c?.parent;if(parent==="eris"||parent==="erisMarket")return transition("erisDistrict");return transition("roadFork");}
    if(/track|tracks|follow trail/.test(q)){state.player.skills.Tracking=Math.min(10,(state.player.skills.Tracking||0)+1);addJournal("Tracking",`You practiced reading signs while attempting: ${text}`);}
    if(/spare|mercy|comfort|help|heal/.test(q))applyTendency({mercy:1,compassion:1});
    if(/kill|stab|attack|threaten/.test(q))applyTendency({violence:1});
    transientCard={id:"freeformResolution",location:state.world.location,parent:null,chapter:"FREEFORM ACTION",text:[`You attempt: “${text}”`,`The action is now part of the world-state ledger. Forked Kingdoms 2.0 treats the numbered cards as suggestions, not walls. When a freeform action matches a known path it resolves directly; otherwise the engine preserves the attempt and returns control without pretending you chose something else.`],choices:[{text:"Continue from the current situation.",next:here},{text:"Return to the nearest open road.",next:"roadFork"}]};
    state.scene="freeformResolution";render();save(false);
  }

  function setScreen(which){[els.start,els.create,els.game].forEach(x=>x.classList.remove("active"));which.classList.add("active");}
  function selectCards(container,data,key){container.innerHTML="";data.forEach(o=>{const b=document.createElement("button");b.className="select-card";b.innerHTML=`<strong>${o.name}</strong><small>${o.desc}</small>`;b.onclick=()=>{createSelection[key]=o.id;[...container.children].forEach(x=>x.classList.remove("selected"));b.classList.add("selected");validateCreate();};container.appendChild(b);});}
  function renderCreate(){selectCards(els.originChoices,origins,"origin");selectCards(els.styleChoices,styles,"style");let wrap=$("adventureStartChoices");if(!wrap){wrap=document.createElement("div");wrap.className="field-group";wrap.innerHTML='<h3>Opening Adventure</h3><p class="muted">All openings enter the same persistent world.</p><div id="adventureStartChoices" class="choice-grid"></div>';els.styleChoices.closest(".field-group").after(wrap);wrap=$("adventureStartChoices");}selectCards(wrap,starts,"start");wrap.firstElementChild?.classList.add("selected");}
  function validateCreate(){els.begin.disabled=!(createSelection.origin&&createSelection.style&&createSelection.start);}
  function newGame(){state=blankState();createSelection={origin:null,style:null,start:"roadFork"};els.playerName.value="";renderCreate();setScreen(els.create);}
  function beginGame(){state=blankState();state.player.name=els.playerName.value.trim()||"Traveler";state.player.origin=createSelection.origin;state.player.style=createSelection.style;state.scene=createSelection.start;addJournal("The Road",`Your Forked Kingdoms 2.0 journey began at ${createSelection.start}.`);noteVisit(state.scene);setScreen(els.game);render();save(false);}

  function render(){
    if(!state)return;if(state.player.health<=0){els.chapter.textContent="DEATH";els.story.innerHTML="<p>Your journey ends here.</p>";els.choices.innerHTML="";updateStatus();return;}
    const c=card(state.scene);if(!c){console.error("Missing decision card",state.scene);return;}setLocation(c);
    els.chapter.textContent=c.chapter||"FORKED KINGDOMS";
    const lines=typeof c.text==="function"?c.text(state):c.text;els.story.innerHTML=(lines||[]).map(t=>`<p>${esc(t)}</p>`).join("");
    if(loopDetected()){state.engine.loopBreaks++;els.story.insertAdjacentHTML("beforeend",'<div class="system">The engine notices this situation is repeating without meaningful change. A new exit has been exposed.</div>');}
    els.choices.innerHTML="";const choices=typeof c.choices==="function"?c.choices(state):c.choices||[];
    choices.forEach((choice,i)=>{const b=document.createElement("button");const badge=choice.tags?.includes("discovered")?'<span class="path-badge">DISCOVERED PATH</span>':'';b.innerHTML=`<span class="choice-number">${i+1}.</span>${esc(choice.text)}${badge}`;b.onclick=()=>resolveChoice(choice);els.choices.appendChild(b);});
    if(loopDetected()){const b=document.createElement("button");b.innerHTML='<span class="choice-number">↳</span>Break the loop and return to an open road.';b.onclick=()=>transition(state.world.locationStack.includes("eris")?"erisDistrict":"roadFork");els.choices.appendChild(b);}
    const free=document.createElement("div");free.className="freeform-choice";free.innerHTML='<label for="freeformAction">Something else</label><div class="freeform-row"><input id="freeformAction" maxlength="220" placeholder="Type what you actually want to do…"><button id="freeformGo" class="secondary">Do it</button></div><small>The cards are suggestions. Your own action outranks them.</small>';els.choices.appendChild(free);
    const input=$("freeformAction"),go=$("freeformGo");go.onclick=()=>resolveFreeform(input.value);input.addEventListener("keydown",e=>{if(e.key==="Enter")resolveFreeform(input.value);});updateStatus();
  }

  function updateStatus(){els.statusName.textContent=state.player.name;els.health.textContent=state.player.health;els.healthBar.style.width=`${state.player.health/state.player.maxHealth*100}%`;els.gold.textContent=state.player.gold;const loc=DATA.locations?.[state.world.location]?.name||state.world.location.replace(/([A-Z])/g," $1").replace(/^./,m=>m.toUpperCase());els.location.textContent=loc;els.rep.textContent=state.player.reputation;els.affinities.innerHTML=Object.entries(state.player.affinities).map(([k,v])=>`<div class="aff-row"><span>${k}</span><strong>${v}/10</strong></div>`).join("");els.companion.textContent=state.companion?`${state.companion.name} · ${state.companion.kind}`:state.familiars.length?state.familiars.map(f=>f.name).join(", "):"None";}
  function save(show=true){if(!state)return;localStorage.setItem(SAVE_KEY,JSON.stringify(state));els.continueBtn.disabled=false;if(show)toast("Game saved.");}
  function migrate(s){if(!s)return null;if(Number(s.version)>=2)return s;const n=blankState();n.player={...n.player,...(s.player||{})};n.world={...n.world,...(s.world||{}),locationStack:["world",s.world?.location||"roadFork"]};n.companion=s.companion||null;n.journal=s.journal||[];n.scene=CARDS[s.scene]?s.scene:"roadFork";addJournal.call({state:n},"Migration","Legacy save migrated to Forked Kingdoms 2.0.");return n;}
  function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;const old=JSON.parse(raw);state=Number(old.version)>=2?old:(()=>{const n=blankState();n.player={...n.player,...(old.player||{})};n.world={...n.world,...(old.world||{})};n.companion=old.companion||null;n.journal=old.journal||[];n.scene=CARDS[old.scene]?old.scene:"roadFork";n.journal.unshift({day:n.world.day||1,title:"Engine 2.0",text:"Legacy character state migrated into the 2.0 world ledger."});return n;})();setScreen(els.game);render();save(false);}catch(e){console.error(e);}}
  function toast(msg){const t=document.createElement("div");t.textContent=msg;Object.assign(t.style,{position:"fixed",left:"50%",bottom:"70px",transform:"translateX(-50%)",background:"#d8ad53",color:"#17120d",padding:"10px 18px",zIndex:100,fontWeight:"bold",borderRadius:"3px"});document.body.appendChild(t);setTimeout(()=>t.remove(),1500);}
  function openDrawer(title,html){els.drawerTitle.textContent=title;els.drawerBody.innerHTML=html;els.drawer.classList.add("open");els.drawer.setAttribute("aria-hidden","false");}
  function journalHtml(){return state.journal.length?state.journal.map(j=>`<div class="list-card"><h3>${esc(j.title)}</h3><p>Day ${j.day} · ${esc(j.text)}</p></div>`).join(""):'<p class="muted">No journal entries yet.</p>';}
  function inventoryHtml(){return `<div class="list-card"><h3>Items</h3><p>${state.player.inventory.map(esc).join(", ")||"None"}</p></div><div class="list-card"><h3>Familiars</h3><p>${state.familiars.map(f=>esc(`${f.name} · ${f.kind}`)).join("<br>")||"None"}</p></div><div class="list-card"><h3>Boons</h3><p>${state.player.boons.map(esc).join(", ")||"None"}</p></div>`;}
  function characterHtml(){return `<div class="list-card"><h3>${esc(state.player.name)}</h3><p>Traits: ${state.player.traits.map(esc).join(", ")||"Still emerging"}<br>Skills: ${Object.entries(state.player.skills).map(([k,v])=>`${esc(k)} ${v}/10`).join(" · ")}</p></div><div class="list-card"><h3>World Ledger</h3><p>Decisions recorded: ${state.engine.decisions.length}<br>Freeform actions: ${state.engine.freeformCount}<br>Loop interventions: ${state.engine.loopBreaks}</p></div>`;}
  function mapHtml(){return `<div class="list-card"><h3>Location Stack</h3><p>${state.world.locationStack.map(esc).join(" → ")}</p></div><div class="list-card"><h3>Known Locations</h3><p>${state.player.knownLocations.map(esc).join(", ")}</p></div>`;}
  function handleAction(action){if(action==="map")openDrawer("World Map",mapHtml());if(action==="journal")openDrawer("Journal",journalHtml());if(action==="inventory")openDrawer("Inventory",inventoryHtml());if(action==="character")openDrawer("Character",characterHtml());if(action==="save")save(true);}

  els.newGame.onclick=newGame;els.continueBtn.onclick=load;els.begin.onclick=beginGame;els.back.onclick=()=>setScreen(els.start);els.saveBtn.onclick=()=>save(true);els.closeDrawer.onclick=()=>{els.drawer.classList.remove("open");els.drawer.setAttribute("aria-hidden","true")};document.querySelectorAll(".utility-card [data-panel]").forEach(b=>b.onclick=()=>handleAction(b.dataset.panel));
  $("menuBtn").onclick=()=>openDrawer("Forked Kingdoms 2.0",`<div class="list-card"><h3>InN8 Labs</h3><p>Forked Kingdoms Engine v${VERSION}</p><p>Decision Cards + persistent world ledger + freeform intent + anti-loop navigation.</p></div><button class="primary" onclick="localStorage.removeItem('${SAVE_KEY}');location.reload()">Return to Title & Clear Local Save</button>`);
  els.continueBtn.disabled=!localStorage.getItem(SAVE_KEY);
})();