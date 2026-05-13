import { useState, useEffect, useCallback, useRef } from "react";
import { defaultCharState } from "../data/defaults";
import { deepMergeCharacterSheet } from "../lib/legacy-storage";

// Character-sheet state, decoupled from persistence.
// `initial`: the canonical character sheet from the active profile (or null)
// `onSave(sheet)`: async function that persists to the server; throws on failure
export function useCharacterState({ initial, onSave } = {}) {
  const [cs, setCs] = useState(() => deepMergeCharacterSheet(defaultCharState(), initial));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // When the active profile changes (different `initial`), reset state.
  // We compare by JSON identity rather than reference, since the parent may
  // create a fresh object on each render.
  const lastInitialRef = useRef(null);
  useEffect(() => {
    const fingerprint = initial ? JSON.stringify(initial) : null;
    if (fingerprint !== lastInitialRef.current) {
      lastInitialRef.current = fingerprint;
      setCs(deepMergeCharacterSheet(defaultCharState(), initial));
      setDirty(false);
      setSaveError(null);
    }
  }, [initial]);

  const save = useCallback(async () => {
    if (!onSave || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(cs);
      setDirty(false);
    } catch (e) {
      setSaveError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }, [cs, onSave, saving]);

  const exportState = useCallback(() => {
    const payload = { version: "kingshot-char-v3", exportedAt: new Date().toISOString(), state: cs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `kingshot-rally-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cs]);

  const update = useCallback((path, value) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] == null) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setDirty(true);
  }, []);

  const numUp = useCallback((path, val) => {
    update(path, Math.max(0, Number(val) || 0));
  }, [update]);

  const updateRoster = useCallback((heroName, field, value) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.heroRoster) next.heroRoster = {};
      if (!next.heroRoster[heroName]) {
        next.heroRoster[heroName] = { level: 1, stars: 0, widgetLv: 0, skills: [0, 0, 0] };
      }
      if (field !== null) {
        next.heroRoster[heroName][field] = value;
      }
      return next;
    });
    setDirty(true);
  }, []);

  const removeRoster = useCallback((heroName) => {
    setCs(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next.heroRoster) delete next.heroRoster[heroName];
      return next;
    });
    setDirty(true);
  }, []);

  return {
    cs,
    dirty,
    saving,
    saveError,
    save,
    update,
    numUp,
    updateRoster,
    removeRoster,
    exportState,
  };
}
