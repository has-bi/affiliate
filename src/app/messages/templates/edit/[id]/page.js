"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import {
  extractParametersFromContent,
  formatMessageContent,
} from "@/lib/templateUtils";
import PageLayout from "@/components/templates/PageLayout";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import { Save, ArrowLeft, Check, X, Plus, Trash, Eye } from "lucide-react";

export default function EditTemplatePage({ params }) {
  const router = useRouter();
  const { id } = params;
  const {
    fetchTemplateById,
    updateTemplate,
    createTemplate,
    isLoading,
    error,
  } = useTemplateDatabase();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    category: "general",
    parameters: [],
  });

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Category options
  const categories = [
    { value: "general", label: "Umum" },
    { value: "marketing", label: "Marketing" },
    { value: "onboarding", label: "Onboarding" },
    { value: "education", label: "Edukasi" },
    { value: "recognition", label: "Pengakuan" },
    { value: "promotion", label: "Promosi" },
  ];

  // Parameter types
  const paramTypes = [
    { value: "text", label: "Text" },
    { value: "url", label: "URL" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
  ];

  // Load template data if editing
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        if (id === "new") return; // Skip for new templates

        const templateData = await fetchTemplateById(parseInt(id, 10));
        if (templateData) {
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
            })),
          });
        } else {
          setSubmitError("Template tidak ditemukan");
        }
      } catch (err) {
        console.error("Error loading template:", err);
        setSubmitError("Error loading template");
      }
    };

    loadTemplate();
  }, [id, fetchTemplateById]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle content changes and auto-extract parameters
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));
  };

  // Extract parameters from content
  const handleExtractParams = () => {
    const extractedParams = extractParametersFromContent(formData.content);

    // Keep existing parameters that match extracted IDs
    const existingParams = {};
    formData.parameters.forEach((p) => {
      existingParams[p.id] = p;
    });

    // Create updated parameter list
    const updatedParams = extractedParams.map((param) => {
      if (existingParams[param.id]) {
        // Keep existing parameter information
        return existingParams[param.id];
      }
      return param;
    });

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

  // Update parameter
  const handleParameterChange = (index, field, value) => {
    const updatedParams = [...formData.parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: field === "required" ? Boolean(value) : value,
    };

    setFormData((prev) => ({
      ...prev,
      parameters: updatedParams,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Nama template wajib diisi");
      }

      if (!formData.content.trim()) {
        throw new Error("Konten template wajib diisi");
      }

      // Validate parameter names and IDs
      const paramErrors = [];
      formData.parameters.forEach((param, index) => {
        if (!param.id.trim()) {
          paramErrors.push(`Parameter ${index + 1} tidak memiliki ID`);
        }
        if (!param.name.trim()) {
          paramErrors.push(`Parameter ${index + 1} tidak memiliki nama`);
        }
      });

      if (paramErrors.length > 0) {
        throw new Error(paramErrors.join("; "));
      }

      let result;

      if (id === "new") {
        // Create new template
        result = await createTemplate(formData);
      } else {
        // Update existing template
        result = await updateTemplate(parseInt(id, 10), formData);
      }

      if (result) {
        setSuccessMessage(
          id === "new"
            ? "Template berhasil dibuat!"
            : "Template berhasil diupdate!"
        );

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/templates/list");
        }, 1500);
      } else {
        throw new Error("Gagal menyimpan template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      setSubmitError(err.message || "Gagal menyimpan template");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  // Get formatted preview
  const getPreviewContent = () => {
    return formatMessageContent(formData.content);
  };

  // Define page actions
  const pageActions = (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        onClick={() => router.push("/templates/list")}
        leftIcon={<ArrowLeft className="h-4 w-4 mr-1" />}
      >
        Kembali
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isSubmitting}
        leftIcon={isSubmitting ? null : <Save className="h-4 w-4 mr-1" />}
      >
        {isSubmitting ? "Menyimpan..." : "Simpan Template"}
      </Button>
    </div>
  );

  return (
    <PageLayout
      title={id === "new" ? "Buat Template Baru" : "Edit Template"}
      description={
        id === "new" ? "Buat template pesan baru" : `Edit template ID: ${id}`
      }
      actions={pageActions}
    >
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
          <Check className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {(submitError || error) && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
          <X className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{submitError || error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="md:col-span-2">
          <Card>
            <Card.Header>
              <Card.Title>Informasi Template</Card.Title>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Template name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nama Template <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Masukkan nama template"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Template description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Deskripsi singkat template (opsional)"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Template category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Kategori
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    disabled={isSubmitting}
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template content */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label
                      htmlFor="content"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Konten Pesan <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleExtractParams}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        disabled={isSubmitting}
                      >
                        Extract Parameters
                      </button>
                      <button
                        type="button"
                        onClick={togglePreview}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center"
                        disabled={isSubmitting}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {showPreview ? "Edit" : "Preview"}
                      </button>
                    </div>
                  </div>

                  {showPreview ? (
                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[240px]">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: getPreviewContent(),
                        }}
                      />
                    </div>
                  ) : (
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleContentChange}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                      placeholder="Ketik konten pesan di sini. Gunakan {parameter_name} untuk konten dinamis."
                      required
                      disabled={isSubmitting}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan {"{parameter_name}"} untuk mendefinisikan parameter.
                    Contoh: Hi {"{name}"}, pesanan {"{order_id}"} Anda telah
                    diproses.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan **text** untuk membuat teks bold.
                  </p>
                </div>
              </form>
            </Card.Content>
          </Card>
        </div>

        {/* Parameters panel */}
        <div className="md:col-span-1">
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <Card.Title>
                  Parameters ({formData.parameters.length})
                </Card.Title>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddParameter}
                  disabled={isSubmitting}
                  leftIcon={<Plus className="h-4 w-4 mr-1" />}
                >
                  Add Parameter
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              {formData.parameters.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 text-center rounded-md">
                  Tidak ada parameter. Gunakan tombol "Extract Parameters" untuk
                  mendeteksi parameter dari konten pesan.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.parameters.map((param, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-3 bg-gray-50"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isSubmitting}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
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
                            value={param.id}
                            onChange={(e) =>
                              handleParameterChange(index, "id", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            required
                            disabled={isSubmitting}
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
                            value={param.name}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`param-type-${index}`}
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Type
                          </label>
                          <select
                            id={`param-type-${index}`}
                            value={param.type}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "type",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            disabled={isSubmitting}
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
                            value={param.placeholder || ""}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "placeholder",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`param-required-${index}`}
                            checked={param.required}
                            onChange={(e) =>
                              handleParameterChange(
                                index,
                                "required",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={`param-required-${index}`}
                            className="ml-2 block text-xs text-gray-700"
                          >
                            Required field
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
