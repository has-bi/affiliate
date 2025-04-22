// src/components/templates/TemplatesPageTemplate/index.js
"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import TemplateManager from "@/components/organisms/TemplateManager";

/**
 * TemplatesPageTemplate - Template for displaying the templates management page
 */
const TemplatesPageTemplate = ({ templates, selectedId }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Message Templates</h1>
              <p className="text-green-100 text-sm">
                Create and manage message templates for your campaigns
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <TemplateManager
          initialTemplates={templates}
          initialSelectedId={selectedId}
        />
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Message Template Manager &#169; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default TemplatesPageTemplate;
