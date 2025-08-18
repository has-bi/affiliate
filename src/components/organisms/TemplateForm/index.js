// src/components/organisms/TemplateForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Plus,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  Edit,
  X,
} from "lucide-react";
import { formatMessageContent } from "@/lib/templates/templateUtils";

/**
 * TemplateForm - Form for creating and editing templates
 */
const TemplateForm = ({ initialTemplate = null, templateId = null }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

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
  const [previewMode, setPreviewMode] = useState(false);

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

  // Fetch template when templateId is provided
  useEffect(() => {
    if (templateId && !isNaN(templateId)) {
      const fetchTemplate = async () => {
        setIsLoadingTemplate(true);
        try {
          const response = await fetch(`/api/templates/${templateId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status}`);
          }

          const templateData = await response.json();

          // Set form data with template values
          setFormData({
            id: templateData.id,
            name: templateData.name,
            description: templateData.description || "",
            content: templateData.content,
            category: templateData.category || "general",
            parameters: templateData.parameters.map((p) => ({
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
          setPreview(formatMessageContent(templateData.content));
        } catch (error) {
          console.error("Error fetching template:", error);
          setFormError(`Failed to load template: ${error.message}`);
        } finally {
          setIsLoadingTemplate(false);
        }
      };

      fetchTemplate();
    }
  }, [templateId]);

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
    const extractedParams = extractParametersFromContent(formData.content);

    // Keep existing parameters that match extracted IDs
    const existingParams = {};
    formData.parameters.forEach((p) => {
      existingParams[p.id] = p;
    });

    // Create updated parameter list
    const updatedParams = [];

    // Add parameters from content that don't exist yet
    extractedParams.forEach((param) => {
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
  const handleParamChange = (paramId, field, value) => {
    setFormData((prev) => {
      const newParameters = prev.parameters.map((param) => {
        if (param.id === paramId) {
          return { ...param, [field]: value };
        }
        return param;
      });

      return {
        ...prev,
        parameters: newParameters,
      };
    });
  };

  // Add new parameter
  const handleAddParameter = () => {
    const newParam = {
      id: `param_${Date.now()}`,
      name: "",
      type: "text", // Default tipe
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

  // Extract parameters from template content
  // Fungsi extractParametersFromContent yang sudah dimodifikasi
  const extractParametersFromContent = (content) => {
    if (!content) return [];
    const paramRegex = /\{([a-zA-Z0-9_-]+)\}/g;
    const matches = content.match(paramRegex) || [];

    // Extract unique parameters
    const uniqueParams = Array.from(
      new Set(matches.map((match) => match.substring(1, match.length - 1)))
    );

    // Convert to parameter objects, preserving existing types
    return uniqueParams.map((paramId) => {
      // Cek apakah parameter ini sudah ada dalam formData.parameters
      const existingParam = formData.parameters.find(
        (param) => param.id === paramId
      );

      // Jika ada, gunakan tipe yang sudah ada, jika tidak gunakan default "text"
      return {
        id: paramId,
        name:
          existingParam?.name ||
          paramId.charAt(0).toUpperCase() + paramId.slice(1).replace(/_/g, " "),
        type: existingParam?.type || "text", // Gunakan tipe yang ada atau default ke "text"
        placeholder:
          existingParam?.placeholder || `Enter ${paramId.replace(/_/g, " ")}`,
        required: existingParam?.required || false,
        isDynamic: existingParam?.isDynamic || paramId === "name",
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitSuccess(false);

    // Debugging: Log nilai parameter
    
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
      const isEditing = !!formData.id && formData.id !== "";
      const url = isEditing
        ? `/api/templates/${formData.id}`
        : "/api/templates";

      // Buat salinan data untuk dikirim ke API
      const dataToSend = {
        ...formData,
        // Pastikan tipe parameter dipertahankan dengan benar
        parameters: formData.parameters.map((param) => ({
          ...param,
          type: param.type || "text", // Default ke text jika tidak ada nilai
        })),
      };

      // Log data yang akan dikirim
      
      // Jika membuat template baru, hapus id
      if (!isEditing) {
        delete dataToSend.id;
      }

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, try to get text
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch (textError) {
            // If even that fails, just use status text
            errorMessage = `${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Get the response text first
      const responseText = await response.text();

      // Check if we have a valid response before parsing
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from server");
      }

      // Now parse the JSON
      let savedTemplate;
      try {
        savedTemplate = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        console.error("Raw response:", responseText);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

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

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Separate parameters by type
  const dynamicParameters = formData.parameters.filter((p) => p.isDynamic);
  const staticParameters = formData.parameters.filter((p) => !p.isDynamic);

  // Show loading state with skeleton
  if (isLoadingTemplate) {
    return (
      <Card className="shadow-sm">
        <div className="p-6">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center mb-6">
              <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            
            {/* Form fields skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
            
            {/* Description skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            
            {/* Content area skeleton */}
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex justify-end space-x-3">
              <div className="h-10 w-20 bg-gray-200 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Loading template...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          {/* Form error message */}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{formError}</p>
            </div>
          )}

          {/* Submit success message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>Template saved successfully!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Template name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter template name"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the template (optional)"
            />
          </div>

          {/* Template content */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                Message Content <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExtractParams}
                >
                  Extract Parameters
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={togglePreview}
                >
                  {previewMode ? (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>

            {previewMode ? (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[240px]">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              </div>
            ) : (
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleContentChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Type your message here. Use {parameter_name} for dynamic content."
                required
              />
            )}

            <div className="mt-1 flex space-x-1 text-xs text-gray-500">
              <Info className="h-4 w-4" />
              <p>
                Use {"{parameter_name}"} for dynamic content. Example: Hi{" "}
                {"{name}"}, your order {"{order_id}"} has been processed.
              </p>
            </div>
            <p className="mt-1 text-xs text-gray-500 ml-5">
              Use <strong>**bold text**</strong> for emphasis.
            </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dynamicParameters.map((param, index) => (
                  <div
                    key={param.id}
                    className="border border-blue-200 rounded-md p-3 bg-blue-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-800">
                        {param.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        Auto-filled
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Parameter ID:{" "}
                      <code className="bg-blue-100 px-1 rounded">
                        {param.id}
                      </code>
                    </p>
                    <p className="text-xs text-blue-600">
                      Source: {param.source || `contact.${param.id}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Static Parameters Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Static Parameters ({staticParameters.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Parameter
              </Button>
            </div>

            {staticParameters.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 text-center rounded-md">
                No static parameters defined. Use the "Extract Parameters"
                button or add manually.
              </div>
            ) : (
              <div className="space-y-4">
                {staticParameters.map((param, index) => (
                  <div
                    key={param.id}
                    className="border border-gray-200 rounded-md p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Parameter #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParameter(param.id)} // Ubah ini untuk menggunakan param.id
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`param-id-${param.id}`} // Gunakan param.id untuk ID yang unik
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Parameter ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`param-id-${param.id}`}
                          value={param.id}
                          onChange={
                            (e) =>
                              handleParamChange(param.id, "id", e.target.value) // Gunakan param.id untuk identifikasi
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`param-name-${param.id}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Display Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`param-name-${param.id}`}
                          value={param.name}
                          onChange={
                            (e) =>
                              handleParamChange(
                                param.id,
                                "name",
                                e.target.value
                              ) // Gunakan param.id untuk identifikasi
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label
                          htmlFor={`param-type-${param.id}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Type
                        </label>
                        <select
                          id={`param-type-${param.id}`}
                          value={param.type}
                          onChange={
                            (e) =>
                              handleParamChange(
                                param.id,
                                "type",
                                e.target.value
                              ) // Gunakan param.id untuk identifikasi
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                          htmlFor={`param-placeholder-${param.id}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Placeholder
                        </label>
                        <input
                          type="text"
                          id={`param-placeholder-${param.id}`}
                          value={param.placeholder || ""}
                          onChange={
                            (e) =>
                              handleParamChange(
                                param.id,
                                "placeholder",
                                e.target.value
                              ) // Gunakan param.id untuk identifikasi
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={param.required || false}
                            onChange={
                              (e) =>
                                handleParamChange(
                                  param.id,
                                  "required",
                                  e.target.checked
                                ) // Tambahkan checkbox untuk required
                            }
                            className="h-4 w-4 mr-2 text-blue-600 rounded"
                          />
                          Required field
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form buttons */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/messages/templates")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.content.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {formData.id ? 'Update Template' : 'Save Template'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default TemplateForm;
