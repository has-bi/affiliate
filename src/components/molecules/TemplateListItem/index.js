// src/components/molecules/TemplateListItem/index.js
"use client";

import React from "react";
import { Edit, Copy, Trash, MessageSquare } from "lucide-react";
import Badge from "@/components/atoms/Badge";

/**
 * TemplateListItem - Displays a single template in the template list
 */
const TemplateListItem = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onClone,
  onDelete,
}) => {
  return (
    <li
      className={`cursor-pointer hover:bg-gray-50 transition ${
        isSelected ? "bg-green-50" : ""
      }`}
      onClick={() => onSelect(template.id)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900">{template.name}</h3>
          <Badge
            variant="success"
            size="sm"
            className="bg-green-100 text-green-800"
          >
            {template.category || "uncategorized"}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {template.content.substring(0, 100)}
          {template.content.length > 100 ? "..." : ""}
        </p>
        <div className="flex items-center mt-2 text-xs text-gray-500">
          <MessageSquare className="h-3 w-3 mr-1" />
          <span>
            {template.parameters?.length || 0}{" "}
            {template.parameters?.length === 1 ? "parameter" : "parameters"}
          </span>
        </div>
      </div>
      <div className="px-4 pb-3 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template.id);
          }}
          className="text-xs text-blue-600 flex items-center"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClone(template.id);
          }}
          className="text-xs text-green-600 flex items-center"
        >
          <Copy className="h-3 w-3 mr-1" />
          Clone
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(template.id);
          }}
          className="text-xs text-red-600 flex items-center"
        >
          <Trash className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    </li>
  );
};

export default TemplateListItem;
