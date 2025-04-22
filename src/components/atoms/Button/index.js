// src/components/atoms/Button/index.js
"use client";

import React from "react";
import Link from "next/link";

const buttonVariants = {
  primary: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-200`,
  secondary: `bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-gray-200`,
  success: `bg-green-500 hover:bg-green-700 text-white focus:ring-green-200`,
  danger: `bg-red-500 hover:bg-red-700 text-white focus:ring-red-200`,
  warning: `bg-yellow-500 hover:bg-yellow-700 text-white focus:ring-yellow-200`,
  info: `bg-blue-500 hover:bg-blue-700 text-white focus:ring-blue-200`,
  ghost: `bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-200`,
  link: `bg-transparent text-blue-500 hover:text-blue-700 hover:underline`,
};

const buttonSizes = {
  xs: `py-1 px-2 text-xs`,
  sm: `py-1.5 px-3 text-sm`,
  md: `py-2 px-4 text-base`,
  lg: `py-2.5 px-5 text-lg`,
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  type = "button",
  href,
  onClick,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    transition-colors duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = buttonVariants[variant] || buttonVariants.primary;
  const sizeClasses = buttonSizes[size] || buttonSizes.md;

  const allClasses = `
    ${baseClasses} 
    ${variantClasses} 
    ${sizeClasses} 
    ${className}
  `;

  // If href is provided, render as a Link
  if (href) {
    return (
      <Link href={href} className={allClasses} {...props}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Link>
    );
  }

  // Otherwise render as a button
  return (
    <button
      type={type}
      className={allClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
