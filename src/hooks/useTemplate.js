// src/hooks/useTemplate.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMessageContent } from "@/lib/templates/templateUtils";

/**
 * Hook for template management
 * Handles template CRUD operations and parameter handling
 */
export function useTemplate(initialTemplates = []) {
  // Template state
  const [templates, setTemplates] = useState(initialTemplates || []);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState("");

  // Derived state
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

  // Update preview when template or parameters change
  useEffect(() => {
    if (selectedTemplate) {
      let content = selectedTemplate.content;

      // Replace parameter placeholders with values
      Object.entries(paramValues).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        content = content.replace(regex, value || `{${key}}`);
      });

      setPreview(formatMessageContent(content));
    } else {
      setPreview("");
    }
  }, [selectedTemplate, paramValues]);

  /**
   * Load templates from API
   */
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates");

      if (!response.ok) {
        throw new Error(`Error fetching templates: ${response.status}`);
      }

      const data = await response.json();
      setTemplates(data);
      return data;
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(err.message || "Failed to fetch templates");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get template by ID
   */
  const fetchTemplateById = useCallback(async (id) => {
    if (!id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${id}`);

      if (!response.ok) {
        throw new Error(`Error fetching template: ${response.status}`);
      }

      const template = await response.json();

      // Add/update template in state
      setTemplates((prev) => {
        const exists = prev.some((t) => t.id === template.id);
        if (exists) {
          return prev.map((t) => (t.id === template.id ? template : t));
        } else {
          return [...prev, template];
        }
      });

      return template;
    } catch (err) {
      console.error(`Error fetching template ${id}:`, err);
      setError(err.message || `Failed to fetch template ${id}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select a template and load its parameters
   */
  const selectTemplate = useCallback(
    async (id) => {
      setSelectedTemplateId(id);
      setParamValues({}); // Reset parameter values

      if (id && !templates.find((t) => t.id === id)) {
        // If template is not in state, fetch it
        await fetchTemplateById(id);
      }
    },
    [templates, fetchTemplateById]
  );

  /**
   * Update parameter value
   */
  const updateParamValue = useCallback((paramId, value) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  }, []);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(async (templateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error creating template: ${response.status}`
        );
      }

      const newTemplate = await response.json();

      // Add to templates list
      setTemplates((prev) => [...prev, newTemplate]);

      return newTemplate;
    } catch (err) {
      console.error("Error creating template:", err);
      setError(err.message || "Failed to create template");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(async (id, templateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error updating template: ${response.status}`
        );
      }

      const updatedTemplate = await response.json();

      // Update in templates list
      setTemplates((prev) =>
        prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
      );

      return updatedTemplate;
    } catch (err) {
      console.error(`Error updating template ${id}:`, err);
      setError(err.message || `Failed to update template ${id}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(
    async (id) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/templates/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Error deleting template: ${response.status}`
          );
        }

        // Remove from templates list
        setTemplates((prev) => prev.filter((t) => t.id !== id));

        // Clear selection if this was the selected template
        if (selectedTemplateId === id) {
          setSelectedTemplateId(null);
        }

        return true;
      } catch (err) {
        console.error(`Error deleting template ${id}:`, err);
        setError(err.message || `Failed to delete template ${id}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTemplateId]
  );

  /**
   * Duplicate a template
   */
  const duplicateTemplate = useCallback(
    async (id) => {
      const template = templates.find((t) => t.id === id);
      if (!template) return null;

      const duplicateData = {
        ...template,
        name: `${template.name} (Copy)`,
        // Remove fields that shouldn't be duplicated
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      return await createTemplate(duplicateData);
    },
    [templates, createTemplate]
  );

  /**
   * Export templates to JSON file
   */
  const exportTemplates = useCallback(() => {
    // Create JSON data
    const data = { templates };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "message-templates.json";

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }, [templates]);

  /**
   * Import templates from JSON file
   */
  const importTemplates = useCallback(
    async (file) => {
      if (!file) return;

      try {
        // Read file content
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.templates || !Array.isArray(data.templates)) {
          throw new Error("Invalid template file format");
        }

        // Import each template
        const results = {
          success: 0,
          failed: 0,
        };

        for (const template of data.templates) {
          try {
            // Remove id and metadata from imported template
            const { id, createdAt, updatedAt, ...templateData } = template;

            // Create template
            const newTemplate = await createTemplate(templateData);

            if (newTemplate) {
              results.success++;
            } else {
              results.failed++;
            }
          } catch (error) {
            console.error(
              `Error importing template "${template.name}":`,
              error
            );
            results.failed++;
          }
        }

        return results;
      } catch (error) {
        console.error("Error importing templates:", error);
        setError("Failed to import templates: " + error.message);
        return { success: 0, failed: 0 };
      }
    },
    [createTemplate]
  );

  // Initialize by fetching templates
  useEffect(() => {
    // Only fetch if no initial templates provided
    if (initialTemplates.length === 0) {
      fetchTemplates();
    }
  }, [fetchTemplates, initialTemplates.length]);

  return {
    // State
    templates,
    selectedTemplateId,
    selectedTemplate,
    paramValues,
    searchTerm,
    filterCategory,
    filteredTemplates,
    categories,
    isLoading,
    error,
    preview,

    // Actions
    fetchTemplates,
    selectTemplate,
    updateParamValue,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates,
    importTemplates,
    setSearchTerm,
    setFilterCategory,

    // Helper
    formatMessageContent,
  };
}
