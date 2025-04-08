// app/broadcasts/page.js
import BroadcastTemplate from "../../components/templates/BroadcastTemplate";

export const metadata = {
  title: "Broadcast Messages | WAHA Control Panel",
  description: "Send messages to multiple WhatsApp contacts",
};

export default function BroadcastsPage() {
  return <BroadcastTemplate />;
}
