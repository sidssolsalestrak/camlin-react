import React from "react";

//if we have render cell in columns we need this component
export const cleanColumns = (columns) => {
    return columns.map((col) => {
      const safeCol = {};
      Object.keys(col).forEach((key) => {
        const value = col[key];
        const type = typeof value;
  
        // keep only cloneable things
        if (
          value == null ||
          type === "string" ||
          type === "number" ||
          type === "boolean" ||
          (Array.isArray(value) && value.every((v) => typeof v !== "function" && typeof v !== "object")) ||
          (type === "object" && !React.isValidElement(value) && !(value instanceof Function))
        ) {
          safeCol[key] = value;
        }
      });
      return safeCol;
    });
  };
  