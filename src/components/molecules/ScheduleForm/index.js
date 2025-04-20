// src/components/molecules/ScheduleForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import Input from "../../atoms/Input";
import Button from "../../atoms/Button";
import Card from "../../atoms/Card";
import TemplateSelector from "../TemplateSelector";
import MessagePreview from "../MessagePreview";
import { useTemplate } from "../../../hooks/useTemplate";
import { useSession } from "../../../hooks/useSession";

const ScheduleForm = ({
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) => {
  const {
    templates,
    selectedTemplateId,
    selectedTemplate,
    paramValues,
    preview,
    selectTemplate,
    updateParamValue,
    getFinalMessage,
  } = useTemplate();

  const { sessions } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    recipients: "",
    scheduleType: "once",
    scheduleConfig: {
      date: "",
      time: "12:00",
      cronExpression: "",
      startDate: "",
      endDate: "",
    },
    sessionName: "",
  });

  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState("template");

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        recipients: Array.isArray(initialData.recipients)
          ? initialData.recipients.join("\n")
          : initialData.recipients || "",
        scheduleType: initialData.scheduleType || "once",
        scheduleConfig: {
          date: initialData.scheduleConfig?.date
            ? new Date(initialData.scheduleConfig.date)
                .toISOString()
                .split("T")[0]
            : "",
          time: initialData.scheduleConfig?.date
            ? new Date(initialData.scheduleConfig.date)
                .toTimeString()
                .slice(0, 5)
            : "12:00",
          cronExpression: initialData.scheduleConfig?.cronExpression || "",
          startDate: initialData.scheduleConfig?.startDate
            ? new Date(initialData.scheduleConfig.startDate)
                .toISOString()
                .split("T")[0]
            : "",
          endDate: initialData.scheduleConfig?.endDate
            ? new Date(initialData.scheduleConfig.endDate)
                .toISOString()
                .split("T")[0]
            : "",
        },
        sessionName: initialData.sessionName || "",
      });

      if (initialData.templateId) {
        selectTemplate(initialData.templateId);
      }

      if (initialData.paramValues) {
        Object.entries(initialData.paramValues).forEach(([key, value]) => {
          updateParamValue(key, value);
        });
      }
    }
  }, [initialData, selectTemplate, updateParamValue]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleConfigChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      scheduleConfig: { ...prev.scheduleConfig, [name]: value },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Schedule name is required";
    }

    if (!selectedTemplateId) {
      newErrors.template = "Please select a message template";
    }

    if (!formData.recipients.trim()) {
      newErrors.recipients = "At least one recipient is required";
    }

    if (!formData.sessionName) {
      newErrors.sessionName = "Please select a WhatsApp session";
    }

    if (formData.scheduleType === "once") {
      if (!formData.scheduleConfig.date) {
        newErrors.date = "Please select a date";
      } else {
        // Check if date is in the past
        const dateTime = new Date(
          `${formData.scheduleConfig.date}T${formData.scheduleConfig.time}:00`
        );
        if (dateTime <= new Date()) {
          newErrors.date = "Date and time must be in the future";
        }
      }
    } else if (formData.scheduleType === "recurring") {
      if (!formData.scheduleConfig.cronExpression) {
        newErrors.cronExpression = "Cron expression is required";
      }
      if (!formData.scheduleConfig.startDate) {
        newErrors.startDate = "Start date is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Parse recipients
    const recipientList = formData.recipients
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => {
        // Add @c.us suffix if not present
        if (!r.includes("@")) {
          return `${r}@c.us`;
        }
        return r;
      });

    // Prepare schedule data
    let scheduleConfig = {};

    if (formData.scheduleType === "once") {
      // Combine date and time for one-time schedule
      const dateTime = new Date(
        `${formData.scheduleConfig.date}T${formData.scheduleConfig.time}:00`
      );
      scheduleConfig = { date: dateTime.toISOString() };
    } else {
      // For recurring schedule
      scheduleConfig = {
        cronExpression: formData.scheduleConfig.cronExpression,
        startDate: formData.scheduleConfig.startDate
          ? new Date(
              `${formData.scheduleConfig.startDate}T00:00:00`
            ).toISOString()
          : undefined,
        endDate: formData.scheduleConfig.endDate
          ? new Date(
              `${formData.scheduleConfig.endDate}T23:59:59`
            ).toISOString()
          : undefined,
      };
    }

    // Prepare final data
    const scheduleData = {
      name: formData.name,
      templateId: selectedTemplateId,
      paramValues,
      recipients: recipientList,
      scheduleType: formData.scheduleType,
      scheduleConfig,
      sessionName: formData.sessionName,
    };

    onSubmit(scheduleData);
  };

  const handleNext = () => {
    if (activeStep === "template" && !selectedTemplateId) {
      setErrors({ template: "Please select a template" });
      return;
    }

    if (activeStep === "template") setActiveStep("recipients");
    else if (activeStep === "recipients") setActiveStep("schedule");
  };

  const handleBack = () => {
    if (activeStep === "schedule") setActiveStep("recipients");
    else if (activeStep === "recipients") setActiveStep("template");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Schedule Name */}
        <div>
          <Input
            label="Schedule Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter a name for this scheduled message"
            error={errors.name}
            required
          />
        </div>

        {/* Multi-step form content */}
        {activeStep === "template" && (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Select Message Template</Card.Title>
              </Card.Header>
              <Card.Content>
                <TemplateSelector
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onSelectTemplate={selectTemplate}
                />
                {errors.template && (
                  <p className="mt-2 text-sm text-red-600">{errors.template}</p>
                )}
              </Card.Content>
            </Card>

            {selectedTemplate && (
              <Card>
                <Card.Header>
                  <Card.Title>Template Parameters</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-4">
                    {selectedTemplate.parameters.map((param) => (
                      <div key={param.id}>
                        <label
                          htmlFor={`param-${param.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          {param.name}{" "}
                          {param.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <input
                          type={param.type === "date" ? "date" : "text"}
                          id={`param-${param.id}`}
                          value={paramValues[param.id] || ""}
                          onChange={(e) =>
                            updateParamValue(param.id, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder={param.placeholder}
                          required={param.required}
                        />
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {activeStep === "recipients" && (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Message Recipients</Card.Title>
              </Card.Header>
              <Card.Content>
                <div>
                  <label
                    htmlFor="recipients"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Recipients (one per line or comma-separated)
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="recipients"
                    name="recipients"
                    value={formData.recipients}
                    onChange={handleInputChange}
                    rows={5}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.recipients ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="6281234567890 
6289876543210
or 6281234567890, 6289876543210"
                    required
                  />
                  {errors.recipients && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.recipients}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Phone numbers will be formatted automatically (e.g.,
                    628123456789@c.us)
                  </p>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="sessionName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    WhatsApp Session <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sessionName"
                    name="sessionName"
                    value={formData.sessionName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.sessionName ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select a session</option>
                    {sessions.map((session) => (
                      <option key={session.name} value={session.name}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                  {errors.sessionName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.sessionName}
                    </p>
                  )}
                </div>
              </Card.Content>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {activeStep === "schedule" && (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Schedule Settings</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="once"
                          checked={formData.scheduleType === "once"}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2">One-time</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="scheduleType"
                          value="recurring"
                          checked={formData.scheduleType === "recurring"}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2">Recurring</span>
                      </label>
                    </div>
                  </div>

                  {formData.scheduleType === "once" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.scheduleConfig.date}
                          onChange={handleScheduleConfigChange}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.date ? "border-red-500" : "border-gray-300"
                          }`}
                          required
                        />
                        {errors.date && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.date}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="time"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id="time"
                          name="time"
                          value={formData.scheduleConfig.time}
                          onChange={handleScheduleConfigChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="cronExpression"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Cron Expression{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="cronExpression"
                          name="cronExpression"
                          value={formData.scheduleConfig.cronExpression}
                          onChange={handleScheduleConfigChange}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.cronExpression
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="e.g., 0 9 * * 1 (Every Monday at 9 AM)"
                          required
                        />
                        {errors.cronExpression && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.cronExpression}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Format: minute hour day-of-month month day-of-week
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.scheduleConfig.startDate}
                            onChange={handleScheduleConfigChange}
                            className={`w-full px-3 py-2 border rounded-md ${
                              errors.startDate
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            required
                          />
                          {errors.startDate && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.startDate}
                            </p>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.scheduleConfig.endDate}
                            onChange={handleScheduleConfigChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Message Preview */}
            <Card>
              <Card.Header>
                <Card.Title>Message Preview</Card.Title>
              </Card.Header>
              <Card.Content>
                <MessagePreview preview={preview} isValid={true} />
              </Card.Content>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" variant="success" isLoading={isSubmitting}>
                Save & Activate Schedule
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ScheduleForm;
