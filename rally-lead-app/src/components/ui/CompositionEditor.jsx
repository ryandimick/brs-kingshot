import { C, FONT_BODY, FONT_MONO, troopColor } from "../../theme";
import { TIERS, TG_LEVELS, totalCount } from "../../data/troop-base-stats";

// Editor for a single troop type's composition: a list of
// { count, tier, tgLevel } rows. Fires onChange with the full array
// whenever any row/row-count changes.
export function CompositionEditor({ troop, composition, onChange }) {
  const rows = Array.isArray(composition) && composition.length > 0
    ? composition
    : [{ count: 0, tier: 11, tgLevel: 0 }];

  const total = totalCount(rows);

  const setRow = (i, patch) => {
    const next = rows.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    onChange(next);
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    onChange([...rows, { count: 0, tier: last?.tier ?? 11, tgLevel: last?.tgLevel ?? 0 }]);
  };

  const removeRow = (i) => {
    if (rows.length <= 1) {
      onChange([{ count: 0, tier: rows[0]?.tier ?? 11, tgLevel: rows[0]?.tgLevel ?? 0 }]);
    } else {
      onChange(rows.filter((_, idx) => idx !== i));
    }
  };

  const color = troopColor[troop];

  return (
    <div style={{
      background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 8,
      padding: 10, display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Header: troop name + total */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}88` }} />
          <span style={{ fontWeight: 700, fontSize: 12, color, fontFamily: FONT_BODY, letterSpacing: "0.5px" }}>{troop}</span>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.txD }}>
          {total.toLocaleString()}
        </span>
      </div>

      {/* Column header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 56px 52px 20px",
        gap: 4, fontSize: 9, color: C.txD, fontFamily: FONT_BODY,
        letterSpacing: "0.5px", textTransform: "uppercase",
      }}>
        <span>Count</span>
        <span>Tier</span>
        <span>TG</span>
        <span />
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr 56px 52px 20px",
          gap: 4, alignItems: "center",
        }}>
          <input
            type="number"
            step={1000}
            min={0}
            value={row.count}
            onChange={e => setRow(i, { count: Math.max(0, Number(e.target.value) || 0) })}
            style={inputStyle}
          />
          <select
            value={row.tier}
            onChange={e => setRow(i, { tier: Number(e.target.value) })}
            style={inputStyle}
          >
            {TIERS.map(t => <option key={t} value={t}>T{t}</option>)}
          </select>
          <select
            value={row.tgLevel}
            onChange={e => setRow(i, { tgLevel: Number(e.target.value) })}
            style={inputStyle}
          >
            {TG_LEVELS.map(g => <option key={g} value={g}>TG{g}</option>)}
          </select>
          <button
            type="button"
            onClick={() => removeRow(i)}
            title="Remove row"
            style={{
              background: "transparent", border: `1px solid ${C.brd}`, color: C.txD,
              borderRadius: 3, cursor: "pointer", width: 20, height: 20, padding: 0,
              fontSize: 11, lineHeight: 1, fontFamily: FONT_MONO,
            }}
          >
            ×
          </button>
        </div>
      ))}

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        style={{
          background: "transparent", border: `1px dashed ${C.brd}`, color: C.txD,
          borderRadius: 4, padding: "4px 8px", fontSize: 10, fontFamily: FONT_BODY,
          letterSpacing: "0.8px", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        + Add Tier / TG
      </button>
    </div>
  );
}

const inputStyle = {
  background: C.s2, border: `1px solid ${C.brd}`, borderRadius: 3,
  color: C.txB, fontFamily: FONT_MONO, fontSize: 11,
  padding: "4px 6px", width: "100%", boxSizing: "border-box",
};
