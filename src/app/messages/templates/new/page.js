// src/app/messages/templates/new/page.js
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/templates/PageLayout";
import TemplateForm from "@/components/organisms/TemplateForm";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTemplatePage() {
  const router = useRouter();

  // Define page actions
  const pageActions = (
    <Button
      variant="secondary"
      onClick={() => router.push("/messages/templates")}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back to Templates
    </Button>
  );

  return (
    <PageLayout
      title="Create New Template"
      description="Create a new message template for your WhatsApp campaigns"
      actions={pageActions}
    >
      <div className="space-y-6">
        <TemplateForm />
      </div>
    </PageLayout>
  );
}
