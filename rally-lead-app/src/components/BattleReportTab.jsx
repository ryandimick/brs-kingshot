import { useEffect, useState } from "react";
import { HERO_DB } from "../data/hero-catalog";
import { C, troopColor, FONT_BODY, FONT_DISPLAY } from "../theme";
import { BuffPanel } from "./ui/BuffPanel";

const TROOP_SLOTS = ["Infantry", "Cavalry", "Archer"];

const MODES = [
  { id: "attack",   label: "Attack Rally" },
  { id: "garrison", label: "Garrison Defense" },
  { id: "custom",   label: "Custom" },
];

const lineupsEqual = (a, b) =>
  Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length && a.every((v, i) => v === b[i]);

export function BattleReportTab({
  cs, update,
  attackBuffs, attackOptimalLineup,
  garrisonBuffs, garrisonOptimalLineup,
  derivedLoading, derivedError,
}) {
  const [mode, setMode] = useState("attack");
  const [squadBuffPct, setSquadBuffPct] = useState(0);

  // Auto modes: keep cs.{attackRally|garrisonLead}.selectedHeroes in sync with
  // the server-computed optimal so the returned buffs reflect the optimal lineup.
  const attackSelected = cs.attackRally?.selectedHeroes;
  useEffect(() => {
    if (mode !== "attack" || !attackOptimalLineup) return;
    if (!lineupsEqual(attackSelected || ["", "", ""], attackOptimalLineup)) {
      update("attackRally.selectedHeroes", [...attackOptimalLineup]);
    }
  }, [mode, attackOptimalLineup, attackSelected, update]);

  const garrisonSelected = cs.garrisonLead?.selectedHeroes;
  useEffect(() => {
    if (mode !== "garrison" || !garrisonOptimalLineup) return;
    if (!lineupsEqual(garrisonSelected || ["", "", ""], garrisonOptimalLineup)) {
      update("garrisonLead.selectedHeroes", [...garrisonOptimalLineup]);
    }
  }, [mode, garrisonOptimalLineup, garrisonSelected, update]);

  return (
    <div>
      <ModeSelector mode={mode} setMode={setMode} />
      <BuffsSelector value={squadBuffPct} onChange={setSquadBuffPct} />

      {mode === "attack" && (
        <AutoReport
          scenario="attack"
          lineup={cs.attackRally?.selectedHeroes || ["", "", ""]}
          optimal={attackOptimalLineup}
          buffs={attackBuffs}
          squadMultiplier={squadBuffPct}
          loading={derivedLoading}
          error={derivedError}
        />
      )}

      {mode === "garrison" && (
        <AutoReport
          scenario="garrison"
          lineup={cs.garrisonLead?.selectedHeroes || ["", "", ""]}
          optimal={garrisonOptimalLineup}
          buffs={garrisonBuffs}
          squadMultiplier={squadBuffPct}
          loading={derivedLoading}
          error={derivedError}
        />
      )}

      {mode === "custom" && (
        <CustomReport
          cs={cs}
          update={update}
          attackBuffs={attackBuffs}
          garrisonBuffs={garrisonBuffs}
          squadMultiplier={squadBuffPct}
          loading={derivedLoading}
          error={derivedError}
        />
      )}
    </div>
  );
}

function ModeSelector({ mode, setMode }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
      {MODES.map(o => (
        <button key={o.id} onClick={() => setMode(o.id)} style={{
          fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, padding: "7px 14px",
          borderRadius: 4, border: `1px solid ${mode === o.id ? C.gold : C.brd}`,
          background: mode === o.id ? C.gold + "22" : C.s1,
          color: mode === o.id ? C.gold : C.txD,
          cursor: "pointer",
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const BUFF_OPTIONS = [
  { value: 0,  label: "None" },
  { value: 10, label: "+10%" },
  { value: 20, label: "+20%" },
];

function BuffsSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
      <span style={{
        fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700,
        color: C.txD, letterSpacing: "1px",
      }}>
        ADD BUFFS
      </span>
      {BUFF_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "5px 12px",
          borderRadius: 4, border: `1px solid ${value === opt.value ? C.gold : C.brd}`,
          background: value === opt.value ? C.gold + "22" : C.s1,
          color: value === opt.value ? C.gold : C.txD,
          cursor: "pointer",
        }}>
          {opt.label}
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 11, color: C.txD }}>
          Multiplicative on top of additive bonuses (ATK / DEF / Leth / HP, all troops).
        </span>
      )}
    </div>
  );
}

function AutoReport({ scenario, lineup, optimal, buffs, squadMultiplier, loading, error }) {
  const scenarioLabel = scenario === "attack" ? "Attack Rally" : "Garrison";
  const ready = buffs && lineupsEqual(lineup, optimal || []);

  return (
    <div>
      <LineupSummary lineup={lineup} title="Auto-selected lineup" />
      {!ready
        ? <DerivedFallback loading={loading} error={error} />
        : <BuffPanel totalBuffs={buffs} scenario={scenarioLabel} squadMultiplier={squadMultiplier} />}
    </div>
  );
}

function CustomReport({ cs, update, attackBuffs, garrisonBuffs, squadMultiplier, loading, error }) {
  const roster = cs.heroRoster || {};
  const rosterNames = Object.keys(roster);

  const [picks, setPicks] = useState({ Infantry: "", Cavalry: "", Archer: "" });
  const [scenario, setScenario] = useState("attack");
  const [submitted, setSubmitted] = useState(null); // { scenario, picks } snapshot

  const allPicked = TROOP_SLOTS.every(t => picks[t]);

  const handleGenerate = () => {
    if (!allPicked) return;
    const lineup = TROOP_SLOTS.map(t => picks[t]);
    if (scenario === "attack") {
      update("attackRally.selectedHeroes", lineup);
    } else {
      update("garrisonLead.selectedHeroes", lineup);
    }
    setSubmitted({ scenario, picks: { ...picks } });
  };

  // Whether the cs lineup currently matches the submitted custom picks.
  const submittedLineup = submitted ? TROOP_SLOTS.map(t => submitted.picks[t]) : null;
  const liveLineup = submitted?.scenario === "attack"
    ? cs.attackRally?.selectedHeroes
    : submitted?.scenario === "garrison"
    ? cs.garrisonLead?.selectedHeroes
    : null;
  const matchesSubmitted = submitted && lineupsEqual(liveLineup, submittedLineup);

  const buffs = submitted?.scenario === "attack" ? attackBuffs : garrisonBuffs;
  const scenarioLabel = submitted?.scenario === "attack" ? "Attack Rally" : "Garrison";

  return (
    <div>
      <div style={{ fontSize: 12, color: C.txD, marginBottom: 10 }}>
        Pick one hero of each troop type, choose a scenario, then click Generate.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
        {TROOP_SLOTS.map(troop => {
          const available = rosterNames.filter(n => {
            const db = HERO_DB.find(h => h.name === n);
            return db?.type === troop;
          });
          return (
            <div key={troop} style={{ background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6, padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: troopColor[troop], marginBottom: 4, fontFamily: FONT_DISPLAY, letterSpacing: "0.5px" }}>
                {troop.toUpperCase()}
              </div>
              <select
                value={picks[troop]}
                onChange={e => setPicks({ ...picks, [troop]: e.target.value })}
                style={{ width: "100%", fontSize: 12 }}
              >
                <option value="">— select —</option>
                {available.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {available.length === 0 && (
                <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>
                  No {troop.toLowerCase()} heroes in roster.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.txD, fontFamily: FONT_DISPLAY, letterSpacing: "0.5px" }}>SCENARIO</div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.tx, cursor: "pointer" }}>
          <input
            type="radio" name="custom-scenario" value="attack"
            checked={scenario === "attack"}
            onChange={() => setScenario("attack")}
          />
          Attack Rally
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.tx, cursor: "pointer" }}>
          <input
            type="radio" name="custom-scenario" value="garrison"
            checked={scenario === "garrison"}
            onChange={() => setScenario("garrison")}
          />
          Garrison Defense
        </label>
        <button
          onClick={handleGenerate}
          disabled={!allPicked}
          style={{
            fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 700, padding: "7px 16px",
            borderRadius: 4, border: "none", cursor: allPicked ? "pointer" : "default",
            background: allPicked ? C.gold : C.s2,
            color: allPicked ? C.bg : C.txD,
            letterSpacing: "0.5px", marginLeft: "auto",
          }}
        >
          GENERATE
        </button>
      </div>

      {submitted && (
        matchesSubmitted && buffs
          ? <BuffPanel totalBuffs={buffs} scenario={`Custom (${scenarioLabel})`} squadMultiplier={squadMultiplier} />
          : <DerivedFallback loading={loading} error={error} />
      )}
    </div>
  );
}

function LineupSummary({ lineup, title }) {
  const labels = lineup.map((name, i) => ({
    name, troop: TROOP_SLOTS[i],
  }));
  return (
    <div style={{
      background: C.s1, border: `1px solid ${C.brd}`, borderRadius: 6,
      padding: "8px 12px", marginBottom: 14,
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 10, fontWeight: 700, color: C.txD, letterSpacing: "1px" }}>
        {title.toUpperCase()}
      </span>
      {labels.map(({ name, troop }) => (
        <span key={troop} style={{ fontSize: 12, color: name ? troopColor[troop] : C.txD }}>
          <strong style={{ fontWeight: 700 }}>{name || "—"}</strong>
          <span style={{ color: C.txD, marginLeft: 4 }}>({troop})</span>
        </span>
      ))}
    </div>
  );
}

function DerivedFallback({ loading, error }) {
  return (
    <div style={{ padding: 24, textAlign: "center", color: C.txD, fontSize: 12 }}>
      {error
        ? <span style={{ color: C.red }}>Failed to compute: {error}</span>
        : loading
        ? "Computing..."
        : "Waiting for character sheet..."}
    </div>
  );
}
