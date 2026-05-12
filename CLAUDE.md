# Kingshot Rally Investment Optimizer

## What This Is
A React app that serves as a **shadow character sheet** for the mobile game Kingshot. Built for an alliance leader (R5) who leads rallies and wants data-driven investment decisions. Tracks all stat sources individually, computes aggregated buff percentages, and runs an investment optimizer showing where the next resource should go for maximum marginal return.

## Architecture

### Project Structure
```
src/
  data/
    constants.js       - HERO_DB, BASE_STATS, TROOP_TYPES, STAT_NAMES
    gear-tables.js     - GOV_GEAR_TIERS, GOV_GEAR_SLOTS, GOV_GEAR_SET_BONUS, CHARM_LEVELS
    investments.js     - INVEST options config
    defaults.js        - defaultCharState()
  engine/
    buffs.js           - computeTotalBuffs(), getSetBonus()
    combat.js          - eff(), offProduct(), defProduct(), computeSkillMod(), marginal()
  hooks/
    useCharacterState.js - State management, localStorage persistence, update helpers
  components/
    Layout.jsx         - Header, TabBar, Footer
    OverviewTab.jsx    - Stat product dashboard, ratio warnings, buff summary, SkillMod
    ResearchTab.jsx    - Per-troop research %, alliance tech, skins
    GearTab.jsx        - Gov gear slots, charms, pets
    HeroesTab.jsx      - 3-hero march config with gear/widgets/skills
    OptimizerTab.jsx   - Ranked investment ROI with expandable breakdowns
    ui/
      Lbl.jsx          - Section label (Orbitron font)
      Chip.jsx         - Stat display chip
      StatRow.jsx      - Key-value row with optional warning
      DataGrid.jsx     - Grid table with header/data cells
  theme.js             - Colors (C), font family constants, troop color map
  App.jsx              - Root: tab state, computed values, tab rendering
  main.jsx             - Entry point
```

### Key Design Decisions
- **Composable components** over monolith — each tab is its own component, shared UI primitives in `ui/`
- **Data/engine separation** — game constants and math engine are pure functions, no React dependency
- **Single state object** persisted to localStorage as JSON (key: `kingshot-char-v1`)
- **Inline styles** using theme constants (matching the existing tactical dark aesthetic)
- **No TypeScript** — keeping JS/JSX to match the existing prototype's style
- **Vite** for dev server and builds

### Theme
- Dark military/tactical aesthetic with gold accents
- Troop-type color coding: blue=Infantry, purple=Cavalry, green=Archer
- Fonts: Rajdhani (body), Orbitron (display/labels), JetBrains Mono (numbers)

### Core Game Math
```
Kills = sqrt(Troops) * (ATK * Leth) / (Enemy_DEF * Enemy_HP) / 100 * SkillMod
effective_stat = base_stat * (1 + total_buff_pct / 100)
offense_product = effective_ATK * effective_Leth / 100
defense_product = effective_HP * effective_DEF / 100
```
- ATK*Leth is a product — marginal ROI favors whichever is lower
- Optimizer is opponent-independent (optimizes own stat products)
- SkillMod uses effect_op system: same-op ADD, different-op MULTIPLY

### Buff Layers
1. **Standard buffs** (additive): Research, Gov Gear, Charms, Pets, Alliance Tech, Skins
2. **Special buffs** (multiplicative): Hero abilities, Widgets, Kingdom titles — multiply ON TOP (not yet implemented)
3. **Widget buffs**: Multiplicative, only from rally leader's heroes (not yet implemented)

### Investment Optimizer
- Models each investment as "+X%" to relevant stats across all troop types
- Troop weights are computed dynamically from the user's actual troop composition (`computeTroopWeights` in `combat.js`), weighted by `√troops × stat_product` (damage-share). The user's ideal rally is roughly 50% Infantry / 20% Cavalry / 30% Archer.
- Offense 75% / Defense 25% for attack rally, inverted for garrison (adjustable per scenario)
- Efficiency = weighted gain / resource rarity
- Ranks S/A/B/C tier

## Upcoming Work (Priority Order)
1. Wire hero gear stats (enhancement/mastery) into buff computation
2. Derive SkillMod from marchHeroes instead of raw leaderDU input
3. Widget multiplicative layer
4. Exact stat lookup tables (hero gear, pets, research nodes)
5. "What If" / diff view on changes
6. UX polish (export/import, per-troop charm control toggle)

## Commands
```bash
npm run dev     # Start dev server
npm run build   # Production build
```
