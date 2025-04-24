// src/components/organisms/TemplateMessageSender/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import { useSession } from "@/hooks/useSession";
import {
  formatMessageContent,
  validateTemplateParams,
  fillDynamicParameters,
  getFinalMessageForContact,
} from "@/lib/templateParameterUtils";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import ContactSelector from "@/components/molecules/ContactSelector";
import {
  MessageSquare,
  Send,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  User,
  Users,
  PlusCircle,
  X,
  Calendar,
  Info,
} from "lucide-react";

/**
 * Component for sending messages using templates with parameters
 */
export default function TemplateMessageSender() {
  // Session state
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const [sessionName, setSessionName] = useState("");

  // Template state
  const { fetchTemplates, isLoading: isLoadingTemplates } =
    useTemplateDatabase();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form state
  const [paramValues, setParamValues] = useState({});
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [manualRecipients, setManualRecipients] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Template, 2: Fill Parameters, 3: Select Recipients
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Sending state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      const data = await fetchTemplates();
      setTemplates(data);
    };

    loadTemplates();
  }, [fetchTemplates]);

  // Update selected template when ID changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(
        (t) => t.id === parseInt(selectedTemplateId, 10)
      );
      setSelectedTemplate(template || null);

      // Reset param values when template changes
      setParamValues({});
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  // Handle template selection
  const handleTemplateChange = (e) => {
    setSelectedTemplateId(e.target.value ? parseInt(e.target.value, 10) : null);
  };

  // Handle parameter value change - only for static parameters
  const handleParamChange = (paramId, value) => {
    // Only handle static parameters
    if (selectedTemplate) {
      const isStaticParam = selectedTemplate.parameters.find(
        (p) => p.id === paramId && !p.isDynamic
      );

      if (isStaticParam) {
        setParamValues((prev) => ({
          ...prev,
          [paramId]: value,
        }));
      }
    }
  };

  // Handle when contacts are selected from ContactSelector
  const handleContactsSelected = (contacts) => {
    setSelectedContacts(contacts);
    setShowContactSelector(false);
  };

  // Get final message for a specific contact
  const getFinalMessageForContact = (contact) => {
    if (!selectedTemplate) return "";

    let content = selectedTemplate.content;

    // First replace dynamic parameters with contact data
    if (selectedTemplate.parameters) {
      selectedTemplate.parameters
        .filter((p) => p.isDynamic)
        .forEach((param) => {
          const regex = new RegExp(`\\{${param.id}\\}`, "g");

          // Get value from contact based on param source
          const value = contact[param.id] || "";
          content = content.replace(regex, value || `{${param.id}}`);
        });
    }

    // Then replace static parameters with user-provided values
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return content;
  };

  // Get preview for the first selected contact or generic preview
  const getPreviewHTML = () => {
    if (!selectedTemplate) return "";

    // If we have selected contacts, show preview for the first one
    if (selectedContacts.length > 0) {
      const previewMessage = getFinalMessageForContact(selectedContacts[0]);
      return formatMessageContent(previewMessage);
    }

    // Otherwise show generic preview with all parameters as placeholders
    let content = selectedTemplate.content;

    // Replace static parameters with values
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return formatMessageContent(content);
  };

  // Parse manual recipients
  const parseManualRecipients = () => {
    if (!manualRecipients.trim()) return [];

    return manualRecipients
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
      .map(formatPhoneNumber);
  };

  // Format phone number to WhatsApp format
  const formatPhoneNumber = (phoneNumber) => {
    // Clean the number
    let cleaned = phoneNumber.toString().replace(/\D/g, "");

    // Handle Indonesian format
    if (cleaned.startsWith("0")) {
      cleaned = `62${cleaned.substring(1)}`;
    }

    // Ensure it has the @c.us suffix
    if (!cleaned.includes("@c.us")) {
      cleaned = `${cleaned}@c.us`;
    }

    return cleaned;
  };

  // Get all recipients (from selected contacts and manual entries)
  const getAllRecipients = () => {
    const contactPhones = selectedContacts.map((contact) =>
      formatPhoneNumber(contact.phone)
    );
    const manualPhones = parseManualRecipients();

    // Combine and remove duplicates
    const allPhones = [...new Set([...contactPhones, ...manualPhones])];
    return allPhones;
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode((prev) => !prev);
  };

  // Add these functions to your component
  const handleNextStep = () => {
    if (step === 1) {
      // Validate template selection
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
      // Validate parameters
      if (
        selectedTemplate.parameters &&
        selectedTemplate.parameters.length > 0
      ) {
        const { isValid, errors } = validateTemplateParams(
          selectedTemplate.parameters,
          paramValues
        );

        if (!isValid) {
          setError(`Parameter error: ${errors.join(", ")}`);
          return;
        }
      }

      setError(null);
      setStep(3);
    } else if (step === 3) {
      // Validate recipients
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

  // Validate form before sending
  const validateForm = () => {
    setError(null);

    // Validate template selection
    if (!selectedTemplate) {
      setError("Silakan pilih template terlebih dahulu");
      return false;
    }

    // Validate session
    if (!sessionName) {
      setError("Silakan pilih session WhatsApp");
      return false;
    }

    // Validate recipients
    const allRecipients = getAllRecipients();
    if (allRecipients.length === 0) {
      setError("Pilih setidaknya satu penerima");
      return false;
    }

    // Validate parameters
    if (selectedTemplate.parameters && selectedTemplate.parameters.length > 0) {
      const { isValid, errors } = validateTemplateParams(
        selectedTemplate.parameters,
        paramValues
      );

      if (!isValid) {
        setError(`Parameter error: ${errors.join(", ")}`);
        return false;
      }
    }

    return true;
  };

  // Handle send messages
  const handleSend = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();
      const finalMessage = getFinalMessage();

      const response = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: sessionName,
          recipients: allRecipients,
          message: finalMessage,
          delay: 3000, // 3 seconds delay between messages
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send messages");
      }

      const result = await response.json();
      setSendResult(result);

      // Reset some form fields on success (optional)
      // setManualRecipients('');
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add these rendering functions to your component
  const renderStep1 = () => (
    <div className="space-y-4">
      {/* Session selection */}
      <div>
        <label
          htmlFor="sessionName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          WhatsApp Session <span className="text-red-500">*</span>
        </label>
        <select
          id="sessionName"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoadingSessions || isSubmitting}
          required
        >
          <option value="">Pilih session</option>
          {sessions.map((session) => (
            <option key={session.name} value={session.name}>
              {session.name} {session.status ? `(${session.status})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Template selection */}
      <div>
        <label
          htmlFor="templateId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Template Pesan <span className="text-red-500">*</span>
        </label>
        <select
          id="templateId"
          value={selectedTemplateId || ""}
          onChange={handleTemplateChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoadingTemplates || isSubmitting}
          required
        >
          <option value="">Pilih template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template preview */}
      {selectedTemplate && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Preview Template
          </h3>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMessageContent(selectedTemplate.content),
              }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Parameter akan ditampilkan dalam kurung kurawal {"{parameter_name}"}
          </p>
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={!selectedTemplate || !sessionName}
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700">
        Isi Parameter Template
      </h3>

      {/* Template parameters */}
      {selectedTemplate &&
      selectedTemplate.parameters &&
      selectedTemplate.parameters.length > 0 ? (
        <div className="space-y-4">
          {selectedTemplate.parameters.map((param) => (
            <div key={param.id}>
              <label
                htmlFor={`param-${param.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={
                  param.type === "number"
                    ? "number"
                    : param.type === "date"
                    ? "date"
                    : "text"
                }
                id={`param-${param.id}`}
                value={paramValues[param.id] || ""}
                onChange={(e) => handleParamChange(param.id, e.target.value)}
                placeholder={param.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={param.required}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">Template ini tidak memiliki parameter</p>
        </div>
      )}

      {/* Message preview */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Preview Pesan</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={togglePreview}
            leftIcon={
              previewMode ? (
                <Edit className="h-4 w-4 mr-1" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )
            }
          >
            {previewMode ? "Edit" : "Preview"}
          </Button>
        </div>

        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button type="button" variant="primary" onClick={handleNextStep}>
          Lanjutkan
        </Button>
      </div>
    </div>
  );

  // Render step 3: Select Recipients
  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700">Pilih Penerima</h3>

      {/* Contact selection buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="secondary"
          leftIcon={<Users className="h-4 w-4 mr-2" />}
          onClick={() => setShowContactSelector(true)}
          className="flex-1"
        >
          Pilih dari Daftar Kontak
        </Button>

        <span className="text-center text-gray-500 hidden sm:inline">atau</span>

        <Button
          type="button"
          variant="secondary"
          leftIcon={<PlusCircle className="h-4 w-4 mr-2" />}
          onClick={() => setShowContactSelector(false)}
          className="flex-1"
        >
          Tambahkan Nomor Manual
        </Button>
      </div>

      {/* Display Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Kontak Terpilih ({selectedContacts.length})
          </h4>
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {selectedContacts.map((contact) => (
                <div
                  key={contact.id || contact.phone}
                  className="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm"
                >
                  <span className="truncate max-w-[150px]">{contact.name}</span>
                  <button
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    onClick={() => {
                      setSelectedContacts((prev) =>
                        prev.filter((c) => c.phone !== contact.phone)
                      );
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manual Recipients Input */}
      {!showContactSelector && (
        <div className="mt-4">
          <label
            htmlFor="manualRecipients"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nomor Penerima Manual (satu per baris atau pisahkan dengan koma)
          </label>
          <textarea
            id="manualRecipients"
            value={manualRecipients}
            onChange={(e) => setManualRecipients(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Contoh:
08123456789
08987654321
atau: 08123456789, 08987654321"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Jumlah nomor manual: {parseManualRecipients().length}
          </p>
        </div>
      )}

      {/* Contact Selector Dialog */}
      {showContactSelector && (
        <div className="mt-4 border border-gray-200 rounded-md p-4 bg-white">
          <ContactSelector onSelectContacts={handleContactsSelected} />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={getAllRecipients().length === 0}
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );

  // Render step 4: Review & Send/Schedule
  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">
        Review & Kirim Pesan
      </h3>

      {/* Preview Box */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="font-medium text-gray-700">Preview Pesan</h4>
        </div>
        <div className="p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Template</h5>
          <p>{selectedTemplate?.name}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Session</h5>
          <p>{sessionName}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recipients</h5>
          <p>{getAllRecipients().length} penerima</p>
        </div>
      </div>

      {/* Scheduling Options */}
      <div className="mt-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sendOption"
              checked={!isScheduling}
              onChange={() => setIsScheduling(false)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Kirim Sekarang</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="sendOption"
              checked={isScheduling}
              onChange={() => setIsScheduling(true)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="ml-2">Jadwalkan Pengiriman</span>
          </label>
        </div>

        {isScheduling && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Jadwal
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="once"
                    checked={scheduleConfig.type === "once"}
                    onChange={handleScheduleConfigChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Satu Kali</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="recurring"
                    checked={scheduleConfig.type === "recurring"}
                    onChange={handleScheduleConfigChange}
                    className="h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2">Berulang</span>
                </label>
              </div>
            </div>

            {scheduleConfig.type === "once" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tanggal
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={scheduleConfig.date}
                    onChange={handleScheduleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Waktu
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={scheduleConfig.time}
                    onChange={handleScheduleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="cronExpression"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cron Expression
                  </label>
                  <input
                    type="text"
                    id="cronExpression"
                    name="cronExpression"
                    value={scheduleConfig.cronExpression}
                    onChange={handleScheduleConfigChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="0 9 * * 1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: menit jam hari-bulan bulan hari-minggu (0 9 * * 1 =
                    Setiap Senin jam 9 pagi)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={scheduleConfig.startDate}
                      onChange={handleScheduleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tanggal Selesai (Opsional)
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={scheduleConfig.endDate}
                      onChange={handleScheduleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min={
                        scheduleConfig.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevStep}
            disabled={isSubmitting}
          >
            Kembali
          </Button>

          {isScheduling ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleSchedule}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <Calendar className="h-4 w-4 mr-1" />}
            >
              {isSubmitting ? "Menjadwalkan..." : "Jadwalkan Pesan"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              onClick={handleSend}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <Send className="h-4 w-4 mr-1" />}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Sekarang"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Add the scheduling-related state and handlers
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    type: "once", // 'once' or 'recurring'
    date: "",
    time: "09:00",
    cronExpression: "0 9 * * 1", // Default to every Monday at 9 AM
    startDate: "",
    endDate: "",
  });

  // Add this handler for schedule config changes
  const handleScheduleConfigChange = (e) => {
    const { name, value } = e.target;
    setScheduleConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add this handler for scheduling messages
  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Validate schedule config
    if (scheduleConfig.type === "once" && !scheduleConfig.date) {
      setError("Silakan pilih tanggal pengiriman");
      return;
    }

    if (scheduleConfig.type === "recurring" && !scheduleConfig.cronExpression) {
      setError("Cron expression harus diisi");
      return;
    }

    setIsSubmitting(true);
    setSendResult(null);

    try {
      const allRecipients = getAllRecipients();

      // Prepare schedule data for database
      let scheduleData = {
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        templateId: selectedTemplate.id, // Make sure this is an integer
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

      console.log(
        "Sending schedule data:",
        JSON.stringify(scheduleData, null, 2)
      );

      // Send to schedules API
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

  // Update the sendResult component to handle both immediate send and scheduled messages
  return (
    <div className="space-y-6">
      {/* Step indicator - Keep your existing step indicator code */}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Send result - Update this part */}
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

          {/* Reset button */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSendResult(null);
                setStep(1);
                setSelectedContacts([]);
                setManualRecipients("");
                setParamValues({});
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
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
