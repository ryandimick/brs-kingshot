import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useCharacterState } from "./hooks/useCharacterState";
import { useProfile } from "./hooks/useProfile";
import { useDerivedState } from "./hooks/useDerivedState";
import { C, FONT_BODY } from "./theme";
import { Header, TabBar, Footer } from "./components/Layout";
import { SignInScreen } from "./components/SignInScreen";
import { CreateProfileScreen } from "./components/CreateProfileScreen";
import { CharacterSheetTab } from "./components/CharacterSheetTab";
import { InvestmentTab } from "./components/InvestmentTab";
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
  const [tab, setTab] = useState("sheet");

  const derived = useDerivedState(cs);

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
        {tab === "sheet" && (
          <CharacterSheetTab
            cs={cs}
            update={update}
            numUp={numUp}
            updateRoster={updateRoster}
            removeRoster={removeRoster}
            activeProfileName={profile.activeProfile?.name}
          />
        )}
        {tab === "invest" && (
          <InvestmentTab
            cs={cs}
            update={update}
            numUp={numUp}
            attackBuffs={derived.attackBuffs}
            attackStatProducts={derived.attackStatProducts}
            attackSkillMod={derived.attackSkillMod}
            attackOptimalLineup={derived.attackOptimalLineup}
            garrisonBuffs={derived.garrisonBuffs}
            garrisonStatProducts={derived.garrisonStatProducts}
            garrisonSkillMod={derived.garrisonSkillMod}
            garrisonOptimalLineup={derived.garrisonOptimalLineup}
            derivedLoading={derived.loading}
            derivedError={derived.error}
          />
        )}
        {tab === "counter" && <CounterTab />}
      </div>

      <Footer />
    </div>
  );
}
