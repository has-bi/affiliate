// hooks/useSession.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useSession() {
  const [sessions, setSessions] = useState([]); // ["marketing", …]
  const [current, setCurrent] = useState(null); // string | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -------------------------------------------
   * Helpers
   * -----------------------------------------*/
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json(); // { sessions: [...] }
      setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (name) => {
    if (!name?.trim()) return null;
    setLoading(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw await res.json();

      setSessions((prev) => [...prev, name.trim()]);
      setCurrent(name.trim());
      return name.trim();
    } catch (e) {
      console.error(e);
      setError(e.error || "Failed to create session");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (name) => {
      if (!name) return false;
      setLoading(true);
      try {
        const res = await fetch(`/api/connections/${name}`, {
          method: "DELETE",
        });
        if (!res.ok) throw await res.json();

        setSessions((prev) => prev.filter((n) => n !== name));
        if (current === name) setCurrent(null);
        return true;
      } catch (e) {
        console.error(e);
        setError(e.error || "Failed to delete session");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [current]
  );

  /* initial load */
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession: current,
    isLoading: loading,
    error,
    fetchSessions,
    createSession,
    deleteSession,
    setCurrentSession: setCurrent,
  };
}
