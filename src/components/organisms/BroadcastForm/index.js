// components/organisms/BroadcastForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import Card from "../../atoms/Card";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";
import MessageComposer from "../../molecules/MessageComposer";
import { useSession } from "../../../hooks/useSession";
import { useBroadcast } from "../../../hooks/useBroadcast";

const BroadcastForm = () => {
  const {
    sessions,
    isLoading: isLoadingSessions,
    error: sessionError,
  } = useSession();
  const {
    isSending,
    error: broadcastError,
    result: broadcastResult,
    broadcastMessage,
    clearResult,
  } = useBroadcast();
  const [selectedSession, setSelectedSession] = useState("");

  // Set default session either from env or first available
  useEffect(() => {
    if (sessions.length > 0) {
      const defaultSession = process.env.NEXT_PUBLIC_WAHA_SESSION;
      if (defaultSession && sessions.some((s) => s.name === defaultSession)) {
        setSelectedSession(defaultSession);
      } else {
        setSelectedSession(sessions[0].name);
      }
    }
  }, [sessions]);

  // Handle session selection change
  const handleSessionChange = (e) => {
    setSelectedSession(e.target.value);
    // Clear any previous results when changing session
    clearResult();
  };

  // Send broadcast message
  const handleSendMessage = async ({ message, recipients }) => {
    if (!selectedSession) {
      alert("Please select a session");
      return;
    }

    await broadcastMessage(selectedSession, recipients, message);

    return (
      <div className="space-y-6">
        {sessionError && (
          <Card className="bg-red-50 border-red-200">
            <Card.Content>
              <p className="text-red-600">{sessionError}</p>
            </Card.Content>
          </Card>
        )}

        {broadcastError && (
          <Card className="bg-red-50 border-red-200">
            <Card.Content>
              <p className="text-red-600">{broadcastError}</p>
            </Card.Content>
          </Card>
        )}

        <Card>
          <Card.Header>
            <Card.Title>Broadcast Messages</Card.Title>
          </Card.Header>

          <Card.Content>
            <div className="mb-4">
              <label
                htmlFor="session-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Session <span className="text-red-500">*</span>
              </label>
              <select
                id="session-select"
                value={selectedSession}
                onChange={handleSessionChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoadingSessions}
              >
                {isLoadingSessions ? (
                  <option>Loading sessions...</option>
                ) : sessions.length === 0 ? (
                  <option value="">No sessions available</option>
                ) : (
                  <>
                    <option value="">Select a session</option>
                    {sessions.map((session) => (
                      <option key={session.name} value={session.name}>
                        {session.name}{" "}
                        {session.status ? `(${session.status})` : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {selectedSession && (
              <MessageComposer
                onSend={handleSendMessage}
                isLoading={isSending}
                sessionName={selectedSession}
              />
            )}

            {broadcastResult && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">
                    Broadcast Results
                  </h4>
                  <Button variant="secondary" size="sm" onClick={clearResult}>
                    Clear
                  </Button>
                </div>

                <div>
                  <div className="flex mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Total Messages</p>
                      <p className="text-lg font-medium">
                        {broadcastResult.total}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-500">
                        Sent Successfully
                      </p>
                      <p className="text-lg font-medium">
                        {broadcastResult.successCount}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-500">Failed</p>
                      <p className="text-lg font-medium">
                        {broadcastResult.failCount}
                      </p>
                    </div>
                  </div>

                  {broadcastResult.failCount > 0 &&
                    broadcastResult.details?.failed && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Failed Messages:
                        </p>
                        <ul className="text-sm text-red-600 list-disc pl-5">
                          {broadcastResult.details.failed.map((result, idx) => (
                            <li key={idx}>
                              {result.reason || "Unknown error"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    );
  };
};
export default BroadcastForm;
