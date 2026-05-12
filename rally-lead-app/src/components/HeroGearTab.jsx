import { C, troopColor, FONT_MONO, FONT_DISPLAY } from "../theme";
import { Lbl } from "./ui/Lbl";
import { heroGearPieceStat, GEAR_PIECE_STAT } from "../data/hero-tables";

const PIECE_NAMES = { helm: "Helm", boots: "Boots", chest: "Chest", gloves: "Gloves" };
const PIECE_ICONS = { helm: "\u{1F3A9}", boots: "\u{1F462}", chest: "\u{1F6E1}", gloves: "\u{1F9E4}" };
const TROOP_TYPES = ["Infantry", "Cavalry", "Archer"];

export function HeroGearTab({ cs, numUp }) {
  return (
    <div>
      <Lbl>Hero Gear (by Troop Type)</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 12 }}>
        Gear belongs to the troop type slot, not a specific hero. Enhancement (XP) and Mastery (Forgehammers) per piece.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {TROOP_TYPES.map(troop => {
          const gearSet = cs.heroGear?.[troop] || {};
          let lethTotal = 0, hpTotal = 0;
          for (const [pid, stat] of Object.entries(GEAR_PIECE_STAT)) {
            const p = gearSet[pid] || { enh: 0, mast: 0 };
            const val = heroGearPieceStat(p.enh || 0, p.mast || 0);
            if (stat === "Leth") lethTotal += val; else hpTotal += val;
          }

          return (
            <div key={troop} style={{
              background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 8, padding: 10,
            }}>
              <div style={{
                textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700,
                color: troopColor[troop], letterSpacing: "1px", marginBottom: 8,
                paddingBottom: 6, borderBottom: `1px solid ${C.brd}`,
              }}>
                {troop.toUpperCase()} GEAR
              </div>

              {Object.entries(GEAR_PIECE_STAT).map(([pieceId, stat]) => {
                const piece = gearSet[pieceId] || { enh: 0, mast: 0 };
                return (
                  <div key={pieceId} style={{
                    background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 4,
                    padding: 6, marginBottom: 4, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>{PIECE_ICONS[pieceId]}</div>
                    <div style={{ fontSize: 9, color: C.txD, marginBottom: 3 }}>
                      {PIECE_NAMES[pieceId]} ({stat === "Leth" ? "Leth" : "HP"})
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 8, color: C.txD }}>Enh</div>
                        <input type="number" min={0} max={200}
                          value={piece.enh}
                          onChange={e => numUp(`heroGear.${troop}.${pieceId}.enh`, e.target.value)}
                          style={{ width: "100%", fontSize: 10, padding: "3px 2px" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 8, color: C.txD }}>Mast</div>
                        <input type="number" min={0} max={20}
                          value={piece.mast}
                          onChange={e => numUp(`heroGear.${troop}.${pieceId}.mast`, e.target.value)}
                          style={{ width: "100%", fontSize: 10, padding: "3px 2px" }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Stat totals */}
              <div style={{
                marginTop: 6, padding: "6px 8px", background: C.bg, borderRadius: 4,
                display: "flex", justifyContent: "space-around", fontFamily: FONT_MONO, fontSize: 10,
              }}>
                <span style={{ color: C.grn }}>Leth {lethTotal.toFixed(1)}%</span>
                <span style={{ color: C.blu }}>HP {hpTotal.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
