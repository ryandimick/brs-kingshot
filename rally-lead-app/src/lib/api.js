import { useAuth } from "@clerk/clerk-react";
import { useCallback } from "react";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// Hook returning an async fetcher that attaches the current Clerk session
// token as a Bearer header. Use inside any authenticated component:
//
//   const api = useApi();
//   const me = await api("/me");
//   await api("/profiles", { method: "POST", body: JSON.stringify({...}) });
export function useApi() {
  const { getToken } = useAuth();

  return useCallback(async (path, options = {}) => {
    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }
    return res.json();
  }, [getToken]);
}
