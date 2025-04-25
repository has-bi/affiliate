// src/components/organisms/TemplateForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, AlertCircle, CheckCircle, Info } from "lucide-react";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import TemplateParameter from "@/components/molecules/TemplateParameter";
import {
  extractParametersFromContent,
  formatMessageContent,
  DYNAMIC_PARAMETERS,
  createParameterId,
} from "@/lib/templateUtils";

/**
 * TemplateForm - Form for creating and editing templates
 */
const TemplateForm = ({ initialTemplate = null }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    content: "",
    category: "general",
    parameters: [],
  });

  // Preview state to show formatted template with parameters
  const [preview, setPreview] = useState("");

  // Category options
  const categories = [
    { value: "general", label: "General" },
    { value: "onboarding", label: "Onboarding" },
    { value: "marketing", label: "Marketing" },
    { value: "education", label: "Education" },
    { value: "recognition", label: "Recognition" },
    { value: "promotion", label: "Promotion" },
  ];

  // Parameter type options
  const paramTypes = [
    { value: "text", label: "Text" },
    { value: "url", label: "URL" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
  ];

  // Initialize with template data if editing
  useEffect(() => {
    if (initialTemplate) {
      setFormData({
        id: initialTemplate.id,
        name: initialTemplate.name,
        description: initialTemplate.description || "",
        content: initialTemplate.content,
        category: initialTemplate.category || "general",
        parameters: initialTemplate.parameters.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type || "text",
          placeholder: p.placeholder || "",
          required: p.required || false,
          isDynamic: p.isDynamic || false,
          source: p.source || "",
        })),
      });

      // Set initial preview
      setPreview(formatMessageContent(initialTemplate.content));
    }
  }, [initialTemplate]);

  // Update preview when content changes
  useEffect(() => {
    setPreview(formatMessageContent(formData.content));
  }, [formData.content]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle content changes and auto-detect parameters
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));
  };

  // Auto-extract parameters from content
  const handleExtractParams = () => {
    const { dynamic, static: staticParams } =
      extractParametersFromTemplateContent(formData.content);

    // Keep existing parameters that match extracted IDs
    const existingParams = {};
    formData.parameters.forEach((p) => {
      existingParams[p.id] = p;
    });

    // Create updated parameter list
    const updatedParams = [];

    // Add dynamic parameters
    dynamic.forEach((param) => {
      if (existingParams[param.id]) {
        updatedParams.push(existingParams[param.id]);
      } else {
        updatedParams.push(param);
      }
    });

    // Add static parameters
    staticParams.forEach((param) => {
      if (existingParams[param.id]) {
        updatedParams.push(existingParams[param.id]);
      } else {
        updatedParams.push(param);
      }
    });

    setFormData((prev) => ({
      ...prev,
      parameters: updatedParams,
    }));
  };

  // Handle parameter changes
  const handleParamChange = (index, field, value) => {
    const updatedParams = [...formData.parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      parameters: updatedParams,
    }));
  };

  // Add new parameter
  const handleAddParameter = () => {
    const newParam = {
      id: `param_${Date.now()}`,
      name: "",
      type: "text",
      placeholder: "",
      required: false,
      isDynamic: false,
    };

    setFormData((prev) => ({
      ...prev,
      parameters: [...prev.parameters, newParam],
    }));
  };

  // Remove parameter
  const handleRemoveParameter = (index) => {
    setFormData((prev) => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitSuccess(false);

    // Validate form
    if (!formData.name.trim()) {
      setFormError("Template name is required");
      return;
    }

    if (!formData.content.trim()) {
      setFormError("Template content is required");
      return;
    }

    // Validate parameter names and IDs
    const paramErrors = [];
    formData.parameters.forEach((param, index) => {
      if (!param.id.trim()) {
        paramErrors.push(`Parameter ${index + 1} is missing an ID`);
      }
      if (!param.name.trim()) {
        paramErrors.push(`Parameter ${index + 1} is missing a name`);
      }
    });

    if (paramErrors.length > 0) {
      setFormError(paramErrors.join("; "));
      return;
    }

    setIsSubmitting(true);

    try {
      const isEditing = !!formData.id;
      const url = isEditing
        ? `/api/templates/${formData.id}`
        : "/api/templates";

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save template");
      }

      const savedTemplate = await response.json();

      setSubmitSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/messages/templates?id=${savedTemplate.id}`);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Error saving template:", error);
      setFormError(error.message || "Failed to save template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separate parameters by type
  const dynamicParameters = formData.parameters.filter((p) => p.isDynamic);
  const staticParameters = formData.parameters.filter((p) => !p.isDynamic);

  return (
    <Card>
      <Card.Content>
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">
            {formData.id ? "Edit Template" : "Create New Template"}
          </h2>

          {/* Form error message */}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          {/* Submit success message */}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>Template saved successfully!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Template name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Template category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the template (optional)"
            />
          </div>

          {/* Template content */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                Message Content <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleExtractParams}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Extract Parameters
              </button>
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleContentChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Type your message here. Use {parameter_name} for dynamic content."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {"{parameter_name}"} to define parameters. Examples:
              <br />- {"{name}"} for recipient name (auto-filled from contact
              data)
              <br />- {"{video_link}"}, {"{product_price}"}, etc. for static
              content
            </p>
          </div>

          {/* Message preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Message Preview
            </h3>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          </div>

          {/* Dynamic Parameters Section */}
          {dynamicParameters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Dynamic Parameters (Auto-filled)
                </h3>
                <Info
                  className="h-4 w-4 ml-2 text-gray-400"
                  title="These parameters are automatically filled from contact data"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md mb-3">
                <p className="text-sm text-blue-700">
                  These parameters will be automatically filled with contact
                  information when sending messages.
                </p>
              </div>
              <div className="space-y-3">
                {dynamicParameters.map((param, index) => (
                  <div
                    key={index}
                    className="border border-blue-200 rounded-md p-3 bg-blue-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">
                        {param.name}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Auto-filled
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Parameter ID: <code>{param.id}</code>
                    </p>
                    <p className="text-xs text-blue-600">
                      Source: {param.source || `contact.${param.id}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static Parameters (User-filled) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Static Parameters ({staticParameters.length})
              </h3>
              <button
                type="button"
                onClick={handleAddParameter}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Parameter
              </button>
            </div>

            {staticParameters.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 text-center rounded-md">
                No static parameters defined. Use the "Extract Parameters"
                button or add manually.
              </div>
            ) : (
              <div className="space-y-3">
                {staticParameters.map((param, index) => (
                  <TemplateParameter
                    key={index}
                    parameter={param}
                    index={index}
                    onChange={handleParamChange}
                    onRemove={handleRemoveParameter}
                    paramTypes={paramTypes}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Form buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
};

export default TemplateForm;
