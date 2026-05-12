import { useState } from "react";
import { HERO_DB } from "../data/hero-database";
import { C, troopColor, FONT_DISPLAY } from "../theme";
import { Lbl } from "./ui/Lbl";

const STAR_OPTIONS = [];
for (let star = 0; star <= 4; star++) {
  for (let step = 0; step <= 5; step++) STAR_OPTIONS.push(star + step * 0.1);
}
STAR_OPTIONS.push(5.0);

function formatStars(v) {
  const star = Math.floor(v);
  const step = Math.round((v - star) * 10);
  if (star === 0 && step === 0) return "0";
  const stars = star > 0 ? "\u2605".repeat(star) : "0\u2605";
  return step > 0 ? `${stars} +${step}` : stars;
}

const TROOP_ORDER = ["Infantry", "Cavalry", "Archer"];

const MAX_GEN = Math.max(...HERO_DB.map(h => h.gen));

export function HeroRosterTab({ cs, update, updateRoster, removeRoster }) {
  const [addHero, setAddHero] = useState("");
  const maxGen = cs.maxGeneration || MAX_GEN;
  const roster = cs.heroRoster || {};
  const rosterNames = Object.keys(roster);
  const availableHeroes = HERO_DB.filter(h => !rosterNames.includes(h.name) && h.gen <= maxGen);

  const handleAdd = () => {
    if (!addHero) return;
    updateRoster(addHero, null, null);
    setAddHero("");
  };

  // Group roster by troop type
  const grouped = {};
  for (const t of TROOP_ORDER) grouped[t] = [];
  for (const name of rosterNames) {
    const db = HERO_DB.find(h => h.name === name);
    const troop = db?.type || "Infantry";
    if (!grouped[troop]) grouped[troop] = [];
    grouped[troop].push({ name, db, entry: roster[name] });
  }

  return (
    <div>
      <Lbl>Hero Roster</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
        Add heroes you own. Set their level, stars, widget, and skill levels. These heroes are available for Attack Rally and Garrison Lead lineups.
      </div>

      {/* Generation filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: C.txD }}>Server Generation:</span>
        <select value={maxGen} onChange={e => update("maxGeneration", Number(e.target.value))}
          style={{ fontSize: 11, width: 80 }}>
          {Array.from({ length: MAX_GEN }, (_, i) => i + 1).map(g => (
            <option key={g} value={g}>Gen {g}</option>
          ))}
        </select>
        <span style={{ fontSize: 10, color: C.txD }}>Only heroes up to this generation will be available</span>
      </div>

      {/* Add hero */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <select value={addHero} onChange={e => setAddHero(e.target.value)} style={{ flex: 1, fontSize: 12 }}>
          <option value="">Select hero to add...</option>
          {TROOP_ORDER.map(t => (
            <optgroup key={t} label={t}>
              {availableHeroes.filter(h => h.type === t).map(h => (
                <option key={h.name} value={h.name}>{h.name} (Gen {h.gen}, {h.rarity})</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button onClick={handleAdd} disabled={!addHero} style={{
          fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, padding: "6px 14px",
          borderRadius: 4, border: "none", cursor: addHero ? "pointer" : "default",
          background: addHero ? C.gold : C.s2, color: addHero ? C.bg : C.txD,
        }}>
          ADD
        </button>
      </div>

      {/* Hero cards grouped by troop type */}
      {TROOP_ORDER.map(troop => {
        const heroes = grouped[troop];
        if (!heroes || heroes.length === 0) return null;
        return (
          <div key={troop} style={{ marginBottom: 16 }}>
            <div style={{ color: troopColor[troop], fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{troop}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {heroes.map(({ name, db, entry }) => (
                <div key={name} style={{
                  background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
                  padding: "8px 12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: troopColor[troop] }}>{name}</span>
                      <span style={{ fontSize: 10, color: C.txD, marginLeft: 6 }}>Gen {db?.gen} {db?.rarity}</span>
                    </div>
                    <button onClick={() => removeRoster(name)} style={{
                      fontSize: 9, color: C.red, background: "none", border: `1px solid ${C.red}44`,
                      borderRadius: 3, padding: "2px 6px", cursor: "pointer",
                    }}>
                      Remove
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>Level</div>
                      <input type="number" min={1} max={80} value={entry.level || 1}
                        onChange={e => updateRoster(name, "level", Math.min(80, Math.max(1, Number(e.target.value) || 1)))}
                        style={{ width: 55 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>Stars</div>
                      <select value={entry.stars || 0} onChange={e => updateRoster(name, "stars", Number(e.target.value))}
                        style={{ fontSize: 11, width: 70 }}>
                        {STAR_OPTIONS.map(v => <option key={v} value={v}>{formatStars(v)}</option>)}
                      </select>
                    </div>
                    {db?.hasWidget && (
                      <div>
                        <div style={{ fontSize: 9, color: C.gold, marginBottom: 2 }}>Widget</div>
                        <input type="number" min={0} max={10} value={entry.widgetLv || 0}
                          onChange={e => updateRoster(name, "widgetLv", Math.min(10, Math.max(0, Number(e.target.value) || 0)))}
                          style={{ width: 45 }} />
                      </div>
                    )}
                    {(db?.expeditionSkills || []).map((skill, si) => (
                      <div key={si}>
                        <div style={{ fontSize: 8, color: C.txD, marginBottom: 2 }}>{skill.name || `Skill ${si + 1}`}</div>
                        <input type="number" min={0} max={5}
                          value={(entry.skills || [0,0,0])[si] || 0}
                          onChange={e => {
                            const sk = [...(entry.skills || [0,0,0])];
                            sk[si] = Math.min(5, Math.max(0, Number(e.target.value) || 0));
                            updateRoster(name, "skills", sk);
                          }}
                          style={{ width: 35, fontSize: 10, padding: "3px 2px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {rosterNames.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: C.txD, fontSize: 12 }}>
          No heroes in roster. Add heroes above to get started.
        </div>
      )}
    </div>
  );
}
