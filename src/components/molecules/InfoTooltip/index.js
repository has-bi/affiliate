"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";

const InfoTooltip = ({ title, description, examples = [], position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure component is mounted before showing any tooltips to prevent hydration mismatches
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isMounted && isVisible && (
        <div
          className={`absolute z-50 w-80 p-3 bg-white border border-gray-200 rounded-lg shadow-lg ${positionClasses[position]}`}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            <p className="text-gray-600 text-xs leading-relaxed">{description}</p>
            
            {examples.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium text-gray-700 text-xs">Examples:</p>
                <ul className="space-y-1">
                  {examples.map((example, index) => (
                    <li key={index} className="text-gray-600 text-xs flex items-start">
                      <span className="text-gray-400 mr-1">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Tooltip Arrow */}
          <div 
            className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1 border-b border-r border-t-0 border-l-0' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1 border-t border-l border-b-0 border-r-0' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1 border-t border-r border-b-0 border-l-0' :
              'right-full top-1/2 -translate-y-1/2 translate-x-1 border-b border-l border-t-0 border-r-0'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;