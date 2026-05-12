import { C } from "../../theme";

export function StatRow({ left, right, warn }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
      <span style={{ color: C.txD }}>{left}</span>
      <span style={{ color: warn ? C.gold : C.txD }}>{right}</span>
    </div>
  );
}
