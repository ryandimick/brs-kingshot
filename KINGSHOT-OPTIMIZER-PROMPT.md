# Kingshot Rally Investment Optimizer — Project Brief & System Prompt

## What This Is

A persistent React (JSX) single-file artifact running in Claude.ai's artifact environment. It's a **shadow character sheet** for the mobile game Kingshot, designed for an alliance leader (R5) who spends ~$20/day and leads rallies. The tool tracks all stat sources individually, computes aggregated buff percentages, and runs an investment optimizer that tells the user where their next resource should go for maximum marginal return.

## The User

Ryan is the CPO at a software company and R5 (alliance leader) of [BRS]BlackRose in Kingshot. He approaches the game analytically — he wants data-driven investment decisions, not vibes. He's on a server ~55 days old, currently in Gen 2-3 hero territory. He leads rallies (not joins), so rally-leader-specific mechanics matter most. He focuses on open-world PvP (fortress/sanctuary battles, not Bear Trap PvE).

## Core Game Mechanics (The Math)

### Damage Formula
```
Kills = √(Troops) × (Attack × Lethality) / (Enemy_Defense × Enemy_Health) / 100 × SkillMod
```

Key properties:
- **ATK × Leth is a product** — marginal ROI always favors whichever stat is currently lower
- **HP × DEF is the defensive product** — same logic applies
- **√Troops** means troop count has diminishing returns
- **SkillMod** is the biggest lever and comes from hero skills

### Per-Troop Calculations
```
attack_per_troop = effective_ATK × effective_Leth / 100
defense_per_troop = effective_HP × effective_DEF / 100
effective_stat = base_stat × (1 + total_buff_percentage / 100)
```

### Army Factor (per troop type)
```
army_factor = √(your_troop_type_count × min(total_your_troops, total_enemy_troops))
```

### SkillMod Formula
```
SkillMod = (DamageUp × OppDefenseDown) / (OppDamageDown × DefenseUp)
```

**Effect_op system**: Hero skills have internal `effect_op` codes. Same-op skills ADD together. Different-op skills MULTIPLY via `math.prod()`.

Known effect_op codes:
- **DamageUp**: 101 (Chenko, Amadeus, Yeonwoo, Jabel, Marlin, Vivian), 102 (Amane, Margot, Hilde partial)
- **DefenseUp**: 111 (Howard, Quinn — damage reduction), 112 (Saul partial, Alcar, Long Fei), 113 (Gordon, Saul partial, Zoe, Rosa, Jaeger)
- **OppDamageDown**: 201 (Fahd), 202 (Eric)

Special cases: Saul has DUAL ops (112 + 113) on one skill. Hilde has DamageUp 102 + DefenseUp 112 on one skill.

### T6 Base Stats (Hidden — NOT what UI shows)
| Troop | ATK | Leth | HP | DEF |
|-------|-----|------|-----|-----|
| Infantry | 243 | 10 | 730 | 10 |
| Cavalry | 730 | 10 | 243 | 10 |
| Archer | 974 | 10 | 183 | 10 |

### Buff Layers
1. **Standard buffs** (additive): Research, Gov Gear, Charms, Pets, Alliance Tech, Skins — all add together
2. **Special buffs** (multiplicative): Hero abilities, Widgets, Kingdom titles, consumables — multiply ON TOP of standard buffs
3. **Widget buffs**: Multiplicative with your existing stats (only from rally/garrison LEADER's heroes, not joiners)

### Combat Loop
- Turn-based: both sides attack simultaneously each round
- Targeting: front line (Infantry) first; when a line dies, retarget next line
- Cavalry exception: 20% bypass frontline to dive Archers each round
- Troop counters: Archer +10% vs Infantry, Infantry +10% vs Cavalry, Cavalry +10% vs Archers
- Battle ends when one side has 0 troops

### Casualty Rates by Location
| Location | Lightly Injured | Hospital | Dead |
|----------|----------------|----------|------|
| Sanctuary/Fortress | 70% | 30% | 0% |
| Defending City | 65% | 35% | 0% |
| Attacking City | 55% | 10% | **35%** |
| King's Castle | All to hospital until full, then die | | |

### Garrison Mechanics
- Defender with highest stat bonuses is chosen as source of defense bonuses
- 4 primary hero skills from other garrison members activate
- Rally leader contributes 9 hero skills + 4 first skills from joiners

## Current App Architecture

### Data Model (persisted via `window.storage`)
```javascript
{
  name: "My Governor",
  
  // Research: per troop type, per stat (ATK/Leth/HP/DEF percentages)
  research: { Infantry: { ATK, Leth, HP, DEF }, Cavalry: {...}, Archer: {...} },
  
  // Governor Gear: 6 slots, each stores tier index into GOV_GEAR_TIERS lookup
  govGearSlots: { helm, accessory, armor, pants, ring, weapon }, // indices 0-33
  
  // Charms: 18 total (3 per gear slot × 6 slots), level index into CHARM_LEVELS
  // Each charm gives BOTH Leth and HP equally
  charmLevels: { Infantry: { helm: [0,0,0], ... }, Cavalry: {...}, Archer: {...} },
  
  // March heroes: 3 heroes with full detail
  marchHeroes: [
    {
      name: "Amadeus",
      level: 1-80,
      stars: 0-5,
      gear: {
        helm: { enh: 0-200, mast: 0-15 },
        gloves: { enh: 0-200, mast: 0-15 },
        chest: { enh: 0-200, mast: 0-15 },
        boots: { enh: 0-200, mast: 0-15 },
      },
      widgetLv: 0-10,
      skills: [0-5, 0-5, 0-5], // 3 expedition skill levels
    },
    // ... ×3
  ],
  
  // Legacy fields (still referenced by some code paths)
  heroGear: { Infantry: { Leth, HP }, ... }, // raw % — being replaced by marchHeroes
  pets: { Leth, HP }, // raw % for all troop types
  allianceTech: { ATK, Leth, HP, DEF }, // raw % all troops
  skins: { ATK, Leth, HP, DEF }, // raw % all troops
  
  // Rally config
  troops: { Infantry: 90000, Cavalry: 36000, Archer: 54000 },
  leaderDU: 45, // total DamageUp from leader hero skills
  joinerSlots: ["Chenko", "Chenko", "Amane", "Amane"], // assumed optimal
}
```

### Lookup Tables Baked In
- **GOV_GEAR_TIERS**: 34 entries from None through Red★★★, with cumulative stat % per tier (from kingshot.net)
- **GOV_GEAR_SET_BONUS**: 3pc DEF and 6pc ATK bonuses by tier prefix
- **CHARM_LEVELS**: 23 entries (Lv 0-22) with cumulative stat % per level (from kingshot.net)
- **HERO_DB**: ~22 heroes with name, gen, rarity, type, skill1 effect_op/category/percentage, widget info

### computeTotalBuffs() Flow
Aggregates all sources into per-troop-type buff percentages:
1. Research (per troop, per stat)
2. Governor Gear (ATK/DEF from tier lookup + set bonuses)
3. Charms (Leth + HP from level lookups, summed across 18 charms)
4. Hero Gear (currently raw %, needs to be derived from marchHeroes gear data)
5. Pets (raw % Leth/HP)
6. Alliance Tech (all-troop flat %)
7. Skins (all-troop flat %)

### Investment Optimizer Logic
For each investment option (Forgehammers, Charms, Pets, Gov Gear, Research variants):
1. Model as "+X%" to the relevant stats across all troop types
2. Compute marginal % increase to offense product (ATK×Leth) and defense product (HP×DEF)
3. Weight by troop importance (Archer 55%, Infantry 25%, Cavalry 20%)
4. Weight offense 65% / defense 35% (adjustable)
5. Divide by resource rarity to get efficiency score
6. Rank S/A/B/C tier

**Key insight**: This is opponent-independent. We optimize our own stat products, not against a specific defender.

### UI Tabs
1. **Overview**: Stat product dashboard, ratio imbalance warnings, total buff summary, SkillMod
2. **Research**: Per-troop research %, alliance tech, skins
3. **Gear & Charms**: Visual 2×3 grid of 6 gov gear slots (tier dropdown), 3 charm level dropdowns per slot, pet refinement
4. **Heroes & March**: 3-column grid (Inf/Cav/Arch hero), each with hero picker, level, stars, 4 gear pieces (enh+mast), widget level, 3 expedition skills, rally formation
5. **Optimizer**: Ranked investment ROI with expandable per-troop breakdowns

## What Needs To Be Done Next (Priority Order)

### 1. Wire Hero Gear Stats Into Buff Computation
Currently `marchHeroes[].gear` stores enhancement/mastery levels but these don't feed into `computeTotalBuffs()`. Need to:
- Research or approximate the stat scaling per enhancement level and mastery level
- Hero gear stat types: **Helmet/Boots → Lethality**, **Chest/Gloves → Health** (for expedition/troop buffs)
- Mastery multiplier: each mastery level multiplies the base gear stats (roughly 1.1x per level, compounds)
- Enhancement level determines base stat value (scales ~linearly within a rarity tier)
- Rarity tiers cap at: Grey 20, Green 40, Blue 60, Purple 80, Gold/Mythic 100, Red 200
- The computed Leth/HP from all 3 heroes' gear should replace the legacy `heroGear` raw % fields

### 2. Derive SkillMod From marchHeroes
Instead of raw `leaderDU` input:
- Look up each hero's skills from HERO_DB
- Multiply skill percentages by skill level (skill level 0 = inactive, 1-5 = scaling)
- Compute DamageUp/DefenseUp/OppDamageDown buckets from all 3 leader heroes' skills
- Assume optimal joiners (2× op101 + 2× op102 for attack rallies)
- Feed into SkillMod formula

### 3. Widget Multiplicative Layer
Widgets are multiplicative with standard buffs (not additive). Currently not modeled.
- Widget level determines the % bonus
- Only the rally leader's heroes' widgets apply
- Need widget stat values per level per hero (likely need to research this)

### 4. Data Quality: Exact Stat Lookup Tables
Several data points are approximated or use raw % inputs where structured lookups would be better:
- Hero gear enhancement XP → stat % per level (would need kingshotguide.org data center or kingshotsimulator.com data)
- Hero base stats per level/star (for SkillMod contribution accuracy)
- Pet refinement levels → stat % lookup (similar to charm levels)
- Research tree node → stat % mapping (complex, many nodes)

### 5. "What If" / Diff View
When the user changes a value, show the before/after impact on:
- Total buff change
- Offense/defense product change
- Optimizer ranking shift

### 6. Polish & UX
- The gear tab charm dropdowns currently update ALL troop types simultaneously (charms are technically per-troop but most players level them uniformly — confirm if Ryan wants per-troop control)
- Add data export/import for backup
- Add a "reset to defaults" option with confirmation
- Make the Overview tab show computed stats from marchHeroes gear, not just research/govgear/charms

## Technical Constraints

- **Single JSX file** running in Claude.ai artifact environment
- **React** with hooks (useState, useMemo, useCallback, useEffect)
- **No localStorage** — use `window.storage.get/set/delete/list` API (async, key-value, persists across sessions)
- **Available libraries**: React, Tailwind (utility classes only), recharts, d3, lodash, lucide-react, shadcn/ui
- **No external API calls** (no fetching game data at runtime)
- **Fonts**: Currently using Rajdhani (body), Orbitron (display/labels), JetBrains Mono (numbers) via Google Fonts import
- **Theme**: Dark military/tactical aesthetic with gold accents, troop-type color coding (blue=Infantry, purple=Cavalry, green=Archer)

## Source References
- **Damage formula**: kingshotguides.com (Daryl) — community-verified, ~95% accuracy, powers kingshotsimulator.com
- **Governor Gear tiers**: kingshot.net/database/governor-gear
- **Charm levels**: kingshot.net/database/governor-charm
- **Hero effect_op codes**: kingshothandbook.com/heroes/database + kingshotguides.com comments
- **Hero gear mechanics**: kingshothandbook.com/guides/hero-gear-ascension-guide
- **Combat loop**: kingshotguide.org combat guide (based on Strat Games Sloth video)
