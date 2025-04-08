// components/organisms/SessionManager/index.js
"use client";

import React from "react";
import SessionCard from "../../molecules/SessionCard";
import SessionForm from "../../molecules/SessionForm";
import { useSession } from "../../../hooks/useSession";
import Card from "../../atoms/Card";

const SessionManager = () => {
  const {
    sessions,
    isLoading,
    error,
    currentAction,
    createSession,
    deleteSession,
    getSession,
    fetchSessions,
  } = useSession();

  // Create a new session
  const handleCreateSession = async (sessionName) => {
    await createSession(sessionName);
    fetchSessions(); // Refresh the list
  };

  // Delete a session
  const handleDeleteSession = async (sessionName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete session "${sessionName}"?`
      )
    ) {
      return;
    }

    await deleteSession(sessionName);
  };

  // Refresh a specific session
  const handleRefreshSession = async (sessionName) => {
    await getSession(sessionName);
  };

  // Connect to a session (this will depend on WAHA API implementation)
  const handleConnectSession = async (sessionName) => {
    // This is just a placeholder. The actual implementation
    // will depend on how WAHA API handles connecting
    try {
      // For demonstration - in reality you'd need to implement
      // the connection logic according to WAHA API docs
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`Connect to session ${sessionName} - Implementation needed`);
      fetchSessions(); // Refresh the list
    } catch (err) {
      console.error("Error connecting to session:", err);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="bg-red-50 border-red-200 mb-4">
          <Card.Content>
            <p className="text-red-600">{error}</p>
          </Card.Content>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <SessionForm
            onSubmit={handleCreateSession}
            isLoading={currentAction.startsWith("create-")}
          />
        </div>

        <div className="md:col-span-2">
          {isLoading && !sessions.length ? (
            <div className="flex justify-center items-center h-48 bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : !sessions.length ? (
            <div className="flex justify-center items-center h-48 bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-500">
                No sessions found. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.name}
                  session={session}
                  onDelete={handleDeleteSession}
                  onRefresh={handleRefreshSession}
                  onConnect={handleConnectSession}
                  isLoading={
                    currentAction === `fetch-${session.name}` ||
                    currentAction === `delete-${session.name}`
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
