"use client";

import { useState, useEffect, useCallback } from "react";

export function useSession() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions");

      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err.message || "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch a specific session
  const fetchSession = useCallback(async (sessionName) => {
    if (!sessionName) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionName}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch session ${sessionName}`);
      }

      const session = await response.json();

      // Update the sessions list with this session
      setSessions((prev) => {
        const exists = prev.some((s) => s.name === session.name);
        if (exists) {
          return prev.map((s) => (s.name === session.name ? session : s));
        } else {
          return [...prev, session];
        }
      });

      setCurrentSession(session);
      return session;
    } catch (err) {
      console.error(`Error fetching session ${sessionName}:`, err);
      setError(err.message || `Failed to fetch session ${sessionName}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new session
  const createSession = useCallback(async (sessionName) => {
    if (!sessionName) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: sessionName }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session ${sessionName}`);
      }

      const newSession = await response.json();
      setSessions((prev) => [...prev, newSession]);
      setCurrentSession(newSession);
      return newSession;
    } catch (err) {
      console.error(`Error creating session ${sessionName}:`, err);
      setError(err.message || `Failed to create session ${sessionName}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    async (sessionName) => {
      if (!sessionName) return false;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionName}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete session ${sessionName}`);
        }

        setSessions((prev) => prev.filter((s) => s.name !== sessionName));

        if (currentSession?.name === sessionName) {
          setCurrentSession(null);
        }

        return true;
      } catch (err) {
        console.error(`Error deleting session ${sessionName}:`, err);
        setError(err.message || `Failed to delete session ${sessionName}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  // Initialize sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    isLoading,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    deleteSession,
    setCurrentSession,
  };
}
