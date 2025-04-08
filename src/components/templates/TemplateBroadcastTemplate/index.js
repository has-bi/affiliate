// components/templates/TemplateBroadcastTemplate/index.js
"use client";

import React from "react";
import Header from "../../organisms/Header";
import BroadcastTemplateForm from "../../organisms/BroadcastTemplateForm";

const TemplateBroadcastTemplate = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9">
                Template Broadcast
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and send templated messages to multiple contacts
              </p>
            </div>
          </div>

          <BroadcastTemplateForm />
        </div>
      </main>
    </div>
  );
};

export default TemplateBroadcastTemplate;
