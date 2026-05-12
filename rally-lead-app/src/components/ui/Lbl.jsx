import { C, FONT_DISPLAY } from "../../theme";

export function Lbl({ children, mt = 0 }) {
  return (
    <div style={{
      fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700,
      color: C.gold, letterSpacing: "1px", marginBottom: 6, marginTop: mt,
    }}>
      {children}
    </div>
  );
}
