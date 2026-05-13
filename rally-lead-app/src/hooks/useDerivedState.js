import { useState, useEffect, useRef } from "react";
import { useApi } from "../lib/api";

const EMPTY = {
  attackBuffs: null,
  garrisonBuffs: null,
  attackStatProducts: null,
  garrisonStatProducts: null,
  attackSkillMod: null,
  garrisonSkillMod: null,
  attackOptimalLineup: null,
  garrisonOptimalLineup: null,
};

// Server-computed derived state for a character sheet: buffs, stat products,
// and skill mods for both attack-rally and garrison-lead scenarios.
//
// Debounces 300ms after the first call (which fires immediately) so rapid
// typing doesn't spam the API. In-flight requests are aborted when cs
// changes again. The last successful result is kept on screen during
// in-flight calls to avoid a "Loading..." flash.
export function useDerivedState(cs) {
  const api = useApi();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFiredRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const delay = hasFiredRef.current ? 300 : 0;
    hasFiredRef.current = true;

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await api("/compute/state", {
          method: "POST",
          body: JSON.stringify({ characterSheet: cs }),
          signal: controller.signal,
        });
        setData(result);
        setError(null);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || String(e));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cs, api]);

  return { ...data, loading, error };
}
