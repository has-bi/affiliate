// src/components/molecules/TemplateDetail/index.js
"use client";

import React from "react";
import { Edit, Send, Calendar, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * TemplateDetail - Displays detailed information about a template
 */
const TemplateDetail = ({ template, formattedContent, onEdit, onUse }) => {
  if (!template) {
    return (
      <Card>
        <Card.Content>
          <div className="text-center py-8">
            <h3 className="text-lg text-gray-500 mb-2">
              Select a template to view details
            </h3>
            <p className="text-gray-400 text-sm">
              Or create a new template using the button above
            </p>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Content>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {template.name}
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onEdit(template.id)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Template
          </Button>
        </div>

        {template.description && (
          <p className="text-gray-600 mb-4">{template.description}</p>
        )}

        {/* Template metadata */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <Tag className="h-4 w-4 mr-1" />
              <span>Category</span>
            </div>
            <div className="font-medium">
              {template.category
                ? template.category.charAt(0).toUpperCase() +
                  template.category.slice(1)
                : "Uncategorized"}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created</span>
            </div>
            <div className="font-medium">
              {new Date(template.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-gray-600 text-sm mb-1">
              <Clock className="h-4 w-4 mr-1" />
              <span>Updated</span>
            </div>
            <div className="font-medium">
              {new Date(template.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Template parameters */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">Parameters</h3>
          {template.parameters.length === 0 ? (
            <p className="text-gray-500 text-sm italic">
              No parameters defined
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {template.parameters.map((param) => (
                <div
                  key={param.id}
                  className="border border-gray-200 rounded-md p-3"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-800">
                      {param.name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {param.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Parameter ID:{" "}
                    <code className="bg-gray-100 px-1 rounded">{param.id}</code>
                  </div>
                  {param.placeholder && (
                    <div className="text-xs text-gray-500 mt-1">
                      Placeholder: {param.placeholder}
                    </div>
                  )}
                  {param.required && (
                    <div className="text-xs text-red-500 mt-1">Required</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template preview */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-700 mb-3">
            Message Preview
          </h3>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-6">
          <Button variant="success" onClick={() => onUse(template.id)}>
            <Send className="h-4 w-4 mr-2" />
            Use This Template
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
};

export default TemplateDetail;
