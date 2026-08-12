(() => {
  const DATA = window.FORKED_PATHS_DATA;
  const SAVE_KEY = "forkedPathsSave.v1";

  const els = {
    start: document.getElementById("startScreen"),
    create: document.getElementById("createScreen"),
    game: document.getElementById("gameScreen"),
    newGame: document.getElementById("newGameBtn"),
    continueBtn: document.getElementById("continueBtn"),
    playerName: document.getElementById("playerName"),
    originChoices: document.getElementById("originChoices"),
    styleChoices: document.getElementById("styleChoices"),
    begin: document.getElementById("beginBtn"),
    back: document.getElementById("backToTitle"),
    story: document.getElementById("storyText"),
    choices: document.getElementById("choices"),
    chapter: document.getElementById("chapterLabel"),
    statusName: document.getElementById("statusName"),
    health: document.getElementById("healthVal"),
    healthBar: document.getElementById("healthBar"),
    gold: document.getElementById("goldVal"),
    location: document.getElementById("locationVal"),
    rep: document.getElementById("repVal"),
    affinities: document.getElementById("affinityList"),
    companion: document.getElementById("companionVal"),
    saveBtn: document.getElementById("saveBtn"),
    drawer: document.getElementById("drawer"),
    drawerTitle: document.getElementById("drawerTitle"),
    drawerBody: document.getElementById("drawerBody"),
    closeDrawer: document.getElementById("closeDrawer")
  };

  const origins = [
    {id:"forgotten", name:"Forgotten Memories", desc:"Your past is fractured. The body may know things the mind cannot explain."},
    {id:"roadborn", name:"Child of the Road", desc:"Survival, observation, and travel have been your teachers."},
    {id:"oath", name:"Bound by Oath", desc:"A promise, service, or failure still follows your name."},
    {id:"wanderer", name:"Wanderer", desc:"No special legacy. Your identity will be built entirely through play."}
  ];

  const styles = [
    {id:"blade", name:"Blade Discipline", desc:"Measured footwork, single-weapon fundamentals, reliable counters."},
    {id:"brawler", name:"Close-Quarters", desc:"Pressure, grappling, leverage, and hard-earned durability."},
    {id:"polearm", name:"Reach Discipline", desc:"Distance control, sweeping defense, deliberate commitment."},
    {id:"dual", name:"Twin-Weapon", desc:"Speed, risk, feints, and rapid transitions."},
    {id:"unarmed", name:"Open-Hand", desc:"Balance, timing, redirection, and disciplined body mechanics."}
  ];

  let createSelection = {origin:null, style:null};
  let state = null;

  function blankState(){
    return {
      version: 1,
      player: {
        name: "Traveler",
        origin: null,
        style: null,
        health: 100,
        maxHealth: 100,
        gold: 3,
        reputation: 0,
        deception: "Medium",
        acting: "Medium",
        improvisation: "Low",
        affinities: {Fire:0, Water:0, Earth:0, Wind:0},
        hiddenForms: [],
        inventory: [],
        boons: [],
        knownLocations: ["westwood"],
        falseIdentity: null
      },
      world: {
        location: "roadToWestwood",
        day: 1,
        hour: 7,
        discovered: {},
        flags: {},
        crime: {wanted:false, warrants:[], heat:0}
      },
      companion: null,
      journal: [],
      scene: "opening"
    };
  }

  const scenes = {
    opening: {
      chapter: "PROLOGUE · THE ROAD",
      text: s => [
        `Morning mist lies low across a narrow road. ${s.player.name} has been walking long enough for the rhythm of boots and breath to become its own kind of thought.`,
        `Westwood lies somewhere ahead. The road forks around an old stand of trees, and from the brush comes a strange sound: not quite a bark, not quite a cry.`,
        `Nothing in the road demands your attention. That may be why the sound does.`
      ],
      choices: [
        {text:"Investigate the strange sound near the road.", next:"wolfFound"},
        {text:"Keep walking toward Westwood.", next:"westwoodApproach"},
        {text:"Call out from the road and wait.", next:"callOut"},
        {text:"Study the brush for signs of a trap.", next:"inspectBrush"}
      ]
    },

    callOut: {
      chapter: "THE ROAD",
      text: () => [
        `Your voice travels farther than expected. The brush answers with a small yelp and a frantic scratching sound.`,
        `Whatever is in there is alive, frightened, and close.`
      ],
      choices: [
        {text:"Go investigate.", next:"wolfFound"},
        {text:"Leave it and continue to Westwood.", next:"westwoodApproach"}
      ]
    },

    inspectBrush: {
      chapter: "THE ROAD",
      text: s => [
        `You crouch and read the roadside as best you can. Bent grass. A dragged paw-print. No boot tracks waiting in ambush.`,
        `The sound comes again, weaker this time.`,
        s.player.origin === "roadborn" ? `Something in your experience says this is distress, not bait.` : `You cannot prove it is safe, but nothing here looks deliberately staged.`
      ],
      choices: [
        {text:"Investigate.", next:"wolfFound"},
        {text:"Continue to Westwood.", next:"westwoodApproach"}
      ]
    },

    wolfFound: {
      chapter: "THE ROAD · A STRANGE SOUND",
      enter: s => {
        s.world.flags.wolfEncountered = true;
      },
      text: () => [
        `At the bottom of the shallow embankment, a wolf pup is wedged between roots and stone. One paw is trapped.`,
        `It bares tiny teeth when you approach. The warning is brave. The tremble beneath it is not.`,
        `Its eyes never leave your hands.`
      ],
      choices: [
        {text:"Approach slowly and free the trapped paw.", next:"wolfFreed", effects:[["wolf","gain"]]},
        {text:"Try to cut the roots quickly before it can bite.", next:"wolfRisk"},
        {text:"Leave the wild animal alone.", next:"westwoodApproach"}
      ]
    },

    wolfRisk: {
      chapter: "THE ROAD",
      text: () => [
        `You move too quickly. The pup snaps, misses your wrist by an inch, and thrashes hard enough to tighten the roots around its paw.`,
        `Speed is making this worse.`
      ],
      choices: [
        {text:"Slow down. Let it see your hands. Try again.", next:"wolfFreed", effects:[["wolf","gain"]]},
        {text:"Back away and leave.", next:"westwoodApproach"}
      ]
    },

    wolfFreed: {
      chapter: "THE ROAD · COMPANION",
      enter: s => {
        if(!s.companion){
          s.companion = {kind:"Wolf Pup", name:"Wolf Pup", affinity:1, ageMonths:0, hunger:"fed", trustWarnings:0};
          addJournal(s, "Wolf Pup", "A wolf pup chose to follow after being freed from roots beside the road.");
        }
      },
      text: () => [
        `The root gives. The pup scrambles backward, favoring the paw.`,
        `It could run. It does not.`,
        `After a long stare it circles you once, sits, and waits as though the next decision belongs to both of you.`
      ],
      choices: [
        {text:"Continue toward Westwood and let it choose whether to follow.", next:"dangerWarning"},
        {text:"Offer it some of your food first.", next:"feedPup", effects:[["wolfAffinity",0.5]]}
      ]
    },

    feedPup: {
      chapter: "THE ROAD",
      text: () => [
        `You set down a proper piece of food rather than a scrap. The pup waits until you lean back before eating.`,
        `When you start walking again, its paws fall into the road behind yours.`
      ],
      choices: [
        {text:"Continue toward Westwood.", next:"dangerWarning"}
      ]
    },

    dangerWarning: {
      chapter: "THE ROAD · DANGER SENSE",
      text: () => [
        `Westwood's roofs are finally visible through the trees.`,
        `The pup abruptly stops.`,
        `Its shoulders lower. A growl rolls out of it toward the brush on the opposite side of the road.`,
        `Nothing moves there. Not yet.`
      ],
      choices: [
        {text:"Your Wolf Pup bears down and growls. Draw your weapon and prepare.", next:"banditReveal", effects:[["trustWarning",1]]},
        {text:"Ignore the growl and keep walking toward Westwood.", next:"banditAmbush"},
        {text:"Back away from the suspected danger and find another approach.", next:"westwoodApproach"}
      ]
    },

    banditReveal: {
      chapter: "THE ROAD · COMBAT",
      text: () => [
        `Your weapon clears its sheath before the first man steps from cover.`,
        `Three would-be robbers freeze when they realize the surprise is gone. The pup darts forward, barking and snapping just outside their reach.`,
        `One attacker glances down at it at exactly the wrong moment.`
      ],
      choices: [
        {text:"Exploit the distraction and strike the nearest attacker.", next:"combatWin", effects:[["health",-6],["reputation",1]]},
        {text:"Demand they leave while you still have the advantage.", next:"banditsFlee", effects:[["reputation",1]]}
      ]
    },

    banditAmbush: {
      chapter: "THE ROAD · AMBUSH",
      enter: s => adjustHealth(s,-18),
      text: () => [
        `You get three more steps before the brush erupts.`,
        `The pup's growl was the warning. Ignoring it costs you.`,
        `A club catches you across the shoulder before you can fully turn.`
      ],
      choices: [
        {text:"Fight through the ambush.", next:"combatWin", effects:[["health",-10]]},
        {text:"Break away and run for Westwood.", next:"westwoodApproach", effects:[["health",-4]]}
      ]
    },

    banditsFlee: {
      chapter: "THE ROAD",
      text: () => [
        `You hold your ground. The pup's teeth and your ready weapon make the arithmetic unappealing.`,
        `The robbers retreat into the trees with more curses than courage.`
      ],
      choices: [{text:"Continue to Westwood.",next:"westwoodApproach"}]
    },

    combatWin: {
      chapter: "THE ROAD · AFTERMATH",
      enter: s => {
        if(s.player.origin === "forgotten" && !s.world.flags.hiddenSeed){
          s.world.flags.hiddenSeed = choose(["Water","Fire","Earth","Wind"]);
        }
      },
      text: s => [
        `The fight ends quickly enough to leave you wondering which movements were deliberate and which arrived before thought.`,
        s.world.flags.hiddenSeed ? `For a moment, your body settles into a stance you do not remember learning. Then it is gone.` : `The wolf pup returns to your side, still vibrating with nervous courage.`,
        `Westwood waits ahead.`
      ],
      choices:[{text:"Enter Westwood.",next:"westwoodApproach"}]
    },

    westwoodApproach: {
      chapter: "WESTWOOD",
      enter: s => {
        s.world.location = "westwood";
        discover(s,"westwood");
      },
      text: s => [
        `Westwood sits where the maintained road begins to lose its argument with the wild.`,
        `A timber gate stands open. Traders, hunters, and road-weary strangers pass beneath the watch of two guards.`,
        s.companion ? `One of the guards looks from you to the wolf pup and raises an eyebrow. "Didn't know wolves had taken to the road."` : `The guards give you the quick inspection reserved for strangers who have not yet become problems.`
      ],
      choices: [
        {text:"Ask the guards about trouble on the road.",next:"guardTalk"},
        {text:"Find an inn and get your bearings.",next:"inn"},
        {text:"Leave town again and explore the road east.",next:"eastRoad"},
        {text:"Check your map.", action:"map"}
      ]
    },

    guardTalk: {
      chapter:"WESTWOOD · GATE",
      text:()=>[
        `The older guard tells you road robberies have become more organized.`,
        `"Not armies," he says. "Just enough hungry men learning that travelers are easier than honest work."`,
        `His partner studies you with the uncomfortable thoroughness of someone trained to remember faces.`
      ],
      choices:[
        {text:"Ask about Eridyn.",next:"eridynRumor"},
        {text:"Ask about the Darkwood.",next:"darkwoodRumor"},
        {text:"Head to the inn.",next:"inn"}
      ]
    },

    eridynRumor: {
      chapter:"WESTWOOD · RUMOR",
      enter:s=>discover(s,"eridyn"),
      text:()=>[
        `"Eridyn?" The guard's expression tightens.`,
        `"Ruins. Wind. Old stories that are safer when they stay stories. Once ruled everything you can put on a map."`,
        `"And if someone invites you to supper in the Court of the Broken Throne," he adds, "don't be rude enough to refuse."`
      ],
      choices:[{text:"Head into town.",next:"inn"}]
    },

    darkwoodRumor: {
      chapter:"WESTWOOD · RUMOR",
      enter:s=>discover(s,"whisperingMeadow"),
      text:()=>[
        `"The Darkwood has paths," the guard says. "That is not the same thing as saying it has roads."`,
        `He points vaguely west. "If you find a meadow that whispers, listen before you decide it's welcoming you."`
      ],
      choices:[{text:"Head into town.",next:"inn"}]
    },

    inn: {
      chapter:"WESTWOOD · EVENING",
      text:s=>[
        `The inn smells of stew, wet wool, and smoke. It is ordinary enough to feel almost suspicious after the road.`,
        s.player.origin === "forgotten" ? `As you settle in, a movement in your wrist nags at you. A posture. A breath. Something waiting for morning.` : `For the first time today, nothing asks you to make an immediate decision.`
      ],
      choices:[
        {text:"Sleep and rise early.",next:"morning"},
        {text:"Listen for rumors before bed.",next:"innRumors"}
      ]
    },

    innRumors: {
      chapter:"WESTWOOD · RUMORS",
      text:()=>[
        `You hear three names repeated more than once: Thieve's Run, where everyone jokes about thieves and travelers sleep easier than anywhere else; Eridyn, where the wind has never forgiven the dead; and a woman called Mira who may be a thief, a liar, or both.`,
        `Nobody agrees which description is complimentary.`
      ],
      choices:[{text:"Sleep.",next:"morning"}]
    },

    morning: {
      chapter:"WESTWOOD · MORNING",
      enter:s=>{s.world.day+=1;s.world.hour=6;},
      text:s=>{
        const lines=[`You wake before the room is properly light.`];
        if(s.player.origin==="forgotten"){
          lines.push(`Without deciding to, you dress and walk beyond the last houses to a small clearing silvered with dew.`);
          lines.push(`Your feet stop exactly where they seem to expect the ground to be.`);
        } else {
          lines.push(`The road is quiet. Westwood has not yet decided to become noisy.`);
        }
        return lines;
      },
      choices:s=> s.player.origin==="forgotten"
        ? [{text:"Let instinct guide your body.",next:"firstKata"}]
        : [{text:"Return to the road.",next:"eastRoad"}]
    },

    firstKata: {
      chapter:"FORGOTTEN MEMORIES · KATA",
      enter:s=>{
        const elem=s.world.flags.hiddenSeed || "Water";
        s.world.flags.hiddenSeed=elem;
        s.world.flags.kataCount=(s.world.flags.kataCount||0)+1;
        if(!s.player.hiddenForms.includes(formName(elem))) s.player.hiddenForms.push(formName(elem));
        addJournal(s,"A Form Remembered",`Your body revealed mastery of ${formName(elem)}, though you do not remember learning it.`);
      },
      text:s=>{
        const elem=s.world.flags.hiddenSeed;
        const base=[
          `The first movement arrives before the thought of making it.`,
          `Then another. Turn. Step. Strike. Recover. Your breathing finds a cadence your mind cannot name.`,
        ];
        if(elem==="Water"){
          base.push(`Dew gathers along the grass around your feet. At the final sequence, droplets fling into the morning air.`);
          if(s.companion) base.push(`The wolf pup launches after them, snapping at glittering beads of water and skidding through the wet grass with delighted confusion.`);
          base.push(`For one bright second the droplets seem to follow the path of your hands before falling.`);
        } else if(elem==="Fire"){
          base.push(`The cold morning air warms against your skin as each strike lands against an opponent only your body remembers.`);
        } else if(elem==="Earth"){
          base.push(`Each stance settles with uncanny certainty. Loose pebbles tremble beneath your final rooted step.`);
        } else {
          base.push(`The clearing's air begins to move with you. At the final turn, leaves spiral upward without any wind you can feel.`);
        }
        base.push(`<div class="system">Hidden Martial Art remembered: <strong>${formName(elem)}</strong>. The knowledge is yours. The memory of learning it is not.</div>`);
        return base;
      },
      choices:[
        {text:"Try to remember who taught you.",next:"memoryStrain"},
        {text:"Stop forcing memory. Let the body keep what it knows.",next:"miraIntro"}
      ]
    },

    memoryStrain:{
      chapter:"FORGOTTEN MEMORIES",
      text:()=>[
        `You reach for the memory and find resistance, not emptiness.`,
        `A voice almost surfaces. A hand correcting your elbow. The shape of a doorway. Then pain blooms behind your eyes and the image tears away.`,
        `Whatever happened to your past, it does not intend to surrender all at once.`
      ],
      choices:[{text:"Return your attention to the clearing.",next:"miraIntro"}]
    },

    miraIntro:{
      chapter:"WESTWOOD OUTSKIRTS · A STRANGER",
      enter:s=>{s.world.flags.miraMet=true;addJournal(s,"Mira","A sharp-eyed traveler named Mira witnessed your morning kata.");},
      text:s=>[
        `You are not alone.`,
        `A woman stands at the edge of the clearing. She is not hiding, exactly, though you have no idea how long she has been there.`,
        `She waits until you are fully still before stepping closer.`,
        `"That's not something people just do," she says.`,
        `Her eyes follow the last of the disturbed dew${s.companion ? `, then flick toward the wolf pup` : ``}.`,
        `"Mira," she says, offering the name and nothing else. "And you look less like someone learning a technique than someone who forgot they already owned it."`
      ],
      choices:[
        {text:"Ask Mira what she knows about the form.",next:"miraFormTalk"},
        {text:"Ask why she was watching you.",next:"miraWhy"},
        {text:"Tell her your memory is none of her business.",next:"miraBoundary"}
      ]
    },

    miraFormTalk:{
      chapter:"MIRA",
      text:s=>[
        `"Enough to know it shouldn't be common," Mira says.`,
        `"Not enough to explain you."`,
        `She smiles slightly. "Which is irritating. I prefer mysteries after I've stolen the answer."`
      ],
      choices:[{text:"Return to Westwood with Mira.",next:"freeRoam"}]
    },

    miraWhy:{
      chapter:"MIRA",
      text:()=>[
        `"Because people who move like that are either very interesting or very dangerous."`,
        `Mira considers the distinction.`,
        `"Usually both."`
      ],
      choices:[{text:"Return to Westwood.",next:"freeRoam"}]
    },

    miraBoundary:{
      chapter:"MIRA",
      text:()=>[
        `Mira's smile widens rather than vanishes.`,
        `"Good. You do have instincts."`,
        `She backs away with exaggerated politeness. "I'll wait until your business decides to become mine."`
      ],
      choices:[{text:"Return to Westwood.",next:"freeRoam"}]
    },

    eastRoad:{
      chapter:"THE ROAD",
      text:()=>[
        `The eastern road leaves Westwood in a slow bend through open country.`,
        `Nothing dramatic happens immediately. In this world, that is not the same as nothing happening.`
      ],
      choices:[
        {text:"Return to Westwood.",next:"westwoodApproach"},
        {text:"Camp and advance time.",next:"morning"}
      ]
    },

    freeRoam:{
      chapter:"WESTWOOD · FREE ROAM",
      text:s=>[
        `For now, Westwood is yours to use as a base.`,
        `The game engine has moved beyond the scripted onboarding. From here the data systems can grow into the larger Forked Paths world without replacing your save.`,
        s.player.origin==="forgotten" ? `Your remembered form remains unresolved. Repeated kata, combat use, elemental affinity, Eridyn, and certain Fae can all pull at that thread.` : `Nothing in your story is predetermined.`
      ],
      choices:[
        {text:"Practice morning kata.",next:"morning"},
        {text:"Review the world map.",action:"map"},
        {text:"Review journal.",action:"journal"},
        {text:"Save game.",action:"save"}
      ]
    }
  };

  function formName(element){
    const map={Water:"The Reed and Current",Fire:"The Cinder Sovereign",Earth:"The Mountain Unbroken",Wind:"The Silent Tempest"};
    return map[element];
  }
  function choose(arr){return arr[Math.floor(Math.random()*arr.length)]}
  function addJournal(s,title,text){s.journal.unshift({day:s.world.day,title,text})}
  function discover(s,id){
    s.world.discovered[id]=true;
    if(!s.player.knownLocations.includes(id)) s.player.knownLocations.push(id);
  }
  function adjustHealth(s,delta){
    s.player.health=Math.max(0,Math.min(s.player.maxHealth,s.player.health+delta));
  }
  function applyEffects(effects){
    for(const [type,val] of (effects||[])){
      if(type==="health") adjustHealth(state,val);
      if(type==="reputation") state.player.reputation+=val;
      if(type==="wolfAffinity" && state.companion) state.companion.affinity=Math.max(0,Math.min(10,state.companion.affinity+val));
      if(type==="trustWarning" && state.companion) {state.companion.trustWarnings+=val;state.companion.affinity=Math.min(10,state.companion.affinity+.25);}
      if(type==="wolf" && val==="gain" && !state.companion) state.companion={kind:"Wolf Pup",name:"Wolf Pup",affinity:1,ageMonths:0,hunger:"fed",trustWarnings:0};
    }
  }

  function setScreen(which){
    [els.start,els.create,els.game].forEach(x=>x.classList.remove("active"));
    which.classList.add("active");
  }

  function renderCreate(){
    els.originChoices.innerHTML="";
    origins.forEach(o=>{
      const b=document.createElement("button"); b.className="select-card";
      b.innerHTML=`<strong>${o.name}</strong><small>${o.desc}</small>`;
      b.onclick=()=>{createSelection.origin=o.id;[...els.originChoices.children].forEach(x=>x.classList.remove("selected"));b.classList.add("selected");validateCreate();};
      els.originChoices.appendChild(b);
    });
    els.styleChoices.innerHTML="";
    styles.forEach(st=>{
      const b=document.createElement("button"); b.className="select-card";
      b.innerHTML=`<strong>${st.name}</strong><small>${st.desc}</small>`;
      b.onclick=()=>{createSelection.style=st.id;[...els.styleChoices.children].forEach(x=>x.classList.remove("selected"));b.classList.add("selected");validateCreate();};
      els.styleChoices.appendChild(b);
    });
  }

  function validateCreate(){els.begin.disabled=!(createSelection.origin&&createSelection.style)}

  function newGame(){
    state=blankState();
    createSelection={origin:null,style:null};
    els.playerName.value="";
    renderCreate();
    setScreen(els.create);
  }

  function beginGame(){
    state=blankState();
    state.player.name=(els.playerName.value.trim()||"Traveler");
    state.player.origin=createSelection.origin;
    state.player.style=createSelection.style;
    addJournal(state,"The Road","Your journey began on the road to Westwood.");
    state.scene="opening";
    setScreen(els.game);
    render();
    save(false);
  }

  function render(){
    if(!state) return;
    if(state.player.health<=0){
      els.chapter.textContent="DEATH";
      els.story.innerHTML="<p>Your journey ends here.</p><div class='system'>Game Over</div>";
      els.choices.innerHTML="";
      updateStatus();
      return;
    }

    const scene=scenes[state.scene];
    if(!scene){console.error("Missing scene",state.scene);return;}
    if(scene.enter && state.world.flags[`entered:${state.scene}`]!==true){
      scene.enter(state);
      state.world.flags[`entered:${state.scene}`]=true;
    }
    els.chapter.textContent=scene.chapter||"FORKED PATHS";
    const lines=typeof scene.text==="function"?scene.text(state):scene.text;
    els.story.innerHTML=lines.map(t=>t.startsWith("<div")?t:`<p>${t}</p>`).join("");
    els.choices.innerHTML="";
    const choices=typeof scene.choices==="function"?scene.choices(state):scene.choices;
    choices.forEach((c,i)=>{
      const b=document.createElement("button");
      b.innerHTML=`<span class="choice-number">${i+1}.</span>${c.text}`;
      b.onclick=()=>{
        if(c.effects) applyEffects(c.effects);
        if(c.action){handleAction(c.action);return;}
        if(c.next){
          state.scene=c.next;
          delete state.world.flags[`entered:${c.next}`];
          render();
          save(false);
        }
      };
      els.choices.appendChild(b);
    });
    updateStatus();
  }

  function updateStatus(){
    els.statusName.textContent=state.player.name;
    els.health.textContent=state.player.health;
    els.healthBar.style.width=`${(state.player.health/state.player.maxHealth)*100}%`;
    els.gold.textContent=state.player.gold;
    els.location.textContent=DATA.locations[state.world.location]?.name || state.world.location.replace(/[A-Z]/g,m=>" "+m).trim();
    els.rep.textContent=state.player.reputation;
    els.affinities.innerHTML=Object.entries(state.player.affinities).map(([k,v])=>`<div class="aff-row"><span>${k}</span><strong>${v}/10</strong></div>`).join("");
    els.companion.textContent=state.companion?`${state.companion.name} · affinity ${state.companion.affinity}/10`:"None";
  }

  function save(show=true){
    if(!state) return;
    localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    if(show) toast("Game saved.");
    els.continueBtn.disabled=false;
  }

  function load(){
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return;
    try{
      state=JSON.parse(raw);
      setScreen(els.game);
      render();
    }catch(e){console.error(e);localStorage.removeItem(SAVE_KEY)}
  }

  function toast(msg){
    const t=document.createElement("div");
    t.textContent=msg;
    Object.assign(t.style,{position:"fixed",left:"50%",bottom:"70px",transform:"translateX(-50%)",background:"#d8ad53",color:"#17120d",padding:"10px 18px",zIndex:100,fontWeight:"bold",borderRadius:"3px"});
    document.body.appendChild(t); setTimeout(()=>t.remove(),1500);
  }

  function openDrawer(title,html){
    els.drawerTitle.textContent=title;
    els.drawerBody.innerHTML=html;
    els.drawer.classList.add("open");
    els.drawer.setAttribute("aria-hidden","false");
  }

  function mapHtml(){
    const markers = {
      highlandWatch:[58,16], westwood:[41,26], xeraCottage:[45,28], eridyn:[54,46],
      eris:[60,91], ironvale:[84,13], thievesRun:[23,74], whisperingMeadow:[38,42],
      velorGrove:[36,34], crumblingObelisk:[92,58]
    };
    const visible = Object.entries(DATA.locations).filter(([id,l])=>l.public || state.world.discovered[id]);
    return `<div class="map-wrap"><div class="map-stage"><img src="/assets/world-map.jpg" alt="Forked Paths world map">`+
      visible.map(([id,l])=>{
        const [x,y]=markers[id]||[50,50];
        return `<div class="map-marker ${l.public?"":"hidden"}" style="left:${x}%;top:${y}%"><span>${l.name}<br>${l.coord}</span></div>`;
      }).join("")+`</div></div><p class="muted">Markers use the canonical A–Z / 0–15 coordinate system. Hidden locations appear only after discovery.</p>`;
  }

  function journalHtml(){
    return state.journal.length?state.journal.map(j=>`<div class="list-card"><h3>${j.title}</h3><p>Day ${j.day} · ${j.text}</p></div>`).join(""):`<p class="muted">No journal entries yet.</p>`;
  }

  function inventoryHtml(){
    const items=state.player.inventory;
    const forms=state.player.hiddenForms;
    const boons=state.player.boons;
    let html="";
    html+=`<div class="list-card"><h3>Gold</h3><p>${state.player.gold}</p></div>`;
    html+=`<div class="list-card"><h3>Items</h3><p>${items.length?items.join(", "):"None"}</p></div>`;
    html+=`<div class="list-card"><h3>Hidden Forms</h3><p>${forms.length?forms.join(", "):"None discovered"}</p></div>`;
    html+=`<div class="list-card"><h3>Boons</h3><p>${boons.length?boons.join(", "):"None"}</p></div>`;
    return html;
  }

  function characterHtml(){
    const origin=origins.find(x=>x.id===state.player.origin)?.name||state.player.origin;
    const style=styles.find(x=>x.id===state.player.style)?.name||state.player.style;
    return `<div class="list-card"><h3>${state.player.name}</h3><p>Origin: ${origin}<br>Starting style: ${style}<br>Deception: ${state.player.deception}<br>Acting: ${state.player.acting}<br>Improvisation: ${state.player.improvisation}</p></div>`+
      `<div class="list-card"><h3>Identity</h3><p>${state.player.falseIdentity?`False identity: ${state.player.falseIdentity.name}. Original identity remains attached and legally actionable.`:"No false identity active."}</p></div>`;
  }

  function handleAction(action){
    if(action==="map") openDrawer("World Map",mapHtml());
    if(action==="journal") openDrawer("Journal",journalHtml());
    if(action==="inventory") openDrawer("Inventory",inventoryHtml());
    if(action==="character") openDrawer("Character",characterHtml());
    if(action==="save") save(true);
  }

  els.newGame.onclick=newGame;
  els.continueBtn.onclick=load;
  els.begin.onclick=beginGame;
  els.back.onclick=()=>setScreen(els.start);
  els.saveBtn.onclick=()=>save(true);
  els.closeDrawer.onclick=()=>{els.drawer.classList.remove("open");els.drawer.setAttribute("aria-hidden","true")};
  document.querySelectorAll(".utility-card [data-panel]").forEach(b=>b.onclick=()=>handleAction(b.dataset.panel));
  document.getElementById("menuBtn").onclick=()=>openDrawer("Forked Paths",
    `<div class="list-card"><h3>InN8 Labs</h3><p>Forked Paths engine v0.1.0</p></div>`+
    `<button class="primary" onclick="localStorage.removeItem('${SAVE_KEY}');location.reload()">Return to Title & Clear Local Save</button>`
  );

  els.continueBtn.disabled=!localStorage.getItem(SAVE_KEY);
})();
