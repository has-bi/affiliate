// src/components/atoms/Input/index.js
"use client";

import React, { forwardRef } from "react";
import { colors, typography, spacing, borderRadius } from "@/lib/designSystem";

const Input = forwardRef(
  (
    {
      id,
      name,
      type = "text",
      placeholder = "",
      label = "",
      error = "",
      helperText = "",
      className = "",
      required = false,
      disabled = false,
      leftIcon = null,
      rightIcon = null,
      onChange,
      onBlur,
      value,
      size = "md",
      variant = "outline",
      ...props
    },
    ref
  ) => {
    // Size classes
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-2.5 text-base",
    };

    // Variant classes
    const variantClasses = {
      outline: "border border-gray-300 bg-white",
      filled: "border border-transparent bg-gray-100",
      flushed: "border-0 border-b border-gray-300 rounded-none px-0",
    };

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const variantClass = variantClasses[variant] || variantClasses.outline;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id || name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label} {required && <span className="text-danger-500">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id || name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            className={`
              w-full rounded-md
              ${sizeClass}
              ${variantClass}
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${
                error
                  ? "border-danger-500 focus:ring-danger-500 focus:border-danger-500"
                  : "focus:ring-primary-500 focus:border-primary-500"
              }
              ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
