// src/components/organisms/TemplateManager/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Copy,
  Trash,
  Tag,
  MessageSquare,
} from "lucide-react";
import { useTemplate } from "@/hooks/useTemplate";
import { formatMessageContent } from "@/lib/templates/templateUtils";

const TemplateManager = ({ initialTemplates = [], selectedId = null }) => {
  const router = useRouter();
  const {
    templates,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filteredTemplates,
    categories,
    selectedTemplateId,
    selectedTemplate,
    isLoading,
    error,
    selectTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useTemplate(initialTemplates);

  // Set initial selected ID
  useEffect(() => {
    if (selectedId && !selectedTemplateId) {
      selectTemplate(selectedId);
    }
  }, [selectedId, selectedTemplateId, selectTemplate]);

  // Navigation handlers
  const handleCreateNew = () => {
    router.push("/messages/templates/new");
  };

  const handleEditTemplate = (id) => {
    router.push(`/messages/templates/edit/${id}`);
  };

  const handleViewDetails = (id) => {
    router.push(`/messages/templates/detail/${id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle template deletion with confirmation
  const handleDeleteTemplate = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    if (window.confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
    }
  };

  // Handle template duplication
  const handleDuplicateTemplate = async (e, id) => {
    e.stopPropagation();
    e.preventDefault();

    const newTemplate = await duplicateTemplate(id);
    if (newTemplate) {
      router.push(`/messages/templates/edit/${newTemplate.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and filter bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all"
                  ? "All Categories"
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          {/* Create button */}
          <Button
            onClick={handleCreateNew}
            variant="primary"
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </Card>

      {/* Templates list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="p-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterCategory !== "all"
              ? "Try adjusting your search filters"
              : "Create your first template to get started"}
          </p>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer hover:shadow-md transition ${
                template.id === selectedTemplateId ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => handleViewDetails(template.id)}
            >
              <div className="p-4">
                {/* Template header */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-1">
                    {template.name}
                  </h3>
                  <Badge
                    variant={
                      template.category === "marketing"
                        ? "primary"
                        : "secondary"
                    }
                  >
                    {template.category || "general"}
                  </Badge>
                </div>

                {/* Template content preview */}
                <div className="h-24 overflow-hidden text-sm text-gray-600 mb-3">
                  <div
                    className="prose prose-sm"
                    dangerouslySetInnerHTML={{
                      __html: formatMessageContent(
                        template.content.substring(0, 150) +
                          (template.content.length > 150 ? "..." : "")
                      ),
                    }}
                  />
                </div>

                {/* Template metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" />
                    <span>{template.parameters?.length || 0} parameters</span>
                  </div>
                  <div>Updated {formatDate(template.updatedAt)}</div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditTemplate(template.id);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDuplicateTemplate(e, template.id)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteTemplate(e, template.id)}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
          <div className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
