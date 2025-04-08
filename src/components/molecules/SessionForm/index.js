// components/molecules/SessionForm/index.js
"use client";

import React, { useState } from "react";
import Card from "../../atoms/Card";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";

const SessionForm = ({ onSubmit, isLoading = false }) => {
  const [sessionName, setSessionName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!sessionName.trim()) {
      setError("Session name is required");
      return;
    }

    // Validate session name format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z0-9-_]+$/.test(sessionName)) {
      setError(
        "Session name can only contain letters, numbers, hyphens, and underscores"
      );
      return;
    }

    // Clear error and submit
    setError("");
    onSubmit(sessionName);

    // Reset form if not loading
    if (!isLoading) {
      setSessionName("");
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Create New Session</Card.Title>
      </Card.Header>

      <form onSubmit={handleSubmit}>
        <Card.Content>
          <Input
            label="Session Name"
            id="session-name"
            name="sessionName"
            placeholder="e.g., my-session"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            error={error}
            helperText="Use a unique name for your WhatsApp session"
            required
          />
        </Card.Content>

        <Card.Footer className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Session
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
};

export default SessionForm;
