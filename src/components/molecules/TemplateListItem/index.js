"use client";

import React from "react";
import { Edit, Copy, Trash, Calendar, Clock, Tag, Send } from "lucide-react";

const TRIGGER_TYPES = [
  { id: "date", name: "Specific Date", icon: <Calendar className="h-4 w-4" /> },
  {
    id: "recurring",
    name: "Recurring Monthly",
    icon: <Clock className="h-4 w-4" />,
  },
  { id: "event", name: "On Event", icon: <Tag className="h-4 w-4" /> },
  { id: "manual", name: "Manual Trigger", icon: <Send className="h-4 w-4" /> },
];

const TemplateListItem = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  return (
    <li
      className={`cursor-pointer hover:bg-gray-50 transition ${
        isSelected ? "bg-green-50" : ""
      }`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900">{template.name}</h3>
          <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">
            {template.category || "uncategorized"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {template.content.substring(0, 100)}
          {template.content.length > 100 ? "..." : ""}
        </p>
        <div className="flex items-center mt-2 text-xs text-gray-500">
          {TRIGGER_TYPES.find((t) => t.id === template.triggerType)?.icon}
          <span className="ml-1">
            {template.triggerType === "recurring"
              ? `Monthly on day ${template.triggerValue}`
              : template.triggerType === "event"
              ? `On ${template.triggerValue}`
              : "Manual trigger"}
          </span>
        </div>
      </div>
      <div className="px-4 pb-3 flex space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-xs text-blue-600 flex items-center"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="text-xs text-green-600 flex items-center"
        >
          <Copy className="h-3 w-3 mr-1" />
          Duplicate
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
