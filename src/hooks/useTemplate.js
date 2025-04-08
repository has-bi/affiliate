// hooks/useTemplate.js
"use client";

import { useState, useCallback } from "react";
import {
  getAllTemplates,
  getTemplateById,
  fillTemplate,
  validateTemplateParams,
  generateTemplatePreview,
  getDefaultParamValues,
} from "../lib/templateUtils";

export function useTemplate() {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [paramValues, setParamValues] = useState({});
  const [preview, setPreview] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  // Load all available templates
  const templates = getAllTemplates();

  // Get the currently selected template
  const selectedTemplate = selectedTemplateId
    ? getTemplateById(selectedTemplateId)
    : null;

  // Select a template and initialize parameter values
  const selectTemplate = useCallback((templateId) => {
    setSelectedTemplateId(templateId);

    // Initialize default parameter values
    const defaultValues = getDefaultParamValues(templateId);
    setParamValues(defaultValues);

    // Generate preview with placeholders
    const newPreview = generateTemplatePreview(templateId);
    setPreview(newPreview || "");

    // Clear validation errors
    setValidationErrors([]);
  }, []);

  // Update a parameter value
  const updateParamValue = useCallback(
    (paramId, value) => {
      setParamValues((prev) => {
        const updated = { ...prev, [paramId]: value };

        // Update preview with new values
        if (selectedTemplateId) {
          const newPreview = generateTemplatePreview(
            selectedTemplateId,
            updated
          );
          setPreview(newPreview || "");
        }

        return updated;
      });
    },
    [selectedTemplateId]
  );

  // Update multiple parameter values at once
  const updateParamValues = useCallback(
    (newValues) => {
      setParamValues((prev) => {
        const updated = { ...prev, ...newValues };

        // Update preview with new values
        if (selectedTemplateId) {
          const newPreview = generateTemplatePreview(
            selectedTemplateId,
            updated
          );
          setPreview(newPreview || "");
        }

        return updated;
      });
    },
    [selectedTemplateId]
  );

  // Validate the current parameter values
  const validateParams = useCallback(() => {
    if (!selectedTemplateId) {
      setValidationErrors(["No template selected"]);
      return false;
    }

    const { isValid, errors } = validateTemplateParams(
      selectedTemplateId,
      paramValues
    );
    setValidationErrors(errors);
    return isValid;
  }, [selectedTemplateId, paramValues]);

  // Get the final message with all parameters filled in
  const getFinalMessage = useCallback(() => {
    if (!selectedTemplateId) {
      return "";
    }

    return fillTemplate(selectedTemplateId, paramValues) || "";
  }, [selectedTemplateId, paramValues]);

  // Reset all state
  const resetTemplate = useCallback(() => {
    setSelectedTemplateId("");
    setParamValues({});
    setPreview("");
    setValidationErrors([]);
  }, []);

  return {
    templates,
    selectedTemplateId,
    selectedTemplate,
    paramValues,
    preview,
    validationErrors,
    selectTemplate,
    updateParamValue,
    updateParamValues,
    validateParams,
    getFinalMessage,
    resetTemplate,
  };
}
