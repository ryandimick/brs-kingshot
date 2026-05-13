import { useState } from "react";
import { C, FONT_DISPLAY, FONT_MONO, FONT_BODY } from "../theme";
import { Lbl } from "./ui/Lbl";
import { PLANNER_CATEGORIES } from "../data/planner-categories";
import { useApi } from "../lib/api";

export function ScenarioPlannerTab({ cs }) {
  const api = useApi();
  const [categoryId, setCategoryId] = useState("govgear");
  const [budget, setBudget] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const category = PLANNER_CATEGORIES.find(c => c.id === categoryId);

  const updateBudget = (key, val) => {
    setBudget(prev => ({ ...prev, [key]: Math.max(0, Number(val) || 0) }));
    setResult(null);
    setError(null);
  };

  const runOptimize = async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await api("/optimize/resources", {
        method: "POST",
        body: JSON.stringify({ characterSheet: cs, categoryId, budget }),
      });
      setResult(r);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  const totalGain = result ? result.upgrades.reduce((sum, u) => sum + u.gain, 0) : 0;

  return (
    <div>
      <Lbl>Scenario Planner</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 12 }}>
        Select a resource category, enter how many you have, and click Optimize to find the best allocation.
      </div>

      {/* Category selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {PLANNER_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setCategoryId(cat.id); setResult(null); setError(null); }} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 10px",
            borderRadius: 4, border: `1px solid ${categoryId === cat.id ? C.gold : C.brd}`,
            background: categoryId === cat.id ? C.gold + "22" : C.s1,
            color: categoryId === cat.id ? C.gold : C.txD,
            cursor: "pointer",
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Resource inputs */}
      {category && (
        <div style={{
          background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
          padding: 12, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.txB, marginBottom: 8 }}>
            Available Resources
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {category.resources.map(res => (
              <div key={res.key}>
                <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>{res.label}</div>
                <input type="number" min={0} value={budget[res.key] || 0}
                  onChange={e => updateBudget(res.key, e.target.value)}
                  style={{ width: 100 }} />
              </div>
            ))}
            <button onClick={runOptimize} disabled={running} style={{
              fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, padding: "7px 18px",
              borderRadius: 4, border: "none", cursor: running ? "default" : "pointer",
              background: running ? C.s2 : C.gold, color: running ? C.txD : C.bg, letterSpacing: "0.5px",
            }}>
              {running ? "OPTIMIZING..." : "OPTIMIZE"}
            </button>
          </div>
          {error && (
            <div style={{
              marginTop: 10, padding: "8px 10px", fontSize: 11, color: C.red,
              background: `${C.red}15`, borderRadius: 4, border: `1px solid ${C.red}55`,
            }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <Lbl>Optimal Allocation</Lbl>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.grn, fontWeight: 700 }}>
              Total: +{totalGain.toFixed(2)}% combined value
            </span>
          </div>

          {result.upgrades.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: C.txD, fontSize: 12 }}>
              Not enough resources for any upgrade in this category.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {result.upgrades.map((u, i) => (
                <div key={i} style={{
                  background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 5,
                  padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 12, color: C.txB, marginRight: 8 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 12, color: C.txB }}>{u.name}</span>
                    <span style={{ fontSize: 10, color: C.txD, marginLeft: 8 }}>{u.desc}</span>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.grn, fontWeight: 700 }}>
                    +{u.gain.toFixed(3)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Remaining resources */}
          {category && (
            <div style={{ marginTop: 12, fontSize: 11, color: C.txD }}>
              Remaining: {category.resources.map(res => (
                <span key={res.key} style={{ marginRight: 10 }}>
                  <span style={{ color: C.txB }}>{result.remaining[res.key] || 0}</span> {res.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
