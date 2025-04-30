// src/app/messages/broadcast/page.js
"use client";

import React from "react";
import PageLayout from "@/components/templates/PageLayout";
import TemplateMessageSender from "@/components/organisms/TemplateMessageSender";

export default function BroadcastPage() {
  return (
    <PageLayout
      title="Broadcast Message"
      description="Send messages to multiple WhatsApp contacts"
    >
      {/* Template Message Sender Component */}
      <TemplateMessageSender />
    </PageLayout>
  );
}
