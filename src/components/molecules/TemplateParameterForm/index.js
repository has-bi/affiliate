// src/components/molecules/TemplateParameterForm/Step2.js
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

const Step2 = ({
  selectedTemplate,
  paramValues,
  handleParamChange,
  isSubmitting,
  previewMode,
  togglePreview,
  getPreviewHTML,
  handlePrevStep,
  handleNextStep,
}) => {
  // Separate dynamic and static parameters
  const dynamicParameters =
    selectedTemplate?.parameters?.filter((p) => p.isDynamic) || [];
  const staticParameters =
    selectedTemplate?.parameters?.filter((p) => !p.isDynamic) || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-700">
        Isi Parameter Template
      </h3>

      {/* Dynamic Parameters (Auto-filled) */}
      {dynamicParameters.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Parameter Otomatis (dari data kontak)
          </h4>
          <div className="bg-blue-50 p-3 rounded-md">
            {dynamicParameters.map((param) => (
              <div key={param.id} className="text-sm text-blue-700 mb-1">
                <span className="font-medium">{param.name}</span>: Akan diisi
                otomatis dari data kontak
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static Parameters */}
      {staticParameters.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            Parameter Manual
          </h4>
          {staticParameters.map((param) => (
            <div key={param.id}>
              <label
                htmlFor={`param-${param.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={
                  param.type === "number"
                    ? "number"
                    : param.type === "date"
                    ? "date"
                    : "text"
                }
                id={`param-${param.id}`}
                value={paramValues[param.id] || ""}
                onChange={(e) => handleParamChange(param.id, e.target.value)}
                placeholder={param.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={param.required}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Template ini tidak memiliki parameter manual
          </p>
        </div>
      )}

      {/* Message preview */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Preview Pesan</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={togglePreview}
            leftIcon={
              previewMode ? (
                <Edit className="h-4 w-4 mr-1" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )
            }
          >
            {previewMode ? "Edit" : "Preview"}
          </Button>
        </div>

        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button type="button" variant="primary" onClick={handleNextStep}>
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};

export default Step2;
