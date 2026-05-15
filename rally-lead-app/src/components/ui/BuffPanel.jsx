import { TROOP_TYPES } from "../../data/constants";
import { C, troopColor, FONT_DISPLAY, FONT_MONO } from "../../theme";
import { Lbl } from "./Lbl";

// Battle-report-styled panel: 12 flat buff % rows + SkillMod chips.
// `scenario` controls the header label ("Attack Rally" vs "Garrison").

const STAT_ORDER = [
  { key: "ATK",  label: "Attack" },
  { key: "DEF",  label: "Defense" },
  { key: "Leth", label: "Lethality" },
  { key: "HP",   label: "Health" },
];

export function BuffPanel({ totalBuffs, skillMod, scenario = "Attack Rally", squadMultiplier = 0 }) {
  const factor = 1 + (squadMultiplier || 0) / 100;
  const rows = [];
  for (const troop of TROOP_TYPES) {
    for (const { key, label } of STAT_ORDER) {
      const additive = totalBuffs[troop]?.[key] || 0;
      const val = squadMultiplier > 0
        ? ((1 + additive / 100) * factor - 1) * 100
        : additive;
      rows.push({ troop, key, label, val });
    }
  }

  return (
    <div>
      <Lbl>Stat Bonuses ({scenario}{squadMultiplier > 0 ? ` — +${squadMultiplier}% squad applied` : ""})</Lbl>
      <div style={{
        background: C.s1, border: `1px solid ${C.brd}`,
        borderRadius: 8, overflow: "hidden", marginBottom: 14,
      }}>
        {rows.map((r, i) => (
          <div key={`${r.troop}-${r.key}`} style={{
            display: "grid", gridTemplateColumns: "1fr auto",
            alignItems: "center", padding: "10px 16px",
            background: i % 2 === 0 ? C.s1 : C.s2,
            borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.brd}`,
          }}>
            <span style={{
              color: troopColor[r.troop], fontWeight: 700, fontSize: 14,
              fontFamily: FONT_DISPLAY, letterSpacing: "0.5px",
            }}>
              {r.troop} {r.label}
            </span>
            <span style={{
              fontFamily: FONT_MONO, fontSize: 16, fontWeight: 800,
              color: r.val > 0 ? C.grn : C.txD,
            }}>
              {r.val > 0 ? "+" : ""}{r.val.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {skillMod && (
        <>
          <Lbl>Multiplicative Layer (SkillMod)</Lbl>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
            <SkillChip label="DAMAGE UP" value={skillMod.du} color={C.grn} />
            <SkillChip label="DEFENSE UP" value={skillMod.defUp} color={C.blu} />
            <SkillChip label="OPP DMG DOWN" value={skillMod.oddDown} color={C.pur} />
            <div style={{ fontSize: 11, color: C.txD, alignSelf: "center" }}>
              {Object.entries(skillMod.buckets || {}).map(([k, v]) => (
                <span key={k} style={{ fontFamily: FONT_MONO, marginRight: 8 }}>{k}: {v.toFixed(1)}%</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SkillChip({ label, value, color }) {
  return (
    <div style={{
      background: C.s1, border: `1px solid ${C.brd}`,
      borderRadius: 6, padding: "10px 14px", textAlign: "center", minWidth: 100,
    }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 800, color }}>
        {value.toFixed(3)}x
      </div>
      <div style={{ fontSize: 9, color: C.txD, marginTop: 3, letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}
