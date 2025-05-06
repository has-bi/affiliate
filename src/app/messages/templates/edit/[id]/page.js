// src/app/messages/templates/edit/[id]/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/templates/PageLayout";
import TemplateForm from "@/components/organisms/TemplateForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditTemplatePage({ params }) {
  const router = useRouter();

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  // Get ID safely from unwrapped params
  const id = parseInt(unwrappedParams.id, 10);

  return (
    <PageLayout
      title={isNaN(id) ? "Create Template" : "Edit Template"}
      description={
        isNaN(id) ? "Create a new message template" : `Edit template ID: ${id}`
      }
      actions={
        <Button
          variant="secondary"
          onClick={() => router.push("/messages/templates")}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Templates
        </Button>
      }
    >
      <div className="space-y-6">
        <TemplateForm templateId={id} />
      </div>
    </PageLayout>
  );
}
