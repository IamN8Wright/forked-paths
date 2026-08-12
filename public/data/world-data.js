window.FORKED_PATHS_DATA = {
  meta: {
    title: "Forked Paths",
    studio: "InN8 Labs",
    revision: "0.1.0",
    mapSizeMiles: { eastWest: 1200, northSouth: 800 },
    grid: { majorColumns: "A-Z", majorRows: "0-15", minorColumns: "a-e", minorRows: "1-5" }
  },

  locations: {
    highlandWatch: {
      name: "Highland Watch",
      coord: "O.c, 2.3",
      kind: "stronghold",
      public: true,
      description: "A northern power overlooking the roads and waters that feed the heartlands."
    },
    westwood: {
      name: "Westwood",
      coord: "K, 4.1",
      kind: "town",
      public: true,
      description: "A frontier settlement northwest of Eridyn, close to the shadow of the Darkwood."
    },
    xeraCottage: {
      name: "Old Cottage",
      coord: "L.b, 4.2",
      kind: "hidden",
      public: false,
      description: "Xera's old cottage, thirty-four miles from Westwood along the road toward Eridyn."
    },
    eridyn: {
      name: "Eridyn",
      coord: "N.d, 7.1",
      kind: "ruins",
      public: true,
      description: "The city the gods made mad. Once capital of a kingdom that covered the known map, now a wind-torn ruin."
    },
    eris: {
      name: "Eris",
      coord: "P.b, 15",
      kind: "harbor",
      public: true,
      description: "A southern harbor city watched by its lighthouse."
    },
    ironvale: {
      name: "Ironvale",
      coord: "V.a, 1.5",
      kind: "city",
      public: true,
      description: "An eastern city tied to hard country, industry, and old roads."
    },
    thievesRun: {
      name: "Thieve's Run",
      coord: "F.e, 11.4",
      kind: "city-state",
      public: true,
      borders: "E11-H14",
      description: "Formerly Crows Point. A politically neutral city-state ruled from the Throne of the Stolen Crown, and paradoxically the safest city on the map."
    },
    whisperingMeadow: {
      name: "Whispering Meadow",
      coord: "J.c, 6.3",
      kind: "wild",
      public: true,
      description: "A strange meadow within the greater Darkwood region."
    },
    velorGrove: {
      name: "Velor Nymm's Grove",
      coord: "J.a, 5.1",
      kind: "hidden",
      public: false,
      description: "A hidden woodland grove reached by a narrow path, with a small pond and creek."
    },
    crumblingObelisk: {
      name: "The Crumbling Obelisk",
      coord: "X, 9",
      kind: "landmark",
      public: true,
      description: "An ancient eastern landmark whose full history remains unwritten."
    }
  },

  hiddenMartialArts: {
    water: {
      name: "The Reed and Current",
      element: "Water",
      forbidden: true,
      discoveryThreshold: 5,
      teachers: ["The Mad King of Eridyn", "Vernal"],
      summary: "Yield and redirect. When one becomes the current, the other becomes the reed."
    },
    fire: {
      name: "The Cinder Sovereign",
      element: "Fire",
      forbidden: true,
      discoveryThreshold: 5,
      teachers: ["The Mad King of Eridyn"],
      summary: "A secret fire discipline once practiced by Eridyn's royal line."
    },
    earth: {
      name: "The Mountain Unbroken",
      element: "Earth",
      forbidden: true,
      discoveryThreshold: 5,
      teachers: ["The Mad King of Eridyn"],
      summary: "A secret earth discipline of endurance, grounding, and immovable control."
    },
    wind: {
      name: "The Silent Tempest",
      element: "Wind",
      forbidden: true,
      discoveryThreshold: 5,
      teachers: ["Eridyn itself"],
      summary: "A wind discipline learned through control, kata, and surviving the impossible winds of ruined Eridyn."
    }
  },

  dualFormHarmony: {
    harmonic: [
      ["Fire", "Water"],
      ["Earth", "Wind"]
    ],
    unstable: [
      ["Fire", "Wind"],
      ["Water", "Earth"]
    ]
  },

  fourthFormLaw: {
    description: "No one was meant to master all four hidden martial arts. The Mad King was the first person in history to master three. Attempting a fourth caused an elemental catastrophe corresponding to the fourth art.",
    eridynEvent: "The Mad King's fourth attempt was Wind, creating the impossible wind anomaly that destroyed Eridyn. Many later described it as a massive tornado, though no natural storm could explain it."
  },

  npcs: {
    avery: {
      name: "Avery",
      type: "Random Fae NPC",
      fixedLocation: null,
      cottageTie: true,
      favor: { min: 0, max: 100 },
      notes: "Can appear anywhere at any time. At maximum favor becomes a constant but uncontrollable companion. Inside the Court of the Broken Throne, Avery is unusually happy-go-lucky and fiercely protective of the Mad King."
    },
    mira: {
      name: "Mira",
      type: "Princess / Thief",
      home: "Thieve's Run",
      recognition: "Well known in Thieve's Run. Outside it, normally recognized only by nobles, royals, thieves, and certain Fae.",
      secret: "The royal family sends heirs on a walkabout to hone their craft. Mira seeks a royal relic or artifact to steal and bring home.",
      waterKey: "Uses water affinity to form a perfect-fit key for locks."
    },
    vernal: {
      name: "Vernal",
      type: "Elemental Fae",
      element: "Water",
      notes: "Can grant knowledge of The Reed and Current. A special Riverbank Kata event can grant a unique boon."
    },
    madKing: {
      name: "The Mad King of Eridyn",
      type: "Immortal Bound King",
      location: "Court of the Broken Throne, Eridyn",
      notes: "First person to master three hidden forms. Attempted a fourth and destroyed Eridyn. Bound to his Broken Throne for roughly three centuries.",
      teaches: ["The Cinder Sovereign", "The Reed and Current", "The Mountain Unbroken"]
    }
  },

  boons: {
    openCurrent: {
      name: "The Open Current",
      grantedBy: "Vernal",
      unique: true,
      condition: "Only granted after the extended Riverbank Reed and Current Kata dance with Vernal.",
      effect: "Player and companions receive free passage anywhere along the river for the remainder of the game."
    }
  },

  relics: {
    bladeOfUndoing: {
      name: "Blade of Undoing",
      type: "High-level one-handed sword",
      origin: "Once belonged to Xera, given to her by the Laird of Highland Watch.",
      faeUndo: {
        die: 20,
        natural1: "fails",
        fullDisenchantAt: 14,
        partialRange: "2-13"
      }
    },
    maidensShield: {
      name: "The Maiden's Shield",
      type: "High-level shield",
      origin: "Given to Xera by her father so as to always protect his daughter.",
      standardBlock: "Blocks ordinary attacks when chosen.",
      highLevelReduction: 0.30
    },
    windDancerCloak: {
      name: "Cloak of the Wind Dancer",
      type: "Legendary travel relic",
      origin: "Gifted by the Mad King when the Winds of Eridyn are finally quieted.",
      effect: "Fast travel to any known point on the map. Major cross-world journeys take roughly one hour."
    }
  },

  wolfLine: {
    discovery: "Early-game strange sound near the road. No elemental affinity required.",
    affinity: { min: 0, max: 10 },
    pup: {
      ageMonths: "0-6",
      combat: "Distracts enemies and can introduce danger-warning choices.",
      dangerSense: true
    },
    wolf: {
      ageMonths: "6-12",
      combat: "Can take enemies down or pin them in a K9-like restraint.",
      scout: true,
      forage: true
    },
    direWolf: {
      ageMonths: "12+",
      requiresAffinity: 9,
      mythic: true,
      combat: "Keeps player in sight, uses terrain stealth when possible, hunts nearby hidden threats.",
      scout: "Long range",
      forage: "Larger quantities",
      reputationBoost: "large",
      enemyFear: "large"
    },
    loneDireWolf: {
      trigger: "Wrong choices / insufficient bond when Dire transformation occurs.",
      result: "Leaves the player."
    },
    foodRefusalPenalty: -0.5
  },

  forgottenMemories: {
    allowsStartingHiddenMastery: true,
    visibleAtCharacterCreation: false,
    note: "Hidden mastery is not presented as a selectable martial art. The narrative reveals that the body knows something the mind does not.",
    kata: {
      phases: ["Instinct", "Pattern", "Expression"],
      vernalMinimumRoutines: 5,
      vernalPreferredRoutines: "5-10+",
      requiresCombatUseBeforeVernal: true,
      wolfPupDewInteraction: true
    }
  }
};
