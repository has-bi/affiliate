"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  MessageSquare,
  Edit,
  Trash,
  MoreHorizontal,
} from "lucide-react";
import { useTemplateDatabase } from "@/hooks/useTemplateDatabase";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import PageLayout from "@/components/templates/PageLayout";

export default function TemplateListPage() {
  const router = useRouter();
  const { fetchTemplates, deleteTemplate, isLoading, error } =
    useTemplateDatabase();
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      const data = await fetchTemplates();
      setTemplates(data);
    };

    loadTemplates();
  }, [fetchTemplates]);

  // Get unique categories
  const categories = [
    { id: "all", name: "Semua Kategori" },
    ...Array.from(new Set(templates.map((t) => t.category)))
      .filter(Boolean)
      .map((category) => ({
        id: category,
        name: category.charAt(0).toUpperCase() + category.slice(1),
      })),
  ];

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle template selection
  const handleSelectTemplate = (id) => {
    router.push(`/templates/edit/${id}`);
  };

  // Handle template deletion
  const handleDeleteTemplate = async (e, id) => {
    e.stopPropagation(); // Prevent navigation to edit page

    if (window.confirm("Yakin mau hapus template ini?")) {
      setIsDeleting(true);
      try {
        const success = await deleteTemplate(id);
        if (success) {
          setTemplates((prev) => prev.filter((t) => t.id !== id));
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
      month: "short",
      day: "numeric",
    });
  };

  // Preview template content (truncated)
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Define page actions
  const pageActions = (
    <Button
      variant="primary"
      onClick={() => router.push("/templates/new")}
      leftIcon={<Plus className="h-4 w-4 mr-1" />}
    >
      Template Baru
    </Button>
  );

  return (
    <PageLayout
      title="Template Pesan"
      description="Kelola template pesan WhatsApp untuk berbagai keperluan"
      actions={pageActions}
    >
      <Card>
        <Card.Header>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Search input */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          {error && (
            <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start mb-4">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Error loading templates</h3>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-md">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada template ditemukan
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterCategory !== "all"
                  ? "Coba ubah filter pencarian Anda"
                  : "Mulai dengan membuat template pesan baru"}
              </p>
              <Button
                variant="primary"
                onClick={() => router.push("/templates/new")}
                leftIcon={<Plus className="h-4 w-4 mr-1" />}
              >
                Buat Template Baru
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nama Template
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Kategori
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Preview
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Update Terakhir
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTemplates.map((template) => (
                    <tr
                      key={template.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectTemplate(template.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {template.parameters?.length || 0} parameter
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            template.category === "marketing"
                              ? "primary"
                              : "secondary"
                          }
                          size="sm"
                        >
                          {template.category || "general"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {truncateContent(template.content)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTemplate(template.id);
                            }}
                            title="Edit Template"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) =>
                              handleDeleteTemplate(e, template.id)
                            }
                            disabled={isDeleting}
                            title="Hapus Template"
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>
    </PageLayout>
  );
}
