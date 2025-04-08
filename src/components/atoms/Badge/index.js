// components/atoms/Badge/index.js
"use client";

import React from "react";

const badgeVariants = {
  default: "bg-gray-100 text-gray-800",
  primary: "bg-blue-100 text-blue-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-indigo-100 text-indigo-800",
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
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
