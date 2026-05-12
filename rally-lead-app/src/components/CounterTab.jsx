import { useState, useMemo } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_MONO, troopColor } from "../theme";
import { createArmy, monteCarloSim, simulateBattle } from "../engine/battle-sim";

// ═══════════════════════════════════════════
// Composition sweep: all triples summing to 100 in 5% buckets → 231 combos
// ═══════════════════════════════════════════
const STEP = 5;
const TOTAL = 100;

function generateCompositions() {
  const out = [];
  for (let inf = 0; inf <= TOTAL; inf += STEP) {
    for (let cav = 0; cav <= TOTAL - inf; cav += STEP) {
      const arch = TOTAL - inf - cav;
      out.push({ Infantry: inf, Cavalry: cav, Archer: arch });
    }
  }
  return out;
}

const ALL_COMPOSITIONS = generateCompositions();

const HEATMAP_CELL = 22;
const HEATMAP_TICK_W = 26;
const HEATMAP_GRID_DIM = (TOTAL / STEP) + 1;

const PRESETS = [
  { name: "Pure Infantry",   comp: { Infantry: 100, Cavalry: 0,   Archer: 0   } },
  { name: "Pure Cavalry",    comp: { Infantry: 0,   Cavalry: 100, Archer: 0   } },
  { name: "Pure Archer",     comp: { Infantry: 0,   Cavalry: 0,   Archer: 100 } },
  { name: "Standard 50/20/30", comp: { Infantry: 50, Cavalry: 20, Archer: 30 } },
  { name: "Garrison 60/20/20", comp: { Infantry: 60, Cavalry: 20, Archer: 20 } },
  { name: "Bear 10/10/80",     comp: { Infantry: 10, Cavalry: 10, Archer: 80 } },
  { name: "Balanced 33/33/34", comp: { Infantry: 35, Cavalry: 30, Archer: 35 } },
];

function makeArmy(comp, totalTroops, tier, tgLevel) {
  return createArmy({
    Infantry: { count: Math.round((totalTroops * comp.Infantry) / 100), tier, tgLevel },
    Cavalry:  { count: Math.round((totalTroops * comp.Cavalry)  / 100), tier, tgLevel },
    Archer:   { count: Math.round((totalTroops * comp.Archer)   / 100), tier, tgLevel },
  });
}

function compKey(c) {
  return `${c.Infantry}-${c.Cavalry}-${c.Archer}`;
}

function compLabel(c) {
  return `${c.Infantry}/${c.Cavalry}/${c.Archer}`;
}

function totalLosses(losses) {
  return losses.Infantry + losses.Cavalry + losses.Archer;
}

// ═══════════════════════════════════════════
// UI Primitives
// ═══════════════════════════════════════════
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700,
      color: C.gold, letterSpacing: "1.2px", marginBottom: 6,
      textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 10, color: C.txD, fontFamily: FONT_BODY, letterSpacing: "0.5px" }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: C.s2, border: `1px solid ${C.brd}`, borderRadius: 4,
          color: C.txB, fontFamily: FONT_MONO, fontSize: 12,
          padding: "6px 8px", width: 80,
        }}
      />
    </div>
  );
}

function CompBar({ comp, width = 120, height = 14 }) {
  const segments = [
    { type: "Infantry", val: comp.Infantry },
    { type: "Cavalry",  val: comp.Cavalry },
    { type: "Archer",   val: comp.Archer },
  ];
  return (
    <div style={{
      display: "flex", width, height, borderRadius: 3, overflow: "hidden",
      border: `1px solid ${C.brd}`,
    }}>
      {segments.map(s => s.val > 0 && (
        <div key={s.type} style={{
          background: troopColor[s.type],
          width: `${s.val}%`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "#000", fontFamily: FONT_MONO, fontWeight: 700,
        }}>
          {s.val >= 15 ? s.val : ""}
        </div>
      ))}
    </div>
  );
}

function CompSliders({ comp, onChange }) {
  // Snap any value to the nearest STEP, and rebalance so total = 100
  const setStat = (statKey, newVal) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVal / STEP) * STEP));
    const others = ["Infantry", "Cavalry", "Archer"].filter(k => k !== statKey);
    const remaining = 100 - clamped;
    const otherSum = comp[others[0]] + comp[others[1]];

    let a, b;
    if (otherSum === 0) {
      a = Math.round((remaining / 2) / STEP) * STEP;
      b = remaining - a;
    } else {
      a = Math.round((remaining * comp[others[0]] / otherSum) / STEP) * STEP;
      b = remaining - a;
      if (b < 0) { a += b; b = 0; }
      if (a < 0) { b += a; a = 0; }
    }

    onChange({ [statKey]: clamped, [others[0]]: a, [others[1]]: b });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {["Infantry", "Cavalry", "Archer"].map(type => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 68, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 700,
            color: troopColor[type], textTransform: "uppercase", letterSpacing: "0.8px",
          }}>
            {type}
          </div>
          <input
            type="range"
            min={0} max={100} step={STEP}
            value={comp[type]}
            onChange={e => setStat(type, Number(e.target.value))}
            style={{ flex: 1, accentColor: troopColor[type] }}
          />
          <div style={{
            width: 36, textAlign: "right", fontFamily: FONT_MONO, fontSize: 12,
            color: C.txB,
          }}>
            {comp[type]}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// CounterTab
// ═══════════════════════════════════════════
export function CounterTab() {
  const [totalTroops, setTotalTroops] = useState(5000);
  const [tier, setTier] = useState(11);
  const [tgLevel, setTgLevel] = useState(0);
  const [iterations, setIterations] = useState(3);
  const [maxRounds, setMaxRounds] = useState(500);
  const [myComp, setMyComp] = useState(PRESETS[3].comp);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRunMs, setLastRunMs] = useState(null);
  const [winCounts, setWinCounts] = useState(null); // Map<key, { comp, wins, losses, draws, total }>
  const [matrixRunning, setMatrixRunning] = useState(false);
  const [matrixProgress, setMatrixProgress] = useState(0);
  const [matrixRunMs, setMatrixRunMs] = useState(null);

  const runSweep = () => {
    setRunning(true);
    // Defer to next tick so the "running" state can render first
    setTimeout(() => {
      const t0 = performance.now();
      // You are the fixed attacker; each cell is a potential enemy defender.
      const attacker = makeArmy(myComp, totalTroops, tier, tgLevel);

      const rows = ALL_COMPOSITIONS.map(comp => {
        const defender = makeArmy(comp, totalTroops, tier, tgLevel);
        const mc = monteCarloSim(attacker, defender, {
          iterations,
          battleType: "tileAttack",
          maxRounds,
        });
        const aLost = totalLosses(mc.avgAttackerLosses);
        const dLost = totalLosses(mc.avgDefenderLosses);
        const attackerSurv = totalTroops - aLost;
        const defenderSurv = totalTroops - dLost;
        return {
          comp,
          key: compKey(comp),
          winRate: mc.attackerWinRate,
          lossRate: mc.defenderWinRate,
          drawRate: mc.drawRate,
          avgRounds: mc.avgRounds,
          attackerSurv,
          defenderSurv,
          netSurv: attackerSurv - defenderSurv, // primary score
          attackerLossPct: aLost / totalTroops,
        };
      });
      rows.sort((a, b) => b.netSurv - a.netSurv);
      setResults(rows);
      setLastRunMs(performance.now() - t0);
      setRunning(false);
      // Main-sweep parameters may have changed; invalidate matrix cache.
      setWinCounts(null);
      setMatrixRunMs(null);
    }, 10);
  };

  // Full NxN robustness sweep: for every attacker comp, battle every defender
  // comp once and count wins/losses/draws. Chunked via setTimeout so the UI
  // stays responsive and progress can be reported.
  const runFullMatrix = () => {
    if (matrixRunning) return;
    setMatrixRunning(true);
    setMatrixProgress(0);

    const t0 = performance.now();
    const comps = ALL_COMPOSITIONS;
    const armies = comps.map(c => makeArmy(c, totalTroops, tier, tgLevel));
    const counts = new Map();
    for (const c of comps) {
      counts.set(compKey(c), { comp: c, wins: 0, losses: 0, draws: 0, total: comps.length - 1 });
    }

    let i = 0;
    const CHUNK = 6;

    const step = () => {
      const end = Math.min(i + CHUNK, comps.length);
      for (; i < end; i++) {
        const att = armies[i];
        const attCounts = counts.get(compKey(comps[i]));
        for (let j = 0; j < comps.length; j++) {
          if (i === j) continue; // skip self
          const result = simulateBattle(att, armies[j], {
            seed: 42, battleType: "tileAttack", maxRounds,
          });
          if (result.winner === "attacker") attCounts.wins++;
          else if (result.winner === "defender") attCounts.losses++;
          else attCounts.draws++;
        }
      }
      setMatrixProgress(Math.round((100 * i) / comps.length));
      if (i < comps.length) {
        setTimeout(step, 0);
      } else {
        setWinCounts(counts);
        setMatrixRunMs(performance.now() - t0);
        setMatrixRunning(false);
      }
    };
    setTimeout(step, 10);
  };

  const myCompValid = myComp.Infantry + myComp.Cavalry + myComp.Archer === 100;

  // Identify interesting rows for the "RPS validation" panel
  const rpsValidation = useMemo(() => {
    if (!results) return null;
    return {
      top: results.slice(0, 10),
      bottom: results.slice(-10).reverse(),
    };
  }, [results]);

  return (
    <div>
      <div style={{ fontSize: 12, color: C.txD, marginBottom: 12 }}>
        Matchup analysis. Runs <em>your</em> formation against every possible enemy composition
        in 5% buckets (231 combinations) and ranks them by net survivor differential &mdash;
        how well you&apos;d fare against each.
      </div>

      {/* ─── Sweep parameters ─── */}
      <div style={{
        background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
        padding: 12, marginBottom: 12,
      }}>
        <SectionLabel>Sweep Parameters</SectionLabel>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <NumberInput label="Total Troops (each side)" value={totalTroops} onChange={setTotalTroops} min={100} max={100000} step={500} />
          <NumberInput label="Troop Tier" value={tier} onChange={setTier} min={1} max={11} />
          <NumberInput label="TG Level" value={tgLevel} onChange={setTgLevel} min={0} max={5} />
          <NumberInput label="Iterations / matchup" value={iterations} onChange={setIterations} min={1} max={20} />
          <NumberInput label="Max Rounds" value={maxRounds} onChange={setMaxRounds} min={50} max={2000} step={50} />
        </div>
      </div>

      {/* ─── Your formation picker ─── */}
      <div style={{
        background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
        padding: 12, marginBottom: 12,
      }}>
        <SectionLabel>Your Formation</SectionLabel>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {PRESETS.map(p => {
            const active = compKey(p.comp) === compKey(myComp);
            return (
              <button key={p.name} onClick={() => setMyComp(p.comp)} style={{
                fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 10px",
                borderRadius: 4, border: `1px solid ${active ? C.gold : C.brd}`,
                background: active ? C.gold + "22" : C.s2,
                color: active ? C.gold : C.txD, cursor: "pointer",
              }}>
                {p.name}
              </button>
            );
          })}
        </div>

        <CompSliders comp={myComp} onChange={(delta) => setMyComp({ ...myComp, ...delta })} />

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <CompBar comp={myComp} width={200} />
          {!myCompValid && (
            <div style={{ color: C.red, fontSize: 11 }}>Must sum to 100%</div>
          )}
        </div>
      </div>

      {/* ─── Run buttons ─── */}
      <div style={{ marginBottom: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={runSweep} disabled={running || matrixRunning || !myCompValid} style={{
          fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: "1px",
          padding: "10px 20px", borderRadius: 4, border: "none",
          background: running ? C.s2 : C.gold, color: running ? C.txD : C.bg,
          cursor: running || matrixRunning || !myCompValid ? "default" : "pointer",
          opacity: !myCompValid ? 0.5 : 1,
        }}>
          {running ? "RUNNING..." : "RUN MATCHUP ANALYSIS"}
        </button>

        <button onClick={runFullMatrix} disabled={running || matrixRunning} style={{
          fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, letterSpacing: "1px",
          padding: "10px 20px", borderRadius: 4,
          border: `1px solid ${C.gold}`,
          background: matrixRunning ? C.s2 : "transparent",
          color: matrixRunning ? C.gold : C.gold,
          cursor: running || matrixRunning ? "default" : "pointer",
        }}>
          {matrixRunning ? `COMPUTING ${matrixProgress}%` : winCounts ? "RECOMPUTE ROBUSTNESS" : "COMPUTE ROBUSTNESS (N×N)"}
        </button>

        {lastRunMs !== null && !running && (
          <div style={{ fontSize: 11, color: C.txD, fontFamily: FONT_MONO }}>
            Last run: {lastRunMs.toFixed(0)}ms &middot; {ALL_COMPOSITIONS.length} matchups &middot; {iterations} iter each
          </div>
        )}
        {matrixRunMs !== null && !matrixRunning && (
          <div style={{ fontSize: 11, color: C.txD, fontFamily: FONT_MONO }}>
            Matrix: {(matrixRunMs / 1000).toFixed(1)}s &middot; {ALL_COMPOSITIONS.length * (ALL_COMPOSITIONS.length - 1)} battles
          </div>
        )}
      </div>

      {/* ─── Results ─── */}
      {results && (
        <>
          <div style={{
            background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, padding: 12,
          }}>
            {(() => {
              const wins = results.filter(r => r.winRate > 0.5).length;
              const losses = results.filter(r => r.winRate < 0.5).length;
              const draws = results.length - wins - losses;
              const pct = (wins / results.length) * 100;
              return (
                <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
                  Your{" "}
                  <span style={{ color: C.gold, fontWeight: 700, fontFamily: FONT_MONO }}>
                    {compLabel(myComp)}
                  </span>{" "}
                  formation wins{" "}
                  <span style={{ color: C.grn, fontWeight: 700, fontFamily: FONT_MONO }}>{wins}</span>
                  {" / loses "}
                  <span style={{ color: C.red, fontWeight: 700, fontFamily: FONT_MONO }}>{losses}</span>
                  {draws > 0 && (
                    <> / draws <span style={{ color: C.txB, fontFamily: FONT_MONO }}>{draws}</span></>
                  )}
                  {" "}({pct.toFixed(0)}% win rate across {results.length} possible enemies)
                </div>
              );
            })()}
            <SectionLabel>Easiest Matchups &mdash; enemies your {compLabel(myComp)} formation crushes</SectionLabel>
            <ResultsTable rows={rpsValidation.top} highlight="top" />

            <div style={{ height: 12 }} />
            <SectionLabel>Hardest Matchups &mdash; enemies that counter your formation</SectionLabel>
            <ResultsTable rows={rpsValidation.bottom} highlight="bottom" />
          </div>

          <div style={{
            background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, padding: 12,
            marginTop: 12,
          }}>
            <SectionLabel>
              Matchup Heatmap &mdash; your {compLabel(myComp)} formation{" "}
              <span style={{ color: C.txD, fontWeight: 400, fontSize: 9 }}>(experimental)</span>
            </SectionLabel>
            <div style={{ fontSize: 11, color: C.txD, marginBottom: 8, maxWidth: 580, lineHeight: 1.5 }}>
              Every possible enemy composition in 5% steps, colored by how <em>your</em> formation
              fares against it. Green = easy win for you, red = hard loss. Infantry % on X, Cavalry % on Y;
              Archer % is implied as 100 − Inf − Cav (top-left corner = 100% Archer,
              top-right = 100% Infantry, bottom = 100% Cavalry).
            </div>
            {winCounts ? (() => {
              let best = null;
              for (const v of winCounts.values()) {
                if (!best || v.wins > best.wins) best = v;
              }
              const mine = winCounts.get(compKey(myComp));
              const myPct = mine ? (mine.wins / mine.total) * 100 : 0;
              const bestPct = (best.wins / best.total) * 100;
              return (
                <div style={{ fontSize: 11, color: C.txD, marginBottom: 12, lineHeight: 1.6 }}>
                  {mine && (
                    <div>
                      Your formation{" "}
                      <span style={{ color: C.gold, fontWeight: 700, fontFamily: FONT_MONO }}>
                        {compLabel(myComp)}
                      </span>{" "}
                      wins{" "}
                      <span style={{ color: C.grn, fontWeight: 700, fontFamily: FONT_MONO }}>
                        {mine.wins}/{mine.total}
                      </span>{" "}
                      ({myPct.toFixed(0)}%) as an attacker against every other comp.
                    </div>
                  )}
                  <div>
                    Most robust overall:{" "}
                    <span style={{ color: C.gold, fontWeight: 700, fontFamily: FONT_MONO }}>
                      {compLabel(best.comp)}
                    </span>{" "}
                    with{" "}
                    <span style={{ color: C.grn, fontWeight: 700, fontFamily: FONT_MONO }}>
                      {best.wins}/{best.total}
                    </span>{" "}
                    ({bestPct.toFixed(0)}%) &middot; hover any cell for per-enemy details.
                  </div>
                </div>
              );
            })() : (
              <div style={{ fontSize: 11, color: C.txD, marginBottom: 12, fontStyle: "italic" }}>
                Run <span style={{ color: C.gold }}>COMPUTE ROBUSTNESS</span> above to also see how your
                formation ranks among all comps and how dangerous each enemy is in general.
              </div>
            )}
            <CompositionHeatmap results={results} myComp={myComp} winCounts={winCounts} />
          </div>
        </>
      )}
    </div>
  );
}

function ResultsTable({ rows, highlight }) {
  const maxNet = Math.max(...rows.map(r => Math.abs(r.netSurv)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "24px 140px 1fr 72px 72px 72px 56px",
        gap: 8, padding: "4px 8px",
        fontSize: 9, color: C.txD, fontFamily: FONT_DISPLAY, letterSpacing: "0.8px",
      }}>
        <div>#</div>
        <div>COMPOSITION</div>
        <div>NET SURVIVORS</div>
        <div style={{ textAlign: "right" }}>WIN %</div>
        <div style={{ textAlign: "right" }}>SURV %</div>
        <div style={{ textAlign: "right" }}>ROUNDS</div>
        <div style={{ textAlign: "right" }}>STAT</div>
      </div>

      {rows.map((r, i) => {
        const positive = r.netSurv >= 0;
        const barW = Math.min(100, (Math.abs(r.netSurv) / maxNet) * 100);
        const barColor = positive ? C.grn : C.red;
        return (
          <div key={r.key} style={{
            display: "grid", gridTemplateColumns: "24px 140px 1fr 72px 72px 72px 56px",
            gap: 8, padding: "7px 8px", alignItems: "center",
            background: C.s2, border: `1px solid ${C.brd}`, borderRadius: 4,
          }}>
            <div style={{ fontSize: 11, color: C.txD, fontFamily: FONT_MONO }}>
              {highlight === "top" ? i + 1 : i + 1}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CompBar comp={r.comp} width={90} height={12} />
              <span style={{ fontSize: 10, fontFamily: FONT_MONO, color: C.tx }}>
                {compLabel(r.comp)}
              </span>
            </div>
            <div style={{ position: "relative", height: 14 }}>
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                left: positive ? "50%" : `${50 - barW / 2}%`,
                width: `${barW / 2}%`,
                background: barColor, opacity: 0.6, borderRadius: 2,
              }} />
              <div style={{
                position: "absolute", left: "50%", top: -1, bottom: -1, width: 1,
                background: C.brd,
              }} />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "flex-end", paddingRight: 4,
                fontSize: 10, fontFamily: FONT_MONO,
                color: positive ? C.grn : C.red, fontWeight: 600,
              }}>
                {positive ? "+" : ""}{r.netSurv.toFixed(0)}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontFamily: FONT_MONO, color: C.txB }}>
              {(r.winRate * 100).toFixed(0)}%
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontFamily: FONT_MONO, color: C.txB }}>
              {((1 - r.attackerLossPct) * 100).toFixed(0)}%
            </div>
            <div style={{ textAlign: "right", fontSize: 11, fontFamily: FONT_MONO, color: C.txD }}>
              {r.avgRounds.toFixed(0)}
            </div>
            <div style={{ textAlign: "right", fontSize: 10, fontFamily: FONT_BODY, color: r.winRate >= 0.5 ? C.grn : C.red }}>
              {r.winRate >= 0.5 ? "WIN" : "LOSS"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Composition Heatmap (experimental)
// ═══════════════════════════════════════════
function CompositionHeatmap({ results, myComp, winCounts }) {
  const [hovered, setHovered] = useState(null);

  const { byKey, maxAbs } = useMemo(() => {
    const map = new Map();
    let max = 0;
    for (const r of results) {
      map.set(r.key, r);
      if (Math.abs(r.netSurv) > max) max = Math.abs(r.netSurv);
    }
    return { byKey: map, maxAbs: max || 1 };
  }, [results]);

  // Markers: your own formation (gold "M") and the enemy that counters you
  // the hardest — the lowest net row in the sweep (white "!").
  const myKey = compKey(myComp);
  const hardestKey = results[results.length - 1]?.key;

  const colorFor = (net) => {
    const t = Math.max(-1, Math.min(1, net / maxAbs));
    const mix = (a, b) => Math.round(a + (b - a) * Math.abs(t));
    // Neutral gray anchor, then diverge to green (pos) or red (neg)
    if (t >= 0) return `rgb(${mix(58, 80)}, ${mix(68, 200)}, ${mix(58, 120)})`;
    return `rgb(${mix(58, 220)}, ${mix(68, 80)}, ${mix(58, 90)})`;
  };

  // Rows: outer = cavalry (top→bottom), inner = infantry (left→right).
  // Top-left = 100% archer, top-right = 100% infantry, bottom-left = 100% cavalry.
  const rows = [];
  for (let cav = 0; cav <= TOTAL; cav += STEP) {
    const rowCells = [];
    for (let inf = 0; inf <= TOTAL; inf += STEP) {
      const arch = TOTAL - inf - cav;
      if (arch < 0) {
        rowCells.push({ empty: true });
      } else {
        const key = `${inf}-${cav}-${arch}`;
        rowCells.push({ inf, cav, arch, key, data: byKey.get(key) });
      }
    }
    rows.push(rowCells);
  }

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* Grid + axes */}
      <div>
        {rows.map((rowCells, rIdx) => {
          const cav = rIdx * STEP;
          return (
            <div key={rIdx} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: HEATMAP_TICK_W, fontSize: 8, color: C.txD, fontFamily: FONT_MONO,
                textAlign: "right", paddingRight: 4, lineHeight: `${HEATMAP_CELL}px`,
              }}>
                {rIdx % 2 === 0 ? cav : ""}
              </div>
              {rowCells.map((cell, cIdx) => {
                if (cell.empty) {
                  return <div key={cIdx} style={{ width: HEATMAP_CELL + 1, height: HEATMAP_CELL + 1 }} />;
                }
                const isMine = cell.key === myKey;
                const isHardest = cell.key === hardestKey;
                return (
                  <div
                    key={cIdx}
                    onMouseEnter={() => setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: HEATMAP_CELL, height: HEATMAP_CELL,
                      marginRight: 1, marginBottom: 1,
                      background: cell.data ? colorFor(cell.data.netSurv) : C.s2,
                      border: isMine
                        ? `2px solid ${C.gold}`
                        : isHardest
                        ? `2px solid #ffffff`
                        : "1px solid rgba(0,0,0,0.35)",
                      boxSizing: "border-box",
                      position: "relative",
                    }}
                  >
                    {(isMine || isHardest) && (
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                        color: isMine ? C.gold : "#ffffff",
                        textShadow: "0 0 2px rgba(0,0,0,0.85)",
                        pointerEvents: "none",
                      }}>
                        {isMine ? "M" : "!"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* X axis ticks */}
        <div style={{ display: "flex", marginTop: 2 }}>
          <div style={{ width: HEATMAP_TICK_W }} />
          {Array.from({ length: HEATMAP_GRID_DIM }).map((_, i) => (
            <div key={i} style={{
              width: HEATMAP_CELL + 1, fontSize: 8, color: C.txD,
              fontFamily: FONT_MONO, textAlign: "center",
            }}>
              {i % 2 === 0 ? `${i * STEP}` : ""}
            </div>
          ))}
        </div>

        {/* Axis titles */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 6, paddingLeft: HEATMAP_TICK_W + 2,
          width: (HEATMAP_CELL + 1) * HEATMAP_GRID_DIM + HEATMAP_TICK_W,
        }}>
          <div style={{
            fontSize: 9, color: troopColor.Cavalry,
            fontFamily: FONT_DISPLAY, letterSpacing: "0.8px",
          }}>
            ↑ CAVALRY %
          </div>
          <div style={{
            fontSize: 9, color: troopColor.Infantry,
            fontFamily: FONT_DISPLAY, letterSpacing: "0.8px",
          }}>
            INFANTRY % →
          </div>
        </div>
      </div>

      {/* Legend + hover detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 200 }}>
        <div>
          <div style={{
            fontFamily: FONT_DISPLAY, fontSize: 9, color: C.txD,
            letterSpacing: "0.8px", marginBottom: 4,
          }}>
            NET SURVIVOR DIFFERENTIAL
          </div>
          <div style={{
            display: "flex", height: 12, borderRadius: 2, overflow: "hidden",
            border: `1px solid ${C.brd}`,
          }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const t = (i / 29) * 2 - 1;
              return <div key={i} style={{ flex: 1, background: colorFor(t * maxAbs) }} />;
            })}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 9, fontFamily: FONT_MONO, marginTop: 2,
          }}>
            <span style={{ color: C.red }}>−{Math.round(maxAbs)}</span>
            <span style={{ color: C.txD }}>0</span>
            <span style={{ color: C.grn }}>+{Math.round(maxAbs)}</span>
          </div>
        </div>

        <div style={{ fontSize: 10, color: C.txD, lineHeight: 1.7 }}>
          <div>
            <span style={{ color: C.gold, fontWeight: 700, marginRight: 4 }}>M</span>
            your formation
          </div>
          <div>
            <span style={{ color: "#ffffff", fontWeight: 700, marginRight: 4 }}>!</span>
            hardest enemy
          </div>
        </div>

        <div style={{
          padding: 10, background: C.s2, border: `1px solid ${C.brd}`, borderRadius: 4,
          fontSize: 11, fontFamily: FONT_MONO, color: C.txB, minHeight: 120,
        }}>
          {hovered && hovered.data ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <CompBar comp={hovered.data.comp} width={80} height={10} />
                <span style={{ fontWeight: 700 }}>{compLabel(hovered.data.comp)}</span>
              </div>
              <div style={{ fontSize: 9, color: C.txD, fontFamily: FONT_DISPLAY, letterSpacing: "0.6px", marginTop: 4 }}>
                YOU VS THIS ENEMY
              </div>
              <div>
                net{" "}
                <span style={{
                  color: hovered.data.netSurv >= 0 ? C.grn : C.red,
                  fontWeight: 700,
                }}>
                  {hovered.data.netSurv >= 0 ? "+" : ""}{hovered.data.netSurv.toFixed(0)}
                </span>
              </div>
              <div>win {(hovered.data.winRate * 100).toFixed(0)}%</div>
              <div>surv {((1 - hovered.data.attackerLossPct) * 100).toFixed(0)}%</div>
              <div>rounds {hovered.data.avgRounds.toFixed(0)}</div>
              {winCounts && winCounts.has(hovered.key) && (() => {
                const wc = winCounts.get(hovered.key);
                const pct = (wc.wins / wc.total) * 100;
                return (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.brd}` }}>
                    <div style={{ fontSize: 9, color: C.txD, fontFamily: FONT_DISPLAY, letterSpacing: "0.6px" }}>
                      THIS ENEMY&apos;S OVERALL STRENGTH
                    </div>
                    <div>
                      wins{" "}
                      <span style={{ color: C.grn, fontWeight: 700 }}>
                        {wc.wins}/{wc.total}
                      </span>{" "}
                      ({pct.toFixed(0)}%)
                    </div>
                    {wc.losses > 0 && <div style={{ color: C.txD }}>losses {wc.losses}</div>}
                    {wc.draws > 0 && <div style={{ color: C.txD }}>draws {wc.draws}</div>}
                  </div>
                );
              })()}
            </>
          ) : (
            <div style={{ color: C.txD, fontSize: 10 }}>Hover a cell…</div>
          )}
        </div>
      </div>
    </div>
  );
}
