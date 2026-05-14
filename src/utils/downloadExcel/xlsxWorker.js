/* eslint-disable no-restricted-globals */
import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";
import { excelStyles } from "./excelConfig";

self.onmessage = function (e) {
  const { data, columns, moduleType, filename, additionalData, meta = {} } = e.data;

  try {
    const config = excelStyles[moduleType];
    if (!config) throw new Error("Invalid module type provided");
    const mergedConfig = { ...config, ...additionalData };

    const {
      headerColor, headerFontColor, headerFontSize, headerBold,
      titleRow1, titleColor, titleFontColor, titleFontSize, titleBold,
      sheetName, dataFontSize, dataFontColor,
    } = mergedConfig;

    // ── Check if any column has subColumns ────────────────────────────────
    const hasSubColumns = columns.some((col) => col.subColumns && col.subColumns.length > 0);

    const borderStyle = {
      top:    { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left:   { style: "thin", color: { rgb: "000000" } },
      right:  { style: "thin", color: { rgb: "000000" } },
    };

    // ── Flatten columns into leaf columns ──────────────────────────────────
    const groupHeaders = [];  // { label, startCol, endCol, spanRows? }
    const leafColumns  = [];  // { field, headerName }

    columns.forEach((col) => {
      if (col.subColumns && col.subColumns.length > 0) {
        const startCol = leafColumns.length;
        col.subColumns.forEach((sub) => leafColumns.push(sub));
        const endCol = leafColumns.length - 1;
        groupHeaders.push({ label: col.headerName, startCol, endCol });
      } else {
        // Top-level leaf column (e.g. "Brand/SKU") — spans both header rows when subColumns exist
        groupHeaders.push({
          label: col.headerName,
          startCol: leafColumns.length,
          endCol: leafColumns.length,
          spanRows: true,
        });
        leafColumns.push({ field: col.field, headerName: col.headerName });
      }
    });

    const totalCols = leafColumns.length;
    const worksheet = XLSX.utils.json_to_sheet([], { cellDates: true });
    const workbook  = XLSX.utils.book_new();
    worksheet["!merges"] = [];

    let currentRow = 0;

    // ── Title Row ──────────────────────────────────────────────────────────
    if (titleRow1) {
      XLSX.utils.sheet_add_aoa(worksheet, [[titleRow1]], { origin: "A1" });
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
      const cell = worksheet["A1"] || (worksheet["A1"] = { v: titleRow1, t: "s" });
      cell.s = {
        font:      { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
        fill:      { patternType: "solid", fgColor: { rgb: titleColor } },
        alignment: { horizontal: "left", vertical: "center" },
        border:    borderStyle,
      };
      for (let c = 1; c < totalCols; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        worksheet[ref] = { v: "", t: "s", s: { border: borderStyle } };
      }
      currentRow = 1;
    }

    // ── Header Row 1 — Group labels ────────────────────────────────────────
    const groupRowIdx = currentRow;

    groupHeaders.forEach(({ label, startCol, endCol, spanRows }) => {
      const cellRef = XLSX.utils.encode_cell({ r: groupRowIdx, c: startCol });
      worksheet[cellRef] = {
        v: label, t: "s",
        s: {
          font:      { bold: headerBold, sz: headerFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
          fill:      { patternType: "solid", fgColor: { rgb: headerColor } },
          alignment: { horizontal: "center", vertical: "center" },
          border:    borderStyle,
        },
      };

      if (hasSubColumns && spanRows) {
        // Leaf-level top column → merge across both header rows (group + sub)
        worksheet["!merges"].push({
          s: { r: groupRowIdx,     c: startCol },
          e: { r: groupRowIdx + 1, c: endCol   },
        });
      } else if (!spanRows && startCol !== endCol) {
        // Group with subColumns spans multiple cols in group row only
        worksheet["!merges"].push({
          s: { r: groupRowIdx, c: startCol },
          e: { r: groupRowIdx, c: endCol   },
        });
      }

      // Fill empty cells in the group range so borders render
      for (let c = startCol; c <= endCol; c++) {
        const ref = XLSX.utils.encode_cell({ r: groupRowIdx, c });
        if (!worksheet[ref]) worksheet[ref] = { v: "", t: "s" };
        worksheet[ref].s = {
          font:      { bold: headerBold, sz: headerFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
          fill:      { patternType: "solid", fgColor: { rgb: headerColor } },
          alignment: { horizontal: "center", vertical: "center" },
          border:    borderStyle,
        };
      }
    });
    currentRow++;

    // ── Header Row 2 — Sub-column labels (only when subColumns exist) ──────
    let subRowIdx = null;
    if (hasSubColumns) {
      subRowIdx = currentRow;
      leafColumns.forEach((col, c) => {
        const cellRef = XLSX.utils.encode_cell({ r: subRowIdx, c });
        worksheet[cellRef] = {
          v: col.headerName, t: "s",
          s: {
            font:      { bold: headerBold, sz: headerFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
            fill:      { patternType: "solid", fgColor: { rgb: headerColor } },
            alignment: { horizontal: "center", vertical: "center" },
            border:    borderStyle,
          },
        };
      });
      currentRow++;
    }

    // ── Data Rows ──────────────────────────────────────────────────────────
    const dataStartRow = currentRow;

    data.forEach((row, rowOffset) => {
      const r = dataStartRow + rowOffset;
      leafColumns.forEach((col, c) => {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        let value     = row[col.field] ?? "";
        const isNumeric = value !== "" && value !== "-" && !isNaN(Number(value));

        const baseStyle = {
          font:      { sz: dataFontSize, color: { rgb: dataFontColor }, name: "Calibri" },
          alignment: { horizontal: isNumeric ? "right" : "left", vertical: "center" },
          border:    borderStyle,
        };

        const totalStyle = row.isTotal
          ? {
              font: { bold: true, sz: dataFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
              fill: { patternType: "solid", fgColor: { rgb: headerColor } },
            }
          : {};

        worksheet[cellRef] = {
          v: isNumeric ? Number(value) : (value === "-" ? "-" : value),
          t: isNumeric ? "n" : "s",
          s: { ...baseStyle, ...totalStyle },
        };
      });
    });

    // ── Column widths ──────────────────────────────────────────────────────
    worksheet["!cols"] = leafColumns.map((col) => ({
      wch: Math.min(Math.max(col.headerName.length + 4, 12), 30),
    }));

    // ── Row heights ────────────────────────────────────────────────────────
    worksheet["!rows"] = [];
    if (titleRow1)          worksheet["!rows"][0]          = { hpt: 22 };
                            worksheet["!rows"][groupRowIdx] = { hpt: 13 };
    if (subRowIdx !== null) worksheet["!rows"][subRowIdx]   = { hpt: 13 };

    // ── Sheet range ────────────────────────────────────────────────────────
    const lastDataRow   = dataStartRow + data.length - 1;
    const lastColLetter = XLSX.utils.encode_col(totalCols - 1);
    worksheet["!ref"]   = `A1:${lastColLetter}${lastDataRow + 1}`;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

    const wbout = XLSX.write(workbook, {
      bookType: "xlsx", type: "array", compression: true, cellStyles: true,
    });

    self.postMessage({ status: "success", buffer: wbout, filename });
  } catch (err) {
    self.postMessage({ status: "error", error: err.message });
  }
};