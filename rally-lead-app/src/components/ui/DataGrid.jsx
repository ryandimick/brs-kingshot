import { C, FONT_DISPLAY, FONT_MONO } from "../../theme";

export function Grid({ cols, children }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: cols, gap: "1px",
      background: C.brd, borderRadius: 5, overflow: "hidden", fontSize: 12,
    }}>
      {children}
    </div>
  );
}

export function Hc({ children }) {
  return (
    <div style={{
      background: C.s1, padding: "6px 8px", fontSize: 9, fontWeight: 700,
      color: C.txD, textAlign: "center", letterSpacing: ".6px", fontFamily: FONT_DISPLAY,
    }}>
      {children}
    </div>
  );
}

export function Dc({ children, mono, style = {} }) {
  return (
    <div style={{
      background: C.bg, padding: "6px 8px", textAlign: "center", fontSize: 12,
      fontFamily: mono ? FONT_MONO : undefined, ...style,
    }}>
      {children}
    </div>
  );
}
