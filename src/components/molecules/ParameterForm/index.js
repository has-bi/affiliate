// components/molecules/ParameterForm/index.js
"use client";

import React, { useState } from "react";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";
import Card from "../../atoms/Card";
import {
  getAllImportantLinks,
  getLinksByCategory,
} from "../../../lib/templateUtils";

const ParameterForm = ({
  template,
  paramValues,
  onUpdateParam,
  validationErrors = [],
}) => {
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [activeParam, setActiveParam] = useState(null);

  // Handle showing links modal for a parameter
  const handleShowLinks = (paramId) => {
    setActiveParam(paramId);
    setShowLinksModal(true);
  };

  // Handle selecting a link from the modal
  const handleSelectLink = (url) => {
    if (activeParam) {
      onUpdateParam(activeParam, url);
    }
    setShowLinksModal(false);
    setActiveParam(null);
  };

  // Close the links modal
  const handleCloseModal = () => {
    setShowLinksModal(false);
    setActiveParam(null);
  };

  // Get all important links
  const importantLinks = getAllImportantLinks();

  // Group links by category
  const linksByCategory = importantLinks.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {});

  // Get error for a specific parameter
  const getParamError = (paramId) => {
    return validationErrors.find((error) =>
      error.includes(template.parameters.find((p) => p.id === paramId)?.name)
    );
  };

  if (!template) {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <p className="text-gray-500 text-sm">Please select a template first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Template Parameters</h3>

      {template.parameters.map((param) => {
        const paramError = getParamError(param.id);

        return (
          <div key={param.id} className="space-y-1">
            <div className="flex justify-between">
              <label
                htmlFor={`param-${param.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                {param.name}{" "}
                {param.required && <span className="text-red-500">*</span>}
              </label>

              {param.type === "url" && (
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => handleShowLinks(param.id)}
                >
                  Insert Link
                </button>
              )}
            </div>

            {param.type === "text" && (
              <Input
                id={`param-${param.id}`}
                type="text"
                placeholder={param.placeholder}
                value={paramValues[param.id] || ""}
                onChange={(e) => onUpdateParam(param.id, e.target.value)}
                error={paramError}
              />
            )}

            {param.type === "url" && (
              <Input
                id={`param-${param.id}`}
                type="url"
                placeholder={param.placeholder}
                value={paramValues[param.id] || ""}
                onChange={(e) => onUpdateParam(param.id, e.target.value)}
                error={paramError}
              />
            )}

            {param.type === "number" && (
              <Input
                id={`param-${param.id}`}
                type="number"
                placeholder={param.placeholder}
                value={paramValues[param.id] || ""}
                onChange={(e) => onUpdateParam(param.id, e.target.value)}
                error={paramError}
              />
            )}

            {param.type === "date" && (
              <Input
                id={`param-${param.id}`}
                type="date"
                placeholder={param.placeholder}
                value={paramValues[param.id] || ""}
                onChange={(e) => onUpdateParam(param.id, e.target.value)}
                error={paramError}
              />
            )}
          </div>
        );
      })}

      {/* Important Links Modal */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Important Link
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={handleCloseModal}
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              {Object.entries(linksByCategory).map(([category, links]) => (
                <div key={category} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 uppercase mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectLink(link.url)}
                      >
                        <div className="font-medium">{link.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {link.description}
                        </div>
                        <div className="text-xs text-blue-600 mt-1 truncate">
                          {link.url}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterForm;
