// src/lib/templateUtils.js
import prisma from "@/lib/prisma";

/**
 * Comprehensive Template Utilities
 * Consolidates all template-related functions with debugging
 */

// ------------------------------------------------------------------------
// CORE TEMPLATE OPERATIONS
// ------------------------------------------------------------------------

/**
 * Get a template by ID from database
 * @param {number|string} templateId - Template ID to fetch
 * @returns {Promise<Object|null>} - Template object or null if not found
 */
export async function getTemplateById(templateId) {
  try {
    const id =
      typeof templateId === "string" ? parseInt(templateId, 10) : templateId;

    if (isNaN(id)) {
      console.error(`Invalid template ID: ${templateId}`);
      return null;
    }

    const template = await prisma.template.findUnique({
      where: { id },
      include: { parameters: true },
    });

    return template;
  } catch (error) {
    console.error(`Error fetching template ${templateId}:`, error);
    return null;
  }
}

/**
 * Get all templates from database
 * @returns {Promise<Array>} - Array of templates
 */
export async function getTemplates() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        parameters: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

// ------------------------------------------------------------------------
// DYNAMIC PARAMETER HANDLING
// ------------------------------------------------------------------------

/**
 * Default dynamic parameters that auto-fill from contact data
 */
export const DYNAMIC_PARAMETERS = {
  name: {
    id: "name",
    name: "Recipient Name",
    type: "text",
    isDynamic: true,
    source: "contact.name",
    placeholder: "Automatically filled from contact data",
    required: false,
  },
  // Add more dynamic parameters as needed
};

/**
 * Extract parameters from template content
 * @param {string} content - Template content
 * @returns {Object} - Object containing dynamic and static parameters
 */
export function extractParametersFromContent(content) {
  console.log("🔍 Extracting parameters from content");
  if (!content) {
    console.log("❌ No content provided");
    return { dynamic: [], static: [] };
  }

  const matches = content.match(/\{([^}]+)\}/g) || [];
  console.log("📝 Found matches:", matches);

  const parameters = {
    dynamic: [],
    static: [],
  };

  const paramSet = new Set();
  matches.forEach((match) => {
    const paramName = match.substring(1, match.length - 1);

    if (!paramSet.has(paramName)) {
      paramSet.add(paramName);

      // Check if it's a dynamic parameter
      if (DYNAMIC_PARAMETERS[paramName]) {
        parameters.dynamic.push({
          ...DYNAMIC_PARAMETERS[paramName],
        });
      } else {
        // It's a static parameter
        parameters.static.push({
          id: paramName,
          name:
            paramName.charAt(0).toUpperCase() +
            paramName.slice(1).replace(/_/g, " "),
          type:
            paramName.includes("link") || paramName.includes("url")
              ? "url"
              : "text",
          isDynamic: false,
          placeholder: `Enter ${paramName.replace(/_/g, " ")}`,
          required: true,
        });
      }
    }
  });

  console.log("✅ Extracted parameters:", parameters);
  return parameters;
}

// ------------------------------------------------------------------------
// CONTENT FORMATTING
// ------------------------------------------------------------------------

/**
 * Format message content for display (convert markdown to HTML)
 * @param {string} content - Raw message content
 * @returns {string} - HTML formatted content
 */
export function formatMessageContent(content) {
  console.log("🎨 Formatting message content");
  if (!content) {
    console.log("❌ No content to format");
    return "";
  }

  try {
    // Replace ** with bold
    let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Replace newlines with <br>
    formatted = formatted.replace(/\n/g, "<br>");

    // Convert URLs to links (if not already within a parameter placeholder)
    formatted = formatted.replace(
      /(https?:\/\/[^\s{}]+)/g,
      '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Highlight parameters in preview
    formatted = formatted.replace(
      /\{([^}]+)\}/g,
      '<span class="inline-block bg-blue-100 text-blue-800 rounded px-1">{$1}</span>'
    );

    console.log("✅ Formatted content successfully");
    return formatted;
  } catch (error) {
    console.error("❌ Error formatting content:", error);
    return content; // Return original content if formatting fails
  }
}

// ------------------------------------------------------------------------
// PARAMETER FILLING
// ------------------------------------------------------------------------

/**
 * Fill template content with parameter values
 * @param {string} content - Template content with placeholders
 * @param {Object} paramValues - Parameter values object
 * @returns {string} - Filled template content
 */
export function fillTemplateContent(content, paramValues = {}) {
  console.log("📝 Filling template content with values:", paramValues);
  if (!content) {
    console.log("❌ No content provided");
    return "";
  }

  try {
    let filledContent = content;

    // Check if paramValues is valid object
    if (paramValues && typeof paramValues === "object") {
      Object.entries(paramValues).forEach(([paramId, value]) => {
        const regex = new RegExp(`\\{${paramId}\\}`, "g");
        filledContent = filledContent.replace(regex, value || `{${paramId}}`);
      });
    } else {
      console.warn("⚠️ Invalid paramValues provided:", paramValues);
    }

    return filledContent;
  } catch (error) {
    console.error("❌ Error filling template content:", error);
    return content;
  }
}

/**
 * Fill dynamic parameters with contact data
 * @param {string} content - Template content
 * @param {Object} contact - Contact data
 * @returns {string} - Content with dynamic parameters filled
 */
export function fillDynamicParameters(content, contact) {
  console.log("📝 Filling dynamic parameters");
  if (!content || !contact) {
    console.log("❌ Missing content or contact");
    return content || "";
  }

  try {
    let filledContent = content;

    // Replace dynamic parameters with contact data
    Object.keys(DYNAMIC_PARAMETERS).forEach((paramId) => {
      const param = DYNAMIC_PARAMETERS[paramId];
      const regex = new RegExp(`\\{${paramId}\\}`, "g");

      if (param.source && contact) {
        // Get nested property using source path (e.g., "contact.name")
        const value = param.source.split(".").reduce((obj, key) => {
          if (key === "contact") return contact;
          return obj?.[key];
        }, {});

        if (value) {
          filledContent = filledContent.replace(regex, value);
        }
      }
    });

    return filledContent;
  } catch (error) {
    console.error("❌ Error filling dynamic parameters:", error);
    return content;
  }
}

/**
 * Get final message content for a specific contact
 * @param {string} templateContent - Template content
 * @param {Object} contact - Contact data
 * @param {Object} staticParamValues - User-provided static parameter values
 * @returns {string} - Final message content
 */
export function getFinalMessageForContact(
  templateContent,
  contact,
  staticParamValues
) {
  console.log("💬 Getting final message for contact");
  if (!templateContent) {
    console.log("❌ No template content provided");
    return "";
  }

  try {
    // First fill dynamic parameters
    let finalContent = fillDynamicParameters(templateContent, contact);

    // Then fill static parameters
    finalContent = fillTemplateContent(finalContent, staticParamValues);

    return finalContent;
  } catch (error) {
    console.error("❌ Error getting final message:", error);
    return "";
  }
}

// ------------------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------------------

/**
 * Validate template parameters
 * @param {Array} parameters - Template parameters
 * @param {Object} paramValues - Parameter values to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateTemplateParams(parameters, paramValues) {
  console.log("🔍 Validating template parameters");
  const errors = [];

  try {
    // Check if parameters is a valid array
    if (!Array.isArray(parameters)) {
      console.warn("⚠️ Parameters is not an array:", parameters);
      return {
        isValid: true,
        errors: [],
      };
    }

    // Check if paramValues is a valid object
    if (!paramValues || typeof paramValues !== "object") {
      console.warn("⚠️ Invalid paramValues:", paramValues);
      paramValues = {};
    }

    // Check if required parameters are filled
    parameters.forEach((param) => {
      if (
        param.required &&
        !param.isDynamic &&
        (!paramValues[param.id] || !paramValues[param.id].trim())
      ) {
        errors.push(`${param.name} is required`);
      }

      // Validate URL parameters
      if (param.type === "url" && paramValues[param.id]) {
        try {
          new URL(paramValues[param.id]);
        } catch {
          errors.push(`${param.name} must be a valid URL`);
        }
      }

      // Validate number parameters
      if (param.type === "number" && paramValues[param.id]) {
        if (isNaN(paramValues[param.id])) {
          errors.push(`${param.name} must be a valid number`);
        }
      }

      // Validate date parameters
      if (param.type === "date" && paramValues[param.id]) {
        const date = new Date(paramValues[param.id]);
        if (isNaN(date.getTime())) {
          errors.push(`${param.name} must be a valid date`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error("❌ Error validating parameters:", error);
    return {
      isValid: false,
      errors: ["Error validating parameters"],
    };
  }
}

// ------------------------------------------------------------------------
// IMPORTANT LINKS MANAGEMENT
// ------------------------------------------------------------------------

/**
 * Get all important links for quick selection
 * @returns {Array} - Array of link objects
 */
export function getAllImportantLinks() {
  return [
    {
      id: "youvit_homepage",
      name: "Youvit Homepage",
      url: "https://youvit.id",
      category: "website",
      description: "Official Youvit website",
    },
    {
      id: "product_brief",
      name: "Brief & Product Knowledge",
      url: "https://bit.ly/youvitaffiliateprogram",
      category: "product",
      description: "Detail informasi lengkap tentang produk Youvit",
    },
    {
      id: "affiliate_form",
      name: "Formulir Pendaftaran Affiliate",
      url: "https://forms.youvit.co.id/affiliate-signup",
      category: "affiliate",
      description: "Link formulir untuk registrasi affiliate baru",
    },
    {
      id: "sample_request",
      name: "Form Request Sample",
      url: "https://bit.ly/sampleyouvitindo",
      category: "product",
      description: "Formulir pengajuan sample produk Youvit",
    },
  ];
}

/**
 * Get links by category
 * @param {string} category - Category to filter by
 * @returns {Array} - Array of link objects filtered by category
 */
export function getLinksByCategory(category) {
  const allLinks = getAllImportantLinks();

  if (!category) return allLinks;

  return allLinks.filter((link) => link.category === category);
}

// ------------------------------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------------------------------

/**
 * Create a unique parameter ID
 * @param {string} baseName - Base name for the parameter
 * @returns {string} - Unique parameter ID
 */
export function createParameterId(baseName = "parameter") {
  return `${baseName}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 7)}`;
}

/**
 * Check if a parameter is dynamic
 * @param {string} paramId - Parameter ID
 * @returns {boolean} - True if dynamic, false otherwise
 */
export function isDynamicParameter(paramId) {
  return !!DYNAMIC_PARAMETERS[paramId];
}

/**
 * Get parameter display name from ID
 * @param {string} paramId - Parameter ID
 * @returns {string} - Display name
 */
export function getParameterDisplayName(paramId) {
  if (DYNAMIC_PARAMETERS[paramId]) {
    return DYNAMIC_PARAMETERS[paramId].name;
  }

  return paramId
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate preview data for a template
 * @param {Object} template - Template object
 * @returns {Object} - Preview data with sample values
 */
export function generatePreviewData(template) {
  const previewData = {};

  if (template && template.parameters) {
    template.parameters.forEach((param) => {
      if (param.isDynamic) {
        // Use placeholder for dynamic parameters
        previewData[param.id] = `[${param.name}]`;
      } else {
        // Use sample values for static parameters
        switch (param.type) {
          case "url":
            previewData[param.id] = "https://example.com";
            break;
          case "number":
            previewData[param.id] = "123";
            break;
          case "date":
            previewData[param.id] = new Date().toISOString().split("T")[0];
            break;
          default:
            previewData[param.id] = `Sample ${param.name}`;
        }
      }
    });
  }

  return previewData;
}
