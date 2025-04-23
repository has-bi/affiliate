"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Custom hook untuk mengakses dan memanipulasi template dari database
 * Fungsi ini terpisah dari useTemplate hook yang fokus pada UI state management
 */
export function useTemplateDatabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch semua template dari database
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
   * Fetch template berdasarkan ID
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

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching template ${id}:`, err);
      setError(err.message || `Failed to fetch template ${id}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Membuat template baru
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

      const data = await response.json();
      toast.success("Template berhasil dibuat");
      return data;
    } catch (err) {
      console.error("Error creating template:", err);
      setError(err.message || "Failed to create template");
      toast.error(err.message || "Failed to create template");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update template yang sudah ada
   */
  const updateTemplate = useCallback(async (id, templateData) => {
    if (!id) return null;

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

      const data = await response.json();
      toast.success("Template berhasil diupdate");
      return data;
    } catch (err) {
      console.error(`Error updating template ${id}:`, err);
      setError(err.message || `Failed to update template ${id}`);
      toast.error(err.message || "Failed to update template");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Menghapus template
   */
  const deleteTemplate = useCallback(async (id) => {
    if (!id) return false;

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

      toast.success("Template berhasil dihapus");
      return true;
    } catch (err) {
      console.error(`Error deleting template ${id}:`, err);
      setError(err.message || `Failed to delete template ${id}`);
      toast.error(err.message || "Failed to delete template");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Mengimpor template dari file JSON
   */
  const importTemplatesFromJSON = useCallback(
    async (templateData) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!Array.isArray(templateData)) {
          throw new Error("Invalid template data format");
        }

        const results = {
          success: 0,
          failed: 0,
          errors: [],
        };

        // Proses satu per satu template
        for (const template of templateData) {
          try {
            // Format data untuk sesuai dengan schema Prisma
            const formattedData = {
              name: template.name,
              description: template.description || "",
              content: template.content,
              category: template.category || "general",
              parameters: template.parameters || [],
            };

            await createTemplate(formattedData);
            results.success++;
          } catch (err) {
            results.failed++;
            results.errors.push(
              `Failed to import template "${template.name}": ${err.message}`
            );
          }
        }

        if (results.success > 0) {
          toast.success(`Berhasil mengimpor ${results.success} template`);
        }

        if (results.failed > 0) {
          toast.error(`Gagal mengimpor ${results.failed} template`);
        }

        return results;
      } catch (err) {
        console.error("Error importing templates:", err);
        setError(err.message || "Failed to import templates");
        toast.error(err.message || "Failed to import templates");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [createTemplate]
  );

  return {
    isLoading,
    error,
    fetchTemplates,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    importTemplatesFromJSON,
  };
}
