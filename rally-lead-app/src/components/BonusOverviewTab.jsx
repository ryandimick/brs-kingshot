import { TROOP_TYPES, STAT_NAMES } from "../data/constants";
import { C, troopColor, FONT_MONO } from "../theme";
import { Lbl } from "./ui/Lbl";

export function BonusOverviewTab({ cs, numUp }) {
  const bo = cs.bonusOverview || {};

  return (
    <div>
      <Lbl>Bonus Overview (Total In-Game Buff Percentages)</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 14 }}>
        Enter the total buff % shown in your in-game bonus screen. This includes Research, Alliance Tech, Outposts, Skins, Gov Gear, Charms, and Pets combined.
      </div>

      {/* Squads (all troop types) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Squads (All Types)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {STAT_NAMES.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
              <input type="number" value={bo.squads?.[s] || 0}
                onChange={e => numUp(`bonusOverview.squads.${s}`, e.target.value)} />
              <span style={{ fontSize: 10, color: C.txD }}>%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per troop type */}
      {TROOP_TYPES.map(t => (
        <div key={t} style={{ marginBottom: 12 }}>
          <div style={{ color: troopColor[t], fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {STAT_NAMES.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: C.txD, width: 32 }}>{s}</span>
                <input type="number" value={bo[t]?.[s] || 0}
                  onChange={e => numUp(`bonusOverview.${t}.${s}`, e.target.value)} />
                <span style={{ fontSize: 10, color: C.txD }}>%</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Back-calculated breakdown */}
      <Lbl mt={20}>Source Breakdown (back-calculated)</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 8 }}>
        Research + Alliance + Outposts + Skins = Bonus Overview &minus; Gov Gear &minus; Charms &minus; Pets
      </div>
    </div>
  );
}
