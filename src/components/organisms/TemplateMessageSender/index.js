"use client";

import React, { useState, useEffect } from "react";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import { useSession } from "@/hooks/useSession";
import {
  formatMessageContent,
  validateTemplateParams,
} from "@/lib/templateUtils";
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

  // Handle parameter value change
  const handleParamChange = (paramId, value) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  };

  // Auto-fill parameter for selected contacts
  const fillParametersFromContacts = () => {
    if (!selectedTemplate || selectedContacts.length === 0) return;

    // Get name parameter if it exists
    const nameParam = selectedTemplate.parameters.find((p) => p.id === "name");

    if (nameParam && selectedContacts.length === 1) {
      // If only one contact is selected, we can auto-fill their name
      setParamValues((prev) => ({
        ...prev,
        name: selectedContacts[0].name,
      }));
    }
  };

  // Handle when contacts are selected from ContactSelector
  const handleContactsSelected = (contacts) => {
    setSelectedContacts(contacts);
    setShowContactSelector(false);

    // Auto-fill parameters based on contact data
    if (contacts.length === 1) {
      fillParametersFromContacts();
    }
  };

  // Get final message with parameters filled in
  const getFinalMessage = () => {
    if (!selectedTemplate) return "";

    let content = selectedTemplate.content;

    // Replace parameter placeholders with values
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return content;
  };

  // Get preview HTML with formatting
  const getPreviewHTML = () => {
    return formatMessageContent(getFinalMessage());
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

  // Go to next step
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
    }
  };

  // Go to previous step
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

  // Render step 1: Select Template and Session
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

  // Render step 2: Fill Parameters
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

      {/* Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Ringkasan Pesan
        </h4>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-500">Template:</span>
            <span className="block font-medium">{selectedTemplate?.name}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Jumlah Penerima:</span>
            <span className="block font-medium">
              {getAllRecipients().length}
            </span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Sesi WhatsApp:</span>
            <span className="block font-medium">{sessionName}</span>
          </div>
        </div>
      </div>

      {/* Navigation and send buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrevStep}
          disabled={isSubmitting}
        >
          Kembali
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSend}
          disabled={isSubmitting || getAllRecipients().length === 0}
          isLoading={isSubmitting}
          leftIcon={!isSubmitting && <Send className="h-4 w-4 mr-1" />}
        >
          {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center">
          <div
            className={`flex-1 relative pb-6 ${
              step > 1 ? "text-indigo-600" : "text-gray-900"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 1
                    ? "bg-indigo-600 text-white"
                    : step > 1
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                1
              </div>
            </div>
            <div className="border-t-2 border-gray-200 absolute top-4 left-1/2 right-0"></div>
            <div className="text-center mt-10 text-sm font-medium">
              Pilih Template
            </div>
          </div>
          <div
            className={`flex-1 relative pb-6 ${
              step > 2 ? "text-indigo-600" : "text-gray-900"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 2
                    ? "bg-indigo-600 text-white"
                    : step > 2
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                2
              </div>
            </div>
            <div className="border-t-2 border-gray-200 absolute top-4 left-0 right-1/2"></div>
            <div className="border-t-2 border-gray-200 absolute top-4 left-1/2 right-0"></div>
            <div className="text-center mt-10 text-sm font-medium">
              Isi Parameter
            </div>
          </div>
          <div className="flex-1 relative pb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step === 3
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                3
              </div>
            </div>
            <div className="border-t-2 border-gray-200 absolute top-4 right-1/2 left-0"></div>
            <div className="text-center mt-10 text-sm font-medium">
              Pilih Penerima
            </div>
          </div>
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
            <h3 className="text-lg font-medium">Pesan Terkirim</h3>
          </div>
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
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
