"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

export default function CSVUploader({ onRecipientsLoaded, className = "" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParseResult(null);
      setError(null);
      uploadAndParseCSV(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.includes('csv')) {
      setFile(droppedFile);
      setParseResult(null);
      setError(null);
      uploadAndParseCSV(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const uploadAndParseCSV = async (fileToUpload) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/ab-testing/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse CSV');
      }

      setParseResult(result.data);
      
      // Notify parent component
      if (onRecipientsLoaded) {
        onRecipientsLoaded(result.data.recipients);
      }

    } catch (err) {
      setError(err.message);
      setParseResult(null);
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = async () => {
    try {
      const response = await fetch('/api/ab-testing/upload-csv');
      const data = await response.json();
      
      const blob = new Blob([data.sampleCSV], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample-recipients.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download sample CSV:', err);
    }
  };

  const clearFile = () => {
    setFile(null);
    setParseResult(null);
    setError(null);
    setShowErrors(false);
    setShowPreview(false);
    if (onRecipientsLoaded) {
      onRecipientsLoaded([]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            CSV Upload - Recipients
          </div>
          <InfoTooltip
            title="CSV Format Guidelines"
            description="Upload a CSV file with phone numbers for this variant. The system automatically converts Indonesian phone numbers to international format."
            examples={[
              "Required columns: Name, Phone Number",
              "Accepted phone formats (all auto-converted):",
              "• 081234567890 (common Indonesian format)",
              "• 8123456789 (without leading 0)",
              "• +6281234567890 (international format)",
              "• 6281234567890 (with country code)",
              "",
              "CSV example:",
              "Name,Phone Number",
              "John Doe,081234567890",
              "Jane Smith,8987654321",
              "Budi,+6281122334455",
              "",
              "File requirements:",
              "• UTF-8 encoding recommended",
              "• Max file size: 5MB",
              "• Max 10,000 recipients per variant"
            ]}
            position="left"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          // Upload area
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload CSV File
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Choose CSV File
              </label>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={downloadSampleCSV}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Sample CSV
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Required columns: <strong>Name</strong> and <strong>Phone Number</strong></p>
              <p>Supported formats: CSV only, max 5MB</p>
              <p className="mt-1 text-blue-600">💡 Hover the help icon above for detailed CSV format guidelines</p>
            </div>
          </div>
        ) : (
          // File uploaded
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload status */}
            {uploading && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Processing CSV...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Success result */}
            {parseResult && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <div className="text-green-700 text-sm">
                      <p className="font-medium">CSV processed successfully!</p>
                      <p>
                        Loaded {parseResult.processedRows} recipients from {parseResult.totalRows} rows
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column mapping */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Column Mapping
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-blue-700">
                      <strong>Name:</strong> {parseResult.columns.name}
                    </div>
                    <div className="text-blue-700">
                      <strong>Phone:</strong> {parseResult.columns.phone}
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {parseResult.errors && parseResult.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-yellow-900">
                        {parseResult.errors.length} Row(s) Skipped
                      </h4>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowErrors(!showErrors)}
                      >
                        {showErrors ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showErrors && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {parseResult.errors.map((error, index) => (
                          <p key={index} className="text-xs text-yellow-700">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Preview */}
                {parseResult.recipients.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Recipients Preview ({parseResult.recipients.length} total)
                      </h4>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Show Preview
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {showPreview && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {parseResult.recipients.slice(0, 5).map((recipient, index) => (
                          <div key={index} className="flex justify-between text-xs text-gray-600 bg-white px-2 py-1 rounded">
                            <span className="font-medium">{recipient.name}</span>
                            <span className="text-gray-500">{recipient.phoneNumber}</span>
                          </div>
                        ))}
                        {parseResult.recipients.length > 5 && (
                          <p className="text-xs text-gray-500 text-center">
                            ... and {parseResult.recipients.length - 5} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}