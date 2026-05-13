import { useEffect, useMemo, useState } from "react";
import { C, FONT_BODY, FONT_DISPLAY, FONT_MONO } from "../theme";
import { Lbl } from "./ui/Lbl";
import { useApi } from "../lib/api";
import { dayOfCycle, isPackAvailableOnDay } from "../lib/cycle";

// Friendly labels for the bundle keys the planner kernel knows about.
const RESOURCE_LABEL = {
  satin: "Satin",
  threads: "Gilded Threads",
  artisan: "Artisan's Vision",
  guides: "Charm Guides",
  designs: "Charm Designs",
  forgehammers: "Forgehammers",
  mythicGears: "Mythic Gears",
  ep: "Enhancement XP",
  mithril: "Mithril",
  widgets: "Widget Fragments",
  petFood: "Pet Food",
  petGrowthManual: "Growth Manuals",
  petNutrientPotion: "Nutrient Potions",
  petPromotionMedallion: "Promotion Medallions",
  tamingMarkCommon: "Common Taming Marks",
  tamingMarkAdvanced: "Advanced Taming Marks",
};

function humanizeKey(k) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()).trim();
}

function formatBundle(bundle, knownOnly = false) {
  if (!bundle) return [];
  return Object.entries(bundle)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => {
      const label = knownOnly ? RESOURCE_LABEL[k] : RESOURCE_LABEL[k] || humanizeKey(k);
      if (!label) return null;
      return `+${v.toLocaleString()} ${label}`;
    })
    .filter(Boolean);
}

export function PacksTab({ cs, cycleAnchor }) {
  const api = useApi();
  const [view, setView] = useState("browse"); // "browse" | "dollar"
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [todayOnly, setTodayOnly] = useState(true);

  useEffect(() => {
    api("/catalog/packs")
      .then(({ packs }) => setCatalog(packs))
      .catch(e => setCatalogError(e.message || String(e)));
  }, [api]);

  const today = useMemo(() => dayOfCycle(cycleAnchor), [cycleAnchor]);
  const filteredCatalog = useMemo(() => {
    if (!catalog) return null;
    if (!todayOnly || today == null) return catalog;
    return catalog.filter(p => isPackAvailableOnDay(p, today));
  }, [catalog, todayOnly, today]);
  const availablePackIds = useMemo(
    () => filteredCatalog?.map(p => p.id) ?? null,
    [filteredCatalog]
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { id: "browse", label: "Browse Packs" },
          { id: "dollar", label: "$ Mode Planner" },
        ].map(o => (
          <button key={o.id} onClick={() => setView(o.id)} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "6px 12px",
            borderRadius: 4, border: `1px solid ${view === o.id ? C.gold : C.brd}`,
            background: view === o.id ? C.gold + "22" : C.s1,
            color: view === o.id ? C.gold : C.txD,
            cursor: "pointer",
          }}>
            {o.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
          {today != null && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.txD, marginRight: 6 }}>
              Day <span style={{ color: C.txB }}>{today}</span> / 28
            </span>
          )}
          <button onClick={() => setTodayOnly(t => !t)} disabled={today == null} title={today == null ? "No cycle anchor on profile" : undefined} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "6px 10px",
            borderRadius: 4, border: `1px solid ${todayOnly ? C.gold : C.brd}`,
            background: todayOnly ? C.gold + "22" : C.s1,
            color: todayOnly ? C.gold : C.txD,
            cursor: today == null ? "default" : "pointer",
            opacity: today == null ? 0.5 : 1,
          }}>
            {todayOnly ? "Today only ✓" : "Today only"}
          </button>
        </div>
      </div>

      {catalogError && (
        <div style={{
          padding: 12, fontSize: 12, color: C.red,
          background: `${C.red}15`, borderRadius: 4, border: `1px solid ${C.red}55`,
          marginBottom: 12,
        }}>
          Failed to load catalog: {catalogError}
        </div>
      )}

      {!catalog && !catalogError && (
        <div style={{ padding: 20, textAlign: "center", color: C.txD, fontSize: 12 }}>
          Loading pack catalog...
        </div>
      )}

      {catalog && view === "browse" && (
        <BrowseView cs={cs} catalog={filteredCatalog} todayOnly={todayOnly} today={today} />
      )}
      {catalog && view === "dollar" && (
        <DollarView cs={cs} packIds={todayOnly && availablePackIds ? availablePackIds : null} />
      )}
    </div>
  );
}

// ─── Browse view ────────────────────────────────────────────────────────

function BrowseView({ cs, catalog, todayOnly, today }) {
  const [expanded, setExpanded] = useState(null); // pack.id

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Lbl>{todayOnly && today != null ? `Packs Available on Day ${today}` : "All Packs"}</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 4 }}>
        Click a pack to expand its tiers and compute personal ROI.
      </div>
      {catalog.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: C.txD, fontSize: 12 }}>
          No packs available on day {today}. Toggle "Today only" off to see the full catalog.
        </div>
      )}
      {catalog.map(pack => (
        <PackCard key={pack.id} pack={pack} cs={cs}
          expanded={expanded === pack.id}
          onToggle={() => setExpanded(expanded === pack.id ? null : pack.id)} />
      ))}
    </div>
  );
}

function PackCard({ pack, cs, expanded, onToggle }) {
  const recurStr = useMemo(() => {
    const wins = pack.recurrence?.windows || [];
    return wins.map(w => `Days ${w.days[0]}-${w.days[1]}`).join(", ");
  }, [pack]);

  return (
    <div style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "10px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "transparent", border: "none", color: C.tx, cursor: "pointer",
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.txB }}>
            {pack.name}
            {pack.tierAccessModel === "sequential" && (
              <span style={{
                marginLeft: 8, fontFamily: FONT_DISPLAY, fontSize: 8,
                color: C.cyn, border: `1px solid ${C.cyn}`, padding: "1px 4px", borderRadius: 3,
              }}>
                SEQ
              </span>
            )}
            {pack.recurrence?.uncertain && (
              <span style={{
                marginLeft: 6, fontFamily: FONT_DISPLAY, fontSize: 8,
                color: C.red, border: `1px solid ${C.red}`, padding: "1px 4px", borderRadius: 3,
              }}>
                CADENCE?
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: C.txD }}>
            {pack.tiers.length} tier{pack.tiers.length === 1 ? "" : "s"}
            {recurStr ? ` · ${recurStr}` : ""}
            {pack.label ? ` · ${pack.label}` : ""}
          </div>
        </div>
        <span style={{ fontSize: 10, color: C.txD }}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.brd}`, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {pack.tiers.map(tier => (
            <TierRow key={tier.id} cs={cs} packId={pack.id} tier={tier} />
          ))}
        </div>
      )}
    </div>
  );
}

function TierRow({ cs, packId, tier }) {
  const api = useApi();
  const [roi, setRoi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const compute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api("/optimize/pack-roi", {
        method: "POST",
        body: JSON.stringify({ characterSheet: cs, packId, tierId: tier.id }),
      });
      setRoi(result);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const routedLines = roi ? formatBundle(roi.routedBundle, true) : [];
  const extraLines = roi ? formatBundle(roi.extras) : [];

  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 4,
      padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: C.txB, flex: 1 }}>
          {tier.tierName}
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.gold }}>
          ${tier.price.toFixed(2)}
        </span>
        {!roi && !loading && (
          <button onClick={compute} style={{
            fontFamily: FONT_DISPLAY, fontSize: 9, fontWeight: 700, padding: "4px 10px",
            borderRadius: 3, border: `1px solid ${C.brd}`, background: C.s2, color: C.tx, cursor: "pointer",
            letterSpacing: "0.5px",
          }}>
            COMPUTE ROI
          </button>
        )}
        {loading && (
          <span style={{ fontSize: 10, color: C.txD }}>computing…</span>
        )}
        {roi && (
          <>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.grn, fontWeight: 700 }}>
              +{roi.deltaGainPct.toFixed(2)}%
            </span>
            {roi.dollarsPerPct != null && (
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.txD }}>
                ${roi.dollarsPerPct.toFixed(2)}/%
              </span>
            )}
          </>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 10, color: C.red }}>{error}</div>
      )}
      {roi && (routedLines.length > 0 || extraLines.length > 0) && (
        <div style={{ fontSize: 10, color: C.txD, display: "flex", flexDirection: "column", gap: 1 }}>
          {routedLines.length > 0 && (
            <div>You'd receive: <span style={{ color: C.txB }}>{routedLines.join(", ")}</span></div>
          )}
          {extraLines.length > 0 && (
            <div>Plus (unscored): {extraLines.join(", ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dollar-mode view ───────────────────────────────────────────────────

function DollarView({ cs, packIds }) {
  const api = useApi();
  const [dollarBudget, setDollarBudget] = useState(50);
  const [maxCopies, setMaxCopies] = useState(3);
  const [cutoffRatio, setCutoffRatio] = useState(0.3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        characterSheet: cs,
        dollarBudget: Number(dollarBudget),
        maxCopiesPerPack: Number(maxCopies),
        cutoffRatio: Number(cutoffRatio),
      };
      if (packIds) body.packIds = packIds;
      const r = await api("/optimize/dollars", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(r);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Lbl>Dollar-Mode Planner</Lbl>
      <div style={{ fontSize: 11, color: C.txD, marginBottom: 10 }}>
        Recommends the best pack-buying sequence for your current state, by personal %/$.
        {packIds
          ? <> Limited to <span style={{ color: C.gold }}>{packIds.length}</span> pack{packIds.length === 1 ? "" : "s"} available today.</>
          : <> Considering the full catalog.</>}
      </div>

      <div style={{
        background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
        padding: 12, marginBottom: 14,
        display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>BUDGET (USD)</div>
          <input type="number" min={1} step={1} value={dollarBudget}
            onChange={e => { setDollarBudget(e.target.value); setResult(null); }}
            style={{ width: 100 }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>MAX COPIES / PACK</div>
          <input type="number" min={1} step={1} value={maxCopies}
            onChange={e => { setMaxCopies(e.target.value); setResult(null); }}
            style={{ width: 100 }} />
        </div>
        <div>
          <div style={{ fontSize: 9, color: C.txD, marginBottom: 2 }}>EFFICIENCY CUTOFF</div>
          <input type="number" min={0} max={1} step={0.05} value={cutoffRatio}
            onChange={e => { setCutoffRatio(e.target.value); setResult(null); }}
            style={{ width: 100 }} />
        </div>
        <button onClick={run} disabled={loading} style={{
          fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, padding: "7px 18px",
          borderRadius: 4, border: "none", cursor: loading ? "default" : "pointer",
          background: loading ? C.s2 : C.gold, color: loading ? C.txD : C.bg,
          letterSpacing: "0.5px",
        }}>
          {loading ? "OPTIMIZING…" : "OPTIMIZE"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: 12, fontSize: 12, color: C.red,
          background: `${C.red}15`, borderRadius: 4, border: `1px solid ${C.red}55`,
          marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.grn }}>
              +{result.totalGainPct.toFixed(2)}% total
            </span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.txD }}>
              ${result.totalSpent.toFixed(2)} spent · ${result.dollarsLeft.toFixed(2)} unspent
            </span>
            <span style={{ fontSize: 11, color: C.txD }}>
              {result.purchases.length} purchase{result.purchases.length === 1 ? "" : "s"}
            </span>
          </div>

          {result.purchases.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: C.txD, fontSize: 12 }}>
              No packs in the catalog give positive ROI at your current state and cutoff.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {result.purchases.map((p, i) => (
                <div key={i} style={{
                  background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 4,
                  padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: C.txB, marginRight: 4 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 12, color: C.txB }}>
                      {p.packName} — {p.tierName}
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", gap: 10, fontFamily: FONT_MONO, fontSize: 11 }}>
                      <span style={{ color: C.gold, fontWeight: 700 }}>${p.price.toFixed(2)}</span>
                      <span style={{ color: C.grn, fontWeight: 700 }}>+{p.deltaGainPct.toFixed(3)}%</span>
                      <span style={{ color: C.txD }}>${p.dollarsPerPct.toFixed(2)}/%</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: C.txD }}>
                    {formatBundle(p.routedBundle, true).join(", ") || <span style={{ fontStyle: "italic" }}>no modeled resources</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
