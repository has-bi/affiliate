// src/components/molecules/TemplateParameter/index.js
"use client";

import React from "react";
import { Trash } from "lucide-react";
import Input from "@/components/atoms/Input";

/**
 * TemplateParameter - Component for editing a single parameter in a template
 */
const TemplateParameter = ({
  parameter,
  index,
  onChange,
  onRemove,
  paramTypes,
}) => {
  const handleChange = (field, value) => {
    onChange(index, field, value);
  };

  return (
    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
      <div className="flex justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Parameter #{index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <div>
          <label
            htmlFor={`param-id-${index}`}
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Parameter ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`param-id-${index}`}
            value={parameter.id}
            onChange={(e) => handleChange("id", e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label
            htmlFor={`param-name-${index}`}
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`param-name-${index}`}
            value={parameter.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor={`param-type-${index}`}
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Type
          </label>
          <select
            id={`param-type-${index}`}
            value={parameter.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
          >
            {paramTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`param-placeholder-${index}`}
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Placeholder
          </label>
          <input
            type="text"
            id={`param-placeholder-${index}`}
            value={parameter.placeholder}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={parameter.required}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="h-4 w-4 mr-2 text-blue-600 rounded"
            />
            Required field
          </label>
        </div>
      </div>
    </div>
  );
};

export default TemplateParameter;
