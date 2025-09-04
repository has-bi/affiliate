// Enhanced version with CSV upload
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Download } from "lucide-react";

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
  const [inputMethod, setInputMethod] = useState("manual"); // manual or csv

  // Handle CSV file upload
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    
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

        // Add to existing manual recipients
        const existingNumbers = manualRecipients ? manualRecipients + '\n' : '';
        setManualRecipients(existingNumbers + phones.join('\n'));
        alert(`Successfully imported ${phones.length} phone numbers from CSV`);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const csvContent = "phone_number\n6281234567890\n6289876543210\n6287654321098\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'phone_numbers_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">Pilih Penerima</h3>

      {/* Input Method Selection */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Metode Input:</h4>
        <div className="flex gap-2">
          <Button
            variant={inputMethod === "manual" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInputMethod("manual")}
            type="button"
          >
            <FileText className="h-4 w-4 mr-2" />
            Manual Input
          </Button>
          <Button
            variant={inputMethod === "csv" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setInputMethod("csv")}
            type="button"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </Button>
        </div>
      </div>
      
      {/* Content based on selected method */}
      {inputMethod === "manual" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nomor Penerima Manual (satu per baris atau pisahkan dengan koma)
          </label>
          <textarea
            value={manualRecipients}
            onChange={(e) => setManualRecipients(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Contoh:
08123456789
08987654321
6281234567890

atau pisahkan dengan koma: 08123456789, 08987654321"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Jumlah nomor: {parseManualRecipients().length}
          </p>
        </div>
      )}

      {inputMethod === "csv" && (
        <div className="space-y-4">
          {/* Download template */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <Button
              variant="secondary"
              size="sm"
              onClick={downloadCsvTemplate}
              type="button"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <span className="text-sm text-blue-700">
              Download contoh format CSV terlebih dahulu
            </span>
          </div>
          
          {/* CSV Upload */}
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

          {/* Show imported numbers */}
          {manualRecipients && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor yang Diimpor ({parseManualRecipients().length} nomor):
              </label>
              <textarea
                value={manualRecipients}
                onChange={(e) => setManualRecipients(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nomor akan muncul di sini setelah upload CSV..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Anda dapat mengedit nomor ini jika diperlukan.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button type="button" variant="secondary" onClick={handlePrevStep}>
          Kembali
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleNextStep}
          disabled={getAllRecipients().length === 0}
        >
          Lanjutkan ({getAllRecipients().length})
        </Button>
      </div>
    </div>
  );
};

export default BroadcastRecipientInput;