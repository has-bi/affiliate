// app/messages/templates/detail/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplate } from "@/hooks/useTemplate";
import { formatMessageContent } from "@/lib/templates/templateUtils";
import PageLayout from "@/components/templates/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  Copy,
  Trash,
  MessageSquare,
  Tag,
  Send,
  AlertCircle,
} from "lucide-react";
import React from "react";

export default function TemplateDetailPage({ params }) {
  const router = useRouter();
  const { templates, isLoading, error, deleteTemplate, duplicateTemplate } =
    useTemplate();

  // Use React.use to unwrap the params Promise
  const unwrappedParams = React.use(params);
  // Get ID safely from unwrapped params
  const id = parseInt(unwrappedParams.id, 10);

  // Local state
  const [isDeleting, setIsDeleting] = useState(false);

  // Find the template from the templates array instead of using fetchTemplateById
  const template = templates.find((t) => t.id === id);
  const formattedContent = template
    ? formatMessageContent(template.content)
    : "";

  // Handler functions
  const handleEdit = () => {
    router.push(`/messages/templates/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setIsDeleting(true);
      try {
        const success = await deleteTemplate(id);
        if (success) {
          router.push("/messages/templates");
        }
      } catch (error) {
        console.error("Error deleting template:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUseTemplate = () => {
    router.push(`/messages/broadcast?template=${id}`);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const categories = {
      general: "Umum",
      marketing: "Marketing",
      onboarding: "Onboarding",
      education: "Edukasi",
      recognition: "Pengakuan",
      promotion: "Promosi",
    };

    return categories[category] || category;
  };

  // Get parameter type label
  const getParameterTypeLabel = (type) => {
    const types = {
      text: "Teks",
      url: "URL/Link",
      number: "Angka",
      date: "Tanggal",
    };

    return types[type] || type;
  };

  // Define page actions
  const pageActions = (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        onClick={() => router.push("/messages/templates")}
        className="flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Kembali
      </Button>
      {template && (
        <Button
          variant="primary"
          onClick={handleEdit}
          className="flex items-center"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout
      title={`Detail Template: ${template?.name || "Loading..."}`}
      description="Lihat detail template pesan"
      actions={pageActions}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push("/messages/templates")}
            className="mt-4"
          >
            Kembali ke Daftar Template
          </Button>
        </Card>
      ) : !template ? (
        <Card className="p-6">
          <div className="text-center py-10">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-3">Template tidak ditemukan</p>
            <p className="text-sm text-gray-400 mb-4">
              Template dengan ID {id} tidak ditemukan dalam database
            </p>
            <Button
              variant="secondary"
              onClick={() => router.push("/messages/templates")}
            >
              Kembali ke Daftar Template
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {template.name}
                </h2>
                {template.description && (
                  <p className="text-gray-600 mt-1">{template.description}</p>
                )}
              </div>
              <Badge
                variant={
                  template.category === "marketing" ? "primary" : "secondary"
                }
              >
                {getCategoryLabel(template.category)}
              </Badge>
            </div>

            {/* Template metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <Tag className="h-4 w-4 mr-1" />
                  <span>Kategori</span>
                </div>
                <div className="font-medium">
                  {getCategoryLabel(template.category) || "Umum"}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Dibuat</span>
                </div>
                <div className="font-medium">
                  {formatDate(template.createdAt)}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Diperbarui</span>
                </div>
                <div className="font-medium">
                  {formatDate(template.updatedAt)}
                </div>
              </div>
            </div>

            {/* Template parameters */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-gray-500" />
                Parameter Template ({template.parameters?.length || 0})
              </h3>
              {!template.parameters || template.parameters.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  Tidak ada parameter yang didefinisikan
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {template.parameters.map((param) => (
                    <div
                      key={param.id}
                      className="border border-gray-200 rounded-md p-3"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800">
                          {param.name}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {getParameterTypeLabel(param.type)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Parameter ID:{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {param.id}
                        </code>
                      </div>
                      {param.placeholder && (
                        <div className="text-xs text-gray-500 mt-1">
                          Placeholder: {param.placeholder}
                        </div>
                      )}
                      {param.required && (
                        <div className="text-xs text-red-500 mt-1">
                          Wajib diisi
                        </div>
                      )}
                      {param.isDynamic && (
                        <div className="text-xs text-blue-500 mt-1">
                          Otomatis (dari data kontak)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Template preview */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                Preview Pesan
              </h3>
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: formattedContent }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                * Parameter akan ditampilkan dalam kurung kurawal{" "}
                {"{parameter_id}"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center"
              >
                <Trash className="h-4 w-4 mr-1" />
                {isDeleting ? "Menghapus..." : "Hapus Template"}
              </Button>
              <Button
                variant="primary"
                onClick={handleUseTemplate}
                className="flex items-center"
              >
                <Send className="h-4 w-4 mr-1" />
                Gunakan Template
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
