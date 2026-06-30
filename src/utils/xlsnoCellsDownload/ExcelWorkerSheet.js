/* eslint-disable no-restricted-globals */
import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";
import { excelStyles } from "../downloadExcel/excelConfig";

self.onmessage = function (e) {
    const { data, columns, moduleType, filename, additionalData, meta = {} } = e.data;

    try {
        const config = excelStyles[moduleType];
        if (!config) throw new Error("Invalid module type provided");
        const mergedConfig = { ...config, ...additionalData };

        const {
            headerColor, headerFontColor, headerFontSize, headerBold,
            titleRow1, titleRow2, titleRow3,titleRow4,
            titleColor, titleFontColor, titleFontSize, titleBold,
            sheetName, dataFontSize, dataFontColor,
        } = mergedConfig;

        // ── Check if any column has subColumns ────────────────────────────────
        const hasSubColumns = columns.some((col) => col.subColumns && col.subColumns.length > 0);

        // ── Border helpers ─────────────────────────────────────────────────────
        // Strategy:
        //   - Outer table edges (top, bottom, left, right) always drawn
        //   - Vertical column dividers: every cell gets left border (acts as col line)
        //     and last column gets right border (outer right edge)
        //   - Horizontal row dividers: every cell gets bottom border (acts as row line)
        //     and first data/header row gets top border (outer top edge)
        const thin = { style: "thin", color: { rgb: "000000" } };
        const none = undefined;

        /**
         * Returns a border object for a cell.
         *
         * @param {object} opts
         *   topEdge    – true if this cell is on the very top boundary of the table
         *   leftCol    – true to draw left border (all columns get this = col divider)
         *   rightCol   – true to draw right border (last column only = outer right)
         *   bottomRow  – true to draw bottom border (all rows get this = row divider)
         */
        function makeBorder({ topEdge, leftCol, rightCol, bottomRow }) {
            return {
                top: topEdge ? thin : none,  // outer top only (title rows / first header)
                bottom: bottomRow ? thin : none,  // every row gets a bottom line
                left: leftCol ? thin : none,  // every column gets a left line
                right: rightCol ? thin : none,  // outer right on last column only
            };
        }

        // ── Flatten columns into leaf columns ──────────────────────────────────
        const groupHeaders = [];  // { label, startCol, endCol, spanRows? }
        const leafColumns = [];  // { field, headerName }

        columns.forEach((col) => {
            if (col.subColumns && col.subColumns.length > 0) {
                const startCol = leafColumns.length;
                col.subColumns.forEach((sub) => leafColumns.push(sub));
                const endCol = leafColumns.length - 1;
                groupHeaders.push({ label: col.headerName, startCol, endCol });
            } else {
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
        const workbook = XLSX.utils.book_new();
        worksheet["!merges"] = [];

        let currentRow = 0;

        // ── Title Rows (up to 3) ───────────────────────────────────────────────
        const titleRows = [titleRow1, titleRow2, titleRow3, titleRow4].filter(Boolean);
        const totalTitleRows = titleRows.length;

        titleRows.forEach((titleText, idx) => {
            const rowIdx = idx;
            const topEdge = rowIdx === 0;           // outer top only on first title row
            // title rows always get bottom line (row divider); last title row bottom
            // naturally separates titles from headers

            XLSX.utils.sheet_add_aoa(worksheet, [[`  ${titleText}`]], { origin: `A${rowIdx + 1}` });
            worksheet["!merges"].push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: totalCols - 1 } });

            for (let c = 0; c < totalCols; c++) {
                const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
                const cell = worksheet[ref] || (worksheet[ref] = { v: c === 0 ? titleText : "", t: "s" });
                cell.s = {
                    font: { bold: titleBold, sz: titleFontSize, color: { rgb: titleFontColor }, name: "Calibri" },
                    fill: { patternType: "solid", fgColor: { rgb: titleColor } },
                    alignment: { horizontal: "left", vertical: "top" },
                    border: makeBorder({
                        topEdge: false,
                        bottomRow: false,
                        leftCol: false,
                        rightCol: false,
                    }),
                };
            }

            currentRow++;
        });

        // ── Header Row 1 — Group labels ────────────────────────────────────────
        const groupRowIdx = currentRow;
        const headerIsLast = !hasSubColumns;

        groupHeaders.forEach(({ label, startCol, endCol, spanRows }) => {
            if (hasSubColumns && spanRows) {
                worksheet["!merges"].push({
                    s: { r: groupRowIdx, c: startCol },
                    e: { r: groupRowIdx + 1, c: endCol },
                });
            } else if (!spanRows && startCol !== endCol) {
                worksheet["!merges"].push({
                    s: { r: groupRowIdx, c: startCol },
                    e: { r: groupRowIdx, c: endCol },
                });
            }

            for (let c = startCol; c <= endCol; c++) {
                const ref = XLSX.utils.encode_cell({ r: groupRowIdx, c });
                if (!worksheet[ref]) worksheet[ref] = { v: c === startCol ? label : "", t: "s" };
                else worksheet[ref].v = c === startCol ? label : worksheet[ref].v;

                worksheet[ref].s = {
                    font: { bold: headerBold, sz: headerFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
                    fill: { patternType: "solid", fgColor: { rgb: headerColor } },
                    alignment: { horizontal: "left", vertical: "center" },
                    border: makeBorder({
                        topEdge: true,                   // always draw top border on header row
                        bottomRow: true,                 // row divider below header row
                        leftCol: true,    
                        rightCol: c === totalCols - 1,
                    }),
                };
            }
        });
        currentRow++;

        // ── Header Row 2 — Sub-column labels (only when subColumns exist) ──────
        let subRowIdx = null;
        if (hasSubColumns) {
            subRowIdx = currentRow;
            leafColumns.forEach((col, c) => {
                const ref = XLSX.utils.encode_cell({ r: subRowIdx, c });
                worksheet[ref] = {
                    v: col.headerName, t: "s",
                    s: {
                        font: { bold: headerBold, sz: headerFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
                        fill: { patternType: "solid", fgColor: { rgb: headerColor } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: makeBorder({
                            topEdge: false,
                            bottomRow: true,                 // row divider below sub-header
                            leftCol: true,                 // col divider on every sub-col
                            rightCol: c === totalCols - 1,
                        }),
                    },
                };
            });
            currentRow++;
        }

        // ── Data Rows ──────────────────────────────────────────────────────────
        const dataStartRow = currentRow;
        const totalDataRows = data.length;

        data.forEach((row, rowOffset) => {
            const r = dataStartRow + rowOffset;
            const isLastRow = rowOffset === totalDataRows - 1;

            leafColumns.forEach((col, c) => {
                const ref = XLSX.utils.encode_cell({ r, c });
                let value = row[col.field] ?? "";
                const isNumeric = value !== "" && value !== "-" && !isNaN(Number(value));

                const baseStyle = {
                    font: { sz: dataFontSize, color: { rgb: dataFontColor }, name: "Calibri" },
                    alignment: { horizontal: isNumeric ? "right" : "left", vertical: "bottom", wrapText: true },
                    border: makeBorder({
                        topEdge: false,
                        bottomRow: true,                   // every data row gets a bottom line
                        leftCol: true,                   // every column gets a left line
                        rightCol: c === totalCols - 1,    // outer right on last column only
                    }),
                };

                const totalStyle = row.isTotal
                    ? {
                        font: { bold: true, sz: dataFontSize, color: { rgb: headerFontColor }, name: "Calibri" },
                        fill: { patternType: "solid", fgColor: { rgb: headerColor } },
                    }
                    : {};

                worksheet[ref] = {
                    v: isNumeric ? Number(value) : (value === "-" ? "-" : value),
                    t: isNumeric ? "n" : "s",
                    s: { ...baseStyle, ...totalStyle },
                };
            });
        });

        // ── Column widths ──────────────────────────────────────────────────────
        // ── Column widths ──────────────────────────────────────────────────────
        worksheet["!cols"] = leafColumns.map((col) => {
            const maxDataLen = data.reduce((max, row) => {
                const val = row[col.field] ?? "";
                return Math.max(max, String(val).length);
            }, 0);
            const maxLen = Math.max(col.headerName.length + 4, maxDataLen + 2, 12);
            return { wch: Math.min(maxLen, 36) }; // cap at 40; wrap handles the rest
        });

        // ── Row heights ────────────────────────────────────────────────────────
        worksheet["!rows"] = [];
        titleRows.forEach((_, idx) => {
            worksheet["!rows"][idx] = { hpt: 32 };
        });
        worksheet["!rows"][groupRowIdx] = { hpt: 13 };
        if (subRowIdx !== null) worksheet["!rows"][subRowIdx] = { hpt: 13 };

        // ── Sheet range ────────────────────────────────────────────────────────
        const lastDataRow = dataStartRow + data.length - 1;
        const lastColLetter = XLSX.utils.encode_col(totalCols - 1);
        worksheet["!ref"] = `A1:${lastColLetter}${lastDataRow + 1}`;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

        const wbout = XLSX.write(workbook, {
            bookType: "xlsx", type: "array", compression: true, cellStyles: true,
        });

        self.postMessage({ status: "success", buffer: wbout, filename });
    } catch (err) {
        self.postMessage({ status: "error", error: err.message });
    }
};