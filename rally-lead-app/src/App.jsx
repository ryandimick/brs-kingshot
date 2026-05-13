import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useCharacterState } from "./hooks/useCharacterState";
import { useProfile } from "./hooks/useProfile";
import { useDerivedState } from "./hooks/useDerivedState";
import { C, FONT_BODY } from "./theme";
import { Header, TabBar, Footer } from "./components/Layout";
import { SignInScreen } from "./components/SignInScreen";
import { CreateProfileScreen } from "./components/CreateProfileScreen";
import { BonusOverviewTab } from "./components/BonusOverviewTab";
import { GearTab } from "./components/GearTab";
import { PetsTab } from "./components/PetsTab";
import { HeroGearTab } from "./components/HeroGearTab";
import { HeroRosterTab } from "./components/HeroRosterTab";
import { AttackRallyTab } from "./components/AttackRallyTab";
import { GarrisonLeadTab } from "./components/GarrisonLeadTab";
import { OptimizerTab } from "./components/OptimizerTab";
import { ScenarioPlannerTab } from "./components/ScenarioPlannerTab";
import { PacksTab } from "./components/PacksTab";
import { CounterTab } from "./components/CounterTab";

export default function App() {
  return (
    <>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <ProfileGate />
      </SignedIn>
    </>
  );
}

function DerivedLoading({ loading, error }) {
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

function FullScreenMessage({ children }) {
  return (
    <div style={{
      background: C.bg, color: C.tx, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT_BODY, padding: 24, textAlign: "center",
    }}>
      {children}
    </div>
  );
}

function ProfileGate() {
  const profile = useProfile();
  const [creating, setCreating] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);

  if (profile.loading) {
    return <FullScreenMessage>Loading profiles...</FullScreenMessage>;
  }

  if (profile.error) {
    return <FullScreenMessage>
      <div>
        <div style={{ color: C.red, marginBottom: 8 }}>Failed to load profiles</div>
        <div style={{ fontSize: 11, color: C.txD }}>{profile.error}</div>
      </div>
    </FullScreenMessage>;
  }

  if (profile.profiles.length === 0 || forceCreate) {
    return <CreateProfileScreen
      creating={creating}
      onCreate={async (data) => {
        setCreating(true);
        try {
          await profile.createProfile(data);
          setForceCreate(false);
        } finally {
          setCreating(false);
        }
      }}
    />;
  }

  if (!profile.activeProfile) {
    return <FullScreenMessage>Selecting profile...</FullScreenMessage>;
  }

  return (
    <AuthenticatedApp
      profile={profile}
      onCreateNewProfile={() => setForceCreate(true)}
    />
  );
}

function AuthenticatedApp({ profile, onCreateNewProfile }) {
  const state = useCharacterState({
    initial: profile.activeProfile?.characterSheet,
    onSave: profile.saveActive,
  });
  const { cs, dirty, saving, saveError, save, update, numUp, updateRoster, removeRoster, exportState } = state;
  const [tab, setTab] = useState("bonuses");

  const {
    attackBuffs, attackStatProducts, attackSkillMod, attackOptimalLineup,
    garrisonBuffs, garrisonStatProducts, garrisonSkillMod, garrisonOptimalLineup,
    loading: derivedLoading, error: derivedError,
  } = useDerivedState(cs);

  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.tx, minHeight: "100vh" }}>
      <Header
        dirty={dirty}
        saving={saving}
        saveError={saveError}
        onSave={save}
        onExport={exportState}
        profiles={profile.profiles}
        activeProfile={profile.activeProfile}
        onSwitchProfile={profile.switchProfile}
        onCreateNewProfile={onCreateNewProfile}
      />
      <TabBar tab={tab} setTab={setTab} />

      <div style={{ padding: "12px 14px 20px" }}>
        {tab === "bonuses" && <BonusOverviewTab cs={cs} numUp={numUp} />}
        {tab === "gear" && <GearTab cs={cs} update={update} numUp={numUp} />}
        {tab === "pets" && <PetsTab cs={cs} numUp={numUp} />}
        {tab === "herogear" && <HeroGearTab cs={cs} numUp={numUp} />}
        {tab === "roster" && <HeroRosterTab cs={cs} update={update} updateRoster={updateRoster} removeRoster={removeRoster} />}
        {tab === "attack" && (attackStatProducts ? (
          <AttackRallyTab cs={cs} update={update} numUp={numUp}
            totalBuffs={attackBuffs} statProducts={attackStatProducts}
            skillMod={attackSkillMod} optimalLineup={attackOptimalLineup} />
        ) : (
          <DerivedLoading loading={derivedLoading} error={derivedError} />
        ))}
        {tab === "garrison" && (garrisonStatProducts ? (
          <GarrisonLeadTab cs={cs} update={update}
            totalBuffs={garrisonBuffs} statProducts={garrisonStatProducts}
            skillMod={garrisonSkillMod} optimalLineup={garrisonOptimalLineup} />
        ) : (
          <DerivedLoading loading={derivedLoading} error={derivedError} />
        ))}
        {tab === "invest" && <OptimizerTab cs={cs} />}
        {tab === "planner" && <ScenarioPlannerTab cs={cs} />}
        {tab === "packs" && <PacksTab cs={cs} />}
        {tab === "counter" && <CounterTab />}
      </div>

      <Footer />
    </div>
  );
}
