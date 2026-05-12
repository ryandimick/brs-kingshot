import { useState, useMemo } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useCharacterState } from "./hooks/useCharacterState";
import { computeAttackBuffs, computeGarrisonBuffs } from "./engine/buffs";
import { computeSkillMod, computeStatProducts, computeInvestments } from "./engine/combat";
import { C, FONT_BODY } from "./theme";
import { Header, TabBar, Footer } from "./components/Layout";
import { SignInScreen } from "./components/SignInScreen";
import { BonusOverviewTab } from "./components/BonusOverviewTab";
import { GearTab } from "./components/GearTab";
import { PetsTab } from "./components/PetsTab";
import { HeroGearTab } from "./components/HeroGearTab";
import { HeroRosterTab } from "./components/HeroRosterTab";
import { AttackRallyTab } from "./components/AttackRallyTab";
import { GarrisonLeadTab } from "./components/GarrisonLeadTab";
import { OptimizerTab } from "./components/OptimizerTab";
import { ScenarioPlannerTab } from "./components/ScenarioPlannerTab";
import { CounterTab } from "./components/CounterTab";

export default function App() {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  );
}

function AuthenticatedApp() {
  const { cs, loaded, dirty, saving, save, update, numUp, updateRoster, removeRoster, exportState } = useCharacterState();
  const [tab, setTab] = useState("bonuses");

  // Attack scenario
  const attackBuffs = useMemo(() => computeAttackBuffs(cs), [cs]);
  const attackStatProducts = useMemo(() => computeStatProducts(attackBuffs, cs), [attackBuffs, cs]);
  const attackSkillMod = useMemo(
    () => computeSkillMod(cs.attackRally?.selectedHeroes || [], cs.heroRoster || {}, cs.attackRally?.joinerSlots || []),
    [cs.attackRally, cs.heroRoster]
  );

  // Garrison scenario
  const garrisonBuffs = useMemo(() => computeGarrisonBuffs(cs), [cs]);
  const garrisonStatProducts = useMemo(() => computeStatProducts(garrisonBuffs, cs), [garrisonBuffs, cs]);
  const garrisonSkillMod = useMemo(
    () => computeSkillMod(cs.garrisonLead?.selectedHeroes || [], cs.heroRoster || {}, []),
    [cs.garrisonLead, cs.heroRoster]
  );

  // Optimizer evaluates against both lineups
  const investments = useMemo(
    () => computeInvestments(cs, attackBuffs, garrisonBuffs),
    [cs, attackBuffs, garrisonBuffs]
  );

  if (!loaded) {
    return (
      <div style={{
        background: C.bg, color: C.tx, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY,
      }}>
        Loading character data...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.tx, minHeight: "100vh" }}>
      <Header dirty={dirty} saving={saving} onSave={save} onExport={exportState} />
      <TabBar tab={tab} setTab={setTab} />

      <div style={{ padding: "12px 14px 20px" }}>
        {tab === "bonuses" && <BonusOverviewTab cs={cs} numUp={numUp} />}
        {tab === "gear" && <GearTab cs={cs} update={update} numUp={numUp} />}
        {tab === "pets" && <PetsTab cs={cs} numUp={numUp} />}
        {tab === "herogear" && <HeroGearTab cs={cs} numUp={numUp} />}
        {tab === "roster" && <HeroRosterTab cs={cs} update={update} updateRoster={updateRoster} removeRoster={removeRoster} />}
        {tab === "attack" && (
          <AttackRallyTab cs={cs} update={update} numUp={numUp}
            totalBuffs={attackBuffs} statProducts={attackStatProducts} skillMod={attackSkillMod} />
        )}
        {tab === "garrison" && (
          <GarrisonLeadTab cs={cs} update={update}
            totalBuffs={garrisonBuffs} statProducts={garrisonStatProducts} skillMod={garrisonSkillMod} />
        )}
        {tab === "invest" && <OptimizerTab investments={investments} />}
        {tab === "planner" && <ScenarioPlannerTab cs={cs} />}
        {tab === "counter" && <CounterTab />}
      </div>

      <Footer />
    </div>
  );
}
