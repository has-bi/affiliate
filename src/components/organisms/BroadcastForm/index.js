// src/components/organisms/BroadcastForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RecipientInput from "@/components/molecules/RecipientInput";
import BroadcastProgress from "@/components/molecules/BroadcastProgress";
import BulkJobProgress from "@/components/molecules/BulkJobProgress";
import ImageUploader from "@/components/molecules/ImageUploader";
import CSVUploader from "@/components/molecules/CSVUploader";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useBulkJob } from "@/hooks/useBulkJob";
import { useSession } from "@/hooks/useWhatsApp";
import { useTemplate } from "@/hooks/useTemplate";
import { validateAndFormatPhone } from "@/lib/utils/phoneValidator";
import { processAllParameters, formatMessageContent } from "@/lib/templates/templateUtils";
import { Send, AlertCircle } from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

const BroadcastForm = () => {
  const { sessions, isLoading: isLoadingSessions } = useSession();
  const { isSending, error, result, broadcastMessage, clearResult } =
    useBroadcast();
  const { 
    isCreating: isCreatingJob, 
    error: jobError, 
    activeJob, 
    createBulkJob, 
    cancelJob, 
    clearActiveJob 
  } = useBulkJob();
  const { templates, fetchTemplates, isLoading: isLoadingTemplates } = useTemplate();

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const [formData, setFormData] = useState({
    sessionName: "",
    recipients: "",
    message: "",
    delaySeconds: 1.0,
    templateId: "",
    useTemplate: false,
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});

  const [selectedImage, setSelectedImage] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [csvContacts, setCsvContacts] = useState([]);
  const [inputMethod, setInputMethod] = useState("manual"); // manual or csv

  // Handle template selection
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setFormData(prev => ({ ...prev, templateId, useTemplate: !!templateId }));
    
    if (templateId) {
      const template = templates.find(t => t.id === parseInt(templateId));
      setSelectedTemplate(template);
      
      // Clear message when using template
      setFormData(prev => ({ ...prev, message: "" }));
      
      // Initialize param values for static parameters
      const initialParams = {};
      if (template?.parameters) {
        template.parameters.forEach(param => {
          if (!param.isDynamic) {
            initialParams[param.id] = "";
          }
        });
      }
      setParamValues(initialParams);
    } else {
      setSelectedTemplate(null);
      setParamValues({});
    }
  };

  // Handle parameter value changes
  const handleParamChange = (paramId, value) => {
    setParamValues(prev => ({ ...prev, [paramId]: value }));
  };

  // Handle CSV contacts loaded
  const handleCsvContactsLoaded = (contacts) => {
    if (Array.isArray(contacts) && contacts.length > 0) {
      setCsvContacts(contacts);
      setRecipientCount(contacts.length);
      setValidationError("");
      
      // Real-time validation feedback
      if (contacts.length > 100) {
        setValidationError("Warning: Large recipient lists may take longer to process and could hit rate limits.");
      }
    } else {
      // Handle empty or invalid CSV data
      setCsvContacts([]);
      setRecipientCount(0);
      setValidationError("No valid contacts found in CSV file.");
    }
  };

  // Update recipient count when recipients change
  const handleRecipientsChange = (value) => {
    setFormData((prev) => ({ ...prev, recipients: value }));
    setValidationError(""); // Clear validation errors when user types

    // Count valid recipients
    const recipients = value
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);

    setRecipientCount(recipients.length);
    
    // Real-time validation feedback
    if (recipients.length > 100) {
      setValidationError("Warning: Large recipient lists may take longer to process and could hit rate limits.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setIsValidating(true);

    try {
      // Validate form
      if (!formData.sessionName) {
        setValidationError("Please select a WhatsApp session");
        return;
      }

      if (!formData.recipients.trim()) {
        setValidationError("Please enter at least one recipient");
        return;
      }

      // Validate message or template
      if (!formData.useTemplate && !formData.message.trim()) {
        setValidationError("Please enter a message or select a template");
        return;
      }
      
      if (formData.useTemplate && !selectedTemplate) {
        setValidationError("Please select a template");
        return;
      }
      
      // Validate required template parameters
      if (formData.useTemplate && selectedTemplate?.parameters) {
        const staticParams = selectedTemplate.parameters.filter(p => !p.isDynamic && p.required);
        const missingParams = staticParams.filter(param => !paramValues[param.id] || !paramValues[param.id].trim());
        
        if (missingParams.length > 0) {
          setValidationError(`Required parameters missing: ${missingParams.map(p => p.name).join(", ")}`);
          return;
        }
      }

      // Parse recipients based on input method
      let recipients = [];
      let contactsData = new Map(); // Map phone -> contact info
      
      if (inputMethod === "csv" && Array.isArray(csvContacts) && csvContacts.length > 0) {
        // Use CSV data
        recipients = csvContacts.map(contact => contact?.phoneNumber).filter(Boolean);
        
        // Create lookup map for CSV contacts
        if (Array.isArray(csvContacts) && csvContacts.length > 0) {
          csvContacts.forEach(contact => {
            if (contact && contact.phoneNumber && contact.name) {
              const phoneKey = contact.phoneNumber.replace(/\D/g, "");
              contactsData.set(phoneKey, {
                name: contact.name,
                phone: contact.phoneNumber,
                source: "csv"
              });
            }
          });
        }
      } else {
        // Use manual input
        recipients = formData.recipients
          .split(/[\n,]+/)
          .map((r) => r.trim())
          .filter(Boolean);
      }

      // Validate recipients format
      const invalidRecipients = recipients.filter(r => {
        const result = validateAndFormatPhone(r);
        return !result.isValid;
      });

      if (invalidRecipients.length > 0) {
        setValidationError(`Invalid phone numbers detected: ${invalidRecipients.slice(0, 3).join(", ")}${invalidRecipients.length > 3 ? ` and ${invalidRecipients.length - 3} more` : ""}`);
        return;
      }

      if (recipients.length > 200) {
        setValidationError("Maximum 200 recipients allowed per broadcast. Please split into smaller groups for better delivery rates and to avoid rate limits.");
        return;
      }

      // Process message based on template or direct message
      let finalMessage = formData.message;
      let processedMessages = [];
      
      if (formData.useTemplate && selectedTemplate) {
        // No database lookup - only use CSV data when available

        // Process each recipient with template
        for (const recipient of recipients) {
          const phoneNumber = recipient.replace(/\D/g, "");
          const formattedChatId = recipient.includes("@c.us")
            ? recipient
            : `${phoneNumber}@c.us`;

          // Get contact info - only use CSV data, no database lookup
          let contactData;
          const csvContact = contactsData.get(phoneNumber);
          
          if (csvContact) {
            // Use CSV data when available
            contactData = {
              name: csvContact.name,
              phone: phoneNumber,
              source: "csv",
            };
          } else {
            // For manual entries, don't provide name (let template handle empty {name})
            contactData = {
              phone: phoneNumber,
              source: "manual",
              // Deliberately no 'name' property - let templates handle missing dynamic parameters
            };
          }

          // Process template with dynamic and static parameters
          const processedMessage = processAllParameters(
            selectedTemplate.content,
            contactData,
            paramValues
          );

          processedMessages.push({
            recipient: formattedChatId,
            message: processedMessage,
          });
        }
        
        finalMessage = processedMessages[0]?.message || selectedTemplate.content;
      }

      // Use job system for ALL batches to avoid 504 timeouts  
      if (recipients.length > 0) {
        if (formData.useTemplate && processedMessages.length > 0) {
          // For templates, we need to use the bulk API to handle personalized messages
          const response = await fetch("/api/messages/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session: formData.sessionName,
              processedMessages: processedMessages,
              templateId: selectedTemplate?.id,
              templateName: selectedTemplate?.name,
              image: selectedImage,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
          }

          const result = await response.json();
          // Handle the response appropriately
          console.log("Broadcast result:", result);
        } else {
          // For simple messages, use the job system
          await createBulkJob(
            formData.sessionName,
            recipients,
            finalMessage,
            [],
            selectedImage
          );
        }
      } else {
        await broadcastMessage(formData.sessionName, recipients, finalMessage, selectedImage);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      sessionName: "",
      recipients: "",
      message: "",
      delaySeconds: 1.0,
      templateId: "",
      useTemplate: false,
    });
    setSelectedTemplate(null);
    setParamValues({});
    setSelectedImage(null);
    setRecipientCount(0);
    setValidationError("");
    setCsvContacts([]);
    setInputMethod("manual");
    clearResult();
    clearActiveJob();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <Card.Header>
            <Card.Title>Broadcast Message</Card.Title>
          </Card.Header>

          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sessionName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sessionName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoadingSessions || isSending}
                >
                  <option value="">Select a session</option>
                  {sessions.map((session) => (
                    <option key={session.name} value={session.name}>
                      {session.name}{" "}
                      {session.status ? `(${session.status})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      checked={!formData.useTemplate}
                      onChange={() => {
                        setFormData(prev => ({ ...prev, useTemplate: false, templateId: "" }));
                        setSelectedTemplate(null);
                        setParamValues({});
                      }}
                      className="mr-2"
                      disabled={isSending}
                    />
                    Custom Message
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="messageType"
                      checked={formData.useTemplate}
                      onChange={() => setFormData(prev => ({ ...prev, useTemplate: true, message: "" }))}
                      className="mr-2"
                      disabled={isSending}
                    />
                    Use Template
                  </label>
                </div>
              </div>

              {/* Template Selection */}
              {formData.useTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.templateId}
                    onChange={handleTemplateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoadingTemplates || isSending}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Template Parameters */}
              {formData.useTemplate && selectedTemplate && selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700">
                    Template Parameters
                  </h3>

                  {/* Dynamic Parameters Info */}
                  {selectedTemplate.parameters.filter(p => p.isDynamic).length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">
                        Dynamic Parameters (Auto-filled from contact data)
                      </h4>
                      {selectedTemplate.parameters.filter(p => p.isDynamic).map((param) => (
                        <div key={param.id} className="text-sm text-blue-600 mb-1">
                          <span className="font-medium">{param.name}</span>: Will be filled automatically
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Static Parameters */}
                  {selectedTemplate.parameters.filter(p => !p.isDynamic).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Manual Parameters
                      </h4>
                      {selectedTemplate.parameters.filter(p => !p.isDynamic).map((param) => (
                        <div key={param.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {param.name}
                            {param.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <input
                            type={param.type === "number" ? "number" : param.type === "date" ? "date" : "text"}
                            value={paramValues[param.id] || ""}
                            onChange={(e) => handleParamChange(param.id, e.target.value)}
                            placeholder={param.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required={param.required}
                            disabled={isSending}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Template Preview */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Template Preview</h4>
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <div 
                        className="prose prose-sm max-w-none" 
                        dangerouslySetInnerHTML={{ 
                          __html: formatMessageContent(
                            processAllParameters(
                              selectedTemplate.content,
                              inputMethod === "csv" && Array.isArray(csvContacts) && csvContacts.length > 0 && csvContacts[0]?.name
                                ? { name: csvContacts[0].name + " (from CSV)" }
                                : {}, // Empty object for manual - no name provided
                              paramValues
                            )
                          )
                        }} 
                      />
                    </div>
                    {inputMethod === "csv" && Array.isArray(csvContacts) && csvContacts.length > 0 && csvContacts[0]?.name ? (
                      <p className="text-xs text-blue-600 mt-2">
                        📄 Names will be filled from your CSV data (showing example with "{csvContacts[0].name}")
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Manual input: {'{name}'} parameters will be empty (no database lookup)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Input Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients Input Method
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputMethod"
                      checked={inputMethod === "manual"}
                      onChange={() => {
                        setInputMethod("manual");
                        setCsvContacts([]);
                        const recipientsText = formData.recipients || "";
                        setRecipientCount(recipientsText.split(/[\n,]+/).map(r => r.trim()).filter(Boolean).length);
                      }}
                      className="mr-2"
                      disabled={isSending}
                    />
                    Manual Input
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="inputMethod"
                      checked={inputMethod === "csv"}
                      onChange={() => {
                        setInputMethod("csv");
                        setFormData(prev => ({ ...prev, recipients: "" }));
                        setRecipientCount(csvContacts.length);
                      }}
                      className="mr-2"
                      disabled={isSending}
                    />
                    CSV Upload (with Names)
                  </label>
                </div>
              </div>

              {/* Recipients Input - Manual */}
              {inputMethod === "manual" && (
                <RecipientInput
                  recipients={formData.recipients}
                  onUpdateRecipients={handleRecipientsChange}
                  delaySeconds={formData.delaySeconds}
                  onUpdateDelay={(value) =>
                    setFormData((prev) => ({ ...prev, delaySeconds: value }))
                  }
                  parsedCount={recipientCount}
                  error={
                    validationError.includes("recipient") ? validationError : ""
                  }
                />
              )}

              {/* Recipients Input - CSV */}
              {inputMethod === "csv" && (
                <div className="space-y-4">
                  <CSVUploader 
                    onRecipientsLoaded={handleCsvContactsLoaded}
                    className=""
                  />
                  
                  {csvContacts.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <h4 className="text-sm font-medium text-green-900 mb-2">
                        CSV Contacts Loaded ({csvContacts.length} contacts)
                      </h4>
                      <div className="text-sm text-green-700">
                        <p>✅ Names available for dynamic parameters</p>
                        <p>📱 Phone numbers ready for broadcast</p>
                      </div>
                      
                      {/* Show preview of first few contacts */}
                      <div className="mt-2 text-xs">
                        <p className="font-medium mb-1">Preview:</p>
                        {csvContacts.slice(0, 3).map((contact, index) => (
                          <p key={index} className="text-gray-600">
                            {contact.name} - {contact.phoneNumber}
                          </p>
                        ))}
                        {csvContacts.length > 3 && (
                          <p className="text-gray-500">... and {csvContacts.length - 3} more</p>
                        )}
                      </div>
                      
                      {/* Delay Settings for CSV */}
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700">
                          Delay between messages:
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          max="30"
                          step="0.5"
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded-md"
                          value={formData.delaySeconds}
                          onChange={(e) => setFormData(prev => ({ ...prev, delaySeconds: parseFloat(e.target.value) || 1.5 }))}
                          disabled={isSending}
                        />
                        <span className="text-xs text-gray-500">seconds</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Message Input - Only show when not using template */}
              {!formData.useTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Type your message here..."
                    disabled={isSending}
                  />
                </div>
              )}

              {/* Image Upload */}
              <ImageUploader
                onImageSelected={setSelectedImage}
                selectedImage={selectedImage}
              />

              {/* Error Display */}
              {(validationError || error) && (
                <div className={`p-4 rounded-md flex items-start ${
                  validationError && validationError.startsWith('Warning:')
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{validationError || error}</p>
                    {recipientCount > 50 && (
                      <p className="mt-2 text-sm">
                        💡 Tip: For large broadcasts, consider using a delay of 5+ seconds between messages to avoid rate limiting.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSending}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSending || isCreatingJob || isValidating || recipientCount === 0 || !formData.sessionName || (!formData.useTemplate && !formData.message.trim()) || (formData.useTemplate && !selectedTemplate) || (inputMethod === "csv" && csvContacts.length === 0)}
                  isLoading={isSending || isCreatingJob || isValidating}
                  leftIcon={!(isSending || isValidating) && <Send className="h-4 w-4" />}
                >
                  {isSending
                    ? `Sending... (${Math.round((result?.successCount || 0) / recipientCount * 100) || 0}%)`
                    : isCreatingJob
                    ? "Creating Job..."
                    : isValidating
                    ? "Validating..."
                    : `${formData.useTemplate && selectedTemplate ? `Send ${selectedTemplate.name}` : 'Send Message'} to ${recipientCount} Recipient${
                        recipientCount !== 1 ? "s" : ""
                      }${recipientCount > 0 ? " (Background Job)" : ""}`}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
      </div>

      {/* Progress Panel */}
      <div className="lg:col-span-1">
        {/* Show job progress for large batches, regular progress for small batches */}
        {activeJob ? (
          <BulkJobProgress
            activeJob={activeJob}
            onCancel={cancelJob}
            onClose={clearActiveJob}
          />
        ) : (
          <BroadcastProgress
            isBroadcasting={isSending}
            progress={{
              current: result?.successCount || 0,
              total: result?.total || 0,
            }}
            results={result?.details || []}
            error={error || jobError}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
};

export default BroadcastForm;
