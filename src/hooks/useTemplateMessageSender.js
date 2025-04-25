// src/hooks/useTemplateMessageSender.js
import { useState, useEffect } from "react";
import {
  formatMessageContent,
  validateTemplateParams,
} from "@/lib/templateParameterUtils";

export function useTemplateMessageSender(templates, selectedTemplateId) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [manualRecipients, setManualRecipients] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);

  // Update selected template when ID changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(
        (t) => t.id === parseInt(selectedTemplateId, 10)
      );
      setSelectedTemplate(template || null);
      setParamValues({});
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  // Handle template selection
  const handleTemplateChange = (e) => {
    return e.target.value ? parseInt(e.target.value, 10) : null;
  };

  // Handle parameter value change - only for static parameters
  const handleParamChange = (paramId, value) => {
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
    let cleaned = phoneNumber.toString().replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = `62${cleaned.substring(1)}`;
    }
    if (!cleaned.includes("@c.us")) {
      cleaned = `${cleaned}@c.us`;
    }
    return cleaned;
  };

  // Get all recipients
  const getAllRecipients = () => {
    const contactPhones = selectedContacts.map((contact) =>
      formatPhoneNumber(contact.phone)
    );
    const manualPhones = parseManualRecipients();
    return [...new Set([...contactPhones, ...manualPhones])];
  };

  // Validate form
  const validateForm = (sessionName) => {
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

  // Get preview for the first selected contact or generic preview
  const getPreviewHTML = () => {
    if (!selectedTemplate) return "";

    if (selectedContacts.length > 0) {
      const previewMessage = getFinalMessageForContact(selectedContacts[0]);
      return formatMessageContent(previewMessage);
    }

    let content = selectedTemplate.content;
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return formatMessageContent(content);
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode((prev) => !prev);
  };

  // Handle contacts selected
  const handleContactsSelected = (contacts) => {
    setSelectedContacts(contacts);
  };

  return {
    selectedTemplate,
    paramValues,
    selectedContacts,
    manualRecipients,
    previewMode,
    error,
    setSelectedTemplate,
    setParamValues,
    setSelectedContacts,
    setManualRecipients,
    setPreviewMode,
    setError,
    handleTemplateChange,
    handleParamChange,
    getFinalMessageForContact,
    parseManualRecipients,
    getAllRecipients,
    validateForm,
    getPreviewHTML,
    togglePreview,
    handleContactsSelected,
  };
}
