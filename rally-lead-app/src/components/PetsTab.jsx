import { TROOP_TYPES } from "../data/constants";
import { C, troopColor } from "../theme";
import { Lbl } from "./ui/Lbl";

export function PetsTab({ cs, numUp }) {
  const pets = cs.pets || {};

  return (
    <div>
      <Lbl>Pet Stats (Aggregate Percentages)</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 14 }}>
        Enter your total pet buff % for each stat. These come from pet refinement, pet skills, and pet passive bonuses combined.
      </div>

      {/* Per-troop Leth & HP */}
      {TROOP_TYPES.map(t => (
        <div key={t} style={{ marginBottom: 12 }}>
          <div style={{ color: troopColor[t], fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["Leth", "HP"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
                <input
                  type="number"
                  value={pets[t]?.[s] || 0}
                  onChange={e => numUp(`pets.${t}.${s}`, e.target.value)}
                />
                <span style={{ fontSize: 10, color: C.txD }}>%</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Squads ATK & DEF */}
      <Lbl mt={16}>Squads (All Troop Types)</Lbl>
      <div style={{ display: "flex", gap: 16 }}>
        {["ATK", "DEF"].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
            <input
              type="number"
              value={pets.squads?.[s] || 0}
              onChange={e => numUp(`pets.squads.${s}`, e.target.value)}
            />
            <span style={{ fontSize: 10, color: C.txD }}>%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
