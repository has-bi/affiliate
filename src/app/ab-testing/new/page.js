"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageLayout from "@/components/templates/PageLayout";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Users, 
  MessageSquare,
  AlertCircle,
  Save,
  Play
} from "lucide-react";

export default function NewABTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sessionName: "",
    cooldownMinutes: 5,
    batchSize: 50,
    variants: [
      { name: "A", templateId: "", customMessage: "", allocationPercentage: 50 },
      { name: "B", templateId: "", customMessage: "", allocationPercentage: 50 }
    ],
    recipients: ""
  });
  const [errors, setErrors] = useState({});
  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    fetchTemplates();
    fetchSessions();
  }, []);

  useEffect(() => {
    // Count recipients
    const recipients = formData.recipients
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(Boolean);
    setRecipientCount(recipients.length);
  }, [formData.recipients]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Experiment name is required";
    }

    if (!formData.sessionName) {
      newErrors.sessionName = "WhatsApp session is required";
    }

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.templateId && !variant.customMessage.trim()) {
        newErrors[`variant_${index}`] = "Either select a template or enter a custom message";
      }
    });

    // Validate allocation percentages
    const totalAllocation = formData.variants.reduce((sum, v) => sum + v.allocationPercentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      newErrors.allocation = "Variant allocations must sum to 100%";
    }

    // Validate recipients
    if (!formData.recipients.trim()) {
      newErrors.recipients = "At least one recipient is required";
    } else if (recipientCount === 0) {
      newErrors.recipients = "No valid recipients found";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVariant = () => {
    const newVariantName = String.fromCharCode(65 + formData.variants.length); // A, B, C, etc.
    const currentAllocation = formData.variants.reduce((sum, v) => sum + v.allocationPercentage, 0);
    const newAllocation = Math.max(0, 100 - currentAllocation);
    
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: newVariantName,
          templateId: "",
          customMessage: "",
          allocationPercentage: newAllocation
        }
      ]
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 2) return; // Keep at least 2 variants
    
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleSubmit = async (action = 'save') => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const recipients = formData.recipients
        .split(/[\n,]+/)
        .map(r => r.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        recipients,
        settings: {
          autoStart: action === 'start'
        }
      };

      const response = await fetch("/api/ab-testing/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const experiment = await response.json();
        
        if (action === 'start') {
          // Start the experiment immediately
          await fetch(`/api/ab-testing/experiments/${experiment.id}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'start' })
          });
        }
        
        router.push(`/ab-testing/${experiment.id}`);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error });
      }
    } catch (error) {
      setErrors({ submit: "Failed to create experiment" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout 
      title="Create A/B Test" 
      description="Set up a new A/B testing experiment to compare message variants"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiment Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome Message Test"
                error={errors.name}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the purpose of this A/B test..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sessionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessionName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select session</option>
                  {sessions.map(session => (
                    <option key={session.name} value={session.name}>
                      {session.name} ({session.status})
                    </option>
                  ))}
                </select>
                {errors.sessionName && (
                  <p className="text-red-500 text-sm mt-1">{errors.sessionName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooldown (minutes)
                </label>
                <Input
                  type="number"
                  value={formData.cooldownMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 5 }))}
                  min={1}
                  max={60}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                </label>
                <Input
                  type="number"
                  value={formData.batchSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 50 }))}
                  min={1}
                  max={200}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Message Variants</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                disabled={formData.variants.length >= 5}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-900">Variant {variant.name}</h4>
                  {formData.variants.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template (Optional)
                    </label>
                    <select
                      value={variant.templateId}
                      onChange={(e) => updateVariant(index, 'templateId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select template</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocation Percentage
                    </label>
                    <Input
                      type="number"
                      value={variant.allocationPercentage}
                      onChange={(e) => updateVariant(index, 'allocationPercentage', parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message {!variant.templateId && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={variant.customMessage}
                    onChange={(e) => updateVariant(index, 'customMessage', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={variant.templateId ? "Leave empty to use template content" : "Enter your message content..."}
                  />
                  {errors[`variant_${index}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`variant_${index}`]}</p>
                  )}
                </div>
              </div>
            ))}

            {errors.allocation && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-700 text-sm">{errors.allocation}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-700 text-sm">
                <strong>Current allocation:</strong> {formData.variants.reduce((sum, v) => sum + v.allocationPercentage, 0)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recipients ({recipientCount} contacts)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Numbers <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.recipients}
                onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter phone numbers (one per line or comma-separated)&#10;+1234567890&#10;+0987654321&#10;..."
              />
              {errors.recipients && (
                <p className="text-red-500 text-sm mt-1">{errors.recipients}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Recipients will be automatically distributed across variants based on allocation percentages.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('save')}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit('start')}
            disabled={loading}
          >
            <Play className="h-4 w-4 mr-2" />
            Create & Start
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}