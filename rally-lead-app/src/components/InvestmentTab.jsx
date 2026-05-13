import { useState } from "react";
import { C, FONT_BODY } from "../theme";
import { OptimizerTab } from "./OptimizerTab";
import { ScenarioPlannerTab } from "./ScenarioPlannerTab";
import { PacksTab } from "./PacksTab";
import { AttackRallyTab } from "./AttackRallyTab";
import { GarrisonLeadTab } from "./GarrisonLeadTab";

const SUB_TABS = [
  { id: "topPicks", label: "Top Picks" },
  { id: "resources", label: "Spend Resources" },
  { id: "packs", label: "Packs" },
  { id: "attack", label: "Attack Rally" },
  { id: "garrison", label: "Garrison Lead" },
];

export function InvestmentTab({
  cs, update, numUp,
  attackBuffs, attackStatProducts, attackSkillMod, attackOptimalLineup,
  garrisonBuffs, garrisonStatProducts, garrisonSkillMod, garrisonOptimalLineup,
  derivedLoading, derivedError,
}) {
  const [sub, setSub] = useState("topPicks");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {SUB_TABS.map(o => (
          <button key={o.id} onClick={() => setSub(o.id)} style={{
            fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, padding: "6px 12px",
            borderRadius: 4, border: `1px solid ${sub === o.id ? C.gold : C.brd}`,
            background: sub === o.id ? C.gold + "22" : C.s1,
            color: sub === o.id ? C.gold : C.txD,
            cursor: "pointer",
          }}>
            {o.label}
          </button>
        ))}
      </div>

      {sub === "topPicks" && <OptimizerTab cs={cs} />}
      {sub === "resources" && <ScenarioPlannerTab cs={cs} />}
      {sub === "packs" && <PacksTab cs={cs} />}
      {sub === "attack" && (attackStatProducts ? (
        <AttackRallyTab
          cs={cs} update={update} numUp={numUp}
          totalBuffs={attackBuffs} statProducts={attackStatProducts}
          skillMod={attackSkillMod} optimalLineup={attackOptimalLineup}
        />
      ) : (
        <DerivedFallback loading={derivedLoading} error={derivedError} />
      ))}
      {sub === "garrison" && (garrisonStatProducts ? (
        <GarrisonLeadTab
          cs={cs} update={update}
          totalBuffs={garrisonBuffs} statProducts={garrisonStatProducts}
          skillMod={garrisonSkillMod} optimalLineup={garrisonOptimalLineup}
        />
      ) : (
        <DerivedFallback loading={derivedLoading} error={derivedError} />
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
