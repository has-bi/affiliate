// src/components/molecules/ScheduleForm/index.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplate } from "../../../hooks/useTemplate";
import RepeatScheduler from "@/components/molecules/FriendlyScheduler";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import {
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  Calendar as CalendarIcon,
  Send,
} from "lucide-react";

const ScheduleForm = ({
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) => {
  const router = useRouter();

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

  const { sessions } = useWhatsApp();

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
  const [previewMode, setPreviewMode] = useState(false);

  // Common cron expressions for easy selection
  const commonCronExpressions = [
    { label: "Every day at 9 AM", value: "0 9 * * *" },
    { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
    { label: "First day of month at 9 AM", value: "0 9 1 * *" },
    { label: "Every hour (on the hour)", value: "0 * * * *" },
    {
      label: "Every Monday, Wednesday, Friday at 1 PM",
      value: "0 13 * * 1,3,5",
    },
  ];

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

  const handleCronPresetChange = (e) => {
    const value = e.target.value;
    if (value) {
      setFormData((prev) => ({
        ...prev,
        scheduleConfig: {
          ...prev.scheduleConfig,
          cronExpression: value,
        },
      }));
    }
  };

  // Toggle preview mode for template content
  const togglePreview = () => {
    setPreviewMode((prev) => !prev);
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

    // Validate parameters
    if (selectedTemplate?.parameters) {
      selectedTemplate.parameters.forEach((param) => {
        if (
          param.required &&
          (!paramValues[param.id] || !paramValues[param.id].trim())
        ) {
          newErrors[
            `param_${param.id}`
          ] = `Parameter ${param.name} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    // Simple validation for current step
    const currentStepErrors = {};

    if (activeStep === "template") {
      if (!formData.name.trim())
        currentStepErrors.name = "Schedule name is required";
      if (!selectedTemplateId)
        currentStepErrors.template = "Please select a template";
      if (!formData.sessionName)
        currentStepErrors.sessionName = "Please select a session";

      if (Object.keys(currentStepErrors).length === 0) {
        setActiveStep("parameters");
      }
    } else if (activeStep === "parameters") {
      // Validate parameters
      if (selectedTemplate?.parameters) {
        selectedTemplate.parameters.forEach((param) => {
          if (
            param.required &&
            (!paramValues[param.id] || !paramValues[param.id].trim())
          ) {
            currentStepErrors[
              `param_${param.id}`
            ] = `Parameter ${param.name} is required`;
          }
        });
      }

      if (Object.keys(currentStepErrors).length === 0) {
        setActiveStep("recipients");
      }
    } else if (activeStep === "recipients") {
      if (!formData.recipients.trim()) {
        currentStepErrors.recipients = "At least one recipient is required";
      }

      if (Object.keys(currentStepErrors).length === 0) {
        setActiveStep("schedule");
      }
    }

    setErrors(currentStepErrors);
  };

  const handlePrevStep = () => {
    if (activeStep === "parameters") setActiveStep("template");
    else if (activeStep === "recipients") setActiveStep("parameters");
    else if (activeStep === "schedule") setActiveStep("recipients");
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
          // Handle Indonesian format (convert 08xx to 628xx)
          if (r.startsWith("0")) {
            return `62${r.substring(1)}@c.us`;
          }
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

  // Get human-readable description of schedule
  const getScheduleDescription = () => {
    if (formData.scheduleType === "once") {
      const date = formData.scheduleConfig.date;
      const time = formData.scheduleConfig.time;
      if (!date) return "No schedule set";

      return `One time on ${new Date(`${date}T${time}`).toLocaleString()}`;
    } else {
      // Try to format recurring schedule in human-readable format
      const expr = formData.scheduleConfig.cronExpression;

      // Very simple cron description (this could be improved with a library)
      for (const preset of commonCronExpressions) {
        if (preset.value === expr) {
          return preset.label;
        }
      }

      return `Recurring: ${expr}`;
    }
  };

  // Render the step content based on active step
  const renderStepContent = () => {
    // Step 1: Template Selection
    if (activeStep === "template") {
      return (
        <div className="space-y-4">
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

          <div>
            <label
              htmlFor="templateId"
              className={`block text-sm font-medium ${
                errors.template ? "text-red-700" : "text-gray-700"
              } mb-1`}
            >
              Message Template <span className="text-red-500">*</span>
            </label>
            <select
              id="templateId"
              value={selectedTemplateId || ""}
              onChange={(e) => selectTemplate(parseInt(e.target.value, 10))}
              className={`w-full px-3 py-2 border ${
                errors.template ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              required
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {errors.template && (
              <p className="mt-1 text-sm text-red-600">{errors.template}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="sessionName"
              className={`block text-sm font-medium ${
                errors.sessionName ? "text-red-700" : "text-gray-700"
              } mb-1`}
            >
              WhatsApp Session <span className="text-red-500">*</span>
            </label>
            <select
              id="sessionName"
              name="sessionName"
              value={formData.sessionName}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${
                errors.sessionName ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              required
            >
              <option value="">Select a session</option>
              {sessions.map((session) => (
                <option key={session.name} value={session.name}>
                  {session.name}
                </option>
              ))}
            </select>
            {errors.sessionName && (
              <p className="mt-1 text-sm text-red-600">{errors.sessionName}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={handleNextStep}>
              Continue
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Parameters
    else if (activeStep === "parameters") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Fill Template Parameters</h3>

          {selectedTemplate?.parameters &&
          selectedTemplate.parameters.length > 0 ? (
            <div className="space-y-4">
              {selectedTemplate.parameters.map((param) => (
                <div key={param.id}>
                  <label
                    htmlFor={`param-${param.id}`}
                    className={`block text-sm font-medium ${
                      errors[`param_${param.id}`]
                        ? "text-red-700"
                        : "text-gray-700"
                    } mb-1`}
                  >
                    {param.name}
                    {param.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
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
                    onChange={(e) => updateParamValue(param.id, e.target.value)}
                    placeholder={param.placeholder}
                    className={`w-full px-3 py-2 border ${
                      errors[`param_${param.id}`]
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md`}
                    required={param.required}
                  />
                  {errors[`param_${param.id}`] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`param_${param.id}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md">
              <p className="text-gray-500">This template has no parameters</p>
            </div>
          )}

          {/* Preview */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Message Preview
              </h3>
              <Button
                type="button"
                variant="secondary"
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

            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={handlePrevStep}>
              Back
            </Button>
            <Button type="button" variant="primary" onClick={handleNextStep}>
              Continue
            </Button>
          </div>
        </div>
      );
    }

    // Step 3: Recipients
    else if (activeStep === "recipients") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Enter Recipients</h3>

          <div>
            <label
              htmlFor="recipients"
              className={`block text-sm font-medium ${
                errors.recipients ? "text-red-700" : "text-gray-700"
              } mb-1`}
            >
              Recipients (one per line or comma-separated){" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="recipients"
              name="recipients"
              value={formData.recipients}
              onChange={handleInputChange}
              rows={6}
              className={`w-full px-3 py-2 border ${
                errors.recipients ? "border-red-500" : "border-gray-300"
              } rounded-md`}
              placeholder="6281234567890 
6289876543210
or 6281234567890, 6289876543210"
              required
            />
            {errors.recipients && (
              <p className="mt-1 text-sm text-red-600">{errors.recipients}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Phone numbers will be formatted automatically (e.g.,
              628123456789@c.us)
            </p>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={handlePrevStep}>
              Back
            </Button>
            <Button type="button" variant="primary" onClick={handleNextStep}>
              Continue
            </Button>
          </div>
        </div>
      );
    }

    // Step 4: Schedule
    else if (activeStep === "schedule") {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Set Schedule</h3>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="date"
                  className={`block text-sm font-medium ${
                    errors.date ? "text-red-700" : "text-gray-700"
                  } mb-1`}
                >
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.scheduleConfig.date}
                  onChange={handleScheduleConfigChange}
                  className={`w-full px-3 py-2 border ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  } rounded-md`}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="time"
                  className={`block text-sm font-medium text-gray-700 mb-1`}
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
                  className={`block text-sm font-medium ${
                    errors.cronExpression ? "text-red-700" : "text-gray-700"
                  } mb-1`}
                >
                  Cron Expression <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      id="cronExpression"
                      name="cronExpression"
                      value={formData.scheduleConfig.cronExpression}
                      onChange={(e) => {
                        // Automatically replace "star" with "*"
                        const cleanedValue = e.target.value.replace(
                          /\bstar\b/g,
                          "*"
                        );
                        handleScheduleConfigChange({
                          target: {
                            name: "cronExpression",
                            value: cleanedValue,
                          },
                        });
                      }}
                      className={`w-full px-3 py-2 border ${
                        errors.cronExpression
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md`}
                      placeholder="e.g., 0 9 * * 1 (Every Monday at 9 AM)"
                      required
                    />
                  </div>
                  <div>
                    <select
                      onChange={handleCronPresetChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select preset</option>
                      {commonCronExpressions.map((preset, index) => (
                        <option key={index} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors.cronExpression && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.cronExpression}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Format: minute hour day-of-month month day-of-week
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Use asterisk (*) for "every". Example: "50-59/3 10 * * *" runs
                  every 3 minutes from :50 to :59 at 10 AM.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className={`block text-sm font-medium ${
                      errors.startDate ? "text-red-700" : "text-gray-700"
                    } mb-1`}
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.scheduleConfig.startDate}
                    onChange={handleScheduleConfigChange}
                    className={`w-full px-3 py-2 border ${
                      errors.startDate ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
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

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Schedule Summary:
            </h4>
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex items-center">
                {formData.scheduleType === "once" ? (
                  <Calendar className="text-gray-500 mr-2 h-5 w-5" />
                ) : (
                  <Clock className="text-gray-500 mr-2 h-5 w-5" />
                )}
                <span>{getScheduleDescription()}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="secondary" onClick={handlePrevStep}>
              Back
            </Button>
            <Button
              type="submit"
              variant="success"
              isLoading={isSubmitting}
              leftIcon={
                !isSubmitting && <CalendarIcon className="h-4 w-4 mr-1" />
              }
            >
              {isSubmitting ? "Saving..." : "Save & Schedule"}
            </Button>
          </div>
        </div>
      );
    }
  };

  // Step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: "template", label: "Template" },
      { id: "parameters", label: "Parameters" },
      { id: "recipients", label: "Recipients" },
      { id: "schedule", label: "Schedule" },
    ];

    const getCurrentStepIndex = () => {
      return steps.findIndex((step) => step.id === activeStep);
    };

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isCompleted = getCurrentStepIndex() > index;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className="relative">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-8 h-0.5 w-full ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderStepIndicator()}
      {renderStepContent()}
    </form>
  );
};

export default ScheduleForm;
