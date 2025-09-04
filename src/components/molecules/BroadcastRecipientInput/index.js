// src/components/molecules/BroadcastRecipientInput/index.js
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import InfoTooltip from "@/components/molecules/InfoTooltip";
import ContactSelector from "@/components/molecules/ContactSelector";
import { batchValidatePhones, getPhoneFormatExamples } from "@/lib/utils/phoneValidator";
import { 
  Upload, 
  Users, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  FileText,
  Download,
  X,
  PlusCircle
} from "lucide-react";

const BroadcastRecipientInput = ({
  selectedContacts,
  setSelectedContacts,
  manualRecipients,
  setManualRecipients,
  handleContactsSelected,
  parseManualRecipients,
  getAllRecipients,
  isSubmitting,
  handlePrevStep,
  handleNextStep,
}) => {
  const [inputMethod, setInputMethod] = useState("manual"); // manual, csv, contacts
  const [isLoading, setIsLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [contactsData, setContactsData] = useState({ active: [], new: [] });
  const [selectedCsvContacts, setSelectedCsvContacts] = useState(new Set());
  const [phoneValidation, setPhoneValidation] = useState({ valid: [], invalid: [], summary: { total: 0, validCount: 0, invalidCount: 0 } });
  const [showContactSelector, setShowContactSelector] = useState(false);

  // Debounced validation - only validate after user stops typing
  useEffect(() => {
    if (!manualRecipients || manualRecipients.trim() === '') {
      setPhoneValidation({ valid: [], invalid: [], summary: { total: 0, validCount: 0, invalidCount: 0 } });
      return;
    }

    // Add a small delay to avoid validating while actively typing
    const timeoutId = setTimeout(() => {
      // Only validate lines that look complete (at least 8 digits)
      const lines = manualRecipients.split(/[\n,;]+/).map(line => line.trim()).filter(line => line.length > 0);
      
      // Filter out incomplete lines (less than 8 characters - likely still typing)
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
  }, [manualRecipients]);

  // Calculate recommendations based on recipient count
  const getRecommendations = () => {
    const totalRecipients = getAllRecipients().length;
    
    if (totalRecipients === 0) return null;

    let recommendations = {
      estimatedTime: 0,
      riskLevel: "low",
      tips: []
    };

    if (totalRecipients <= 50) {
      recommendations.riskLevel = "low";
      recommendations.estimatedTime = Math.ceil(totalRecipients * 3 / 60); // 3 seconds per message
      recommendations.tips = [
        "Small batch - messages will be sent quickly",
        "Low risk of rate limiting",
        "Good for testing campaigns"
      ];
    } else if (totalRecipients <= 200) {
      recommendations.riskLevel = "medium";
      recommendations.estimatedTime = Math.ceil(totalRecipients * 5 / 60); // 5 seconds per message
      recommendations.tips = [
        "Medium batch - monitor sending progress",
        "Consider using scheduling for optimal timing",
        "Watch for delivery rates"
      ];
    } else {
      recommendations.riskLevel = "high";
      recommendations.estimatedTime = Math.ceil(totalRecipients * 8 / 60); // 8 seconds per message
      recommendations.tips = [
        "Large batch - consider scheduling instead",
        "High risk of rate limiting if sent immediately",
        "Recommend splitting into smaller campaigns",
        "Monitor WhatsApp session health closely"
      ];
    }

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

        // Add to manual recipients instead of replacing
        const existingNumbers = manualRecipients ? manualRecipients + '\n' : '';
        setManualRecipients(existingNumbers + phones.join('\n'));
        setInputMethod("manual"); // Switch to manual view to see the imported numbers
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

  // Handle contact selection from spreadsheet
  const handleSpreadsheetContactSelect = (phone, isSelected) => {
    const newSelected = new Set(selectedCsvContacts);
    if (isSelected) {
      newSelected.add(phone);
    } else {
      newSelected.delete(phone);
    }
    setSelectedCsvContacts(newSelected);
  };

  // Apply selected contacts from spreadsheet
  const applySpreadsheetContacts = () => {
    const phones = Array.from(selectedCsvContacts);
    const existingNumbers = manualRecipients ? manualRecipients + '\n' : '';
    setManualRecipients(existingNumbers + phones.join('\n'));
    setSelectedCsvContacts(new Set());
    setInputMethod("manual");
    alert(`Added ${phones.length} contacts to recipients list`);
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
    setManualRecipients("");
    setSelectedContacts([]);
    setSelectedCsvContacts(new Set());
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const existingNumbers = manualRecipients ? manualRecipients + '\n' : '';
      setManualRecipients(existingNumbers + clipboardText);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("Failed to read clipboard. Please paste manually.");
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">Pilih Penerima</h3>

      {/* Input Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Metode Input Penerima</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button
              variant={inputMethod === "manual" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("manual")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Manual
            </Button>
            <Button
              variant={inputMethod === "csv" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("csv")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button
              variant={inputMethod === "spreadsheet" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setInputMethod("spreadsheet")}
            >
              <Users className="h-4 w-4 mr-2" />
              Dari Spreadsheet
            </Button>
            <Button
              variant={inputMethod === "contacts" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setInputMethod("contacts");
                setShowContactSelector(true);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Pilih Kontak
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Content Based on Method */}
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Penerima ({getAllRecipients().length > 0 ? `${getAllRecipients().length} total` : '0'})
            </CardTitle>
            {(inputMethod === "manual" || inputMethod === "csv") && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handlePaste} type="button">
                  Paste
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClear} type="button">
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {(inputMethod === "manual" || inputMethod === "csv") && (
            <div>
              <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">
                Masukkan nomor telepon (satu per baris atau pisahkan dengan koma)
              </label>
              <textarea
                id="recipients"
                className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh:
08123456789
08987654321
atau: 08123456789, 08987654321"
                value={manualRecipients}
                onChange={(e) => setManualRecipients(e.target.value)}
                disabled={isSubmitting}
              />
              
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
                            💡 Tip: Format yang didukung: 081234567890, 6281234567890
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
              
              <p className="mt-1 text-xs text-gray-500">
                Format yang didukung: {getPhoneFormatExamples().slice(0, 2).join(', ')}
              </p>
            </div>
          )}

          {inputMethod === "csv" && (
            <div className="space-y-4 mt-4">
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
                  Download contoh format CSV
                </span>
              </div>
              
              <div>
                <label htmlFor="csv-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File CSV
                </label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  File CSV harus berisi nomor telepon. System akan otomatis mendeteksi nomor di kolom manapun.
                </p>
              </div>
            </div>
          )}

          {inputMethod === "spreadsheet" && (
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
                        Select contacts ({selectedCsvContacts.size} selected)
                      </span>
                      {selectedCsvContacts.size > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={applySpreadsheetContacts}
                          type="button"
                        >
                          Add Selected ({selectedCsvContacts.size})
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
                                checked={selectedCsvContacts.has(contact.phone)}
                                onChange={(e) => handleSpreadsheetContactSelect(contact.phone, e.target.checked)}
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
                                checked={selectedCsvContacts.has(contact.phone)}
                                onChange={(e) => handleSpreadsheetContactSelect(contact.phone, e.target.checked)}
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

          {inputMethod === "contacts" && showContactSelector && (
            <div className="mt-4 border border-gray-200 rounded-md p-4 bg-white">
              <ContactSelector onSelectContacts={handleContactsSelected} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Selected Contacts from Contact Selector */}
      {selectedContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kontak Terpilih ({selectedContacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedContacts.map((contact, index) => (
                <div
                  key={`${contact.id || contact.phone}-${index}`}
                  className="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm"
                >
                  <span className="truncate max-w-[150px]">{contact.name}</span>
                  <button
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                    onClick={() => {
                      setSelectedContacts((prev) =>
                        prev.filter((c) => c.phone !== contact.phone)
                      );
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && getAllRecipients().length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Rekomendasi Broadcast</CardTitle>
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
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Total Penerima:</span> {getAllRecipients().length}</p>
                  <p><span className="font-medium">Estimasi Waktu:</span> ~{recommendations.estimatedTime} menit</p>
                </div>
                <div>
                  <p><span className="font-medium">Tingkat Risiko:</span> {recommendations.riskLevel.toUpperCase()}</p>
                  {recommendations.riskLevel === 'high' && (
                    <p><span className="font-medium text-amber-600">Saran:</span> Gunakan scheduling</p>
                  )}
                </div>
              </div>
              
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recommendations.tips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={getAllRecipients().length === 0 || isSubmitting}
        >
          Lanjutkan ({getAllRecipients().length})
        </Button>
      </div>
    </div>
  );
};

export default BroadcastRecipientInput;