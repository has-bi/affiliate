// src/hooks/useMessageWizard.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMessageContent } from "@/lib/templates/templateUtils";
import { formatPhoneNumber } from "@/lib/utils";

/**
 * Hook for managing the message broadcast wizard workflow
 * Handles templates, parameters, recipients, and scheduling
 */
export function useMessageWizard(templates = [], initialTemplateId = null) {
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(initialTemplateId);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});

  // Recipients state
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [manualRecipients, setManualRecipients] = useState("");

  // UI state
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState("");

  // Schedule state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState({
    type: "once",
    date: "",
    time: "09:00",
    cronExpression: "0 9 * * 1",
    startDate: "",
    endDate: "",
  });

  // Update selected template when ID or templates change
  useEffect(() => {
    if (selectedTemplateId && templates && templates.length > 0) {
      const template = templates.find(
        (t) => parseInt(t.id, 10) === parseInt(selectedTemplateId, 10)
      );

      if (template) {
        console.log("📋 Template found:", template.name);
        setSelectedTemplate(template);

        // Initialize parameter values
        const defaultParams = {};
        if (template.parameters && Array.isArray(template.parameters)) {
          template.parameters.forEach((param) => {
            defaultParams[param.id] = paramValues[param.id] || "";
          });
          setParamValues(defaultParams);
        }
      } else {
        console.log("⚠️ Template not found for ID:", selectedTemplateId);
        setSelectedTemplate(null);
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  // Handle template selection
  const handleTemplateChange = (e) => {
    const id = e.target.value ? parseInt(e.target.value, 10) : null;
    setSelectedTemplateId(id);
    return id;
  };

  // Handle parameter updates
  const handleParamChange = (paramId, value) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  };

  // Handle schedule config changes
  const handleScheduleConfigChange = (e) => {
    const { name, value } = e.target;
    setScheduleConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Parse manual recipients
  const parseManualRecipients = useCallback(() => {
    if (!manualRecipients.trim()) return [];

    return manualRecipients
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map(formatPhoneNumber);
  }, [manualRecipients]);

  // Get all recipients (selected contacts + manual)
  const getAllRecipients = useCallback(() => {
    // Get phone numbers from contacts
    const contactPhones = selectedContacts.map((c) =>
      formatPhoneNumber(c.phone)
    );

    // Get manual recipients
    const manualPhones = parseManualRecipients();

    // Combine and deduplicate
    const allPhones = [...contactPhones, ...manualPhones];
    const uniquePhones = [...new Set(allPhones)];

    return uniquePhones.filter(Boolean);
  }, [selectedContacts, parseManualRecipients]);

  // Get HTML preview of template with parameters
  const getPreviewHTML = useCallback(() => {
    if (!selectedTemplate) return "";

    let content = selectedTemplate.content;

    // Replace parameter placeholders with values
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return formatMessageContent(content);
  }, [selectedTemplate, paramValues]);

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode((prev) => !prev);
  };

  // Handle contacts selection from contact picker
  const handleContactsSelected = (contacts) => {
    setSelectedContacts((prev) => {
      // Combine with previous contacts and remove duplicates by phone
      const phoneMap = new Map();
      [...prev, ...contacts].forEach((contact) => {
        if (contact && contact.phone) {
          phoneMap.set(formatPhoneNumber(contact.phone), contact);
        }
      });
      return Array.from(phoneMap.values());
    });
  };

  // Validate form before submission
  const validateForm = (sessionName) => {
    // Check for template
    if (!selectedTemplate) {
      setError("Pilih template pesan terlebih dahulu");
      return false;
    }

    // Check for session
    if (!sessionName) {
      setError("Pilih sesi WhatsApp terlebih dahulu");
      return false;
    }

    // Check recipients
    const recipients = getAllRecipients();
    if (recipients.length === 0) {
      setError("Tambahkan minimal satu penerima pesan");
      return false;
    }

    // Validate required parameters
    if (selectedTemplate.parameters && selectedTemplate.parameters.length > 0) {
      const missingParams = [];

      selectedTemplate.parameters.forEach((param) => {
        // Skip dynamic parameters that will be filled automatically
        if (param.isDynamic) return;

        // Check if required parameter is missing
        if (
          param.required &&
          (!paramValues[param.id] || !paramValues[param.id].trim())
        ) {
          missingParams.push(param.name);
        }
      });

      if (missingParams.length > 0) {
        setError(`Parameter berikut harus diisi: ${missingParams.join(", ")}`);
        return false;
      }
    }

    // Validate schedule if scheduling
    if (isScheduling) {
      if (scheduleConfig.type === "once") {
        if (!scheduleConfig.date) {
          setError("Pilih tanggal untuk jadwal pengiriman");
          return false;
        }

        // Check if date is in the past
        const scheduledDate = new Date(
          `${scheduleConfig.date}T${scheduleConfig.time}:00`
        );
        if (scheduledDate <= new Date()) {
          setError("Tanggal dan waktu harus di masa depan");
          return false;
        }
      } else if (scheduleConfig.type === "recurring") {
        if (!scheduleConfig.cronExpression) {
          setError("Silahkan pilih jadwal berulang");
          return false;
        }

        if (!scheduleConfig.startDate) {
          setError("Tentukan tanggal mulai untuk jadwal berulang");
          return false;
        }
      }
    }

    // All validations passed
    setError("");
    return true;
  };

  // Get message with parameters filled for a contact
  const getFinalMessageForContact = useCallback(
    (contact) => {
      if (!selectedTemplate || !selectedTemplate.content) return "";

      let finalContent = selectedTemplate.content;

      // First fill dynamic parameters from contact
      if (contact) {
        // Handle name parameter
        if (contact.name && finalContent.includes("{name}")) {
          finalContent = finalContent.replace(/\{name\}/g, contact.name);
        }

        // Add other contact field replacements as needed
      }

      // Then fill static parameters
      Object.entries(paramValues).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        finalContent = finalContent.replace(regex, value || `{${key}}`);
      });

      return formatMessageContent(finalContent);
    },
    [selectedTemplate, paramValues]
  );

  return {
    // Template state
    selectedTemplate,
    selectedTemplateId,
    paramValues,

    // Recipient state
    selectedContacts,
    manualRecipients,

    // UI state
    previewMode,
    error,

    // Schedule state
    isScheduling,
    scheduleConfig,

    // Setters
    setSelectedContacts,
    setManualRecipients,
    setError,
    setIsScheduling,

    // Handlers
    handleTemplateChange,
    handleParamChange,
    handleScheduleConfigChange,
    parseManualRecipients,
    getAllRecipients,
    validateForm,
    getPreviewHTML,
    togglePreview,
    handleContactsSelected,
    getFinalMessageForContact,
  };
}
