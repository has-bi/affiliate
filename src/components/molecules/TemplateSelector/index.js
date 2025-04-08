// components/molecules/TemplateSelector/index.js
"use client";

import React from "react";
import Card from "../../atoms/Card";

const TemplateSelector = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`cursor-pointer transition-all duration-200 ${
            selectedTemplateId === template.id
              ? "ring-2 ring-blue-500 shadow-md"
              : "hover:shadow-md"
          }`}
          onClick={() => onSelectTemplate(template.id)}
        >
          <Card.Content>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {template.description}
                </p>
              </div>

              {selectedTemplateId === template.id && (
                <div className="ml-4 flex-shrink-0 bg-blue-500 rounded-full p-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-2">
              <span className="text-xs font-medium text-gray-500">
                {template.parameters.length} Parameters
              </span>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
};

export default TemplateSelector;
