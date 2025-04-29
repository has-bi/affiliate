// components/molecules/MessagePreview/index.js
"use client";

import React from "react";
import { Card } from "@/components/ui/card";

const MessagePreview = ({ preview, isValid }) => {
  // Function to process the message text with markdown-like syntax
  const processMessageText = (text) => {
    if (!text) return [];

    // Split by lines
    const lines = text.split("\n");

    return lines.map((line, index) => {
      // Process bold text: replace **text** with <strong>text</strong>
      let processedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Process italic text: replace *text* with <em>text</em> (but not if it's already part of **)
      processedLine = processedLine.replace(
        /(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g,
        "<em>$1</em>"
      );

      // Process links
      processedLine = processedLine.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      return (
        <div
          key={index}
          className={index > 0 ? "mt-1" : ""}
          dangerouslySetInnerHTML={{ __html: processedLine || "&nbsp;" }}
        />
      );
    });
  };

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title>Message Preview</Card.Title>
      </Card.Header>

      <Card.Content>
        {!preview ? (
          <p className="text-gray-500 italic">
            No preview available. Please select a template.
          </p>
        ) : (
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200 relative">
            {!isValid && (
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Preview Mode
                </span>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              {processMessageText(preview)}
            </div>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default MessagePreview;
