// src/components/organisms/TemplateMessageSender/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useTemplate } from "@/hooks/useTemplate";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useMessageWizard } from "@/hooks/useMessageWizard";
import { formatMessageContent } from "@/lib/templates/templateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Search } from "lucide-react";

// Import step components
import Step1 from "@/components/molecules/TemplateSelector";
import Step2 from "@/components/molecules/TemplateParameterForm";
import Step3 from "@/components/molecules/RecipientSelector";
import Step4 from "@/components/molecules/ReviewAndSend";

export default function TemplateMessageSender() {
  console.log("🚀 TemplateMessageSender: Rendering");

  // Session state
  const { sessions, isLoading: isLoadingSessions } = useWhatsApp();
  const [sessionName, setSessionName] = useState("");

  // Template state using useTemplate hook instead
  const {
    templates,
    fetchTemplates,
    isLoading: isLoadingTemplates,
  } = useTemplate();

  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Use the useMessageWizard hook
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
    getFinalMessageForContact,
  } = useMessageWizard(templates, selectedTemplateId);

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

  // Debug logging
  useEffect(() => {
    console.log("📊 State Debug:", {
      step,
      selectedTemplateId,
      selectedTemplate: selectedTemplate ? "exists" : "null",
      sessionName,
      paramValues,
      selectedContacts: selectedContacts.length,
      manualRecipients,
      scheduleConfig,
      isScheduling,
    });
  }, [
    step,
    selectedTemplateId,
    selectedTemplate,
    sessionName,
    paramValues,
    selectedContacts,
    manualRecipients,
    scheduleConfig,
    isScheduling,
  ]);

  // Handle template change (wrapper for the hook function)
  const handleTemplateChangeWrapper = (e) => {
    console.log("🔄 Template change event:", e.target.value);
    const newId = handleTemplateChange(e);
    console.log("📝 New template ID:", newId);
    setSelectedTemplateId(newId);
  };

  // Handle navigation
  const handleNextStep = () => {
    console.log(`➡️ Moving to next step from step ${step}`);

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
      console.log("📋 Recipients before step 4:", recipients);
      if (recipients.length === 0) {
        setError("Silakan pilih minimal satu penerima pesan");
        return;
      }
      setError(null);
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    console.log(`⬅️ Moving to previous step from step ${step}`);
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Handle send messages
  const handleSend = async (e) => {
    e.preventDefault();
    console.log("📤 Handling send...");

    if (!validateForm(sessionName)) {
      console.log("❌ Form validation failed");
      return;
    }

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();
      console.log("📋 All recipients:", allRecipients);

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

      console.log("💬 Messages to send:", messages);

      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionName,
          recipients: allRecipients,
          message: messages[0].message,
          delay: 3000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send messages");
      }

      const result = await response.json();
      console.log("✅ Send result:", result);
      setSendResult(result);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle scheduling messages
  const handleSchedule = async (e) => {
    e.preventDefault();
    console.log("📅 Handling schedule...");

    if (!validateForm(sessionName)) return;

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();
      console.log("📋 Schedule recipients:", allRecipients);

      // Format schedule data
      let scheduleData = {
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        templateId: selectedTemplate.id,
        paramValues: paramValues,
        recipients: allRecipients,
        scheduleType: scheduleConfig.type,
        sessionName: sessionName,
        scheduleConfig: {},
      };

      // Format schedule configuration based on type
      if (scheduleConfig.type === "once") {
        // Validate date is present
        if (!scheduleConfig.date) {
          throw new Error("Tanggal harus dipilih untuk jadwal tipe 'sekali'");
        }

        // Validate time format
        const time = scheduleConfig.time || "00:00";
        if (!/^\d{2}:\d{2}$/.test(time)) {
          throw new Error("Format waktu tidak valid, gunakan format HH:MM");
        }

        // Check if the date string already contains a time component (T)
        const hasTimeComponent = scheduleConfig.date.includes("T");

        // Create a proper ISO string for the date, avoiding double time components
        let dateTimeString;
        let scheduleDate;

        if (hasTimeComponent) {
          // If date already has a time component, use it directly
          console.log("Date already has time component:", scheduleConfig.date);
          scheduleDate = new Date(scheduleConfig.date);
        } else {
          // Otherwise, append the time component
          dateTimeString = `${scheduleConfig.date}T${time}:00`;
          console.log("Creating date with time:", dateTimeString);
          scheduleDate = new Date(dateTimeString);
        }

        // Check date validity
        if (isNaN(scheduleDate.getTime())) {
          throw new Error(`Format tanggal tidak valid: ${scheduleConfig.date}`);
        }

        // Check date is in the future
        if (scheduleDate <= new Date()) {
          throw new Error("Tanggal dan waktu harus di masa depan");
        }

        // Use the validated date
        scheduleData.scheduleConfig = {
          date: scheduleDate.toISOString(),
        };
      } else if (scheduleConfig.type === "recurring") {
        // Validate cron expression
        if (!scheduleConfig.cronExpression) {
          throw new Error("Ekspresi cron wajib diisi untuk jadwal berulang");
        }

        // Validate start date
        if (!scheduleConfig.startDate) {
          throw new Error("Tanggal mulai wajib diisi untuk jadwal berulang");
        }

        // Create valid dates for start and end dates
        const startDate = scheduleConfig.startDate
          ? new Date(`${scheduleConfig.startDate}T00:00:00`)
          : new Date();

        // Validate start date
        if (isNaN(startDate.getTime())) {
          throw new Error("Format tanggal mulai tidak valid");
        }

        // Process end date if provided
        let endDate = null;
        if (scheduleConfig.endDate) {
          endDate = new Date(`${scheduleConfig.endDate}T23:59:59`);
          if (isNaN(endDate.getTime())) {
            throw new Error("Format tanggal selesai tidak valid");
          }
          if (endDate <= startDate) {
            throw new Error("Tanggal selesai harus setelah tanggal mulai");
          }
        }

        // Set schedule config with validated dates
        scheduleData.scheduleConfig = {
          cronExpression: scheduleConfig.cronExpression,
          startDate: scheduleConfig.startDate
            ? new Date(`${scheduleConfig.startDate}T00:00:00`).toISOString()
            : undefined,
          endDate: scheduleConfig.endDate
            ? new Date(`${scheduleConfig.endDate}T23:59:59`).toISOString()
            : undefined,
        };
      }

      console.log("📝 Schedule data:", scheduleData);

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      // Process response based on status
      if (!response.ok) {
        // Get detailed error message
        let errorMsg = "Failed to schedule message";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;

          // Handle validation errors specifically
          if (errorData.details) {
            errorMsg += ": " + JSON.stringify(errorData.details);
          }
        } catch {
          // If we can't parse JSON, try to get the text
          try {
            const text = await response.text();
            if (text) errorMsg = text;
          } catch {
            // If even that fails, use status text
            errorMsg = `${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMsg);
      }

      // Parse the response
      let result = {};
      const responseText = await response.text();

      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText);
        } catch (err) {
          console.warn("Could not parse schedule response:", err);
        }
      }

      setSendResult({
        scheduled: true,
        scheduleId: result.id || "unknown",
        nextRun: result.nextRun || "according to schedule",
      });

      // Show success message
      console.log("✅ Schedule created successfully:", result);
    } catch (err) {
      console.error("❌ Error scheduling message:", err);
      setError(err.message || "Failed to schedule message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle schedule config change
  const handleScheduleConfigChange = (e) => {
    const { name, value } = e.target;
    console.log(`⚙️ Schedule config change: ${name} = ${value}`);
    setScheduleConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Render the step components with additional debugging props
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
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
