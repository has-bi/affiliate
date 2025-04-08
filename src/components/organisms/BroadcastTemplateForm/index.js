// src/components/organisms/BroadcastTemplateForm/index.js
"use client";

import React, { useState, useCallback } from "react";
import Card from "../../../components/atoms/Card";
import Button from "../../../components/atoms/Button";
import TemplateSelector from "../../../components/molecules/TemplateSelector";
import ParameterForm from "../../../components/molecules/ParameterForm";
import MessagePreview from "../../../components/molecules/MessagePreview";
import RecipientInput from "../../../components/molecules/RecipientInput";
import BroadcastProgress from "../../../components/molecules/BroadcastProgress";
import { useTemplate } from "../../../hooks/useTemplate";
import { useBroadcastDelay } from "../../../hooks/useBroadcastDelay";
import { useSession } from "../../../hooks/useSession";

const BroadcastTemplateForm = () => {
  const [step, setStep] = useState("select-template"); // 'select-template', 'fill-params', 'recipients', 'broadcast'
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const [selectedSession, setSelectedSession] = useState("");

  // Template hook for template selection and parameter handling
  const {
    templates,
    selectedTemplateId,
    selectedTemplate,
    paramValues,
    preview,
    validationErrors,
    selectTemplate,
    updateParamValue,
    validateParams,
    getFinalMessage,
    resetTemplate,
  } = useTemplate();

  // Broadcast hook for handling recipients and broadcasting
  const {
    recipients,
    setRecipients,
    isBroadcasting,
    progress,
    results,
    error: broadcastError,
    delaySeconds,
    setDelaySeconds,
    parseRecipients,
    startBroadcast,
    cancelBroadcast,
    retryFailed,
    resetBroadcast,
  } = useBroadcastDelay();

  // Navigate to the next step
  const handleNext = () => {
    if (step === "select-template") {
      if (!selectedTemplateId) {
        alert("Please select a template");
        return;
      }
      setStep("fill-params");
    } else if (step === "fill-params") {
      const isValid = validateParams();
      if (!isValid) {
        return;
      }
      setStep("recipients");
    } else if (step === "recipients") {
      const recipientList = parseRecipients();
      if (recipientList.length === 0) {
        alert("Please enter at least one recipient");
        return;
      }

      if (!selectedSession) {
        alert("Please select a session");
        return;
      }

      setStep("broadcast");
    }
  };

  // Go back to the previous step
  const handleBack = () => {
    if (step === "fill-params") {
      setStep("select-template");
    } else if (step === "recipients") {
      setStep("fill-params");
    } else if (step === "broadcast") {
      if (isBroadcasting) {
        if (
          !confirm(
            "Broadcasting is in progress. Going back will not stop it. Continue?"
          )
        ) {
          return;
        }
      }
      setStep("recipients");
    }
  };

  // Handle selecting a template
  const handleSelectTemplate = (templateId) => {
    selectTemplate(templateId);
  };

  // Handle updating a parameter value
  const handleUpdateParam = (paramId, value) => {
    updateParamValue(paramId, value);
  };

  // Handle updating recipients
  const handleUpdateRecipients = (value) => {
    setRecipients(value);
  };

  // Handle updating delay
  const handleUpdateDelay = (value) => {
    setDelaySeconds(value);
  };

  // Start the broadcast
  const handleStartBroadcast = async () => {
    if (!selectedSession) {
      alert("Please select a session");
      return;
    }

    const message = getFinalMessage();
    if (!message) {
      alert("Failed to generate message");
      return;
    }

    // Message function to be called for each recipient
    const sendMessageToRecipient = async (recipient) => {
      try {
        // Use the new API endpoint to send the message
        const response = await fetch("/api/sendText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: recipient, // Already formatted with @c.us in parseRecipients()
            text: message,
            session: selectedSession,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        return await response.json();
      } catch (error) {
        console.error(`Error sending to ${recipient}:`, error);
        throw error;
      }
    };

    await startBroadcast(sendMessageToRecipient);
  };

  // Cancel the broadcast
  const handleCancelBroadcast = () => {
    if (confirm("Are you sure you want to cancel the broadcast?")) {
      cancelBroadcast();
    }
  };

  // Retry failed messages
  const handleRetryFailed = async () => {
    if (!selectedSession) {
      alert("Please select a session");
      return;
    }

    const message = getFinalMessage();
    if (!message) {
      alert("Failed to generate message");
      return;
    }

    // Message function to be called for each recipient
    const sendMessageToRecipient = async (recipient) => {
      try {
        // Use the new API endpoint to send the message
        const response = await fetch("/api/sendText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: recipient,
            text: message,
            session: selectedSession,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        return await response.json();
      } catch (error) {
        console.error(`Error sending to ${recipient}:`, error);
        throw error;
      }
    };

    await retryFailed(sendMessageToRecipient);
  };

  // Reset the broadcast
  const handleResetBroadcast = () => {
    if (
      confirm("Reset broadcast data? This will clear all progress and results.")
    ) {
      resetBroadcast();
    }
  };

  // Reset everything
  const handleReset = () => {
    if (confirm("Reset everything? This will clear all selections and data.")) {
      resetTemplate();
      resetBroadcast();
      setStep("select-template");
      setSelectedSession("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header className="flex items-center justify-between">
          <Card.Title>Template Broadcast</Card.Title>
          {step !== "select-template" && (
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Reset All
            </Button>
          )}
        </Card.Header>

        <Card.Content>
          {/* Session selector shown on all steps */}
          <div className="mb-6">
            <label
              htmlFor="session-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Session <span className="text-red-500">*</span>
            </label>
            <select
              id="session-select"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingSessions || isBroadcasting}
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

          {/* Step 1: Template Selection */}
          {step === "select-template" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select a Template
              </h3>
              <TemplateSelector
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplate={handleSelectTemplate}
              />
              <div className="flex justify-end mt-4">
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!selectedTemplateId}
                >
                  Continue to Parameters
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Fill Parameters */}
          {step === "fill-params" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <ParameterForm
                    template={selectedTemplate}
                    paramValues={paramValues}
                    onUpdateParam={handleUpdateParam}
                    validationErrors={validationErrors}
                  />
                </div>

                <div>
                  <MessagePreview
                    preview={preview}
                    isValid={validationErrors.length === 0}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>

                <Button variant="primary" onClick={handleNext}>
                  Continue to Recipients
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === "recipients" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <RecipientInput
                    recipients={recipients}
                    onUpdateRecipients={handleUpdateRecipients}
                    delaySeconds={delaySeconds}
                    onUpdateDelay={handleUpdateDelay}
                    parsedCount={parseRecipients().length}
                    error={broadcastError}
                  />
                </div>

                <div>
                  <MessagePreview
                    preview={preview}
                    isValid={validationErrors.length === 0}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>

                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={parseRecipients().length === 0 || !selectedSession}
                >
                  Start Broadcast
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Broadcast */}
          {step === "broadcast" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <BroadcastProgress
                    isBroadcasting={isBroadcasting}
                    progress={progress}
                    results={results}
                    error={broadcastError}
                    onCancel={handleCancelBroadcast}
                    onRetry={handleRetryFailed}
                    onReset={handleResetBroadcast}
                  />
                </div>

                <div>
                  <MessagePreview
                    preview={preview}
                    isValid={validationErrors.length === 0}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isBroadcasting}
                >
                  Back
                </Button>

                {!isBroadcasting && progress.current === 0 && (
                  <Button variant="primary" onClick={handleStartBroadcast}>
                    Start Broadcast
                  </Button>
                )}

                {isBroadcasting && (
                  <Button variant="danger" onClick={handleCancelBroadcast}>
                    Cancel Broadcast
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default BroadcastTemplateForm;
