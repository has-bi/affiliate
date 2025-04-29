// src/components/molecules/TemplateSelector/Step1.js
import React from "react";
import { Button } from "@/components/ui/button";

const Step1 = ({
  sessionName,
  setSessionName,
  sessions,
  isLoadingSessions,
  isSubmitting,
  templates,
  selectedTemplateId,
  handleTemplateChange,
  isLoadingTemplates,
  selectedTemplate,
  handleNextStep,
  formatMessageContent,
}) => {
  return (
    <div className="space-y-4">
      {/* Session selection */}
      <div>
        <label
          htmlFor="sessionName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          WhatsApp Session <span className="text-red-500">*</span>
        </label>
        <select
          id="sessionName"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoadingSessions || isSubmitting}
          required
        >
          <option value="">Pilih session</option>
          {sessions.map((session) => (
            <option key={session.name} value={session.name}>
              {session.name} {session.status ? `(${session.status})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Template selection */}
      <div>
        <label
          htmlFor="templateId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Template Pesan <span className="text-red-500">*</span>
        </label>
        <select
          id="templateId"
          value={selectedTemplateId || ""}
          onChange={handleTemplateChange}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoadingTemplates || isSubmitting}
          required
        >
          <option value="">Pilih template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template preview */}
      {selectedTemplate && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Preview Template
          </h3>
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: formatMessageContent(selectedTemplate.content),
              }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Parameter akan ditampilkan dalam kurung kurawal {"{parameter_name}"}
          </p>
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={!selectedTemplate || !sessionName}
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};

export default Step1;
