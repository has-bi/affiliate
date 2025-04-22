// lib/templateUtils.js
import prisma from "@/lib/prisma";

/**
 * Fill a template with parameter values
 * @param {number} templateId - ID of the template to use
 * @param {Object} paramValues - Object containing parameter values
 * @returns {Promise<string|null>} Filled template content or null if template not found
 */
export async function fillTemplate(templateId, paramValues) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { parameters: true },
    });

    if (!template) {
      return null;
    }

    let content = template.content;

    // Replace each parameter placeholder with its value
    template.parameters.forEach((param) => {
      const value = paramValues[param.id] || "";
      content = content.replace(new RegExp(`{${param.id}}`, "g"), value);
    });

    return content;
  } catch (error) {
    console.error("Error filling template:", error);
    return null;
  }
}

/**
 * Validate parameter values against template requirements
 * @param {number} templateId - ID of the template to validate against
 * @param {Object} paramValues - Object containing parameter values
 * @returns {Promise<Object>} Object with isValid flag and errors array
 */
export async function validateTemplateParams(templateId, paramValues) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { parameters: true },
    });

    if (!template) {
      return {
        isValid: false,
        errors: ["Template not found"],
      };
    }

    const errors = [];

    // Check each required parameter
    template.parameters.forEach((param) => {
      if (
        param.required &&
        (!paramValues[param.id] || paramValues[param.id].trim() === "")
      ) {
        errors.push(`${param.name} is required`);
      }

      // Type validation
      if (paramValues[param.id]) {
        const value = paramValues[param.id];

        switch (param.type) {
          case "url":
            try {
              new URL(value);
            } catch (e) {
              errors.push(`${param.name} must be a valid URL`);
            }
            break;

          case "number":
            if (isNaN(Number(value))) {
              errors.push(`${param.name} must be a number`);
            }
            break;

          case "date":
            if (isNaN(Date.parse(value))) {
              errors.push(`${param.name} must be a valid date`);
            }
            break;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error("Error validating template parameters:", error);
    return {
      isValid: false,
      errors: ["An error occurred during validation"],
    };
  }
}

/**
 * Get default parameter values for a template
 * @param {number} templateId - ID of the template
 * @returns {Promise<Object>} Object with parameter IDs as keys and empty strings as values
 */
export async function getDefaultParamValues(templateId) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { parameters: true },
    });

    if (!template) {
      return {};
    }

    const defaultValues = {};

    template.parameters.forEach((param) => {
      defaultValues[param.id] = "";
    });

    return defaultValues;
  } catch (error) {
    console.error("Error getting default parameter values:", error);
    return {};
  }
}

/**
 * Generate a preview of a template with either actual values or placeholders
 * @param {number} templateId - ID of the template
 * @param {Object} paramValues - Object containing parameter values (optional)
 * @returns {Promise<string|null>} Preview content or null if template not found
 */
export async function generateTemplatePreview(templateId, paramValues = {}) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { parameters: true },
    });

    if (!template) {
      return null;
    }

    let content = template.content;

    // Replace each parameter placeholder
    template.parameters.forEach((param) => {
      const value = paramValues[param.id] || `[${param.name}]`;
      content = content.replace(new RegExp(`{${param.id}}`, "g"), value);
    });

    return content;
  } catch (error) {
    console.error("Error generating template preview:", error);
    return null;
  }
}

/**
 * Extract parameters from template content
 * Looks for {param_name} patterns in the content
 * @param {string} content - Template content
 * @returns {Array} Array of parameter objects
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
    type:
      param.includes("link") ||
      param.includes("url") ||
      param.includes("image") ||
      param.includes("video")
        ? "url"
        : "text",
    placeholder: `Enter ${param.replace(/_/g, " ")}`,
    required: true,
  }));
}

/**
 * Process template content for display
 * @param {string} content - Raw template content
 * @returns {string} HTML formatted content with formatting applied
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
 * Generate a unique parameter ID
 * @param {string} baseName - Base name for the parameter
 * @param {Array} existingParams - Existing parameters to avoid duplicates
 * @returns {string} Unique parameter ID
 */
export function generateUniqueParamId(baseName, existingParams) {
  const baseId = baseName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // If no conflicting IDs, use the base ID
  if (!existingParams.some((p) => p.id === baseId)) {
    return baseId;
  }

  // Otherwise, append a number to make it unique
  let counter = 1;
  let newId = `${baseId}_${counter}`;

  while (existingParams.some((p) => p.id === newId)) {
    counter++;
    newId = `${baseId}_${counter}`;
  }

  return newId;
}
