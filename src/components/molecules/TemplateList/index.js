// src/components/molecules/TemplateList/index.js
"use client";

import React, { useState } from "react";
import { Search, ChevronDown, MessageSquare, Plus } from "lucide-react";
import TemplateListItem from "@/components/molecules/TemplateListItem";
import Button from "@/components/atoms/Button";

/**
 * TemplateList - Displays a list of templates with filtering and search
 */
const TemplateList = ({
  templates = [],
  selectedId,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplate,
  onCloneTemplate,
  onDeleteTemplate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Extract unique categories from templates
  const categories = [
    "all",
    ...new Set(templates.map((t) => t.category).filter(Boolean)),
  ];

  // Filter templates based on search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 flex justify-between items-center rounded-t-lg">
        <h2 className="text-white text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Message Templates
        </h2>
        <Button
          variant="success"
          size="sm"
          onClick={onCreateTemplate}
          className="bg-white text-green-600 hover:bg-green-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Template
        </Button>
      </div>

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
      <div className="overflow-y-auto max-h-[500px]">
        {filteredTemplates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No templates found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                isSelected={selectedId === template.id}
                onSelect={onSelectTemplate}
                onEdit={onEditTemplate}
                onClone={onCloneTemplate}
                onDelete={onDeleteTemplate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TemplateList;
