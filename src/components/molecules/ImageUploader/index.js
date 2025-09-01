"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Image as ImageIcon, 
  X,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import InfoTooltip from "@/components/molecules/InfoTooltip";

export default function ImageUploader({ onImageSelected, selectedImage, className = "" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(selectedImage?.url || "");

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, []);

  const handleDrop = useCallback(async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadFile(file);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const uploadFile = async (file) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/messages/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      const imageData = {
        url: result.url,
        filename: file.name,
        size: file.size,
        type: file.type
      };

      setImageUrl(result.url);
      if (onImageSelected) {
        onImageSelected(imageData);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    
    if (url && onImageSelected) {
      onImageSelected({
        url: url,
        filename: 'External Image',
        size: 0,
        type: 'image/external'
      });
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setError(null);
    if (onImageSelected) {
      onImageSelected(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2" />
            Image Attachment (Optional)
          </div>
          <InfoTooltip
            title="Image Upload Guidelines"
            description="Add an image to your broadcast message. Images will be sent before the text message."
            examples={[
              "Supported formats: JPG, PNG, GIF, WebP",
              "Maximum file size: 5MB",
              "Recommended: 1080x1080px or smaller",
              "Images sent before text message",
              "",
              "Upload methods:",
              "• Upload file from computer",
              "• Enter direct image URL",
              "• Drag and drop image file"
            ]}
            position="left"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
              disabled={uploading}
            />
            {imageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">OR</div>

        {/* File Upload */}
        {!imageUrl ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 mb-2">
              Drag and drop an image here, or click to browse
            </p>
            
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label 
              htmlFor="image-upload" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Choose Image
            </label>

            <div className="mt-2 text-xs text-gray-500">
              <p>Supported: JPG, PNG, GIF, WebP • Max 5MB</p>
            </div>
          </div>
        ) : (
          /* Image Preview */
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Image selected</span>
                {selectedImage?.url && (
                  <a 
                    href={selectedImage.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
            
            {/* Image preview */}
            <div className="border rounded-lg overflow-hidden max-w-xs mx-auto">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-auto max-h-48 object-cover"
                onError={(e) => {
                  setError("Failed to load image");
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Upload status */}
        {uploading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm">Uploading image...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}