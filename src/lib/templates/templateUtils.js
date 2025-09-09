// src/lib/templates/templateUtils.js
import prisma from "@/lib/prisma";

/**
 * Get a template by ID with parameters
 * @param {number|string} id Template ID
 * @returns {Promise<Object|null>} Template object or null
 */
export async function getTemplate(id) {
  try {
    return await prisma.template.findUnique({
      where: { id: Number(id) },
      include: { parameters: true },
    });
  } catch (error) {
    console.error(`[Templates] Error fetching template ${id}:`, error);
    return null;
  }
}

/**
 * Update a template
 * @param {number|string} id Template ID
 * @param {Object} data Updated template data
 * @returns {Promise<Object|null>} Updated template or null
 */
export async function updateTemplate(id, data) {
  try {
    const { parameters, ...templateData } = data;

    // Use transaction to update template and parameters atomically
    return await prisma.$transaction(async (tx) => {
      // Update the template
      const updatedTemplate = await tx.template.update({
        where: { id: Number(id) },
        data: {
          ...templateData,
          updatedAt: new Date(),
        },
      });

      // If parameters are provided, update them
      if (parameters && Array.isArray(parameters)) {
        // Delete existing parameters
        await tx.parameter.deleteMany({
          where: { templateId: Number(id) },
        });

        // Create new parameters
        await Promise.all(
          parameters.map((param) =>
            tx.parameter.create({
              data: {
                ...param,
                templateId: Number(id),
              },
            })
          )
        );
      }

      // Return updated template with parameters
      return tx.template.findUnique({
        where: { id: Number(id) },
        include: { parameters: true },
      });
    });
  } catch (error) {
    console.error(`[Templates] Error updating template ${id}:`, error);
    throw error; // Let API layer handle this error
  }
}

/**
 * Create a new template
 * @param {Object} data Template data with parameters
 * @returns {Promise<Object|null>} Created template or null
 */
export async function createTemplate(data) {
  try {
    const { parameters, ...templateData } = data;

    return await prisma.template.create({
      data: {
        ...templateData,
        parameters:
          parameters && Array.isArray(parameters)
            ? {
                create: parameters,
              }
            : undefined,
      },
      include: {
        parameters: true,
      },
    });
  } catch (error) {
    console.error(`[Templates] Error creating template:`, error);
    throw error; // Let API layer handle this error
  }
}

/**
 * Delete a template
 * @param {number|string} id Template ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTemplate(id) {
  try {
    await prisma.template.delete({
      where: { id: Number(id) },
    });
    return true;
  } catch (error) {
    console.error(`[Templates] Error deleting template ${id}:`, error);
    return false;
  }
}

/**
 * List all templates
 * @returns {Promise<Array>} Array of templates with parameters
 */
export async function listTemplates() {
  try {
    return await prisma.template.findMany({
      include: { parameters: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("[Templates] Error listing templates:", error);
    return [];
  }
}

/**
 * Format message content with parameters
 * @param {string} content Template content
 * @param {Object} params Parameter values { paramId: value }
 * @returns {string} Formatted content
 */
export function formatMessageContent(content) {
  if (!content) return "";

  // Format bold text
  let formatted = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Format italic text (single asterisks, not double)
  formatted = formatted.replace(
    /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
    "<em>$1</em>"
  );

  // Format links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return formatted;
}

/**
 * Process all parameters in a template (both dynamic and static)
 * @param {string} content - Template content
 * @param {Object} contact - Contact data with dynamic fields
 * @param {Object} staticParams - Static parameter values
 * @returns {string} Processed content with all parameters replaced
 */
export function processAllParameters(content, contact = {}, staticParams = {}) {
  if (!content) return "";

  let processedContent = content;

  // Process dynamic parameters from contact
  if (contact) {
    // Replace {name} parameter - only if name is available (from CSV)
    if (contact.name && processedContent.includes("{name}")) {
      processedContent = processedContent.replace(/\{name\}/g, contact.name);
    } else if (processedContent.includes("{name}")) {
      // If no name available, replace with empty string and clean up spacing
      processedContent = processedContent.replace(/\{name\}\s*,?\s*/g, "");
      // Also handle cases like "Hi {name}, " -> "Hi there, "
      processedContent = processedContent.replace(/Hi\s*,/g, "Hi there,");
    }

    // Replace {phone} parameter if available
    if (contact.phone && processedContent.includes("{phone}")) {
      processedContent = processedContent.replace(/\{phone\}/g, contact.phone);
    }

    // Replace {platform} parameter if available
    if (contact.platform && processedContent.includes("{platform}")) {
      processedContent = processedContent.replace(
        /\{platform\}/g,
        contact.platform
      );
    }

    // Add other dynamic fields as needed
    // Loop through all properties in contact to replace any matching parameters
    Object.entries(contact).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "string" &&
        processedContent.includes(`{${key}}`)
      ) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        processedContent = processedContent.replace(regex, value);
      }
    });
    
    // Clean up any remaining dynamic parameters that weren't found in contact
    // This handles cases where templates have {name} but no name was provided
    const dynamicParamRegex = /\{(name|phone|platform)\}\s*,?\s*/g;
    processedContent = processedContent.replace(dynamicParamRegex, "");
    
    // Fix common spacing issues after parameter removal
    processedContent = processedContent.replace(/Hi\s*,/g, "Hi there,");
    processedContent = processedContent.replace(/\s{2,}/g, " "); // Remove extra spaces
  }

  // Process static parameters (same as before)
  if (staticParams && typeof staticParams === "object") {
    Object.entries(staticParams).forEach(([key, value]) => {
      if (key && value !== undefined && value !== null) {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        processedContent = processedContent.replace(regex, String(value));
      }
    });
  }

  return processedContent;
}

/**
 * Fill template content with parameter values
 * @param {string} content Template content
 * @param {Object} paramValues Parameter values { paramId: value }
 * @returns {string} Content with parameters replaced
 */
export function fillTemplateContent(content, paramValues = {}) {
  // Use processAllParameters for consistency
  return processAllParameters(content, {}, paramValues);
}

/**
 * Extract parameters from template content
 * @param {string} content Template content
 * @returns {Array} Array of parameter objects
 */
export function extractParametersFromContent(content) {
  if (!content) return [];

  const paramRegex = /\{([a-zA-Z0-9_-]+)\}/g;
  const matches = content.match(paramRegex) || [];

  // Extract unique parameters
  const uniqueParams = Array.from(
    new Set(matches.map((match) => match.substring(1, match.length - 1)))
  );

  // Convert to parameter objects
  return uniqueParams.map((paramId) => ({
    id: paramId,
    name: paramId.charAt(0).toUpperCase() + paramId.slice(1).replace(/_/g, " "),
    type: "text",
    placeholder: `Enter ${paramId.replace(/_/g, " ")}`,
    required: false,
    isDynamic: paramId === "name", // Automatically set name as dynamic
  }));
}

/**
 * Validate template parameters
 * @param {Array} parameters Template parameters
 * @param {Object} values Parameter values
 * @returns {Object} Validation result { isValid, errors }
 */
export function validateTemplateParams(parameters, values = {}) {
  const errors = [];

  // Check required parameters
  parameters.forEach((param) => {
    if (param.required && (!values[param.id] || !values[param.id].trim())) {
      errors.push(`Parameter ${param.name} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get final message for a contact with all parameters filled
 * @param {string} content Template content
 * @param {Object} contact Contact information
 * @param {Object} staticParams Static parameter values
 * @returns {string} Filled message content
 */
export function getFinalMessageForContact(
  content,
  contact = {},
  staticParams = {}
) {
  if (!content) return "";

  // Use processAllParameters for consistency
  return processAllParameters(content, contact, staticParams);
}

/**
 * Convert HTML-formatted content to WhatsApp formatting
 * @param {string} htmlContent HTML formatted content
 * @returns {string} WhatsApp formatted content
 */
export function convertHtmlToWhatsApp(htmlContent) {
  if (!htmlContent) return "";

  let whatsAppFormatted = htmlContent;

  // Convert HTML strong tags to WhatsApp bold (double asterisks)
  whatsAppFormatted = whatsAppFormatted.replace(
    /<strong>(.*?)<\/strong>/g,
    "*$1*"
  );

  // Convert HTML em tags to WhatsApp italic (single underscores)
  whatsAppFormatted = whatsAppFormatted.replace(/<em>(.*?)<\/em>/g, "_$1_");

  // Remove HTML link tags, keep the text
  whatsAppFormatted = whatsAppFormatted.replace(/<a[^>]*>(.*?)<\/a>/g, "$1");

  // Remove any other HTML tags
  whatsAppFormatted = whatsAppFormatted.replace(/<[^>]*>/g, "");

  return whatsAppFormatted;
}
