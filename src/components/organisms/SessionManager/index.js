"use client";

import React, { useState } from "react";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import { AlertCircle, RefreshCw, Power, Trash } from "lucide-react";
import { useSession } from "@/hooks/useSession";

/**
 * Component for managing WhatsApp sessions
 */
const SessionManager = () => {
  const {
    sessions,
    isLoading,
    error,
    fetchSession,
    createSession,
    deleteSession,
  } = useSession();

  const [newSessionName, setNewSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [refreshingSession, setRefreshingSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);

  // Handle session creation
  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!newSessionName.trim()) {
      alert("Please enter a session name");
      return;
    }

    setIsCreating(true);

    try {
      await createSession(newSessionName);
      setNewSessionName("");
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle session refresh
  const handleRefreshSession = async (sessionName) => {
    setRefreshingSession(sessionName);

    try {
      await fetchSession(sessionName);
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setRefreshingSession(null);
    }
  };

  // Handle session deletion
  const handleDeleteSession = async (sessionName) => {
    if (!confirm(`Are you sure you want to delete session "${sessionName}"?`)) {
      return;
    }

    setDeletingSession(sessionName);

    try {
      await deleteSession(sessionName);
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setDeletingSession(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "connected":
      case "authenticated":
        return "success";
      case "connecting":
      case "starting":
        return "warning";
      case "disconnected":
      case "failed":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md flex items-start text-red-700">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Creation Form */}
        <Card>
          <Card.Header>
            <Card.Title>Create New Session</Card.Title>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleCreateSession}>
              <div className="space-y-4">
                <Input
                  label="Session Name"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Enter a unique session name"
                  disabled={isCreating}
                  required
                  helperText="Use only letters, numbers, and hyphens"
                />

                <Button
                  type="submit"
                  isLoading={isCreating}
                  disabled={isCreating}
                  className="w-full"
                >
                  Create Session
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        {/* Sessions List */}
        <div className="md:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>WhatsApp Sessions</Card.Title>
            </Card.Header>
            <Card.Content>
              {isLoading && sessions.length === 0 ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    No sessions found. Create one to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessions.map((session) => (
                    <Card key={session.name}>
                      <Card.Content className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {session.name}
                            </h3>
                            <Badge
                              variant={getStatusColor(
                                session.status || session.engine?.state
                              )}
                              className="mt-1"
                            >
                              {session.status ||
                                session.engine?.state ||
                                "Unknown"}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRefreshSession(session.name)}
                              isLoading={refreshingSession === session.name}
                              disabled={refreshingSession === session.name}
                              title="Refresh Session"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteSession(session.name)}
                              isLoading={deletingSession === session.name}
                              disabled={deletingSession === session.name}
                              title="Delete Session"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Session Details */}
                        {session.me && (
                          <div className="text-sm">
                            <p className="font-medium">
                              {session.me.pushName || "Unknown"}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {session.me.id || "No ID"}
                            </p>
                          </div>
                        )}

                        {/* QR Code Button */}
                        {session.status !== "connected" &&
                          session.status !== "authenticated" && (
                            <div className="mt-3">
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  window.open(
                                    `/sessions/${session.name}/qr`,
                                    "_blank"
                                  )
                                }
                              >
                                <Power className="h-4 w-4 mr-1" />
                                Connect Session
                              </Button>
                            </div>
                          )}
                      </Card.Content>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
