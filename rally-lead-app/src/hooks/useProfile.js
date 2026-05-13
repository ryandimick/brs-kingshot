import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "../lib/api";

function activeProfileKey(userId) {
  return userId ? `rally-active-profile:${userId}` : null;
}

// Manages the user's profile list and active-profile selection.
// State machine:
//   loading: true → fetching profile list
//   loading: false, profiles: [] → user has no profiles yet (show CreateProfileScreen)
//   loading: false, profiles: [...], activeProfile: ... → ready
export function useProfile() {
  const { userId } = useAuth();
  const api = useApi();

  const [profiles, setProfiles] = useState(null);   // null = still loading
  const [activeProfileId, setActiveProfileId] = useState(() => {
    const key = activeProfileKey(userId);
    return key ? localStorage.getItem(key) : null;
  });
  const [error, setError] = useState(null);

  // Initial load of the user's profile list
  useEffect(() => {
    let cancelled = false;
    setError(null);
    api("/profiles")
      .then(({ profiles: list }) => {
        if (cancelled) return;
        setProfiles(list);
        // If the stored active id is stale (deleted profile, wrong user), pick the most recent.
        if (list.length > 0 && (!activeProfileId || !list.some(p => p.id === activeProfileId))) {
          const fallback = list[list.length - 1].id;
          setActiveProfileId(fallback);
          const key = activeProfileKey(userId);
          if (key) localStorage.setItem(key, fallback);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || String(err));
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const switchProfile = useCallback((id) => {
    setActiveProfileId(id);
    const key = activeProfileKey(userId);
    if (key) localStorage.setItem(key, id);
  }, [userId]);

  const createProfile = useCallback(async ({ name, kingshotPlayerId, characterSheet, cycleAnchor }) => {
    const { profile } = await api("/profiles", {
      method: "POST",
      body: JSON.stringify({
        name,
        kingshotPlayerId,
        characterSheet,
        cycleAnchor: cycleAnchor || new Date().toISOString(),
      }),
    });
    setProfiles(prev => [...(prev || []), profile]);
    switchProfile(profile.id);
    return profile;
  }, [api, switchProfile]);

  const saveActive = useCallback(async (characterSheet) => {
    if (!activeProfileId) throw new Error("No active profile");
    const { profile } = await api(`/profiles/${activeProfileId}`, {
      method: "PUT",
      body: JSON.stringify({ characterSheet }),
    });
    setProfiles(prev => (prev || []).map(p => p.id === profile.id ? profile : p));
    return profile;
  }, [api, activeProfileId]);

  const activeProfile = profiles?.find(p => p.id === activeProfileId) || null;

  return {
    loading: profiles === null,
    error,
    profiles: profiles || [],
    activeProfile,
    switchProfile,
    createProfile,
    saveActive,
  };
}
