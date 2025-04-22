// src/components/atoms/Card/index.js
"use client";

import React from "react";
import { shadows, borderRadius, spacing } from "@/lib/designSystem";

const Card = ({
  children,
  className = "",
  variant = "default",
  padding = true,
  border = true,
  shadow = true,
  rounded = true,
  ...props
}) => {
  // Variant styles
  const variantStyles = {
    default: "bg-white",
    primary: "bg-primary-50 border-primary-200",
    success: "bg-success-100 border-success-200",
    warning: "bg-warning-100 border-warning-200",
    danger: "bg-danger-100 border-danger-200",
    info: "bg-info-100 border-info-200",
  };

  const variantStyle = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`
        ${variantStyle}
        ${padding ? "p-4" : ""}
        ${border ? "border border-gray-200" : ""}
        ${rounded ? "rounded-lg" : ""}
        ${shadow ? "shadow-sm" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`border-b border-gray-200 pb-3 mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3 className={`text-lg font-medium text-gray-900 ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`border-t border-gray-200 pt-3 mt-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
