import { C, FONT_MONO } from "../../theme";

export function Chip({ label, value }) {
  return (
    <div style={{
      background: C.bg, borderRadius: 4, padding: "5px 6px",
      border: `1px solid ${C.brd}`, textAlign: "center",
    }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.txB }}>{value}</div>
      <div style={{ fontSize: 8, color: C.txD, marginTop: 1 }}>{label}</div>
    </div>
  );
}
