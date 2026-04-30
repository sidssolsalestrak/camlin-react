/* eslint-disable no-restricted-globals */
import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";
import { excelStyles } from "./excelConfig";

self.onmessage = function (e) {
  console.log(e.data, "datas")
  const { data, columns, moduleType, filename, additionalData } = e.data;
  console.log("excel", data, columns, filename, additionalData)

  try {
    const config = excelStyles[moduleType];
    if (!config) throw new Error("Invalid module type provided");

    const {
      headerColor,
      headerFontColor,
      headerFontSize,
      headerBold,
      titleRow1,
      titleRow2,
      titleRow5,
      titleColor,
      titleFontColor,
      titleFontSize,
      titleBold,
      sheetName,
      filenameSuffix,
      dataFontSize,
      dataFontColor,
      showFilters,
    } = config;

    // Filter out the index column from columns
    const filteredColumns = columns.filter((col) => col.headerName !== "Action");

    // Format main data - remove time from date+time values
    const formattedData = data.map((row) => {
      const newRow = {};
      filteredColumns.forEach((col) => {
        // Use filteredColumns here
        let value = row[col.field] ?? "";
        if (col.type === "date" && value) {
          const parsed = dayjs(value);
          if (parsed.isValid()) {
            value = {
              v: parsed.toDate(),   // REAL DATE
              t: "d",
              z: "dd-mm-yyyy"       // Display format
            };
          }
        }
        // Additional check for any date-like strings that might contain time
        else if (value && typeof value === "string") {
          // Check if it's a date string that might contain time
          const dateWithTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/;
          if (dateWithTimeRegex.test(value)) {
            const parsed = dayjs(value);
            if (parsed.isValid()) {
              value = {
                v: parsed.toDate(),
                t: "d",
                z: "dd-mm-yyyy"
              };

            }
          }
        }
        newRow[col.headerName] = value;
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet([], { cellDates: true });
    const workbook = XLSX.utils.book_new();

    let currentRow = 0;

    // Common border style
    const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };

    const borderStyle2 = {
      top: { style: "thin", color: { rgb: "d1d5db" } },
      bottom: { style: "thin", color: { rgb: "d1d5db" } },
      left: { style: "thin", color: { rgb: "d1d5db" } },
      right: { style: "thin", color: { rgb: "d1d5db" } }
    };

    // this for userlogs
    if (moduleType === "userlogs") {
      const totalCols = filteredColumns.length; // Use filteredColumns length
      worksheet["!merges"] = [];

      // First title row - only in column A
      XLSX.utils.sheet_add_aoa(worksheet, [[titleRow5]], { origin: "A1" });
      // Merge first column (A) across all columns for wider title
      worksheet["!merges"].push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: totalCols - 1 },
      });

      const titleCell1 = worksheet["A1"];
      titleCell1.s = {
        font: {
          bold: titleBold,
          sz: titleFontSize,
          color: { rgb: titleFontColor },
          name: "Calibri"
        },
        fill: { patternType: "solid", fgColor: { rgb: titleColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderStyle,
      };

      // Apply border to merged cells area
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { v: "", t: "s" };
        }
        worksheet[cellRef].s = {
          ...(worksheet[cellRef].s || {}),
          border: borderStyle,
        };
      }

      currentRow = 1; // We've used 1 row for title
    }

    // Add Three Title Rows in First Column for Quotation
    if (moduleType === 'Region_Wise_Distributor_Wise_Data_Submission') {

      const totalCols = filteredColumns.length; // ✅ add this
      worksheet["!merges"] = [];

      // First title row - span ALL columns
      XLSX.utils.sheet_add_aoa(worksheet, [[titleRow1]], { origin: "A1" });
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }); // ✅ was e: { r:0, c:0 }
      if (!worksheet["A1"]) worksheet["A1"] = { v: titleRow1, t: "s" };
      worksheet["A1"].s = {
        font: { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
        fill: { patternType: "solid", fgColor: { rgb: titleColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderStyle,
      };

      // Second title row - span ALL columns
      if (titleRow2) {
        XLSX.utils.sheet_add_aoa(worksheet, [[titleRow2]], { origin: "A2" });
        worksheet["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }); // ✅ was e: { r:1, c:0 }
        if (!worksheet["A2"]) worksheet["A2"] = { v: titleRow2, t: "s" };
        worksheet["A2"].s = {
          font: { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
          fill: { patternType: "solid", fgColor: { rgb: titleColor } },
          alignment: { horizontal: "left", vertical: "center" },
          border: borderStyle,
        };
        currentRow = 2;
      } else {
        currentRow = 1;
      }
    }
    // Add Main Table Headers
    const headerData = [filteredColumns.map((col) => col.headerName)]; // Use filteredColumns
    XLSX.utils.sheet_add_aoa(worksheet, headerData, {
      origin: `A${currentRow + 1}`,
    });

    // Style main headers - all headers aligned left with borders
    const totalCols = filteredColumns.length; // Use filteredColumns length
    for (let c = 0; c < totalCols; c++) {
      const headerRef = XLSX.utils.encode_cell({ r: currentRow, c });
      const headerCell = worksheet[headerRef];
      if (headerCell) {
        headerCell.s = {
          font: {
            bold: headerBold,
            color: { rgb: headerFontColor },
            sz: headerFontSize,
            name: "Calibri"
          },
          fill: { patternType: "solid", fgColor: { rgb: headerColor } },
          alignment: { horizontal: "left", vertical: "center" },
          border: moduleType === "userList" ? borderStyle2 : borderStyle
        };
      }
    }

    const headerRowIndex = currentRow;
    currentRow++;

    // Add Main Data Rows
    if (formattedData.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, formattedData, {
        skipHeader: true,
        origin: `A${currentRow + 1}`,
      });
    }

    // Style data rows with dynamic alignment based on content and add borders
    const dataStartRow = currentRow;
    const dataEndRow = dataStartRow + formattedData.length;

    // Calculate maximum content length for each column for auto-width
    const maxContentLengths = new Array(totalCols).fill(0);

    for (let r = dataStartRow; r < dataEndRow; r++) {
      for (let c = 0; c < totalCols; c++) {
        const dataRef = XLSX.utils.encode_cell({ r, c });
        const dataCell = worksheet[dataRef];
        if (dataCell) {
          const cellValue = dataCell.v;
          let horizontalAlign = "left"; // Default alignment

          // Determine alignment based on content type
          if (
            cellValue !== null &&
            cellValue !== undefined &&
            cellValue !== ""
          ) {
            const stringValue = String(cellValue).trim();

            // Calculate content length for auto-width
            const contentLength = stringValue.length;
            if (contentLength > maxContentLengths[c]) {
              maxContentLengths[c] = contentLength;
            }

            // Check if it's a date (DD-MM-YYYY format)
            if (cellValue instanceof Date) {
              horizontalAlign = "right";
            }
            // Check if it's purely numbers (including decimals)
            else if (/^-?\d*\.?\d+$/.test(stringValue)) {
              horizontalAlign = "right";
            }
            // Check if it's alphanumeric (contains both letters and numbers)
            else if (/[a-zA-Z]/.test(stringValue) && /\d/.test(stringValue)) {
              horizontalAlign = "left";
            }
            // Check if it starts with words (alphabetic characters)
            else if (/^[a-zA-Z]/.test(stringValue)) {
              horizontalAlign = "left";
            }
            // Default to left alignment for everything else
            else {
              horizontalAlign = "left";
            }
          }

          dataCell.s = {
            font: {
              sz: dataFontSize,
              color: { rgb: dataFontColor },
              name: "Calibri"
            },
            alignment: {
              horizontal: horizontalAlign,
              vertical: "center",
            },
            border: moduleType === "userList" || moduleType === "customerList" ? borderStyle2 : borderStyle
          };
        }
      }
    }

    // Calculate column widths based on actual content (100% width)
    worksheet["!cols"] = filteredColumns.map((col, index) => {
      // Use filteredColumns
      const headerLength = col.headerName.length;
      const contentLength = maxContentLengths[index] || 0;

      // Use the maximum of header length or content length, plus some padding
      const maxLength = Math.max(headerLength, contentLength);

      // For userlogs module with titleRow5, increase width significantly for first column
      if (moduleType === "userlogs" && index === 0) {
        return { wch: Math.max(18, maxLength + 8) }; // Increased width for title
      }
      // For quotation module, first column has minimum width of 35
      else if ((moduleType === "quotation" || moduleType === 'currentoverdue' || moduleType === 'inventory') && index === 0) {
        return { wch: Math.max(40, maxLength + 4) };
      } else {
        return { wch: Math.min(Math.max(maxLength + 4, 12), 30) };
      }
    });

    // No AutoFilter for quotation
    if (showFilters && formattedData.length > 0) {
      worksheet["!autofilter"] = {
        ref: `A${headerRowIndex + 1}:${XLSX.utils.encode_col(
          totalCols - 1
        )}${dataEndRow}`,
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const wbout = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      compression: true,
      cellStyles: true,
    });

    self.postMessage({
      status: "success",
      buffer: wbout,
      filename: filename || filenameSuffix,
    });
  } catch (err) {
    self.postMessage({ status: "error", error: err.message });
  }
};