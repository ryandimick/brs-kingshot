export function defaultCharState() {
  return {
    name: "My Governor",
    maxGeneration: 6,
    bonusOverview: {
      squads: { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
      Infantry: { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
      Cavalry: { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
      Archer: { ATK: 0, DEF: 0, Leth: 0, HP: 0 },
    },
    govGearSlots: { helm: 0, accessory: 0, armor: 0, pants: 0, ring: 0, weapon: 0 },
    charmLevels: {
      Infantry: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
      Cavalry: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
      Archer: { helm: [0,0,0], accessory: [0,0,0], armor: [0,0,0], pants: [0,0,0], ring: [0,0,0], weapon: [0,0,0] },
    },
    pets: {
      Infantry: { Leth: 0, HP: 0 },
      Cavalry: { Leth: 0, HP: 0 },
      Archer: { Leth: 0, HP: 0 },
      squads: { ATK: 0, DEF: 0 },
    },
    // Each troop type has a composition: a list of { count, tier, tgLevel } groups.
    // Engines aggregate weighted base stats from this list; a single-entry
    // composition is equivalent to the old flat-count model.
    troops: {
      Infantry: { composition: [{ count: 90000, tier: 11, tgLevel: 0 }] },
      Cavalry:  { composition: [{ count: 36000, tier: 11, tgLevel: 0 }] },
      Archer:   { composition: [{ count: 54000, tier: 11, tgLevel: 0 }] },
    },

    // Hero gear: decoupled from heroes, keyed by troop type
    heroGear: {
      Infantry: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Cavalry: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
      Archer: { helm: { enh: 0, mast: 0 }, gloves: { enh: 0, mast: 0 }, chest: { enh: 0, mast: 0 }, boots: { enh: 0, mast: 0 } },
    },

    // Hero roster: unbounded collection, keyed by hero name
    heroRoster: {},

    // Attack rally scenario
    attackRally: {
      selectedHeroes: ["", "", ""],
      joinerSlots: ["Chenko", "Chenko", "Amane", "Amane"],
      offenseWeight: 75,
    },

    // Garrison defense scenario
    garrisonLead: {
      selectedHeroes: ["", "", ""],
      offenseWeight: 25,
    },
  };
}
