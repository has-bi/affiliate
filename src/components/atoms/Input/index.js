// components/atoms/Input/index.js
"use client";

import React, { forwardRef } from "react";

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
      onChange,
      onBlur,
      value,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id || name}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
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
          w-full px-3 py-2 bg-white border rounded-md
          ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          } 
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${className}
        `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
