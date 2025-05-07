"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import TemplateManager from "@/components/organisms/TemplateManager";
import PageLayout from "@/components/templates/PageLayout";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Create a separate component for the search params functionality
function TemplateContent() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  // Get the id param
  const selectedId = searchParams ? parseInt(searchParams.get("id"), 10) : null;

  useEffect(() => {
    if (!hasFetchedRef.current) {
      const fetchTemplates = async () => {
        try {
          setIsLoading(true);
          const response = await fetch("/api/templates");
          if (response.ok) {
            const data = await response.json();
            setTemplates(data);
          }
        } catch (error) {
          console.error("Error fetching templates:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTemplates();
      hasFetchedRef.current = true;
    }
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <TemplateManager templates={templates} selectedId={selectedId} />
      )}
    </>
  );
}

export default function TemplatesClientPage() {
  // Define page actions
  const pageActions = (
    <Button
      variant="primary"
      href="/messages/templates/new"
      className={"hidden"}
    >
      <Plus className="h-4 w-4 mr-1" />
      New Template
    </Button>
  );

  return (
    <PageLayout
      title="Message Templates"
      description="Create and manage message templates for your WhatsApp campaigns"
      actions={pageActions}
    >
      <Suspense
        fallback={
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <TemplateContent />
      </Suspense>
    </PageLayout>
  );
}
