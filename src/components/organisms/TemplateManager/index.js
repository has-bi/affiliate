"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TemplateList from "@/components/molecules/TemplateList";
import TemplateDetail from "@/components/molecules/TemplateDetail";
import { formatMessageContent } from "@/lib/templateUtils";
import toast from "react-hot-toast"; // Import toast if available, or remove if not

/**
 * TemplateManager - Main organism for managing templates, combining list and detail views
 */
const TemplateManager = ({ initialTemplates, initialSelectedId }) => {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates || []);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [isLoading, setIsLoading] = useState(false);

  // Get the selected template
  const selectedTemplate = templates.find((t) => t.id === selectedId);

  // Format the content of the selected template
  const formattedContent = selectedTemplate
    ? formatMessageContent(selectedTemplate.content)
    : "";

  // Fetch all templates from API
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast?.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a template
  const handleSelectTemplate = (id) => {
    setSelectedId(id);
    // Update URL without full page refresh
    router.push(`/templates?id=${id}`, { scroll: false });
  };

  // Handle creating a new template
  const handleCreateTemplate = () => {
    router.push("/templates/new");
  };

  // Handle editing a template
  const handleEditTemplate = (id) => {
    router.push(`/templates/edit/${id}`);
  };

  // Handle cloning a template
  const handleCloneTemplate = async (id) => {
    try {
      // First get the template to duplicate
      const response = await fetch(`/api/templates/${id}`);
      if (!response.ok) throw new Error("Failed to fetch template");

      const template = await response.json();

      // Create a new template based on the existing one
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        content: template.content,
        category: template.category,
        parameters: template.parameters.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type || "text",
          placeholder: p.placeholder || "",
          required: p.required,
        })),
      };

      const createResponse = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (!createResponse.ok) throw new Error("Failed to clone template");

      const newTemplate = await createResponse.json();

      // Refresh templates list and select the new template
      await fetchTemplates();
      handleSelectTemplate(newTemplate.id);

      toast?.success("Template cloned successfully");
    } catch (error) {
      console.error("Error cloning template:", error);
      toast?.error("Failed to clone template");
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      // Refresh templates
      await fetchTemplates();

      // If the deleted template was selected, clear selection
      if (selectedId === id) {
        setSelectedId(null);
        router.push("/templates", { scroll: false });
      }

      toast?.success("Template deleted successfully");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast?.error("Failed to delete template");
    }
  };

  // Handle using a template
  const handleUseTemplate = (id) => {
    router.push(`/templates/use/${id}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <TemplateList
          templates={templates}
          selectedId={selectedId}
          onSelectTemplate={handleSelectTemplate}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onCloneTemplate={handleCloneTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      </div>

      <div className="lg:col-span-2">
        <TemplateDetail
          template={selectedTemplate}
          formattedContent={formattedContent}
          onEdit={handleEditTemplate}
          onUse={handleUseTemplate}
        />
      </div>
    </div>
  );
};

export default TemplateManager;
