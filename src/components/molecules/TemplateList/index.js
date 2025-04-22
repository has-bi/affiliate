"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import TemplateListItem from "../TemplateListItem";

const TemplateList = ({
  templates = [],
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="mb-2">No templates found.</p>
        <p className="text-sm">Create a new template to get started.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {templates.map((template) => (
        <TemplateListItem
          key={template.id}
          template={template}
          isSelected={selectedId === template.id}
          onSelect={() => onSelect(template.id)}
          onEdit={() => onEdit(template.id)}
          onDelete={() => onDelete(template.id)}
          onDuplicate={() => onDuplicate(template.id)}
        />
      ))}
    </ul>
  );
};

export default TemplateList;
