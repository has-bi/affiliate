// src/lib/templateParameterUtils.js

/**
 * Default dynamic parameters that are automatically extracted from contact data
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
};

/**
 * Extract parameters from template content
 * @param {string} content - Template content
 * @returns {Object} - Object containing dynamic and static parameters
 */
export function extractParametersFromTemplateContent(content) {
  if (!content) return { dynamic: [], static: [] };

  const matches = content.match(/\{([^}]+)\}/g) || [];
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

  return parameters;
}

/**
 * Fill dynamic parameters with contact data
 * @param {string} content - Template content
 * @param {Object} contact - Contact data
 * @returns {string} - Content with dynamic parameters filled
 */
export function fillDynamicParameters(content, contact) {
  if (!content || !contact) return content;

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
}

/**
 * Fill static parameters with user input
 * @param {string} content - Template content
 * @param {Object} paramValues - User-provided parameter values
 * @returns {string} - Content with static parameters filled
 */
export function fillStaticParameters(content, paramValues) {
  if (!content) return content;

  let filledContent = content;

  // Replace static parameters with user values
  Object.entries(paramValues).forEach(([paramId, value]) => {
    const regex = new RegExp(`\\{${paramId}\\}`, "g");
    filledContent = filledContent.replace(regex, value || `{${paramId}}`);
  });

  return filledContent;
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
  // First fill dynamic parameters
  let finalContent = fillDynamicParameters(templateContent, contact);

  // Then fill static parameters
  finalContent = fillStaticParameters(finalContent, staticParamValues);

  return finalContent;
}
