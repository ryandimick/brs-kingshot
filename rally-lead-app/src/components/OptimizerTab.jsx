import { useState, useEffect } from "react";
import { TROOP_TYPES } from "../data/constants";
import { C, troopColor, FONT_DISPLAY, FONT_MONO, FONT_BODY, TIER_COLORS } from "../theme";
import { useApi } from "../lib/api";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "govgear", label: "Gov Gear" },
  { id: "charm", label: "Gov Charms" },
  { id: "heroXP", label: "Hero Gear Enh" },
  { id: "forgehammer", label: "Hero Gear Mastery" },
  { id: "widget", label: "Hero Widgets" },
];

export function OptimizerTab({ cs }) {
  const api = useApi();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expInv, setExpInv] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("gain");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api("/optimize/marginal", {
      method: "POST",
      body: JSON.stringify({ characterSheet: cs }),
    })
      .then(({ investments: list }) => {
        if (!cancelled) {
          setInvestments(list);
          setLoading(false);
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message || String(e));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [cs, api]);

  const byFilter = filter === "all" ? investments : investments.filter(inv => inv.costType === filter);
  const filtered = sortBy === "usdEff"
    ? [...byFilter].sort((a, b) => {
        const ae = a.usdEff ?? -1, be = b.usdEff ?? -1;
        return be - ae;
      })
    : byFilter;
  const maxComb = filtered.length > 0 ? Math.max(...filtered.map(f => f.comb || 0), 0.001) : 1;

  return (
    <div>
      <div style={{ fontSize: 12, color: C.txD, marginBottom: 10 }}>
        Ranked by {sortBy === "usdEff" ? "% gain per USD spent (using $5 pack baseline)" : "combined value across Attack Rally + Garrison Lead"}.
        Click any row for per-troop breakdown.
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {FILTER_OPTIONS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 10px",
            borderRadius: 4, border: `1px solid ${filter === f.id ? C.gold : C.brd}`,
            background: filter === f.id ? C.gold + "22" : C.s1,
            color: filter === f.id ? C.gold : C.txD,
            cursor: "pointer",
          }}>
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => setSortBy("gain")} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 10px",
            borderRadius: 4, border: `1px solid ${sortBy === "gain" ? C.gold : C.brd}`,
            background: sortBy === "gain" ? C.gold + "22" : C.s1,
            color: sortBy === "gain" ? C.gold : C.txD,
            cursor: "pointer",
          }}>Sort: Gain</button>
          <button onClick={() => setSortBy("usdEff")} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 10px",
            borderRadius: 4, border: `1px solid ${sortBy === "usdEff" ? C.gold : C.brd}`,
            background: sortBy === "usdEff" ? C.gold + "22" : C.s1,
            color: sortBy === "usdEff" ? C.gold : C.txD,
            cursor: "pointer",
          }}>Sort: %/$</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12, fontSize: 12, color: C.red,
          background: `${C.red}15`, borderRadius: 4, border: `1px solid ${C.red}55`,
          marginBottom: 12,
        }}>
          Failed to load: {error}
        </div>
      )}

      {loading && investments.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: C.txD, fontSize: 12 }}>
          Computing investments...
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.map((inv) => {
          const isExp = expInv === inv.id;
          const barW = Math.min(100, (inv.comb / Math.max(maxComb, .001)) * 100);
          const tCl = TIER_COLORS[inv.tier];
          return (
            <div key={inv.id} onClick={() => setExpInv(isExp ? null : inv.id)} style={{
              background: C.s1, border: `1px solid ${isExp ? tCl : C.brd}`,
              borderRadius: 6, overflow: "hidden", cursor: "pointer",
            }}>
              <div style={{ position: "relative", padding: "10px 12px" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${barW}%`, background: `linear-gradient(90deg,${tCl}18,${tCl}05)`,
                }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: FONT_DISPLAY, fontSize: 9, fontWeight: 700, color: tCl,
                      border: `1px solid ${tCl}`, padding: "1px 4px", borderRadius: 3,
                    }}>{inv.tier}</span>
                    <span style={{ fontSize: 14 }}>{inv.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.txB }}>{inv.name}</span>
                    <span style={{ fontSize: 10, color: C.txD }}>{inv.desc}</span>
                    <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.grn }}>
                      +{inv.comb.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 10, fontFamily: FONT_MONO, marginTop: 3, flexWrap: "wrap" }}>
                    {inv.atkComb != null && <span style={{ color: C.grn }}>ATK +{inv.atkComb.toFixed(2)}%</span>}
                    {inv.garComb != null && <span style={{ color: C.blu }}>GAR +{inv.garComb.toFixed(2)}%</span>}
                    {inv.costLabel && <span style={{ color: C.txD }}>{"•"} {inv.costLabel}</span>}
                    {inv.usdCost != null && (
                      <span style={{ color: C.gold }}>
                        {"•"} ${inv.usdCost.toFixed(2)}
                        {inv.usdEff != null && ` (${(1/inv.usdEff).toFixed(2)}/% )`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExp && (
                <div style={{ padding: "8px 12px 10px", borderTop: `1px solid ${C.brd}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                    {TROOP_TYPES.map(t => (
                      <div key={t} style={{ background: C.bg, borderRadius: 4, padding: "6px 8px", border: `1px solid ${C.brd}` }}>
                        <div style={{ color: troopColor[t], fontWeight: 600, fontSize: 11, marginBottom: 3 }}>{t}</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 10 }}>
                          {inv.pt[t].og > 0 && <div>OFF <span style={{ color: C.grn }}>+{inv.pt[t].og.toFixed(2)}%</span></div>}
                          {inv.pt[t].dg > 0 && <div>DEF <span style={{ color: C.blu }}>+{inv.pt[t].dg.toFixed(2)}%</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!loading && filtered.length === 0 && !error && (
          <div style={{ padding: 20, textAlign: "center", color: C.txD, fontSize: 12 }}>
            No upgrades available for this category.
          </div>
        )}
      </div>
    </div>
  );
}
