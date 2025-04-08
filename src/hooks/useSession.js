// hooks/useSession.js
"use client";

import { useState, useEffect, useCallback } from "react";
import wahaClient from "../lib/wahaClient";

export function useSession() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAction, setCurrentAction] = useState("");

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await wahaClient.getAllSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err.message || "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a specific session
  const getSession = useCallback(async (sessionName) => {
    setCurrentAction(`fetch-${sessionName}`);
    setError(null);

    try {
      const session = await wahaClient.getSession(sessionName);

      // Update the sessions state with the new data
      setSessions((prevSessions) => {
        const index = prevSessions.findIndex((s) => s.name === sessionName);
        if (index === -1) {
          return [...prevSessions, session];
        }

        const newSessions = [...prevSessions];
        newSessions[index] = session;
        return newSessions;
      });

      return session;
    } catch (err) {
      console.error(`Error fetching session ${sessionName}:`, err);
      setError(err.message || `Failed to fetch session ${sessionName}`);
      return null;
    } finally {
      setCurrentAction("");
    }
  }, []);

  // Create a new session
  const createSession = useCallback(async (sessionName, config = {}) => {
    setCurrentAction(`create-${sessionName}`);
    setError(null);

    try {
      const newSession = await wahaClient.createSession(sessionName, config);

      // Add the new session to the list
      setSessions((prevSessions) => [...prevSessions, newSession]);

      return newSession;
    } catch (err) {
      console.error(`Error creating session ${sessionName}:`, err);
      setError(err.message || `Failed to create session ${sessionName}`);
      return null;
    } finally {
      setCurrentAction("");
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionName) => {
    setCurrentAction(`delete-${sessionName}`);
    setError(null);

    try {
      await wahaClient.deleteSession(sessionName);

      // Remove the session from the list
      setSessions((prevSessions) =>
        prevSessions.filter((session) => session.name !== sessionName)
      );

      return true;
    } catch (err) {
      console.error(`Error deleting session ${sessionName}:`, err);
      setError(err.message || `Failed to delete session ${sessionName}`);
      return false;
    } finally {
      setCurrentAction("");
    }
  }, []);

  // Initial fetch of sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    currentAction,
    fetchSessions,
    getSession,
    createSession,
    deleteSession,
    isActionInProgress: !!currentAction,
  };
}
