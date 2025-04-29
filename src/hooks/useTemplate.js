"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { formatMessageContent } from "@/lib/templates/templateUtils";
import { useTemplateDatabase } from "./useTemplateDatabase";

export function useTemplate(initialTemplates = []) {
  // Use the database hook
  const {
    isLoading: isDbLoading,
    error: dbError,
    fetchTemplates,
    fetchTemplateById,
    createTemplate: dbCreateTemplate,
    updateTemplate: dbUpdateTemplate,
    deleteTemplate: dbDeleteTemplate,
  } = useTemplateDatabase();

  // Use a ref to track if we've initialized from props
  const initializedRef = useRef(false);

  // Core state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [preview, setPreview] = useState("");

  // Initialize from props only once
  useEffect(() => {
    if (!initializedRef.current && initialTemplates.length > 0) {
      setTemplates(initialTemplates);
      initializedRef.current = true;
    }
  }, [initialTemplates]);

  // Computed properties
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Update preview when template or param values change
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.content) {
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

  // Load templates from database
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      setError("Failed to load templates");
      console.error("Error loading templates:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTemplates]);

  // Select a template
  const selectTemplate = useCallback(
    async (templateId) => {
      setSelectedTemplateId(templateId);

      // Reset parameter values when selecting a new template
      setParamValues({});

      // If we're selecting a template ID that's not in our current list,
      // fetch it from the database
      if (templateId && !templates.find((t) => t.id === templateId)) {
        try {
          const template = await fetchTemplateById(templateId);
          if (template) {
            setTemplates((prev) => {
              // Add template to the list if not already there
              if (!prev.find((t) => t.id === template.id)) {
                return [...prev, template];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error(`Error fetching template ${templateId}:`, err);
        }
      }
    },
    [fetchTemplateById, templates]
  );

  // Update parameter value
  const updateParamValue = useCallback((paramId, value) => {
    setParamValues((prev) => ({
      ...prev,
      [paramId]: value,
    }));
  }, []);

  // Create a new template
  const createTemplate = useCallback(
    async (templateData = null) => {
      if (!templateData) {
        // Create empty template UI only (not in database)
        const newTemplate = {
          id: `temp-${Date.now()}`,
          name: "",
          description: "",
          content: "",
          category: "general",
          parameters: [],
        };

        setTemplates((prev) => [...prev, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
        return true;
      } else {
        // Create template in database
        try {
          const createdTemplate = await dbCreateTemplate(templateData);
          if (createdTemplate) {
            setTemplates((prev) => [...prev, createdTemplate]);
            setSelectedTemplateId(createdTemplate.id);
            return true;
          }
          return false;
        } catch (err) {
          console.error("Error creating template:", err);
          return false;
        }
      }
    },
    [dbCreateTemplate]
  );

  // Update a template
  const updateTemplate = useCallback(
    async (updatedTemplate) => {
      try {
        // For temporary templates not yet saved to DB
        if (updatedTemplate.id.startsWith("temp-")) {
          // Remove the temp ID and save as new
          const { id, ...templateData } = updatedTemplate;
          const result = await dbCreateTemplate(templateData);

          if (result) {
            // Remove temporary template and add the real one
            setTemplates((prev) =>
              prev.filter((t) => t.id !== id).concat(result)
            );
            setSelectedTemplateId(result.id);
            return true;
          }
          return false;
        } else {
          // Update existing template
          const result = await dbUpdateTemplate(
            updatedTemplate.id,
            updatedTemplate
          );

          if (result) {
            setTemplates((prev) =>
              prev.map((t) => (t.id === result.id ? result : t))
            );
            return true;
          }
          return false;
        }
      } catch (err) {
        console.error("Error updating template:", err);
        return false;
      }
    },
    [dbCreateTemplate, dbUpdateTemplate]
  );

  // Delete a template
  const deleteTemplate = useCallback(
    async (templateId) => {
      if (window.confirm("Are you sure you want to delete this template?")) {
        try {
          // For temporary templates not yet saved to DB
          if (templateId.startsWith("temp-")) {
            setTemplates((prev) => prev.filter((t) => t.id !== templateId));
            if (selectedTemplateId === templateId) {
              setSelectedTemplateId(null);
            }
            return true;
          } else {
            // Delete from database
            const success = await dbDeleteTemplate(templateId);

            if (success) {
              setTemplates((prev) => prev.filter((t) => t.id !== templateId));
              if (selectedTemplateId === templateId) {
                setSelectedTemplateId(null);
              }
              return true;
            }
            return false;
          }
        } catch (err) {
          console.error("Error deleting template:", err);
          return false;
        }
      }
      return false;
    },
    [dbDeleteTemplate, selectedTemplateId]
  );

  // Duplicate a template
  const duplicateTemplate = useCallback(
    async (templateId) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return false;

      try {
        // Create copy of the template data
        const { id, createdAt, updatedAt, ...templateData } = template;

        const newTemplateData = {
          ...templateData,
          name: `${template.name} (Copy)`,
        };

        // Save to database
        const result = await dbCreateTemplate(newTemplateData);

        if (result) {
          setTemplates((prev) => [...prev, result]);
          toast.success("Template duplicated");
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error duplicating template:", err);
        return false;
      }
    },
    [templates, dbCreateTemplate]
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
  const importTemplates = useCallback(
    (file) => {
      if (!file) return;

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target.result);

          if (json.templates && Array.isArray(json.templates)) {
            setIsLoading(true);

            const results = {
              success: 0,
              failed: 0,
            };

            // Process templates one by one
            for (const template of json.templates) {
              try {
                // Format data for database
                const { id, ...templateData } = template;
                const result = await dbCreateTemplate(templateData);

                if (result) {
                  results.success++;
                  // Add to local state
                  setTemplates((prev) => [...prev, result]);
                } else {
                  results.failed++;
                }
              } catch (err) {
                results.failed++;
                console.error(
                  `Error importing template ${template.name}:`,
                  err
                );
              }
            }

            setIsLoading(false);

            if (results.success > 0) {
              toast.success(`${results.success} templates imported`);
            }

            if (results.failed > 0) {
              toast.error(`Failed to import ${results.failed} templates`);
            }
          } else {
            toast.error("Invalid template format");
          }
        } catch (error) {
          toast.error("Error parsing JSON file");
          console.error("Error parsing JSON:", error);
        }
      };

      reader.readAsText(file);
    },
    [dbCreateTemplate]
  );

  // Get final message with all parameters filled in
  const getFinalMessage = useCallback(() => {
    if (!selectedTemplate) return "";

    let content = selectedTemplate.content;

    // Replace parameter placeholders with values
    Object.entries(paramValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      content = content.replace(regex, value || `{${key}}`);
    });

    return content;
  }, [selectedTemplate, paramValues]);

  return {
    // State
    templates,
    isLoading: isLoading || isDbLoading,
    error: error || dbError,
    selectedTemplateId,
    selectedTemplate,
    searchTerm,
    filterCategory,
    filteredTemplates,
    categories,
    paramValues,
    preview,

    // Actions
    setSearchTerm,
    setFilterCategory,
    selectTemplate,
    updateParamValue,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates,
    importTemplates,
    loadTemplates,
    getFinalMessage,
  };
}
