// src/app/contacts/onboarding/page.js
"use client";

import React from "react";
import PageLayout from "@/components/templates/PageLayout";
import OnboardingAffiliatesList from "@/components/organisms/OnboardingAffiliatesList";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function OnboardingAffiliatesPage() {
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
      title="Onboarding Affiliates"
      description="Process new affiliates waiting for approval"
      actions={pageActions}
    >
      <OnboardingAffiliatesList />
    </PageLayout>
  );
}
