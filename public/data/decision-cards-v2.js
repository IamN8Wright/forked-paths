window.FK2_DECISION_CARDS = {
  roadFork: {
    id:"ROAD_FORK_001", location:"roadFork", parent:"world", chapter:"PROLOGUE · THE FORK",
    text:["The road divides beneath an old marker stone. The right fork slips toward tangled woodland. The left runs toward a weather-beaten cottage road. Behind you, the road remains open.","Nothing forces your hand. The world is simply waiting to see which way you lean."],
    choices:[
      {text:"Take the right fork toward the woods.",next:"wildMan",tags:["authored","beta"]},
      {text:"Take the left fork toward the old cottage road.",next:"xeraDoor",tags:["authored","beta"]},
      {text:"Turn back and investigate whatever has been following you.",next:"followerCamp",tags:["discovered","beta"]},
      {text:"Head toward your hometown instead.",next:"hoodedStranger",tags:["authored","beta"]}
    ]
  },
  wildMan: {
    id:"RIGHT_WILD_MAN_001", location:"rightFork", parent:"roadFork", chapter:"THE RIGHT FORK",
    text:["Three steps down the right fork, a wild-looking man rises from the ditch. His beard is scraggly, his clothes ragged, his movements almost animal.","He watches your hands more carefully than your face."],
    choices:[
      {text:"Draw your sword.",next:"wildManArmed",tendency:{violence:1}},
      {text:"Calmly say, ‘Hello, stranger.’",next:"rowanTalk",tendency:{compassion:1}},
      {text:"Back away toward the fork.",next:"roadFork",tendency:{caution:1}}
    ]
  },
  wildManArmed:{
    id:"RIGHT_WILD_MAN_002",location:"rightFork",parent:"roadFork",chapter:"THE RIGHT FORK · STEEL",
    text:["Steel clears leather. The man drops into a low crouch and growls, hands curled like claws.","‘This land does not belong to you.’"],
    choices:[
      {text:"Claim authority and demand passage.",next:"rowanTalk",tendency:{honor:1}},
      {text:"Lower the blade and acknowledge the land belongs to no one.",next:"rowanTalk",tendency:{compassion:1}},
      {text:"Advance and threaten him.",next:"wildManFight",tendency:{violence:2}}
    ]
  },
  wildManFight:{
    id:"RIGHT_WILD_MAN_003",location:"rightFork",parent:"roadFork",chapter:"THE RIGHT FORK · BLOOD",
    text:["He lunges with teeth and nails. The fight becomes ugly at once. You gain the advantage, your blade poised to decide what kind of story this becomes."],
    choices:[
      {text:"Kill him.",next:"wolfPupAftermath",effects:{reputation:-1},tendency:{violence:2,cruelty:1}},
      {text:"Stop the blade and demand surrender.",next:"rowanTalk",tendency:{mercy:2}}
    ]
  },
  rowanTalk:{
    id:"ROWAN_001",location:"rightFork",parent:"roadFork",chapter:"ROWAN · SON OF THE WOODS",
    text:["The tension eases. The man introduces himself as Rowan, son of the woods. A whistle brings a spotted pup stumbling from the ditch.","Rowan asks where you are headed, and for the first time this road feels less like a test and more like an invitation."],
    choices:[
      {text:"Ask Rowan to travel with you for a while.",next:"roadFork",effects:{companion:{name:"Rowan",kind:"Woodsman",affinity:1}},tags:["discovered","beta"]},
      {text:"Pet the pup and ask what danger lies ahead.",next:"roadFork",effects:{knowledge:"Rowan warns the right fork is dangerous for reasons beyond bandits."}},
      {text:"Thank him and return to the fork.",next:"roadFork"}
    ]
  },
  wolfPupAftermath:{
    id:"WOLF_PUP_001",location:"rightFork",parent:"roadFork",chapter:"THE DITCH",
    text:["A small whimper comes from the ditch. A dire wolf pup noses at the aftermath, frightened but unwilling to leave."],
    choices:[
      {text:"Approach slowly and offer food.",next:"roadFork",effects:{familiar:{name:"Kai",kind:"Dire Wolf Pup",bond:1}},tendency:{compassion:2},tags:["discovered","beta"]},
      {text:"Leave the pup alone.",next:"roadFork"}
    ]
  },
  xeraDoor:{
    id:"XERA_COTTAGE_001",location:"xeraCottage",parent:"leftFork",chapter:"XERA’S COTTAGE",
    text:["By midday the left road reaches a rundown cottage. Smoke curls from its chimney. The door is shut, but someone inside is awake."],
    choices:[
      {text:"Knock on the door.",next:"xeraInside",tendency:{caution:1}},
      {text:"Call out from the path.",next:"xeraInside"},
      {text:"Enter without knocking.",next:"xeraInside",tendency:{recklessness:1}},
      {text:"Ignore the cottage and continue.",next:"riverToll"}
    ]
  },
  xeraInside:{
    id:"XERA_COTTAGE_002",location:"xeraCottageInterior",parent:"xeraCottage",chapter:"XERA’S COTTAGE · THE STORY",
    text:["An old blind woman rocks beside a cauldron. Her crippled hand rests in her lap.","‘So,’ she says, with tired certainty, ‘you have come to kill me.’","She names herself Xera. Whatever she once was, she is not merely a helpless old woman."],
    choices:[
      {text:"Tell Xera no one needs to die today.",next:"xeraBargain",tendency:{mercy:2}},
      {text:"Offer to hear her story before deciding anything.",next:"xeraBargain",tendency:{curiosity:1}},
      {text:"Kill Xera swiftly.",next:"xeraAftermath",tendency:{violence:2,cruelty:1}},
      {text:"Leave the cottage.",next:"riverToll"}
    ]
  },
  xeraBargain:{
    id:"XERA_COTTAGE_003",location:"xeraCottageInterior",parent:"xeraCottage",chapter:"XERA · AVERY’S SHADOW",
    text:["Xera’s story circles an old fae bargain and a name she speaks with equal parts anger and dread: Avery.","She warns you that bargains outlive intentions, and that the cleverest wording often grows the sharpest teeth."],
    choices:[
      {text:"Ask about Avery and the bargain.",next:"xeraAftermath",effects:{knowledge:"Xera is bound to an old bargain involving Avery."}},
      {text:"Refuse to become part of her bargain and leave.",next:"riverToll",tendency:{caution:1}},
      {text:"End Xera’s life after hearing her story.",next:"xeraAftermath",tendency:{violence:1}}
    ]
  },
  xeraAftermath:{
    id:"XERA_COTTAGE_004",location:"xeraCottageInterior",parent:"xeraCottage",chapter:"XERA · AFTERMATH",
    text:["The cottage has become evidence of whatever you chose to do here. The fire, the body, the untouched possessions, the missing possessions: the world will remember the details."],
    choices:[
      {text:"Search the cottage carefully.",next:"riverToll",effects:{item:"Fae Fang"},tendency:{curiosity:1}},
      {text:"Burn the cottage and everything in it.",next:"riverToll",effects:{trait:"Pyro"},tendency:{recklessness:2},tags:["discovered","beta"]},
      {text:"Leave everything untouched and go.",next:"riverToll",tendency:{restraint:1}}
    ]
  },
  riverToll:{
    id:"RIVER_NYMPH_001",location:"riverCrossing",parent:"world",chapter:"THE RIVER",
    text:["The road ends at a broad river and a narrow crossing watched by a river nymph. She introduces herself as Vernel and names a toll with the confidence of someone who has never considered asking permission."],
    choices:[
      {text:"Pay the toll.",next:"erisGate",effects:{gold:-2}},
      {text:"Negotiate with Vernel.",next:"erisGate",tendency:{diplomacy:1}},
      {text:"Threaten Vernel.",next:"erisGate",tendency:{violence:1}},
      {text:"Ask Vernel whether she wants to travel with you instead.",next:"erisGate",effects:{companion:{name:"Vernel",kind:"River Nymph",affinity:1}},tags:["discovered","beta"]}
    ]
  },
  followerCamp:{
    id:"FOLLOWER_CAMP_001",location:"oldRoadCamp",parent:"roadFork",chapter:"THE ROAD · SOMETHING FOLLOWS",
    text:["You turn back. By dusk the unseen follower is still with you. At camp, movement whispers just beyond the firelight."],
    choices:[
      {text:"Challenge the follower to show itself.",next:"roadFork",tendency:{courage:1}},
      {text:"Invite whoever is there to sit by the fire.",next:"roadFork",tendency:{compassion:1},tags:["discovered","beta"]},
      {text:"Pretend to sleep and watch.",next:"roadFork",tendency:{caution:1}}
    ]
  },
  hoodedStranger:{
    id:"SIREN_STRANGER_001",location:"hometown",parent:"world",chapter:"HOMETOWN · THE STRANGER",
    text:["A scarred stranger in a hood beckons you closer. Daggers line his belt. He offers a map to a cave where a powerful spirit guards treasure, for a suspiciously convenient price."],
    choices:[
      {text:"Ask why he does not go himself.",next:"sirenGift",tendency:{caution:1}},
      {text:"Threaten him for the map.",next:"sirenGift",tendency:{violence:1}},
      {text:"Ignore him and head home.",next:"smokeHome"}
    ]
  },
  sirenGift:{
    id:"SIREN_STRANGER_002",location:"hometown",parent:"world",chapter:"THE SIREN RING",
    text:["The stranger admits the spirit seeks a soul to devour. Then he offers a small wooden box.","Inside is a ring meant to preserve the wearer’s senses when a siren sings."],
    choices:[
      {text:"Accept the Siren Ring.",next:"smokeHome",effects:{item:"Siren Ring",knowledge:"The Siren Ring can resist a siren’s song."}},
      {text:"Reject the gift.",next:"smokeHome"}
    ]
  },
  smokeHome:{
    id:"HOMETOWN_SMOKE_001",location:"hometownRoad",parent:"hometown",chapter:"HOMETOWN · BLACK SMOKE",
    text:["On the road home, black smoke rises into the sky. Whatever adventure the stranger offered has just collided with something personal."],
    choices:[
      {text:"Run toward home.",next:"princeCoterie",tendency:{loyalty:1}},
      {text:"Stay back and observe who is moving through the smoke.",next:"princeCoterie",tendency:{caution:1}}
    ]
  },
  princeCoterie:{
    id:"PRINCE_COTERIE_001",location:"hometown",parent:"world",chapter:"THE PRINCE’S COTERIE",
    text:["Members of the Prince’s Coterie move with a strange, puppet-like purpose. Later, some may remember nothing of what they did.","This is not a quest marker. It is a mystery already moving with or without you."],
    choices:[
      {text:"Follow them without confronting them.",next:"roadFork",tendency:{caution:1}},
      {text:"Try to restrain and question one of them.",next:"roadFork",tendency:{curiosity:1}},
      {text:"Leave the mystery alone for now.",next:"roadFork"}
    ]
  },
  erisGate:{
    id:"ERIS_GATE_001",location:"erisGate",parent:"eris",chapter:"ERIS · SOUTH GATE",
    text:["The walls of Eris rise over the road. The gate is busy, bureaucratic, and very much not the whole city."],
    choices:[
      {text:"Enter Eris through the gate.",next:"erisDistrict",effects:{flag:["erisEntryResolved",true]}},
      {text:"Ask the guards about entry rules.",next:"erisGateInfo"},
      {text:"Look for another legal way into the city.",next:"erisDistrict"},
      {text:"Leave Eris for now.",next:"riverToll"}
    ]
  },
  erisGateInfo:{
    id:"ERIS_GATE_002",location:"erisGate",parent:"eris",chapter:"ERIS · SOUTH GATE",
    text:["The guard explains the entry requirements once. Once you satisfy them, the matter is resolved unless your legal status later changes."],
    choices:[{text:"Complete entry and go inside.",next:"erisDistrict",effects:{flag:["erisEntryResolved",true]}}]
  },
  erisDistrict:{
    id:"ERIS_DISTRICT_001",location:"erisMarket",parent:"eris",chapter:"ERIS · MARKET DISTRICT",
    text:["Inside Eris, streets fan away from the gate. The market district smells of bread, leather, horses, incense, and too many people with somewhere to be.","The gate is now behind you. Visiting an inn will not somehow make you re-enter the city."],
    choices:[
      {text:"Enter the Reluctant Tippler inn.",next:"erisInn"},
      {text:"Explore the market.",next:"erisMarket"},
      {text:"Return physically to the south gate.",next:"erisGate"},
      {text:"Leave Eris by another road.",next:"roadFork"}
    ]
  },
  erisInn:{
    id:"ERIS_INN_001",location:"reluctantTippler",parent:"erisMarket",chapter:"ERIS · THE RELUCTANT TIPPLER",
    text:["The Reluctant Tippler is loud enough to hide a conspiracy and ordinary enough to host several by accident.","You are inside an inn inside the Market District inside Eris."],
    choices:[
      {text:"Listen for rumors.",next:"erisInnRumor"},
      {text:"Rent a room and rest.",next:"erisInn"},
      {text:"Leave the inn and return to the Market District.",next:"erisDistrict"}
    ]
  },
  erisInnRumor:{
    id:"ERIS_INN_002",location:"reluctantTippler",parent:"erisMarket",chapter:"ERIS · RUMORS",
    text:["You collect three rumors. At least one is wrong. The engine records them as rumors, not facts."],
    choices:[{text:"Return to the common room.",next:"erisInn"},{text:"Leave the inn.",next:"erisDistrict"}]
  },
  erisMarket:{
    id:"ERIS_MARKET_001",location:"erisMarket",parent:"eris",chapter:"ERIS · MARKET",
    text:["Merchants argue over copper, cloth, charms, maps, and stories. A city is not a corridor. You can leave, linger, or invent a purpose of your own."],
    choices:[{text:"Return to the district square.",next:"erisDistrict"},{text:"Visit the inn.",next:"erisInn"}]
  }
};