// src/components/organisms/TemplateMessageSender/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import { useSession } from "@/hooks/useSession";
import { useTemplateMessageSender } from "@/hooks/useTemplateMessageSender";
import { formatMessageContent } from "@/lib/templateParameterUtils";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import { AlertCircle, Check } from "lucide-react";

// Import step components
import Step1 from "@/components/molecules/TemplateSelector/Step1";
import Step2 from "@/components/molecules/TemplateParameterForm/Step2";
import Step3 from "@/components/molecules/RecipientSelector/Step3";
import Step4 from "@/components/molecules/ReviewAndSend/Step4";

export default function TemplateMessageSender() {
  // Session state
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const [sessionName, setSessionName] = useState("");

  // Template state
  const { fetchTemplates, isLoading: isLoadingTemplates } =
    useTemplateDatabase();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Use the new hook for template message logic
  const {
    selectedTemplate,
    paramValues,
    selectedContacts,
    manualRecipients,
    previewMode,
    error,
    setSelectedContacts,
    setManualRecipients,
    setError,
    handleTemplateChange,
    handleParamChange,
    parseManualRecipients,
    getAllRecipients,
    validateForm,
    getPreviewHTML,
    togglePreview,
    handleContactsSelected,
  } = useTemplateMessageSender(templates, selectedTemplateId);

  // Form state
  const [step, setStep] = useState(1);
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Sending state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Scheduling state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    type: "once",
    date: "",
    time: "09:00",
    cronExpression: "0 9 * * 1",
    startDate: "",
    endDate: "",
  });

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const data = await fetchTemplates();
      setTemplates(data);
    };
    loadTemplates();
  }, [fetchTemplates]);

  // Handle template change (wrapper for the hook function)
  const handleTemplateChangeWrapper = (e) => {
    const newId = handleTemplateChange(e);
    setSelectedTemplateId(newId);
  };

  // Handle navigation
  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedTemplate) {
        setError("Silakan pilih template terlebih dahulu");
        return;
      }
      if (!sessionName) {
        setError("Silakan pilih session WhatsApp");
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (
        selectedTemplate.parameters &&
        selectedTemplate.parameters.length > 0
      ) {
        const staticParams = selectedTemplate.parameters.filter(
          (p) => !p.isDynamic
        );
        if (staticParams.length > 0) {
          const missingParams = staticParams.filter(
            (param) =>
              param.required &&
              (!paramValues[param.id] || !paramValues[param.id].trim())
          );
          if (missingParams.length > 0) {
            setError(
              `Parameter error: ${missingParams
                .map((p) => p.name)
                .join(", ")} harus diisi`
            );
            return;
          }
        }
      }
      setError(null);
      setStep(3);
    } else if (step === 3) {
      const recipients = getAllRecipients();
      if (recipients.length === 0) {
        setError("Silakan pilih minimal satu penerima pesan");
        return;
      }
      setError(null);
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Handle send messages
  const handleSend = async (e) => {
    e.preventDefault();

    if (!validateForm(sessionName)) return;

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();
      const messages =
        selectedContacts.length > 0
          ? selectedContacts.map((contact) => ({
              recipient: contact.phone,
              message: getFinalMessageForContact(contact),
            }))
          : allRecipients.map((phone) => ({
              recipient: phone,
              message: selectedTemplate.content,
            }));

      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: sessionName,
          recipients: allRecipients,
          message: messages[0].message, // For now, send the same message
          delay: 3000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send messages");
      }

      const result = await response.json();
      setSendResult(result);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle scheduling messages
  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!validateForm(sessionName)) return;

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();

      let scheduleData = {
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        templateId: selectedTemplate.id,
        paramValues: paramValues,
        recipients: allRecipients,
        scheduleType: scheduleConfig.type,
        sessionName: sessionName,
        scheduleConfig: {
          cronExpression:
            scheduleConfig.type === "recurring"
              ? scheduleConfig.cronExpression
              : null,
          date:
            scheduleConfig.type === "once"
              ? new Date(
                  `${scheduleConfig.date}T${scheduleConfig.time}:00`
                ).toISOString()
              : null,
        },
      };

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule message");
      }

      const result = await response.json();
      setSendResult({
        scheduled: true,
        scheduleId: result.id,
        nextRun: result.nextRun,
      });
    } catch (err) {
      console.error("Error scheduling message:", err);
      setError(err.message || "Failed to schedule message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle schedule config change
  const handleScheduleConfigChange = (e) => {
    const { name, value } = e.target;
    setScheduleConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  step === stepNumber
                    ? "bg-blue-600 text-white"
                    : step > stepNumber
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {stepNumber}
              </div>
              <span
                className={`mt-2 text-xs ${
                  step === stepNumber
                    ? "text-blue-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {stepNumber === 1
                  ? "Template"
                  : stepNumber === 2
                  ? "Parameters"
                  : stepNumber === 3
                  ? "Recipients"
                  : "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Send result */}
      {sendResult && (
        <div className="bg-green-50 p-4 rounded-md text-green-700">
          <div className="flex items-center mb-3">
            <Check className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">
              {sendResult.scheduled
                ? "Pesan Berhasil Dijadwalkan"
                : "Pesan Terkirim"}
            </h3>
          </div>

          {sendResult.scheduled ? (
            <div className="mb-3">
              <p>Pesan berhasil dijadwalkan untuk dikirim pada:</p>
              <p className="font-medium mt-1">
                {new Date(sendResult.nextRun).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold">
                  {sendResult.totalSent + sendResult.totalFailed}
                </p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-green-500">Sukses</p>
                <p className="text-xl font-bold text-green-600">
                  {sendResult.totalSent}
                </p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-red-500">Gagal</p>
                <p className="text-xl font-bold text-red-600">
                  {sendResult.totalFailed}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSendResult(null);
                setStep(1);
                setSelectedContacts([]);
                setManualRecipients("");
                setIsScheduling(false);
                setScheduleConfig({
                  type: "once",
                  date: "",
                  time: "09:00",
                  cronExpression: "0 9 * * 1",
                  startDate: "",
                  endDate: "",
                });
              }}
            >
              Kirim Pesan Baru
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      {!sendResult && (
        <Card>
          <Card.Content>
            {step === 1 && (
              <Step1
                sessionName={sessionName}
                setSessionName={setSessionName}
                sessions={sessions}
                isLoadingSessions={isLoadingSessions}
                isSubmitting={isSubmitting}
                templates={templates}
                selectedTemplateId={selectedTemplateId}
                handleTemplateChange={handleTemplateChangeWrapper}
                isLoadingTemplates={isLoadingTemplates}
                selectedTemplate={selectedTemplate}
                handleNextStep={handleNextStep}
                formatMessageContent={formatMessageContent}
              />
            )}

            {step === 2 && (
              <Step2
                selectedTemplate={selectedTemplate}
                paramValues={paramValues}
                handleParamChange={handleParamChange}
                isSubmitting={isSubmitting}
                previewMode={previewMode}
                togglePreview={togglePreview}
                getPreviewHTML={getPreviewHTML}
                handlePrevStep={handlePrevStep}
                handleNextStep={handleNextStep}
              />
            )}

            {step === 3 && (
              <Step3
                showContactSelector={showContactSelector}
                setShowContactSelector={setShowContactSelector}
                selectedContacts={selectedContacts}
                setSelectedContacts={setSelectedContacts}
                handleContactsSelected={handleContactsSelected}
                manualRecipients={manualRecipients}
                setManualRecipients={setManualRecipients}
                parseManualRecipients={parseManualRecipients}
                isSubmitting={isSubmitting}
                handlePrevStep={handlePrevStep}
                handleNextStep={handleNextStep}
                getAllRecipients={getAllRecipients}
              />
            )}

            {step === 4 && (
              <Step4
                selectedTemplate={selectedTemplate}
                sessionName={sessionName}
                getAllRecipients={getAllRecipients}
                getPreviewHTML={getPreviewHTML}
                isScheduling={isScheduling}
                setIsScheduling={setIsScheduling}
                scheduleConfig={scheduleConfig}
                handleScheduleConfigChange={handleScheduleConfigChange}
                handleSend={handleSend}
                handleSchedule={handleSchedule}
                isSubmitting={isSubmitting}
                handlePrevStep={handlePrevStep}
              />
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
