"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import { formatMessageContent } from "@/lib/templates/templateUtils";
import PageLayout from "@/components/templates/PageLayout";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  Copy,
  Trash,
  MessageSquare,
  Tag,
  FileText,
} from "lucide-react";

export default function TemplateDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const { fetchTemplateById, deleteTemplate, isLoading, error } =
    useTemplateDatabase();

  const [template, setTemplate] = useState(null);
  const [formattedContent, setFormattedContent] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      const templateData = await fetchTemplateById(parseInt(id, 10));
      if (templateData) {
        setTemplate(templateData);
        setFormattedContent(formatMessageContent(templateData.content));
      }
    };

    loadTemplate();
  }, [id, fetchTemplateById]);

  // Handle edit
  const handleEdit = () => {
    router.push(`/templates/edit/${id}`);
  };

  // Handle duplicate
  const handleDuplicate = () => {
    // Navigate to new template page with template data as state
    router.push(`/templates/new?duplicate=${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (window.confirm("Yakin ingin menghapus template ini?")) {
      setIsDeleting(true);
      try {
        const success = await deleteTemplate(parseInt(id, 10));
        if (success) {
          router.push("/templates/list");
        }
      } finally {
        setIsDeleting(false);
      }
    }
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
        onClick={() => router.push("/templates/list")}
        leftIcon={<ArrowLeft className="h-4 w-4 mr-1" />}
      >
        Kembali
      </Button>
      <Button
        variant="primary"
        onClick={handleEdit}
        leftIcon={<Edit className="h-4 w-4 mr-1" />}
      >
        Edit
      </Button>
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
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <Card>
          <Card.Content>
            <div className="bg-red-50 p-4 rounded-md text-red-700">
              <h3 className="font-medium">Error</h3>
              <p>{error}</p>
              <Button
                variant="secondary"
                onClick={() => router.push("/templates/list")}
                className="mt-4"
              >
                Kembali ke Daftar Template
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : !template ? (
        <Card>
          <Card.Content>
            <div className="text-center py-10">
              <p className="text-gray-500">Template tidak ditemukan</p>
              <Button
                variant="secondary"
                onClick={() => router.push("/templates/list")}
                className="mt-4"
              >
                Kembali ke Daftar Template
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <Card.Content>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {template.name}
                </h2>
                <Badge
                  variant={
                    template.category === "marketing" ? "primary" : "secondary"
                  }
                >
                  {getCategoryLabel(template.category)}
                </Badge>
              </div>

              {template.description && (
                <p className="text-gray-600 mb-4">{template.description}</p>
              )}

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
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Template preview */}
              <div className="mb-4">
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
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  leftIcon={<Trash className="h-4 w-4 mr-1" />}
                >
                  {isDeleting ? "Menghapus..." : "Hapus Template"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDuplicate}
                  leftIcon={<Copy className="h-4 w-4 mr-1" />}
                >
                  Duplikasi
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEdit}
                  leftIcon={<Edit className="h-4 w-4 mr-1" />}
                >
                  Edit Template
                </Button>
              </div>
            </Card.Content>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
