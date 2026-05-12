import { TROOP_TYPES } from "../data/constants";
import { GOV_GEAR_SLOTS, GOV_GEAR_TIERS, CHARM_LEVELS } from "../data/gear-tables";
import { getSetBonus } from "../data/gear-tables";
import { C, FONT_MONO, tierColorFromLabel } from "../theme";
import { Lbl } from "./ui/Lbl";

export function GearTab({ cs, update, numUp }) {
  const slots = cs.govGearSlots || {};

  return (
    <div>
      <Lbl>Governor Gear Slots</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
        Pick the tier for each of your 6 gear pieces. Stats and set bonuses compute automatically.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {GOV_GEAR_SLOTS.map(slot => {
          const tierIdx = slots[slot.id] || 0;
          const tier = GOV_GEAR_TIERS[tierIdx];
          const tierColor = tierColorFromLabel(tier.label);
          return (
            <div key={slot.id} style={{
              background: C.s1, border: `1px solid ${tierIdx > 0 ? tierColor + "44" : C.brd}`,
              borderRadius: 8, padding: "10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{slot.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.txB, marginBottom: 6 }}>{slot.name}</div>
              <select
                value={tierIdx}
                onChange={e => update(`govGearSlots.${slot.id}`, Number(e.target.value))}
                style={{ width: "100%", fontSize: 11, padding: "4px 4px", color: tierColor }}
              >
                {GOV_GEAR_TIERS.map((t, i) => (
                  <option key={i} value={i}>{t.label} ({t.total}%)</option>
                ))}
              </select>
              {tierIdx > 0 && (
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: tierColor, marginTop: 4 }}>
                  +{tier.total}% ATK/DEF
                </div>
              )}

              {/* 3 Charm slots */}
              <div style={{ marginTop: 8, borderTop: `1px solid ${C.brd}`, paddingTop: 6 }}>
                <div style={{ fontSize: 9, color: C.txD, marginBottom: 4, letterSpacing: "0.5px" }}>CHARMS (Leth + HP)</div>
                <div style={{ display: "flex", gap: 3 }}>
                  {[0, 1, 2].map(ci => (
                    <select
                      key={ci}
                      value={(cs.charmLevels?.Infantry?.[slot.id]?.[ci]) || 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        for (const t of TROOP_TYPES) {
                          const arr = [...(cs.charmLevels?.[t]?.[slot.id] || [0,0,0])];
                          arr[ci] = val;
                          update(`charmLevels.${t}.${slot.id}`, arr);
                        }
                      }}
                      style={{ flex: 1, fontSize: 10, padding: "2px 2px", minWidth: 0 }}
                    >
                      {CHARM_LEVELS.map((cl, i) => (
                        <option key={i} value={i}>{cl.label}{cl.total > 0 ? ` (${cl.total}%)` : ""}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Set Bonus Display */}
      {(() => {
        const sb = getSetBonus(slots);
        return (sb.atk3 > 0 || sb.def3 > 0) ? (
          <div style={{
            marginTop: 10, padding: "8px 12px", background: C.s2,
            border: `1px solid ${C.gold}33`, borderRadius: 6,
            display: "flex", gap: 16, fontSize: 12,
          }}>
            {sb.def3 > 0 && <span style={{ color: C.blu }}>3pc Set: +{sb.def3}% DEF</span>}
            {sb.atk3 > 0 && <span style={{ color: C.grn }}>6pc Set: +{sb.atk3}% ATK</span>}
          </div>
        ) : null;
      })()}

    </div>
  );
}
