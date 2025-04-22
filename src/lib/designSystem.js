// src/lib/designSystem.js
export const colors = {
  // Primary brand colors
  primary: {
    50: "#e6f7f3",
    100: "#ccefe7",
    200: "#99dfd0",
    300: "#66cfb9",
    400: "#33bfa1",
    500: "#00af8a", // Primary brand color
    600: "#008c6e",
    700: "#006953",
    800: "#004637",
    900: "#00231c",
  },

  // Secondary accent colors
  secondary: {
    50: "#e7f0ff",
    100: "#d0e1ff",
    200: "#a1c3ff",
    300: "#71a5ff",
    400: "#4287ff",
    500: "#1369ff", // Secondary brand color
    600: "#0f54cc",
    700: "#0b3f99",
    800: "#072a66",
    900: "#041533",
  },

  // Neutral grays
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Semantic/Feedback colors
  success: {
    100: "#dcfce7",
    500: "#22c55e",
    700: "#15803d",
  },
  warning: {
    100: "#fef3c7",
    500: "#f59e0b",
    700: "#b45309",
  },
  danger: {
    100: "#fee2e2",
    500: "#ef4444",
    700: "#b91c1c",
  },
  info: {
    100: "#dbeafe",
    500: "#3b82f6",
    700: "#1d4ed8",
  },
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
};

// Spacing
export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
};

// Shadows
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Border radius
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px", // Fully rounded (circles)
};

// Layout
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// Z-index
export const zIndices = {
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
  auto: "auto",
};
