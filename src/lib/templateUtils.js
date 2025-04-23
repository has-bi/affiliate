// src/lib/templateUtils.js

import prisma from "@/lib/prisma";

/**
 * Get a template by ID
 * @param {number|string} templateId - Template ID to fetch
 * @returns {Promise<Object|null>} - Template object or null if not found
 */
export async function getTemplateById(templateId) {
  try {
    // Convert string ID to number if needed
    const id =
      typeof templateId === "string" ? parseInt(templateId, 10) : templateId;

    if (isNaN(id)) return null;

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
 * Get all templates
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

/**
 * Format message content for display
 * Converts markdown-style formatting to HTML
 *
 * @param {string} content - Raw template content
 * @returns {string} - HTML formatted content
 */
export function formatMessageContent(content) {
  if (!content) return "";

  // Replace ** with bold
  let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace newlines with <br>
  formatted = formatted.replace(/\n/g, "<br>");

  // Convert URLs to links (if not already within a parameter placeholder)
  formatted = formatted.replace(
    /(https?:\/\/[^\s{}]+)/g,
    '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return formatted;
}

/**
 * Extract parameters from template content
 * @param {string} content - Template content
 * @returns {Array} - Array of parameter objects
 */
export function extractParametersFromContent(content) {
  if (!content) return [];

  // Match all {parameter} occurrences
  const matches = content.match(/\{([^}]+)\}/g) || [];

  // Extract parameter names and create unique set
  const paramSet = new Set();
  matches.forEach((match) => {
    // Remove { and } to get the parameter name
    const paramName = match.substring(1, match.length - 1);
    paramSet.add(paramName);
  });

  // Convert to array of parameter objects
  return Array.from(paramSet).map((param) => ({
    id: param,
    name: param.charAt(0).toUpperCase() + param.slice(1).replace(/_/g, " "),
    type: param.includes("link") || param.includes("url") ? "url" : "text",
    placeholder: `Enter ${param.replace(/_/g, " ")}`,
    required: true,
  }));
}

/**
 * Fill template with parameter values
 * @param {number|string} templateId - Template ID
 * @param {Object} paramValues - Parameter values object
 * @returns {Promise<string|null>} - Filled template content or null if error
 */
export async function fillTemplate(templateId, paramValues = {}) {
  try {
    const template = await getTemplateById(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let filledContent = template.content;

    // Replace each parameter placeholder with its value
    Object.entries(paramValues).forEach(([paramId, value]) => {
      const regex = new RegExp(`\\{${paramId}\\}`, "g");
      filledContent = filledContent.replace(regex, value || `{${paramId}}`);
    });

    return filledContent;
  } catch (error) {
    console.error(`Error filling template ${templateId}:`, error);
    return null;
  }
}

/**
 * Fill template content with parameter values (synchronous version)
 * @param {string} content - Template content with placeholders
 * @param {Object} paramValues - Parameter values object
 * @returns {string} - Filled template content
 */
export function fillTemplateContent(content, paramValues = {}) {
  if (!content) return "";

  let filledContent = content;

  // Replace each parameter placeholder with its value
  Object.entries(paramValues).forEach(([paramId, value]) => {
    const regex = new RegExp(`\\{${paramId}\\}`, "g");
    filledContent = filledContent.replace(regex, value || `{${paramId}}`);
  });

  return filledContent;
}

/**
 * Validate a template's parameters
 * @param {Array} parameters - Template parameters
 * @param {Object} paramValues - Parameter values to validate
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateTemplateParams(parameters, paramValues) {
  const errors = [];

  // Check if required parameters are filled
  parameters.forEach((param) => {
    if (
      param.required &&
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
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get all important links
 * Used in ParameterForm component for quick link selection
 * @returns {Array} - Array of link objects
 */
export function getAllImportantLinks() {
  try {
    // In a real implementation, you could fetch this from a database
    // Here we're just returning some mock data
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
  } catch (error) {
    console.error("Error getting important links:", error);
    return [];
  }
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
