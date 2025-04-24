// src/components/templates/PageLayout/index.js
import React from "react";
import Header from "@/components/organisms/Header";

const PageLayout = ({ children, title, description, actions = null }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {title && (
            <div className="mb-6">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9">
                    {title}
                  </h1>
                  {description && (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                  )}
                </div>
                {actions && (
                  <div className="mt-4 flex md:mt-0 md:ml-4">{actions}</div>
                )}
              </div>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
