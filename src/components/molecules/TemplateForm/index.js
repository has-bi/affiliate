"use client";

import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";

const TRIGGER_TYPES = [
  { id: "date", name: "Specific Date", icon: "calendar" },
  { id: "recurring", name: "Recurring Monthly", icon: "clock" },
  { id: "event", name: "On Event", icon: "tag" },
  { id: "manual", name: "Manual Trigger", icon: "send" },
];

const TemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    content: "",
    triggerType: "manual",
    triggerValue: "",
    category: "",
    targetGroup: "",
  });

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        id: template.id || `template-${Date.now()}`,
        name: template.name || "",
        content: template.content || "",
        triggerType: template.triggerType || "manual",
        triggerValue: template.triggerValue || "",
        category: template.category || "",
        targetGroup: template.targetGroup || "",
      });
    }
  }, [template]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Template name is required");
      return;
    }

    if (!formData.content.trim()) {
      alert("Template content is required");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Template Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 w-full border border-gray-300 rounded-md p-2"
          placeholder="Enter template name"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Message Content
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          rows={12}
          className="mt-1 w-full border border-gray-300 rounded-md p-2 font-mono text-sm"
          placeholder="Type your message here. Use **text** for bold formatting."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label
            htmlFor="triggerType"
            className="block text-sm font-medium text-gray-700"
          >
            Trigger Type
          </label>
          <select
            id="triggerType"
            name="triggerType"
            value={formData.triggerType}
            onChange={handleInputChange}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
          >
            {TRIGGER_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="triggerValue"
            className="block text-sm font-medium text-gray-700"
          >
            {formData.triggerType === "recurring"
              ? "Day of Month"
              : formData.triggerType === "date"
              ? "Specific Date"
              : formData.triggerType === "event"
              ? "Event Name"
              : "Trigger Value"}
          </label>
          <input
            type={formData.triggerType === "date" ? "date" : "text"}
            id="triggerValue"
            name="triggerValue"
            value={formData.triggerValue}
            onChange={handleInputChange}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            placeholder={
              formData.triggerType === "recurring"
                ? "e.g. 1 for 1st day of month"
                : formData.triggerType === "event"
                ? "e.g. new-affiliate"
                : ""
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. marketing, onboarding"
          />
        </div>

        <div>
          <label
            htmlFor="targetGroup"
            className="block text-sm font-medium text-gray-700"
          >
            Target Group
          </label>
          <input
            type="text"
            id="targetGroup"
            name="targetGroup"
            value={formData.targetGroup}
            onChange={handleInputChange}
            className="mt-1 w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. all-affiliates, new-users"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </button>
      </div>
    </div>
  );
};

export default TemplateForm;
