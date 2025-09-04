// src/components/molecules/ScheduleForm/index.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTemplate } from "../../../hooks/useTemplate";
import RepeatScheduler from "@/components/molecules/RepeatScheduler";
import EnhancedRecipientInput from "@/components/molecules/EnhancedRecipientInput";
import ImageUploader from "@/components/molecules/ImageUploader";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { batchValidatePhones } from "@/lib/utils/phoneValidator";
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
    imageUrl: "",
    batchSize: 50,
    batchDelay: 300, // 5 minutes in seconds
    dailyLimit: 1000,
  });

  const [errors, setErrors] = useState({});
  const [activeStep, setActiveStep] = useState("template");
  const [previewMode, setPreviewMode] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState(null);

  // Only calculate basic count for display, not full validation during typing
  const recipientCount = useMemo(() => {
    if (!formData.recipients || formData.recipients.trim() === '') {
      return 0;
    }
    // Just count lines that look like they might be phone numbers
    const lines = formData.recipients.split(/[\n,;]+/).map(line => line.trim()).filter(line => line.length > 0);
    const potentialNumbers = lines.filter(line => {
      const digitsOnly = line.replace(/\D/g, '');
      return digitsOnly.length >= 8; // Only count lines with at least 8 digits
    });
    return potentialNumbers.length;
  }, [formData.recipients]);

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
        imageUrl: initialData.imageUrl || "",
        batchSize: initialData.batchSize || 50,
        batchDelay: initialData.batchDelay || 300,
        dailyLimit: initialData.dailyLimit || 1000,
      });

      if (initialData.templateId) {
        selectTemplate(initialData.templateId);
      }

      if (initialData.paramValues) {
        Object.entries(initialData.paramValues).forEach(([key, value]) => {
          updateParamValue(key, value);
        });
      }

      // Set initial image if exists
      if (initialData.imageUrl) {
        setSelectedImage({
          url: initialData.imageUrl,
          filename: 'Existing Image',
          size: 0,
          type: 'image/existing'
        });
      }
    }
  }, [initialData, selectTemplate, updateParamValue]);

  // Handle template selection - show template image if it exists
  useEffect(() => {
    if (selectedTemplate?.imageUrl && !selectedImage) {
      // Only set template image if user hasn't selected their own image
      console.log('DEBUG ScheduleForm - Template has imageUrl:', selectedTemplate.imageUrl);
      setSelectedImage({
        url: selectedTemplate.imageUrl,
        filename: 'Template Image',
        size: 0,
        type: 'image/template'
      });
      setFormData((prev) => ({
        ...prev,
        imageUrl: selectedTemplate.imageUrl,
      }));
    } else if (!selectedTemplate?.imageUrl && selectedImage?.type === 'image/template') {
      // Clear template image if switching to template without image
      console.log('DEBUG ScheduleForm - Template has no imageUrl, clearing template image');
      setSelectedImage(null);
      setFormData((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    }
  }, [selectedTemplate, selectedImage]);

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

  // Handle image selection
  const handleImageSelected = (imageData) => {
    console.log('DEBUG ScheduleForm - handleImageSelected called with:', imageData);
    setSelectedImage(imageData);
    const newImageUrl = imageData ? imageData.url : "";
    console.log('DEBUG ScheduleForm - Setting imageUrl to:', newImageUrl);
    setFormData((prev) => ({
      ...prev,
      imageUrl: newImageUrl,
    }));
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

    // Validate phone numbers only when submitting
    const phoneValidationResult = batchValidatePhones(formData.recipients);
    
    if (phoneValidationResult.invalid.length > 0) {
      // Show validation errors
      const errorMessages = phoneValidationResult.invalid
        .slice(0, 5) // Show first 5 errors
        .map(err => `Line ${err.lineNumber}: ${err.input} - ${err.error}`)
        .join('\n');
      
      const moreErrors = phoneValidationResult.invalid.length > 5 
        ? `\n... and ${phoneValidationResult.invalid.length - 5} more errors`
        : '';
      
      alert(`Phone number validation failed:\n\n${errorMessages}${moreErrors}\n\nPlease fix these numbers and try again.`);
      return;
    }
    
    if (phoneValidationResult.valid.length === 0) {
      alert('No valid phone numbers found. Please enter at least one valid phone number.');
      return;
    }
    
    const recipientList = phoneValidationResult.valid;

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
      imageUrl: formData.imageUrl, // Include imageUrl in the submitted data
      batchSize: formData.batchSize,
      batchDelay: formData.batchDelay,
      dailyLimit: formData.dailyLimit,
    };

    // DEBUG: Log image data for troubleshooting
    console.log('DEBUG ScheduleForm - Submitting with imageUrl:', formData.imageUrl);

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
      // For recurring schedules, we'll rely on the cron expression
      // The RepeatScheduler component will provide a human-readable description
      return `Recurring: ${formData.scheduleConfig.cronExpression}`;
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

          {/* Image Upload Section */}
          <div>
            <ImageUploader 
              onImageSelected={handleImageSelected}
              selectedImage={selectedImage}
            />
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
          <h3 className="text-lg font-medium">Configure Recipients & Batching</h3>

          <EnhancedRecipientInput
            recipients={formData.recipients}
            onUpdateRecipients={(recipients) => 
              setFormData(prev => ({ ...prev, recipients }))
            }
            batchSize={formData.batchSize}
            onUpdateBatchSize={(batchSize) => 
              setFormData(prev => ({ ...prev, batchSize }))
            }
            batchDelay={formData.batchDelay}
            onUpdateBatchDelay={(batchDelay) => 
              setFormData(prev => ({ ...prev, batchDelay }))
            }
            dailyLimit={formData.dailyLimit}
            onUpdateDailyLimit={(dailyLimit) => 
              setFormData(prev => ({ ...prev, dailyLimit }))
            }
            parsedCount={recipientCount}
            error={errors.recipients}
          />

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
              {/* Replace cron expression input with RepeatScheduler */}
              <RepeatScheduler
                initialCron={formData.scheduleConfig.cronExpression}
                onChange={(cronExpression) => {
                  handleScheduleConfigChange({
                    target: {
                      name: "cronExpression",
                      value: cronExpression,
                    },
                  });
                }}
              />

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
