/* eslint-disable no-restricted-globals */
import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";
import { excelStyles } from "./excelConfig";

self.onmessage = function (e) {
  const { data, columns, moduleType, filename, additionalData, grandTotal = false, meta = {} } = e.data;

  try {
    const config = excelStyles[moduleType];
    if (!config) throw new Error("Invalid module type provided");

    const mergedConfig = { ...config, ...additionalData };

    const {
      headerColor, headerFontColor, headerFontSize, headerBold,
      titleRow1, titleRow2, titleRow5, titleColor, titleFontColor,
      titleFontSize, titleBold, sheetName, filenameSuffix,
      dataFontSize, dataFontColor, showFilters, highlightHeaders,
      zoneRowColor, zoneRowFontColor,
    } = mergedConfig;

    const grandTotalLabel =
      typeof grandTotal === "object" && grandTotal.label
        ? grandTotal.label
        : "Grand Total";

    const filteredColumns = columns.filter((col) => col.headerName !== "Action");
    const highlightSet = new Set(highlightHeaders || []);

    // ── Helper: parse a value to number ────────────────────────────────────────
    const toNumber = (val) => {
      if (val === null || val === undefined || val === "" || val === "-") return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    // ── Build grand total config (same logic as CSV worker) ────────────────────
    const buildGrandTotalConfig = () => {
      if (!grandTotal) return null;
      if (typeof grandTotal === "object" && !grandTotal.label) return grandTotal;

      const autoConfig = {};
      const sampleRow = data[0] ?? {};
      filteredColumns.forEach((col, idx) => {
        if (idx === 0) { autoConfig[col.field] = "label"; return; }
        const val = sampleRow[col.field];
        const isNumeric = val !== null && val !== undefined && val !== "" && val !== "-" && !isNaN(Number(val));
        autoConfig[col.field] = isNumeric ? "sum" : "skip";
      });
      return autoConfig;
    };

    const gtConfig = buildGrandTotalConfig();

    // ── Compute grand total values ─────────────────────────────────────────────
    const computeGrandTotals = (config) => {
      const totals = {};
      filteredColumns.forEach((col) => {
        const agg = config[col.field] ?? "skip";
        if (agg === "label") { totals[col.field] = grandTotalLabel; return; }
        if (agg === "none")  { totals[col.field] = "-"; return; }
        if (agg === "skip")  { totals[col.field] = ""; return; }
        const numbers = data.map((row) => toNumber(row[col.field]));
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        if (agg === "sum") {
          totals[col.field] = sum;
        } else if (agg === "avg") {
          const avg = numbers.length > 0 ? sum / numbers.length : 0;
          const rounded = Math.round(avg * 100) / 100;
          totals[col.field] = rounded === 0 ? "-" : rounded;
        }
      });
      return totals;
    };

    const grandTotalValues = gtConfig ? computeGrandTotals(gtConfig) : null;

    // ── Format row (date handling) ─────────────────────────────────────────────
    const formatRow = (row) => {
      const newRow = {};
      filteredColumns.forEach((col) => {
        let value = row[col.field] ?? "";
        if (col.type === "date" && value) {
          const parsed = dayjs(value);
          if (parsed.isValid()) value = { v: parsed.toDate(), t: "d", z: "dd-mm-yyyy" };
        } else if (value && typeof value === "string") {
          const dateWithTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/;
          if (dateWithTimeRegex.test(value)) {
            const parsed = dayjs(value);
            if (parsed.isValid()) value = { v: parsed.toDate(), t: "d", z: "dd-mm-yyyy" };
          }
        }
        newRow[col.headerName] = value;
      });
      return newRow;
    };

    const formattedData = data.map(formatRow);

    // Format grand total row using headerName keys (for sheet_add_json)
    const formattedGrandTotal = grandTotalValues
      ? (() => {
          const row = {};
          filteredColumns.forEach((col) => {
            row[col.headerName] = grandTotalValues[col.field] ?? "";
          });
          return row;
        })()
      : null;

    const worksheet = XLSX.utils.json_to_sheet([], { cellDates: true });
    const workbook = XLSX.utils.book_new();

    let currentRow = 0;
    const totalCols = filteredColumns.length;

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
      right: { style: "thin", color: { rgb: "d1d5db" } },
    };

    // ── Title Row 1 ────────────────────────────────────────────────────────────
    const titleText = titleRow1 || titleRow5;
    if (titleText) {
      worksheet["!merges"] = worksheet["!merges"] || [];
      XLSX.utils.sheet_add_aoa(worksheet, [[titleText]], { origin: "A1" });
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
      if (!worksheet["A1"]) worksheet["A1"] = { v: titleText, t: "s" };
      worksheet["A1"].s = {
        font: { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
        fill: { patternType: "solid", fgColor: { rgb: titleColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderStyle,
      };
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (!worksheet[cellRef]) worksheet[cellRef] = { v: "", t: "s" };
        worksheet[cellRef].s = { ...(worksheet[cellRef].s || {}), border: borderStyle };
      }
      currentRow = 1;
    }

    // ── Title Row 2 ────────────────────────────────────────────────────────────
    if (titleRow2) {
      worksheet["!merges"] = worksheet["!merges"] || [];
      XLSX.utils.sheet_add_aoa(worksheet, [[titleRow2]], { origin: `A${currentRow + 1}` });
      worksheet["!merges"].push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: totalCols - 1 } });
      const cellKey = `A${currentRow + 1}`;
      if (!worksheet[cellKey]) worksheet[cellKey] = { v: titleRow2, t: "s" };
      worksheet[cellKey].s = {
        font: { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
        fill: { patternType: "solid", fgColor: { rgb: titleColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderStyle,
      };
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: currentRow, c });
        if (!worksheet[cellRef]) worksheet[cellRef] = { v: "", t: "s" };
        worksheet[cellRef].s = { ...(worksheet[cellRef].s || {}), border: borderStyle };
      }
      currentRow += 1;
    }

    // ── Header Row ─────────────────────────────────────────────────────────────
    const headerData = [filteredColumns.map((col) => col.headerName)];
    XLSX.utils.sheet_add_aoa(worksheet, headerData, { origin: `A${currentRow + 1}` });
    for (let c = 0; c < totalCols; c++) {
      const headerRef = XLSX.utils.encode_cell({ r: currentRow, c });
      const headerCell = worksheet[headerRef];
      if (headerCell) {
        headerCell.s = {
          font: { bold: headerBold, color: { rgb: headerFontColor }, sz: headerFontSize, name: "Calibri" },
          fill: { patternType: "solid", fgColor: { rgb: headerColor } },
          alignment: { horizontal: "left", vertical: "center" },
          border: moduleType === "userList" ? borderStyle2 : borderStyle,
        };
      }
    }
    const headerRowIndex = currentRow;
    currentRow++;

    // ── Data Rows ──────────────────────────────────────────────────────────────
    if (formattedData.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, formattedData, {
        skipHeader: true,
        origin: `A${currentRow + 1}`,
      });
    }

    // ── Style Data Rows ────────────────────────────────────────────────────────
    const dataStartRow = currentRow;
    const dataEndRow = dataStartRow + formattedData.length;
    const maxContentLengths = new Array(totalCols).fill(0);

    for (let r = dataStartRow; r < dataEndRow; r++) {
      for (let c = 0; c < totalCols; c++) {
        const dataRef = XLSX.utils.encode_cell({ r, c });
        const dataCell = worksheet[dataRef];
        if (dataCell) {
          const cellValue = dataCell.v;
          let horizontalAlign = "left";
          const isZoneRow = !!data[r - dataStartRow]?._iszone;
          const colHeaderName = filteredColumns[c]?.headerName || "";
          const isHighlight = !isZoneRow && highlightSet.has(colHeaderName);

          if (cellValue !== null && cellValue !== undefined && cellValue !== "") {
            const stringValue = String(cellValue).trim();
            const contentLength = stringValue.length;
            if (contentLength > maxContentLengths[c]) maxContentLengths[c] = contentLength;
            if (cellValue instanceof Date) horizontalAlign = "right";
            else if (/^-?\d*\.?\d+$/.test(stringValue)) horizontalAlign = "right";
            else horizontalAlign = "left";
          }

          const getFill = () => {
            if (isZoneRow && zoneRowColor) return { fill: { patternType: "solid", fgColor: { rgb: zoneRowColor } } };
            if (isHighlight) return { fill: { patternType: "solid", fgColor: { rgb: "d0e8f5" } } };
            return {};
          };

          dataCell.s = {
            font: {
              sz: dataFontSize,
              color: { rgb: isZoneRow && zoneRowFontColor ? zoneRowFontColor : dataFontColor },
              name: "Calibri",
            },
            alignment: { horizontal: isHighlight ? "center" : horizontalAlign, vertical: "center" },
            ...getFill(),
            border: moduleType === "userList" || moduleType === "customerList" ? borderStyle2 : borderStyle,
          };
        }
      }
    }

    // ── Grand Total Row ────────────────────────────────────────────────────────
    if (formattedGrandTotal) {
      const gtRowIndex = dataEndRow + 1; // +1 empty row gap (same as CSV \n)

      XLSX.utils.sheet_add_json(worksheet, [formattedGrandTotal], {
        skipHeader: true,
        origin: `A${gtRowIndex + 1}`,
      });

      // Style grand total row
      for (let c = 0; c < totalCols; c++) {
        const gtRef = XLSX.utils.encode_cell({ r: gtRowIndex, c });
        if (!worksheet[gtRef]) worksheet[gtRef] = { v: "", t: "s" };
        const gtCell = worksheet[gtRef];

        const cellValue = gtCell.v;
        let horizontalAlign = "left";
        if (cellValue !== null && cellValue !== undefined && cellValue !== "") {
          const stringValue = String(cellValue).trim();
          if (/^-?\d*\.?\d+$/.test(stringValue)) horizontalAlign = "right";
        }

        gtCell.s = {
          font: {
            bold: true,
            sz: dataFontSize,
            color: { rgb: headerFontColor },
            name: "Calibri",
          },
          fill: { patternType: "solid", fgColor: { rgb: headerColor } },
          alignment: { horizontal: horizontalAlign, vertical: "center" },
          border: borderStyle,
        };
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // ── Column Widths ──────────────────────────────────────────────────────────
    worksheet["!cols"] = filteredColumns.map((col, index) => {
      const headerLength = col.headerName.length;
      const contentLength = maxContentLengths[index] || 0;
      const maxLength = Math.max(headerLength, contentLength);
      if ((moduleType === "quotation" || moduleType === "currentoverdue" || moduleType === "inventory") && index === 0) {
        return { wch: Math.max(40, maxLength + 4) };
      }
      return { wch: Math.min(Math.max(maxLength + 4, 12), 30) };
    });

    // ── AutoFilter ─────────────────────────────────────────────────────────────
    if (showFilters && formattedData.length > 0) {
      worksheet["!autofilter"] = {
        ref: `A${headerRowIndex + 1}:${XLSX.utils.encode_col(totalCols - 1)}${dataEndRow}`,
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const wbout = XLSX.write(workbook, {
      bookType: "xlsx", type: "array", compression: true, cellStyles: true,
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