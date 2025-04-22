"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TemplateList from "@/components/molecules/TemplateList";
import TemplateForm from "@/components/molecules/TemplateForm";
import TemplatePreview from "@/components/molecules/TemplatePreview";
import { useTemplate } from "@/hooks/useTemplate";
import {
  Plus,
  MessageSquare,
  Download,
  Upload,
  Search,
  ChevronDown,
} from "lucide-react";

const TemplateManager = ({ initialTemplates = [], selectedId = null }) => {
  const router = useRouter();
  const initializedRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    templates,
    isLoading,
    error,
    selectedTemplateId,
    selectedTemplate,
    searchTerm,
    filterCategory,
    filteredTemplates,
    categories,
    setSearchTerm,
    setFilterCategory,
    selectTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    exportTemplates,
    importTemplates,
  } = useTemplate(initialTemplates);

  // Set initial selected ID only once
  useEffect(() => {
    if (!initializedRef.current && selectedId && !selectedTemplateId) {
      selectTemplate(selectedId);
      initializedRef.current = true;
    }
  }, [selectedId, selectedTemplateId, selectTemplate]);

  // Handle creating a new template
  const handleCreateNew = () => {
    createTemplate();
    setIsEditing(true);
  };

  // Handle edit template
  const handleEditTemplate = (templateId) => {
    selectTemplate(templateId);
    setIsEditing(true);
  };

  // Handle save template
  const handleSaveTemplate = (formData) => {
    const success = formData.id
      ? updateTemplate(formData)
      : createTemplate(formData);

    if (success) {
      setIsEditing(false);
      toast.success(formData.id ? "Template updated" : "Template created");
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Handle import file selection
  const handleImportFile = (event) => {
    importTemplates(event.target.files[0]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Message Templates
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateNew}
            className="bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium flex items-center hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </button>
          <button
            onClick={exportTemplates}
            className="bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium flex items-center hover:bg-green-50"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>
          <input
            type="file"
            id="import-templates"
            className="hidden"
            accept=".json"
            onChange={handleImportFile}
          />
          <label
            htmlFor="import-templates"
            className="bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium flex items-center hover:bg-green-50 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[600px]">
        {/* Left Sidebar - Template List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex">
              <div className="relative inline-block w-full">
                <select
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all"
                        ? "All Categories"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto">
            <TemplateList
              templates={filteredTemplates}
              selectedId={selectedTemplateId}
              onSelect={selectTemplate}
              onEdit={handleEditTemplate}
              onDelete={deleteTemplate}
              onDuplicate={duplicateTemplate}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Content - Template Details */}
        <div className="w-2/3 flex flex-col">
          {isEditing ? (
            <TemplateForm
              template={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={handleCancelEdit}
            />
          ) : (
            <TemplatePreview
              template={selectedTemplate}
              onEdit={handleEditTemplate}
              onDelete={deleteTemplate}
              onDuplicate={duplicateTemplate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
