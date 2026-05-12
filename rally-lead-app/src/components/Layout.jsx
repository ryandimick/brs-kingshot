import { UserButton } from "@clerk/clerk-react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";

const TABS = [
  { id: "bonuses", l: "Bonus Overview" },
  { id: "gear", l: "Gear & Charms" },
  { id: "pets", l: "Pets" },
  { id: "herogear", l: "Hero Gear" },
  { id: "roster", l: "Hero Roster" },
  { id: "attack", l: "Attack Rally" },
  { id: "garrison", l: "Garrison Lead" },
  { id: "invest", l: "Optimal Investment" },
  { id: "planner", l: "Scenario Planner" },
  { id: "counter", l: "Counter Search" },
];

export function Header({ dirty, saving, onSave, onExport }) {
  return (
    <div style={{
      background: C.s1, borderBottom: `1px solid ${C.brd}`,
      padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 800, color: C.gold, letterSpacing: "1.5px" }}>
          KINGSHOT RALLY OPTIMIZER
        </div>
        <div style={{ fontSize: 11, color: C.txD, marginTop: 1 }}>
          Investment optimizer &middot; Attack &amp; Garrison planner
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onExport} title="Download your saved stats as a JSON file" style={{
          fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: "1px",
          padding: "8px 16px", borderRadius: 4, border: `1px solid ${C.brd}`, cursor: "pointer",
          background: C.s2, color: C.tx, transition: "all .2s",
        }}>
          EXPORT
        </button>
        <button onClick={onSave} style={{
          fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, letterSpacing: "1px",
          padding: "8px 16px", borderRadius: 4, border: "none", cursor: "pointer",
          background: dirty ? C.gold : C.s2, color: dirty ? C.bg : C.txD,
          transition: "all .2s",
        }}>
          {saving ? "SAVED \u2713" : dirty ? "SAVE" : "SAVED"}
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}

export function TabBar({ tab, setTab }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${C.brd}`, background: C.s1, overflowX: "auto" }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "8px 12px",
          background: "none", border: "none", flexShrink: 0,
          color: tab === t.id ? C.gold : C.txD,
          borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          {t.l}
        </button>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <div style={{
      padding: 10, borderTop: `1px solid ${C.brd}`,
      fontSize: 9, color: C.txD, textAlign: "center", fontFamily: FONT_MONO,
    }}>
      Kills = &radic;Troops &times; ATK&times;Leth / DEF&times;HP / 100 &times; SkillMod &middot; kingshotguides.com
    </div>
  );
}
