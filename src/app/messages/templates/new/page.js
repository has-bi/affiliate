// app/templates/new/page.js
import { Suspense } from "react";
import { MessageSquare, Plus } from "lucide-react";
import TemplateForm from "@/components/organisms/TemplateForm";

export const metadata = {
  title: "Create New Template",
  description: "Create a new message template",
};

export default function NewTemplatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Create New Template</h1>
              <p className="text-green-100 text-sm">
                Create a new message template for your campaigns
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<div>Loading form...</div>}>
          <TemplateForm />
        </Suspense>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Message Template Manager &#169; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
