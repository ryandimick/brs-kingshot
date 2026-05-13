import { TROOP_TYPES } from "../data/constants";
import { HERO_DB } from "../data/hero-catalog";
import { C, troopColor, FONT_DISPLAY } from "../theme";
import { Chip } from "./ui/Chip";
import { Lbl } from "./ui/Lbl";
import { BuffPanel } from "./ui/BuffPanel";
import { CompositionEditor } from "./ui/CompositionEditor";

const TROOP_SLOTS = ["Infantry", "Cavalry", "Archer"];

export function AttackRallyTab({ cs, update, numUp, totalBuffs, statProducts, skillMod, optimalLineup }) {
  const roster = cs.heroRoster || {};
  const rosterNames = Object.keys(roster);
  const selected = cs.attackRally?.selectedHeroes || ["", "", ""];
  const joiners = cs.attackRally?.joinerSlots || ["", "", "", ""];
  const offenseWeight = cs.attackRally?.offenseWeight ?? 75;
  const optimal = optimalLineup || ["", "", ""];

  const setHero = (slotIdx, name) => {
    const next = [...selected];
    next[slotIdx] = name;
    update("attackRally.selectedHeroes", next);
  };

  const setJoiner = (slotIdx, name) => {
    const next = [...joiners];
    next[slotIdx] = name;
    update("attackRally.joinerSlots", next);
  };

  const applyOptimal = () => {
    update("attackRally.selectedHeroes", [...optimal]);
  };

  const isOptimal = selected[0] === optimal[0] && selected[1] === optimal[1] && selected[2] === optimal[2];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Lbl>Attack Rally Lineup</Lbl>
        <button onClick={applyOptimal} disabled={isOptimal} style={{
          fontFamily: FONT_DISPLAY, fontSize: 9, fontWeight: 700, padding: "5px 12px",
          borderRadius: 4, border: "none", cursor: isOptimal ? "default" : "pointer",
          background: isOptimal ? C.s2 : C.grn, color: isOptimal ? C.txD : C.bg,
          letterSpacing: "0.5px",
        }}>
          {isOptimal ? "OPTIMAL" : "AUTO-OPTIMIZE"}
        </button>
      </div>

      {/* Offense/Defense weight slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: C.grn, fontWeight: 700, width: 55 }}>OFF {offenseWeight}%</span>
        <input type="range" min={0} max={100} step={5} value={offenseWeight}
          onChange={e => update("attackRally.offenseWeight", Number(e.target.value))}
          style={{ flex: 1, accentColor: C.gold }} />
        <span style={{ fontSize: 10, color: C.blu, fontWeight: 700, width: 55, textAlign: "right" }}>DEF {100 - offenseWeight}%</span>
      </div>

      {/* Hero selection */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {TROOP_SLOTS.map((troop, i) => {
          const available = rosterNames.filter(n => {
            const db = HERO_DB.find(h => h.name === n);
            return db?.type === troop;
          });
          const others = rosterNames.filter(n => {
            const db = HERO_DB.find(h => h.name === n);
            return db?.type !== troop;
          });
          return (
            <div key={troop} style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: troopColor[troop], marginBottom: 4, fontFamily: FONT_DISPLAY }}>
                {troop.toUpperCase()} SLOT
              </div>
              <select value={selected[i]} onChange={e => setHero(i, e.target.value)} style={{ width: "100%", fontSize: 11 }}>
                <option value="">None</option>
                {available.map(n => <option key={n} value={n}>{n}</option>)}
                {others.length > 0 && (
                  <optgroup label="Other types">
                    {others.map(n => <option key={n} value={n}>{n}</option>)}
                  </optgroup>
                )}
              </select>
              {selected[i] && roster[selected[i]] && (
                <div style={{ fontSize: 9, color: C.txD, marginTop: 3 }}>
                  Lv {roster[selected[i]].level} / {"\u2605"}{Math.floor(roster[selected[i]].stars)}
                  {roster[selected[i]].widgetLv > 0 && ` / W${roster[selected[i]].widgetLv}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Joiners */}
      <Lbl>Joiner Heroes (4 slots)</Lbl>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[0,1,2,3].map(ji => (
          <select key={ji} value={joiners[ji]} onChange={e => setJoiner(ji, e.target.value)}
            style={{ flex: 1, fontSize: 11, minWidth: 100 }}>
            <option value="">None</option>
            {HERO_DB.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
          </select>
        ))}
      </div>

      {/* Rally Formation — per-troop composition */}
      <Lbl>Rally Formation</Lbl>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {TROOP_TYPES.map(t => (
          <CompositionEditor
            key={t}
            troop={t}
            composition={cs.troops?.[t]?.composition || []}
            onChange={(next) => update(`troops.${t}.composition`, next)}
          />
        ))}
      </div>

      {/* Stat Products */}
      <Lbl>Attack Stat Products</Lbl>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
        {TROOP_TYPES.map(t => {
          const sp = statProducts[t];
          return (
            <div key={t} style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: troopColor[t], boxShadow: `0 0 6px ${troopColor[t]}88` }} />
                <span style={{ fontWeight: 700, fontSize: 12, color: troopColor[t] }}>{t}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <Chip label="ATK\u00D7Leth" value={sp.off.toFixed(1)} />
                <Chip label="HP\u00D7DEF" value={sp.def.toFixed(1)} />
              </div>
            </div>
          );
        })}
      </div>

      <BuffPanel totalBuffs={totalBuffs} skillMod={skillMod} scenario="Attack Rally" />
    </div>
  );
}
