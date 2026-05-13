import { useState, useMemo } from "react";
import { C, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../theme";
import { loadLegacyCharacterSheet } from "../lib/legacy-storage";
import { defaultCharState } from "../data/defaults";

export function CreateProfileScreen({ onCreate, creating }) {
  const [name, setName] = useState("");
  const [kingshotPlayerId, setKingshotPlayerId] = useState("");
  const [error, setError] = useState(null);

  // If the user already has a local character sheet from before sign-in,
  // surface that — we'll seed the new profile with it.
  const legacySheet = useMemo(() => loadLegacyCharacterSheet(), []);
  const hasLegacy = !!legacySheet;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Profile name is required");
    if (!kingshotPlayerId.trim()) return setError("Kingshot player ID is required");
    try {
      await onCreate({
        name: name.trim(),
        kingshotPlayerId: kingshotPlayerId.trim(),
        characterSheet: legacySheet || defaultCharState(),
      });
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.tx,
      fontFamily: FONT_BODY,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 800,
          color: C.gold,
          letterSpacing: "2px",
          marginBottom: 6,
        }}>
          CREATE YOUR PROFILE
        </div>
        <div style={{ fontSize: 12, color: C.txD }}>
          Each profile is tied to a Kingshot player ID
        </div>
      </div>

      <form onSubmit={submit} style={{
        background: C.s1,
        border: `1px solid ${C.brd}`,
        borderRadius: 6,
        padding: 20,
        width: "100%",
        maxWidth: 380,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.txD, letterSpacing: "0.5px" }}>PROFILE NAME</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Main, Farm Alt, etc."
            disabled={creating}
            style={{
              fontFamily: FONT_BODY,
              fontSize: 13,
              padding: "8px 10px",
              borderRadius: 4,
              border: `1px solid ${C.brd}`,
              background: C.bg,
              color: C.txB,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, color: C.txD, letterSpacing: "0.5px" }}>KINGSHOT PLAYER ID</span>
          <input
            type="text"
            value={kingshotPlayerId}
            onChange={e => setKingshotPlayerId(e.target.value)}
            placeholder="In-game player ID"
            disabled={creating}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              padding: "8px 10px",
              borderRadius: 4,
              border: `1px solid ${C.brd}`,
              background: C.bg,
              color: C.txB,
            }}
          />
          <span style={{ fontSize: 10, color: C.txD }}>
            One profile per player ID. Player IDs are claimed on a first-come basis.
          </span>
        </label>

        {hasLegacy && (
          <div style={{
            fontSize: 11,
            color: C.txD,
            padding: "8px 10px",
            background: C.s2,
            borderRadius: 4,
            border: `1px solid ${C.brd}`,
          }}>
            Found a saved character sheet on this device — it will be imported into your new profile.
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 12,
            color: C.red,
            padding: "8px 10px",
            background: `${C.red}15`,
            borderRadius: 4,
            border: `1px solid ${C.red}55`,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={creating}
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            padding: "10px 16px",
            borderRadius: 4,
            border: "none",
            cursor: creating ? "default" : "pointer",
            background: creating ? C.s2 : C.gold,
            color: creating ? C.txD : C.bg,
            transition: "all .2s",
          }}
        >
          {creating ? "CREATING..." : "CREATE PROFILE"}
        </button>
      </form>
    </div>
  );
}
