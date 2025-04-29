// src/hooks/useTemplateMessageSender.js
import { useState, useEffect } from "react";
import {
  formatMessageContent,
  validateTemplateParams,
  fillTemplateContent,
  fillDynamicParameters,
  getFinalMessageForContact,
} from "@/lib/templates/templateUtils";

export function useTemplateMessageSender(templates, selectedTemplateId) {
  console.log("🔧 useTemplateMessageSender: Hook called with:", {
    templates: templates?.length || 0,
    selectedTemplateId,
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [manualRecipients, setManualRecipients] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);

  // Update selected template when ID changes
  useEffect(() => {
    console.log("🔄 Template ID changed:", selectedTemplateId);
    if (selectedTemplateId) {
      const template = templates.find(
        (t) => t.id === parseInt(selectedTemplateId, 10)
      );
      console.log("📝 Found template:", template ? "yes" : "no");
      setSelectedTemplate(template || null);
      setParamValues({});
    } else {
      setSelectedTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  // Handle template selection
  const handleTemplateChange = (e) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null;
    console.log("🔀 Handle template change, value:", value);
    return value;
  };

  // Handle parameter value change - only for static parameters
  const handleParamChange = (paramId, value) => {
    console.log(`📝 Parameter change: ${paramId} = ${value}`);
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
  const getFinalMessageForContactLocal = (contact) => {
    console.log("💬 Getting final message for contact:", contact);
    if (!selectedTemplate || !selectedTemplate.content) {
      console.log("❌ No template or content available");
      return "";
    }

    try {
      const message = getFinalMessageForContact(
        selectedTemplate.content,
        contact,
        paramValues
      );
      console.log("✅ Final message generated");
      return message;
    } catch (error) {
      console.error("❌ Error generating final message:", error);
      return "";
    }
  };

  // Parse manual recipients
  const parseManualRecipients = () => {
    console.log("📋 Parsing manual recipients");
    if (!manualRecipients.trim()) {
      console.log("📭 No manual recipients to parse");
      return [];
    }

    const parsed = manualRecipients
      .split(/[\n,]/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0)
      .map(formatPhoneNumber);

    console.log("✅ Parsed recipients:", parsed);
    return parsed;
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
    console.log("📋 Getting all recipients");
    try {
      const contactPhones = selectedContacts.map((contact) =>
        formatPhoneNumber(contact.phone)
      );
      const manualPhones = parseManualRecipients();
      const allRecipients = [...new Set([...contactPhones, ...manualPhones])];
      console.log("✅ All recipients:", allRecipients);
      return allRecipients;
    } catch (error) {
      console.error("❌ Error getting all recipients:", error);
      return [];
    }
  };

  // Validate form
  const validateForm = (sessionName) => {
    console.log("🔍 Validating form");
    setError(null);

    // Validate template selection
    if (!selectedTemplate) {
      const errorMsg = "Silakan pilih template terlebih dahulu";
      console.log("❌ Validation failed:", errorMsg);
      setError(errorMsg);
      return false;
    }

    // Validate session
    if (!sessionName) {
      const errorMsg = "Silakan pilih session WhatsApp";
      console.log("❌ Validation failed:", errorMsg);
      setError(errorMsg);
      return false;
    }

    // Validate recipients
    const allRecipients = getAllRecipients();
    if (allRecipients.length === 0) {
      const errorMsg = "Pilih setidaknya satu penerima";
      console.log("❌ Validation failed:", errorMsg);
      setError(errorMsg);
      return false;
    }

    // Validate parameters
    if (selectedTemplate.parameters && selectedTemplate.parameters.length > 0) {
      const { isValid, errors } = validateTemplateParams(
        selectedTemplate.parameters,
        paramValues
      );

      if (!isValid) {
        const errorMsg = `Parameter error: ${errors.join(", ")}`;
        console.log("❌ Validation failed:", errorMsg);
        setError(errorMsg);
        return false;
      }
    }

    console.log("✅ Form validation passed");
    return true;
  };

  // Get preview for the first selected contact or generic preview
  const getPreviewHTML = () => {
    console.log("🖼️ Getting preview HTML");
    try {
      if (!selectedTemplate || !selectedTemplate.content) {
        console.log("❌ No template or content for preview");
        return "";
      }

      if (selectedContacts.length > 0) {
        const previewMessage = getFinalMessageForContactLocal(
          selectedContacts[0]
        );
        const html = formatMessageContent(previewMessage);
        console.log("✅ Preview HTML generated with contact");
        return html;
      }

      const tempContent = fillTemplateContent(
        selectedTemplate.content,
        paramValues
      );
      const html = formatMessageContent(tempContent);
      console.log("✅ Preview HTML generated without contact");
      return html;
    } catch (error) {
      console.error("❌ Error generating preview HTML:", error);
      return "";
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    console.log("🔄 Toggling preview mode");
    setPreviewMode((prev) => !prev);
  };

  // Handle contacts selected
  const handleContactsSelected = (contacts) => {
    console.log("👥 Contacts selected:", contacts.length);
    setSelectedContacts(contacts);
  };

  // Log current state for debugging
  useEffect(() => {
    console.log("📊 Hook state:", {
      selectedTemplate: selectedTemplate ? "exists" : "null",
      paramValues,
      selectedContacts: selectedContacts.length,
      manualRecipients,
      previewMode,
      error,
    });
  }, [
    selectedTemplate,
    paramValues,
    selectedContacts,
    manualRecipients,
    previewMode,
    error,
  ]);

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
    getFinalMessageForContact: getFinalMessageForContactLocal,
    parseManualRecipients,
    getAllRecipients,
    validateForm,
    getPreviewHTML,
    togglePreview,
    handleContactsSelected,
  };
}
