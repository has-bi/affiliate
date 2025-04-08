// app/template-broadcast/page.js
import TemplateBroadcastTemplate from "../../components/templates/TemplateBroadcastTemplate";

export const metadata = {
  title: "Template Broadcast | WAHA Control Panel",
  description:
    "Create and send templated messages to multiple WhatsApp contacts",
};

export default function TemplateBroadcastPage() {
  return <TemplateBroadcastTemplate />;
}
