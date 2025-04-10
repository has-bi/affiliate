// components/atoms/Card/index.js
"use client";

import React from "react";

const Card = ({
  children,
  className = "",
  padding = "p-4",
  border = true,
  shadow = true,
  rounded = true,
  ...props
}) => {
  return (
    <div
      className={`
        bg-white
        ${padding}
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
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
