"use client";

import React from "react";
import { Edit, Copy, Trash, Send, Eye } from "lucide-react";
import { formatMessageContent } from "@/lib/templateUtils";

const TRIGGER_TYPES = [
  { id: "date", name: "Specific Date" },
  { id: "recurring", name: "Recurring Monthly" },
  { id: "event", name: "On Event" },
  { id: "manual", name: "Manual Trigger" },
];

const TemplatePreview = ({ template, onEdit, onDelete, onDuplicate }) => {
  if (!template) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select a template to view or edit</p>
          <p className="mt-2">
            <button className="text-green-600 underline hover:text-green-700">
              Or create a new template
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Format content for preview
  const formattedContent = formatMessageContent(template.content);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {template.name}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(template.id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="Edit Template"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDuplicate(template.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full"
              title="Duplicate Template"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(template.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              title="Delete Template"
            >
              <Trash className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 p-3 rounded-md">
            <span className="font-medium text-gray-700">Trigger Type:</span>{" "}
            <span className="text-gray-600">
              {TRIGGER_TYPES.find((t) => t.id === template.triggerType)?.name ||
                "Manual"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <span className="font-medium text-gray-700">Trigger Value:</span>{" "}
            <span className="text-gray-600">
              {template.triggerType === "recurring"
                ? `Day ${template.triggerValue} of each month`
                : template.triggerValue || "N/A"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <span className="font-medium text-gray-700">Category:</span>{" "}
            <span className="text-gray-600">
              {template.category || "Uncategorized"}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <span className="font-medium text-gray-700">Target Group:</span>{" "}
            <span className="text-gray-600">
              {template.targetGroup || "All Users"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Message Preview
          </h4>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: formattedContent,
              }}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-between">
          <div className="text-sm text-gray-500">
            Last sent: {template.lastSent || "Never"}
          </div>

          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
            <Send className="h-4 w-4 mr-2" />
            Test Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
