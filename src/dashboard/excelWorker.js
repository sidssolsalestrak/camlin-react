/* eslint-disable no-restricted-globals */
import XLSX from "xlsx-js-style";

const getStatusOnly = (str) => {
  if (!str) return "";
  const idx = str.lastIndexOf(" - ");
  return idx !== -1 ? str.slice(idx + 3).trim() : str.trim();
};

const buildWorkbook = (data, options) => {
  const {
    grandTotal = null,
    kamLabel = "",
    psmLabel = "",
    distributorLabel = "",
    regionLabel = "",
  } = options;

  const columnHeaders = [
    "Sl",
    `${regionLabel}`,
    `${psmLabel}/${kamLabel}`,
    "Date",
    "Customer",
    `${distributorLabel}`,
    "Tot qty",
    "Tot free",
    "Tot Value",
    "Tot offer",
    "Status",
    "Disc. Val.",
    "Upload Invoice",
  ];

  // Build rows directly as arrays (faster than objects + Object.values)
  const rows = data.map((row, index) => [
    index + 1,
    row.regName || "",
    row.psmName || "",
    row.ordDt || "",
    row.cusProd || "",
    row.stk || "",
    Number(row.totQty) || 0,
    Number(row.totFree) || 0,
    Number(row.totVal) || 0,
    Number(row.totOffer) || 0,
    getStatusOnly(row.statusname),
    Number(row.ordDiscVal) || 0,
    row.ordInvName ? row.ordInvName : "",
  ]);

  if (grandTotal) {
    rows.push([
      "", "", "", "", "", "Total",
      Number(grandTotal.qty) || 0,
      Number(grandTotal.free) || 0,
      Number(grandTotal.val) || 0,
      Number(grandTotal.offer) || 0,
      "",
      Number(grandTotal.discVal) || 0,
      "",
    ]);
  }

  const totalColumns = 13;
  const titleRow = Array(totalColumns).fill("");
  titleRow[0] = "Order approval details";

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([titleRow, columnHeaders, ...rows]);

  ws["!cols"] = [
    { wch: 5 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 30 },
    { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 15 },
  ];

  const lastRowIndex = rows.length + 1; // last row in the sheet (0-based)
  const headerRowIndex = 1;
  const dataStartIndex = 2;
  const dataEndIndex = grandTotal ? lastRowIndex - 1 : lastRowIndex;
  const totalRowIndex = lastRowIndex;
  const lastCol = totalColumns - 1;

  const side = { style: "thin", color: { rgb: "666666" } };
  const thinBorder = { top: side, bottom: side, left: side, right: side };

  // ---- Styles created ONCE and reused for every cell ----
  const titleStyle = {
    font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "000000" } },
    alignment: { horizontal: "center", vertical: "center" },
  };
  const headerStyle = {
    font: { bold: false, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
    fill: { fgColor: { rgb: "3464A7" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  };
  const dataText = {
    font: { sz: 10, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: thinBorder,
  };
  const dataNum = {
    font: { sz: 10, name: "Calibri" },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt: "#,##0.00",
    border: thinBorder,
  };
  const totalText = {
    font: { bold: true, sz: 10, name: "Calibri" },
    alignment: { horizontal: "left", vertical: "center" },
    border: thinBorder,
  };
  const totalLabel = {
    font: { bold: true, sz: 10, name: "Calibri" },
    alignment: { horizontal: "right", vertical: "center" },
    border: thinBorder,
  };
  const totalNum = { ...totalLabel, numFmt: "#,##0.00" };

  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];

  // Title
  const titleCell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  if (titleCell) titleCell.s = titleStyle;

  // Header
  for (let c = 0; c <= lastCol; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
    if (cell) cell.s = headerStyle;
  }

  // Data rows
  for (let r = dataStartIndex; r <= dataEndIndex; r++) {
    for (let c = 0; c <= lastCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      const isNum = (c >= 6 && c <= 9) || c === 11;
      cell.s = isNum ? dataNum : dataText;
    }
  }

  // Total row
  if (grandTotal) {
    for (let c = 0; c <= lastCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: totalRowIndex, c })];
      if (!cell) continue;
      if (c === 5) cell.s = totalLabel;
      else if ((c >= 6 && c <= 9) || c === 11) cell.s = totalNum;
      else cell.s = totalText;
    }
  }

  ws["!freeze"] = { xSplit: 0, ySplit: 2 };

  XLSX.utils.book_append_sheet(wb, ws, "OrderApproval");

  return XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
    compression: true,
    bookSST: false,
  });
};

self.onmessage = (e) => {
  try {
    const { data, options } = e.data;
    const buffer = buildWorkbook(data, options);
    self.postMessage({ ok: true, buffer });
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};