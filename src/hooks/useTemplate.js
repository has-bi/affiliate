// src/hooks/useTemplate.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { formatMessageContent } from "@/lib/templateUtils";

export function useTemplate(initialTemplates = []) {
  // Use a ref to track if we've initialized from props
  const initializedRef = useRef(false);

  // Core state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from props only once
  useEffect(() => {
    if (!initializedRef.current && initialTemplates.length > 0) {
      setTemplates(initialTemplates);
      initializedRef.current = true;
    }
  }, [initialTemplates]);

  // Computed properties
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from templates
  const categories = [
    "all",
    ...new Set(templates.map((t) => t.category).filter(Boolean)),
  ];

  // Load templates (fetch from API)
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For API implementation:
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        throw new Error("Failed to fetch templates");
      }
    } catch (err) {
      setError("Failed to load templates");
      console.error("Error loading templates:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a template
  const selectTemplate = useCallback((templateId) => {
    setSelectedTemplateId(templateId);
  }, []);

  // Create a new template
  const createTemplate = useCallback((templateData = null) => {
    const newTemplate = templateData || {
      id: `template-${Date.now()}`,
      name: "",
      content: "",
      triggerType: "manual",
      triggerValue: "",
      category: "",
      targetGroup: "",
    };

    if (!templateData) {
      setTemplates((prev) => [...prev, newTemplate]);
      setSelectedTemplateId(newTemplate.id);
    } else {
      const withId = { ...newTemplate, id: `template-${Date.now()}` };
      setTemplates((prev) => [...prev, withId]);
      setSelectedTemplateId(withId.id);
    }

    return true;
  }, []);

  // Update a template
  const updateTemplate = useCallback((updatedTemplate) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
    return true;
  }, []);

  // Delete a template
  const deleteTemplate = useCallback(
    (templateId) => {
      if (window.confirm("Are you sure you want to delete this template?")) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));

        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(null);
        }

        toast.success("Template deleted");
        return true;
      }
      return false;
    },
    [selectedTemplateId]
  );

  // Duplicate a template
  const duplicateTemplate = useCallback(
    (templateId) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return false;

      const newTemplate = {
        ...template,
        id: `template-${Date.now()}`,
        name: `${template.name} (Copy)`,
      };

      setTemplates((prev) => [...prev, newTemplate]);
      toast.success("Template duplicated");
      return true;
    },
    [templates]
  );

  // Export templates
  const exportTemplates = useCallback(() => {
    const dataStr = JSON.stringify({ templates }, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "message-templates.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Templates exported successfully");
  }, [templates]);

  // Import templates
  const importTemplates = useCallback((file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (json.templates && Array.isArray(json.templates)) {
          setTemplates((prev) => [...prev, ...json.templates]);
          toast.success(`${json.templates.length} templates imported`);
        } else {
          toast.error("Invalid template format");
        }
      } catch (error) {
        toast.error("Error parsing JSON file");
        console.error("Error parsing JSON:", error);
      }
    };

    reader.readAsText(file);
  }, []);

  return {
    // State
    templates,
    isLoading,
    error,
    selectedTemplateId,
    selectedTemplate,
    searchTerm,
    filterCategory,
    filteredTemplates,
    categories,

    // Actions
    setSearchTerm,
    setFilterCategory,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates,
    importTemplates,
    loadTemplates,
  };
}
