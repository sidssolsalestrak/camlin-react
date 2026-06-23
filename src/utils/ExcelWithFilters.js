import * as XLSX from "xlsx-js-style";
import dayjs from "dayjs";

const getBorderStyle = () => ({
  top: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } }
});

const getHorizontalAlign = (cellValue) => {
  if (cellValue instanceof Date) return "right";
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(cellValue).trim())) {
    return "left";
  }
  return "right";
};

const formatCellValue = (value) => {
  if (!value || typeof value !== "string") return value;

  const dateWithTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/;
  if (!dateWithTimeRegex.test(value)) return value;

  const parsed = dayjs(value);
  return parsed.isValid() ? { v: parsed.toDate(), t: "d", z: "dd-mmm-yy" } : value;
};

const formatDataRows = (tableData, fieldIds, headers) => {
  return tableData.map((row) => {
    const newRow = {};
    fieldIds.forEach((fieldId, index) => {
      const value = row[fieldId] ?? "";
      newRow[headers[index]] = formatCellValue(value);
    });
    return newRow;
  });
};

const addTitleRows = (ws, mergedTitleRows, borderStyle, type) => {
  ws["!merges"] = [];

  mergedTitleRows.forEach((title, i) => {
    const origin = `A${i + 1}`;
    XLSX.utils.sheet_add_aoa(ws, [[title.label]], { origin });
    ws["!merges"].push({ s: { r: i, c: 0 }, e: { r: i, c: 3 } });

    for (let c = 0; c <= 3; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c });
      if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };

      ws[cellRef].s = {
        font: { bold: title.bold, sz: title.sz, color: { rgb: type > 0 ? "FFFFFF" : "000000" }, name: "Calibri" },
        fill: { patternType: "solid", fgColor: { rgb: type > 0 ? "3464a7" : "FFFFFF" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderStyle
      };
    }
  });
};

const addHeaderRow = (ws, headers, currentRow, borderStyle, headerFontSize, type) => {
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: `A${currentRow + 1}` });

  headers.forEach((header, c) => {
    const cellRef = XLSX.utils.encode_cell({ r: currentRow, c });
    if (!ws[cellRef]) ws[cellRef] = { v: header, t: "s" };

    ws[cellRef].s = {
      font: { bold: false, sz: headerFontSize || 9, color: { rgb: "FFFFFF" }, name: "Calibri" },
      fill: { patternType: "solid", fgColor: { rgb: type > 0 ? "6398c3" : "3464a7" } },
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: borderStyle
    };
  });
};

const styleDataCells = (ws, dataStartRow, dataEndRow, totalCols, borderStyle, maxContentLengths, cellFontSize) => {
  for (let r = dataStartRow; r < dataEndRow; r++) {
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      const cellValue = cell.v;
      if (cellValue !== null && cellValue !== undefined && cellValue !== "") {
        const stringValue = String(cellValue).trim();
        maxContentLengths[c] = Math.max(maxContentLengths[c] || 0, stringValue.length);
      }

      const horizontalAlign = getHorizontalAlign(cellValue);
      cell.s = {
        font: { sz: cellFontSize || 9, color: { rgb: "000000" }, name: "Calibri" },
        alignment: { horizontal: horizontalAlign, vertical: "center", wrapText: true },
        border: borderStyle
      };
    }
  }
};

const setColumnWidths = (ws, headers, maxContentLengths) => {
  ws["!cols"] = headers.map((header, index) => {
    const maxLength = Math.max(header.length, maxContentLengths[index] || 0);
    const cap = header === "PRODUCT NAME" ? 50 : 30; 
    return { wch: Math.min(Math.max(maxLength + 4, 12), cap) };
  });
};

const setRowHeights = (ws, mergedTitleRows, formattedData) => {
  ws["!rows"] = [
    ...mergedTitleRows.map((t) => ({ hpt: t.bold ? 22 : 18 })),
    { hpt: 25 },
    ...formattedData.map(() => ({ hpt: 20 }))
  ];
};

export const excelWithFilters = async (tableData, tableColumns, fileName, filters, setProgress, type = 0, { headerFontSize = 9, cellFontSize = 9 } = {}) => {
  try {
    setProgress("0%");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([], { cellDates: true });
    const borderStyle = getBorderStyle();

    await new Promise((r) => setTimeout(r, 200));
    setProgress("25%");

    const headers = tableColumns.map((col) => col.label);
    const fieldIds = tableColumns.map((col) => col.id);
    const totalCols = headers.length;
    const currentDate = dayjs().format("DD MMM YYYY HH:mm:ss");
    const mergedTitleRows = [
      ...filters,
      // { label: `Refreshed : ${currentDate}`, bold: false, sz: 10 },
      // { label: `Records Returned : ${tableData.length}`, bold: false, sz: 10 }
    ];

    addTitleRows(ws, mergedTitleRows, borderStyle, type);
    const headerRowIndex = mergedTitleRows.length;
    addHeaderRow(ws, headers, headerRowIndex, borderStyle, headerFontSize, type);

    await new Promise((r) => setTimeout(r, 200));
    setProgress("50%");

    const formattedData = formatDataRows(tableData, fieldIds, headers);
    const dataStartRow = headerRowIndex + 1;
    XLSX.utils.sheet_add_json(ws, formattedData, {
      skipHeader: true,
      origin: `A${dataStartRow + 1}`
    });

    await new Promise((r) => setTimeout(r, 200));
    setProgress("90%");

    const maxContentLengths = new Array(totalCols).fill(0);
    styleDataCells(ws, dataStartRow, dataStartRow + formattedData.length, totalCols, borderStyle, maxContentLengths, cellFontSize);
    // ── Apply subtotal row colors ──
    tableData.forEach((row, rowIndex) => {
      const r = dataStartRow + rowIndex;
      let bgColor = null;
      let fontColor = "000000";
      let isBold = false;

      if (row._isGroupHeader) {
        bgColor = row.bgcolor || "f59e0b";      // orange — matches UI
        fontColor = row.color || "FFFFFF";
        isBold = true;
      }
      if (row._grandTotal) bgColor = "bdbdbd";
      else if (row._zoneTotal) bgColor = "e0e0e0";
      else if (row._isSubtotal || row._subtotal) bgColor = "eeeeee";
      if (!bgColor) return;

      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
        ws[cellRef].s = {
          ...ws[cellRef].s,
          fill: { patternType: "solid", fgColor: { rgb: bgColor } },
          font: {
            ...ws[cellRef].s?.font, bold: isBold, sz: cellFontSize, name: "Calibri",
            color: { rgb: fontColor },
          },
        };
      }
    });
    setColumnWidths(ws, headers, maxContentLengths);
    setRowHeights(ws, mergedTitleRows, formattedData);

    await new Promise((r) => setTimeout(r, 200));
    setProgress("100%");

    XLSX.utils.book_append_sheet(wb, ws, "gate");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Failed to download!", error);
  } finally {
    setProgress(null);
  }
};
