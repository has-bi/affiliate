import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Edit,
  Trash,
  Copy,
  Send,
  Save,
  X,
  Calendar,
  Clock,
  Users,
  Tag,
  ChevronDown,
  Search,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import templatesData from "@/data/message-templates.json";

// Sample data untuk trigger types
const TRIGGER_TYPES = [
  { id: "date", name: "Specific Date", icon: <Calendar className="h-4 w-4" /> },
  {
    id: "recurring",
    name: "Recurring Monthly",
    icon: <Clock className="h-4 w-4" />,
  },
  { id: "event", name: "On Event", icon: <Tag className="h-4 w-4" /> },
  { id: "manual", name: "Manual Trigger", icon: <Send className="h-4 w-4" /> },
];

const MessageTemplateManager = () => {
  // State untuk menyimpan templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Form state untuk edit/create template
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    content: "",
    triggerType: "manual",
    triggerValue: "",
    category: "",
    targetGroup: "",
  });

  // Load templates on component mount
  useEffect(() => {
    setTemplates(templatesData.templates);
  }, []);

  // Handle select template
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setIsEditing(false);
  };

  // Handle create new template
  const handleCreateNew = () => {
    setFormData({
      id: `template-${Date.now()}`,
      name: "",
      content: "",
      triggerType: "manual",
      triggerValue: "",
      category: "",
      targetGroup: "",
    });
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  // Handle edit template
  const handleEditTemplate = (template) => {
    setFormData({ ...template });
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  // Handle delete template
  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((t) => t.id !== templateId));
      if (selectedTemplate && selectedTemplate.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
      toast.success("Template deleted");
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
    };
    setTemplates([...templates, newTemplate]);
    toast.success("Template duplicated");
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save template
  const handleSaveTemplate = () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error("Please fill in template name and content");
      return;
    }

    if (templates.some((t) => t.id === formData.id)) {
      // Update existing template
      setTemplates(templates.map((t) => (t.id === formData.id ? formData : t)));
      setSelectedTemplate(formData);
      toast.success("Template updated");
    } else {
      // Create new template
      setTemplates([...templates, formData]);
      setSelectedTemplate(formData);
      toast.success("Template created");
    }

    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedTemplate) {
      setFormData({ ...selectedTemplate });
    }
  };

  // Export templates to JSON file
  const exportTemplates = () => {
    const dataStr = JSON.stringify({ templates }, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "message-templates.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast.success("Templates exported successfully");
  };

  // Import templates from JSON file
  const importTemplates = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);

          if (json.templates && Array.isArray(json.templates)) {
            setTemplates(json.templates);
            toast.success(`${json.templates.length} templates imported`);
          } else {
            toast.error("Invalid template format");
          }
        } catch (error) {
          toast.error("Error parsing JSON file");
          console.error("Error parsing JSON:", error);
        }
      };

      reader.readAsText(file);
    }
  };

  // Filter templates based on search and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from templates
  const categories = [
    "all",
    ...new Set(templates.map((t) => t.category).filter(Boolean)),
  ];

  // Convert markdown for preview (very basic)
  const renderContent = (content) => {
    if (!content) return "";

    // Replace ** with bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Replace newlines with <br>
    formatted = formatted.replace(/\n/g, "<br>");

    return formatted;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Message Templates
        </h2>
        <button
          onClick={handleCreateNew}
          className="bg-white text-green-600 px-3 py-1 rounded-md text-sm font-medium flex items-center hover:bg-green-50"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Template
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-[600px]">
        {/* Left Sidebar - Template List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex">
              <div className="relative inline-block w-full">
                <select
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all"
                        ? "All Categories"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No templates found.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <li
                    key={template.id}
                    className={`cursor-pointer hover:bg-gray-50 transition ${
                      selectedTemplate?.id === template.id ? "bg-green-50" : ""
                    }`}
                  >
                    <div
                      className="p-4"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">
                          {template.category || "uncategorized"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {template.content.substring(0, 100)}
                        {template.content.length > 100 ? "..." : ""}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        {
                          TRIGGER_TYPES.find(
                            (t) => t.id === template.triggerType
                          )?.icon
                        }
                        <span className="ml-1">
                          {template.triggerType === "recurring"
                            ? `Monthly on day ${template.triggerValue}`
                            : template.triggerType === "event"
                            ? `On ${template.triggerValue}`
                            : "Manual trigger"}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pb-3 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        className="text-xs text-blue-600 flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                        className="text-xs text-green-600 flex items-center"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="text-xs text-red-600 flex items-center"
                      >
                        <Trash className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Content - Template Details */}
        <div className="w-2/3 flex flex-col">
          {!selectedTemplate && !isEditing ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a template to view or edit</p>
                <p className="mt-2">
                  <button
                    onClick={handleCreateNew}
                    className="text-green-600 underline hover:text-green-700"
                  >
                    Or create a new template
                  </button>
                </p>
              </div>
            </div>
          ) : isEditing ? (
            /* Template Editing Form */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Template Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  placeholder="Enter template name"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  rows={12}
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 font-mono text-sm"
                  placeholder="Type your message here. Use **text** for bold formatting."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="triggerType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Trigger Type
                  </label>
                  <select
                    id="triggerType"
                    name="triggerType"
                    value={formData.triggerType}
                    onChange={handleFormChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                  >
                    {TRIGGER_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="triggerValue"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {formData.triggerType === "recurring"
                      ? "Day of Month"
                      : formData.triggerType === "date"
                      ? "Specific Date"
                      : formData.triggerType === "event"
                      ? "Event Name"
                      : "Trigger Value"}
                  </label>
                  <input
                    type={formData.triggerType === "date" ? "date" : "text"}
                    id="triggerValue"
                    name="triggerValue"
                    value={formData.triggerValue}
                    onChange={handleFormChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    placeholder={
                      formData.triggerType === "recurring"
                        ? "e.g. 1 for 1st day of month"
                        : formData.triggerType === "event"
                        ? "e.g. new-affiliate"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    placeholder="e.g. marketing, onboarding"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetGroup"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Target Group
                  </label>
                  <input
                    type="text"
                    id="targetGroup"
                    name="targetGroup"
                    value={formData.targetGroup}
                    onChange={handleFormChange}
                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                    placeholder="e.g. all-affiliates, new-users"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            /* Template Preview */
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedTemplate.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(selectedTemplate)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit Template"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDuplicateTemplate(selectedTemplate)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Duplicate Template"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete Template"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium text-gray-700">
                      Trigger Type:
                    </span>{" "}
                    <span className="text-gray-600">
                      {TRIGGER_TYPES.find(
                        (t) => t.id === selectedTemplate.triggerType
                      )?.name || "Manual"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium text-gray-700">
                      Trigger Value:
                    </span>{" "}
                    <span className="text-gray-600">
                      {selectedTemplate.triggerType === "recurring"
                        ? `Day ${selectedTemplate.triggerValue} of each month`
                        : selectedTemplate.triggerValue || "N/A"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium text-gray-700">Category:</span>{" "}
                    <span className="text-gray-600">
                      {selectedTemplate.category || "Uncategorized"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="font-medium text-gray-700">
                      Target Group:
                    </span>{" "}
                    <span className="text-gray-600">
                      {selectedTemplate.targetGroup || "All Users"}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    Message Preview
                  </h4>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderContent(selectedTemplate.content),
                      }}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <div className="text-sm text-gray-500">
                    Last sent: {selectedTemplate.lastSent || "Never"}
                  </div>

                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    onClick={() =>
                      toast.success(
                        "This would send a test message (not implemented)"
                      )
                    }
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTemplateManager;
