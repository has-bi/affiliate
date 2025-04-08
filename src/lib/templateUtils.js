// lib/templateUtils.js
import messageTemplates from "./data/messageTemplates.json";
import importantLinks from "./data/importantLinks.json";

/**
 * Get all message templates
 * @returns {Array} Array of template objects
 */
export function getAllTemplates() {
  return messageTemplates.templates;
}

/**
 * Get a template by ID
 * @param {string} templateId - ID of the template to retrieve
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(templateId) {
  return (
    messageTemplates.templates.find((template) => template.id === templateId) ||
    null
  );
}

/**
 * Get all important links
 * @returns {Array} Array of link objects
 */
export function getAllImportantLinks() {
  return importantLinks.important_links;
}

/**
 * Get important links by category
 * @param {string} category - Category to filter by
 * @returns {Array} Array of link objects in the specified category
 */
export function getLinksByCategory(category) {
  return importantLinks.important_links.filter(
    (link) => link.category === category
  );
}

/**
 * Get an important link by ID
 * @param {string} linkId - ID of the link to retrieve
 * @returns {Object|null} Link object or null if not found
 */
export function getLinkById(linkId) {
  return (
    importantLinks.important_links.find((link) => link.id === linkId) || null
  );
}

/**
 * Fill a template with parameter values
 * @param {string} templateId - ID of the template to use
 * @param {Object} paramValues - Object containing parameter values
 * @returns {string|null} Filled template content or null if template not found
 */
export function fillTemplate(templateId, paramValues) {
  const template = getTemplateById(templateId);

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
}

/**
 * Validate parameter values against template requirements
 * @param {string} templateId - ID of the template to validate against
 * @param {Object} paramValues - Object containing parameter values
 * @returns {Object} Object with isValid flag and errors array
 */
export function validateTemplateParams(templateId, paramValues) {
  const template = getTemplateById(templateId);

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
}

/**
 * Get default parameter values with placeholders
 * @param {string} templateId - ID of the template
 * @returns {Object} Object with parameter IDs as keys and empty strings as values
 */
export function getDefaultParamValues(templateId) {
  const template = getTemplateById(templateId);

  if (!template) {
    return {};
  }

  const defaultValues = {};

  template.parameters.forEach((param) => {
    defaultValues[param.id] = "";
  });

  return defaultValues;
}

/**
 * Generate a preview of a template with either actual values or placeholders
 * @param {string} templateId - ID of the template
 * @param {Object} paramValues - Object containing parameter values (optional)
 * @returns {string|null} Preview content or null if template not found
 */
export function generateTemplatePreview(templateId, paramValues = {}) {
  const template = getTemplateById(templateId);

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
}
