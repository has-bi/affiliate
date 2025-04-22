// src/components/atoms/Badge/index.js
"use client";

import React from "react";
import { colors } from "@/lib/designSystem";

const badgeVariants = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-primary-100 text-primary-800",
  secondary: "bg-secondary-100 text-secondary-800",
  success: "bg-success-100 text-success-800",
  warning: "bg-warning-100 text-warning-800",
  danger: "bg-danger-100 text-danger-800",
  info: "bg-info-100 text-info-800",
  outline: "bg-white border border-gray-300 text-gray-700",
};

const badgeSizes = {
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1 text-base",
};

const Badge = ({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const variantClasses = badgeVariants[variant] || badgeVariants.default;
  const sizeClasses = badgeSizes[size] || badgeSizes.md;

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantClasses}
        ${sizeClasses}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
