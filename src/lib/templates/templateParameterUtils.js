// lib/templates/templateParameterUtils.js

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
      if (DYNAMIC_PARAMETERS[paramName]) {
        parameters.dynamic.push(DYNAMIC_PARAMETERS[paramName]);
      } else {
        parameters.static.push({ id: paramName, name: paramName });
      }
    }
  });
  return parameters;
}

export function fillDynamicParameters(content, contact) {
  return content.replace(/\{([^}]+)\}/g, (_, param) => {
    if (param === "name") return contact?.name ?? "";
    return "";
  });
}

export function getFinalMessageForContact(template, contact) {
  return fillDynamicParameters(template.content, contact);
}
