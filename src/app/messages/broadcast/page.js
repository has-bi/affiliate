// app/messages/broadcast/page.js
"use client";

import React, { useState } from "react";
import PageLayout from "@/components/templates/PageLayout";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import TemplateMessageSender from "@/components/organisms/TemplateMessageSender";
import { MessageSquare, FileText } from "lucide-react";

export default function BroadcastPage() {
  const [mode, setMode] = useState("template"); // We'll default to template since it's the main functionality

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
