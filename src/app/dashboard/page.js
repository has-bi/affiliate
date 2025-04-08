// app/dashboard/page.js
import DashboardTemplate from "../../components/templates/DashboardTemplate";

export const metadata = {
  title: "Dashboard | WAHA Control Panel",
  description: "Manage your WhatsApp sessions",
};

export default function DashboardPage() {
  return <DashboardTemplate />;
}
