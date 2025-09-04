// src/components/molecules/EnhancedRecipientInput/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InfoTooltip from "@/components/molecules/InfoTooltip";
import { batchValidatePhones, getPhoneFormatExamples } from "@/lib/utils/phoneValidator";
import { 
  Upload, 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  FileText,
  Download
} from "lucide-react";

const EnhancedRecipientInput = ({
  recipients,
  onUpdateRecipients,
  batchSize,
  onUpdateBatchSize,
  batchDelay,
  onUpdateBatchDelay,
  dailyLimit,
  onUpdateDailyLimit,
  parsedCount,
  error,
}) => {
  const [inputMethod, setInputMethod] = useState("manual"); // manual, csv, contacts
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [contactsData, setContactsData] = useState({ active: [], new: [] });
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [phoneValidation, setPhoneValidation] = useState({ valid: [], invalid: [], summary: { total: 0, validCount: 0, invalidCount: 0 } });

  // Debounced validation - only validate after user stops typing
  useEffect(() => {
    if (!recipients || recipients.trim() === '') {
      setPhoneValidation({ valid: [], invalid: [], summary: { total: 0, validCount: 0, invalidCount: 0 } });
      return;
    }

    // Add a small delay to avoid validating while actively typing
    const timeoutId = setTimeout(() => {
      // Only validate lines that look complete (at least 8 digits)
      const lines = recipients.split(/[\n,;]+/).map(line => line.trim()).filter(line => line.length > 0);
      
      // Filter out incomplete lines (less than 6 characters - likely still typing)
      const completeLookingLines = lines.filter(line => {
        const digitsOnly = line.replace(/\D/g, '');
        return digitsOnly.length >= 8; // Only validate if it has at least 8 digits
      });
      
      if (completeLookingLines.length > 0) {
        const validation = batchValidatePhones(completeLookingLines.join('\n'));
        setPhoneValidation(validation);
      } else {
        // Show count but no validation errors for incomplete entries
        setPhoneValidation({ 
          valid: [], 
          invalid: [], 
          summary: { 
            total: lines.length, 
            validCount: 0, 
            invalidCount: 0 
          } 
        });
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [recipients]);

  // Calculate recommendations based on recipient count
  const getRecommendations = () => {
    const count = phoneValidation.summary.validCount || 0;
    
    if (count === 0) return null;

    let recommendations = {
      batchSize: 50,
      batchDelay: 300, // 5 minutes
      dailyLimit: 1000,
      estimatedTime: 0,
      riskLevel: "low",
      tips: []
    };

    if (count <= 50) {
      recommendations.batchSize = Math.min(count, 25);
      recommendations.batchDelay = 180; // 3 minutes
      recommendations.riskLevel = "low";
      recommendations.tips = [
        "Small batch - can use shorter delays",
        "Low risk of rate limiting",
        "Messages will be sent quickly"
      ];
    } else if (count <= 200) {
      recommendations.batchSize = 30;
      recommendations.batchDelay = 300; // 5 minutes
      recommendations.riskLevel = "medium";
      recommendations.tips = [
        "Medium batch - use moderate delays",
        "Consider spreading over time",
        "Monitor delivery rates"
      ];
    } else if (count <= 500) {
      recommendations.batchSize = 50;
      recommendations.batchDelay = 600; // 10 minutes
      recommendations.riskLevel = "medium";
      recommendations.tips = [
        "Large batch - use longer delays",
        "Spread over multiple hours",
        "Monitor for rate limiting"
      ];
    } else {
      recommendations.batchSize = 50;
      recommendations.batchDelay = 900; // 15 minutes
      recommendations.dailyLimit = Math.min(1000, Math.ceil(count * 0.8));
      recommendations.riskLevel = "high";
      recommendations.tips = [
        "Very large batch - spread over multiple days",
        "Use maximum delays to avoid blocking",
        "Consider splitting into smaller campaigns",
        "Monitor WhatsApp session health closely"
      ];
    }

    // Calculate estimated time
    const batches = Math.ceil(count / recommendations.batchSize);
    const totalTimeMinutes = (batches - 1) * (recommendations.batchDelay / 60) + 5; // +5 for processing
    recommendations.estimatedTime = totalTimeMinutes;

    return recommendations;
  };

  const recommendations = getRecommendations();

  // Handle CSV file upload
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const phones = [];
        
        lines.forEach((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          
          // Look for phone numbers in any column
          values.forEach(value => {
            // Simple phone number detection
            const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
            if (phoneRegex.test(value.replace(/\s/g, ''))) {
              const cleanPhone = value.replace(/\D/g, '');
              if (cleanPhone.length >= 8) {
                phones.push(cleanPhone);
              }
            }
          });
        });

        if (phones.length === 0) {
          alert('No phone numbers found in CSV file. Please ensure phone numbers are in a recognizable format.');
          return;
        }

        onUpdateRecipients(phones.join('\n'));
        alert(`Successfully imported ${phones.length} phone numbers from CSV`);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  // Fetch contacts from spreadsheet
  const fetchContacts = async (type) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/contacts/${type}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      
      const data = await response.json();
      
      if (type === 'active') {
        setContactsData(prev => ({ ...prev, active: data }));
      } else {
        setContactsData(prev => ({ ...prev, new: data }));
      }
      
    } catch (error) {
      console.error(`Error fetching ${type} contacts:`, error);
      alert(`Failed to fetch ${type} contacts. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle contact selection
  const handleContactSelect = (phone, isSelected) => {
    const newSelected = new Set(selectedContacts);
    if (isSelected) {
      newSelected.add(phone);
    } else {
      newSelected.delete(phone);
    }
    setSelectedContacts(newSelected);
  };

  // Apply selected contacts
  const applySelectedContacts = () => {
    const phones = Array.from(selectedContacts);
    const existingRecipients = recipients.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);
    const allRecipients = [...new Set([...existingRecipients, ...phones])];
    
    onUpdateRecipients(allRecipients.join('\n'));
    setSelectedContacts(new Set());
    setInputMethod("manual");
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const csvContent = "phone_number\n6281234567890\n6289876543210\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phone_numbers_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear recipients
  const handleClear = () => {
    onUpdateRecipients("");
    setSelectedContacts(new Set());
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onUpdateRecipients(clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Failed to read clipboard. Please paste manually.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Method Selection */}
      <Card>
        <Card.Header>
          <Card.Title>Recipients Input Method</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={inputMethod === "manual" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("manual")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Manual Input
            </Button>
            <Button
              variant={inputMethod === "csv" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("csv")}
            >
              <Upload className="h-4 w-4 mr-2" />
              CSV Upload
            </Button>
            <Button
              variant={inputMethod === "contacts" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("contacts")}
            >
              <Users className="h-4 w-4 mr-2" />
              From Contacts
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Input Content Based on Method */}
      <Card className="h-full">
        <Card.Header>
          <div className="flex justify-between items-center">
            <Card.Title>
              Recipients ({phoneValidation.summary.validCount > 0 ? `${phoneValidation.summary.validCount} valid` : '0'})
              {phoneValidation.summary.invalidCount > 0 && (
                <span className="text-red-600 ml-2">
                  ({phoneValidation.summary.invalidCount} invalid)
                </span>
              )}
            </Card.Title>
            {inputMethod === "manual" && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handlePaste} type="button">
                  Paste from Clipboard
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClear} type="button">
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card.Header>

        <Card.Content>
          {inputMethod === "manual" && (
            <div>
              <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">
                Enter phone numbers (one per line or comma-separated)
              </label>
              <textarea
                id="recipients"
                className={`w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  error ? "border-red-500" : ""
                }`}
                placeholder="Example:
6281234567890
6289876543210
or 6281234567890, 6289876543210"
                value={recipients}
                onChange={(e) => onUpdateRecipients(e.target.value)}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              
              {/* Phone validation feedback */}
              {phoneValidation.summary.total > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-4 text-sm">
                    {phoneValidation.summary.validCount > 0 && (
                      <span className="text-green-600">
                        ✅ {phoneValidation.summary.validCount} valid numbers
                      </span>
                    )}
                    {phoneValidation.summary.invalidCount > 0 && (
                      <span className="text-amber-600">
                        ⚠️ {phoneValidation.summary.invalidCount} numbers need fixing
                      </span>
                    )}
                    {phoneValidation.summary.validCount === 0 && phoneValidation.summary.invalidCount === 0 && phoneValidation.summary.total > 0 && (
                      <span className="text-gray-500">
                        📝 {phoneValidation.summary.total} numbers entered (validation pending...)
                      </span>
                    )}
                  </div>
                  
                  {phoneValidation.invalid.length > 0 && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-amber-600 hover:text-amber-800">
                          💡 Show suggestions for invalid numbers ({phoneValidation.invalid.length})
                        </summary>
                        <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-xs max-h-32 overflow-y-auto">
                          {phoneValidation.invalid.slice(0, 10).map((err, index) => (
                            <div key={index} className="mb-1">
                              <strong>Line {err.lineNumber}:</strong> "{err.input}" - {err.error}
                            </div>
                          ))}
                          {phoneValidation.invalid.length > 10 && (
                            <div className="text-gray-600">
                              ... and {phoneValidation.invalid.length - 10} more to review
                            </div>
                          )}
                          <div className="mt-2 text-amber-700 font-medium">
                            💡 Tip: Make sure numbers have at least 8-12 digits and use formats like: 081234567890, 6281234567890
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: {getPhoneFormatExamples().slice(0, 2).join(', ')}
              </p>
            </div>
          )}

          {inputMethod === "csv" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadCsvTemplate}
                  type="button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <span className="text-sm text-gray-500">
                  Download a sample CSV format
                </span>
              </div>
              
              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload CSV File
                </label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  CSV file should contain phone numbers. The system will automatically detect phone numbers in any column.
                </p>
              </div>

              {recipients && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imported Numbers Preview
                  </label>
                  <textarea
                    readOnly
                    value={recipients}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              )}
            </div>
          )}

          {inputMethod === "contacts" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fetchContacts('active')}
                  disabled={isLoading}
                  type="button"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Load Active Contacts ({contactsData.active.length})
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchContacts('new')}
                  disabled={isLoading}
                  type="button"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Load New Contacts ({contactsData.new.length})
                </Button>
              </div>

              {(contactsData.active.length > 0 || contactsData.new.length > 0) && (
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <div className="p-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Select contacts ({selectedContacts.size} selected)
                      </span>
                      {selectedContacts.size > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={applySelectedContacts}
                          type="button"
                        >
                          Apply Selected ({selectedContacts.size})
                        </Button>
                      )}
                    </div>
                    
                    {contactsData.active.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2">
                          Active Contacts ({contactsData.active.length})
                        </h4>
                        <div className="space-y-1">
                          {contactsData.active.map((contact, index) => (
                            <label key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.phone)}
                                onChange={(e) => handleContactSelect(contact.phone, e.target.checked)}
                                className="h-4 w-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{contact.name}</div>
                                <div className="text-xs text-gray-500">{contact.phone}</div>
                                {contact.platform && (
                                  <div className="text-xs text-blue-600">{contact.platform}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {contactsData.new.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-700 mb-2">
                          New Contacts ({contactsData.new.length})
                        </h4>
                        <div className="space-y-1">
                          {contactsData.new.map((contact, index) => (
                            <label key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.phone)}
                                onChange={(e) => handleContactSelect(contact.phone, e.target.checked)}
                                className="h-4 w-4 text-blue-600"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{contact.name}</div>
                                <div className="text-xs text-gray-500">{contact.phone}</div>
                                {contact.platform && (
                                  <div className="text-xs text-blue-600">{contact.platform}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading contacts...</p>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Batch Configuration with Recommendations */}
      {phoneValidation.summary.validCount > 0 && (
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <Card.Title>Batch Configuration</Card.Title>
              {recommendations && (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    recommendations.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    recommendations.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recommendations.riskLevel === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {recommendations.riskLevel === 'medium' && <Info className="h-3 w-3 mr-1" />}
                    {recommendations.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {recommendations.riskLevel.toUpperCase()} RISK
                  </span>
                  <InfoTooltip
                    title="Batch Configuration Recommendations"
                    description={`Based on ${parsedCount} recipients, here are our recommendations:`}
                    examples={[
                      `Recommended batch size: ${recommendations.batchSize}`,
                      `Recommended delay: ${Math.floor(recommendations.batchDelay / 60)} minutes between batches`,
                      `Estimated total time: ~${Math.floor(recommendations.estimatedTime / 60)} hours`,
                      ...recommendations.tips
                    ]}
                    position="left"
                  />
                </div>
              )}
            </div>
          </Card.Header>
          
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="batchSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Size
                  {recommendations && (
                    <span className="text-xs text-blue-600 ml-2">
                      (recommended: {recommendations.batchSize})
                    </span>
                  )}
                </label>
                <input
                  id="batchSize"
                  type="number"
                  min="1"
                  max="100"
                  value={batchSize}
                  onChange={(e) => onUpdateBatchSize(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of messages per batch
                </p>
              </div>

              <div>
                <label htmlFor="batchDelay" className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Delay (seconds)
                  {recommendations && (
                    <span className="text-xs text-blue-600 ml-2">
                      (recommended: {recommendations.batchDelay})
                    </span>
                  )}
                </label>
                <input
                  id="batchDelay"
                  type="number"
                  min="60"
                  max="3600"
                  value={batchDelay}
                  onChange={(e) => onUpdateBatchDelay(parseInt(e.target.value) || 300)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Delay between batches ({Math.floor(batchDelay / 60)} min {batchDelay % 60} sec)
                </p>
              </div>

              <div>
                <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Limit
                  {recommendations && (
                    <span className="text-xs text-blue-600 ml-2">
                      (recommended: {recommendations.dailyLimit})
                    </span>
                  )}
                </label>
                <input
                  id="dailyLimit"
                  type="number"
                  min="0"
                  max="10000"
                  value={dailyLimit}
                  onChange={(e) => onUpdateDailyLimit(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max messages per day (0 = no limit)
                </p>
              </div>
            </div>

            {recommendations && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Execution Summary:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Total Recipients:</span> {phoneValidation.summary.validCount}</p>
                    <p><span className="font-medium">Number of Batches:</span> {Math.ceil(phoneValidation.summary.validCount / batchSize)}</p>
                    <p><span className="font-medium">Messages per Batch:</span> {batchSize}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Batch Interval:</span> {Math.floor(batchDelay / 60)} minutes</p>
                    <p><span className="font-medium">Estimated Duration:</span> ~{Math.floor(recommendations.estimatedTime / 60)} hours</p>
                    <p><span className="font-medium">Daily Throughput:</span> {dailyLimit > 0 ? dailyLimit : 'Unlimited'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  );
};

export default EnhancedRecipientInput;