// src/app/contacts/affiliates/page.js
"use client";

import React from "react";
import PageLayout from "@/components/templates/PageLayout";
import AffiliatesList from "@/components/organisms/AffiliatesList";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ActiveAffiliatesPage() {
  const router = useRouter();

  // Define page actions
  const pageActions = (
    <Button
      variant="secondary"
      onClick={() => router.push("/contacts")}
      className="flex items-center"
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      Back
    </Button>
  );

  return (
    <PageLayout
      title="Active Affiliates"
      description="Manage your active affiliates"
      actions={pageActions}
    >
      <AffiliatesList status="active" />
    </PageLayout>
  );
}
