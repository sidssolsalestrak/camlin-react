/* eslint-disable no-restricted-globals */
import dayjs from "dayjs";

self.onmessage = function (e) {
  const { data, columns, filename, meta = {}, grandTotal = false } = e.data;

  const grandTotalLabel =
    typeof grandTotal === "object" && grandTotal.label
      ? grandTotal.label
      : "Grand Total";

  try {
    // Filter out the index column
    const filteredColumns = columns.filter((col) => col.field !== "index");

    // ── Helper: parse a value to a number (treat "-", null, "", undefined as 0) ──
    const toNumber = (val) => {
      if (val === null || val === undefined || val === "" || val === "-")
        return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    // ── Build the grand total config ────────────────────────────────────────────
    // Returns a map of { [field]: "sum" | "avg" | "none" | "skip" | "label" }
    const buildGrandTotalConfig = () => {
      if (!grandTotal) return null;

      // If caller passed an explicit per-field object, use it directly
      if (typeof grandTotal === "object" && !grandTotal.label) {
        return grandTotal; // keyed by field name
      }

      // Auto-detect: inspect the first data row to classify each column
      const autoConfig = {};
      const sampleRow = data[0] ?? {};
      filteredColumns.forEach((col, idx) => {
        if (idx === 0) {
          autoConfig[col.field] = "label"; // first column → Grand Total label
          return;
        }
        const val = sampleRow[col.field];
        // If the stored value is numeric-looking → sum; otherwise → skip
        const isNumeric =
          val !== null &&
          val !== undefined &&
          val !== "" &&
          val !== "-" &&
          !isNaN(Number(val));
        autoConfig[col.field] = isNumeric ? "sum" : "skip";
      });
      return autoConfig;
    };

    const gtConfig = buildGrandTotalConfig(); // null when grandTotal === false

    // ── Compute grand total values keyed by field ───────────────────────────────
    const computeGrandTotals = (config) => {
      const totals = {};
      filteredColumns.forEach((col) => {
        const agg = config[col.field] ?? "skip";
        if (agg === "label") {
          totals[col.field] = grandTotalLabel;
          return;
        }
        if (agg === "none") {
          totals[col.field] = "-";
          return;
        }
        if (agg === "skip") {
          totals[col.field] = "";
          return;
        }
        // sum / avg
        const numbers = data.map((row) => toNumber(row[col.field]));
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        if (agg === "sum") {
          totals[col.field] = sum;
        } else if (agg === "avg") {
          const avg = numbers.length > 0 ? sum / numbers.length : 0;
          // Round to at most 2 decimal places; show "-" if result is 0
          const rounded = Math.round(avg * 100) / 100;
          totals[col.field] = rounded === 0 ? "-" : rounded;
        }
      });
      return totals;
    };

    const grandTotalValues = gtConfig ? computeGrandTotals(gtConfig) : null;

    // ── Format main data — remove time from date+time values ───────────────────
    const formatRow = (row) => {
      const newRow = {};
      filteredColumns.forEach((col) => {
        let value = row[col.field] ?? "";
        if (col.type === "date" && value) {
          const parsed = dayjs(value);
          if (parsed.isValid()) {
            value = parsed.format("DD-MM-YYYY");
          }
        } else if (value && typeof value === "string") {
          const dateWithTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/;
          if (dateWithTimeRegex.test(value)) {
            const parsed = dayjs(value);
            if (parsed.isValid()) {
              value = parsed.format("DD-MM-YYYY");
            }
          }
        }
        newRow[col.field] = value;
      });
      return newRow;
    };

    const formattedData = data.map(formatRow);

    // Format the grand total row the same way (dates would be rare, but keep symmetry)
    const formattedGrandTotal = grandTotalValues
      ? formatRow(grandTotalValues)
      : null;

    const BOM = "\uFEFF";

    // ── Helper to escape CSV values ─────────────────────────────────────────────
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      const escapedValue = stringValue.replace(/"/g, '""');
      if (/[,"\n\r]/.test(escapedValue)) {
        return `"${escapedValue}"`;
      }
      return escapedValue;
    };

    let csvContent = "";

    // ── Dynamic meta header rows ────────────────────────────────────────────────
    const colCount = filteredColumns.length > 0
      ? filteredColumns.length
      : data.length > 0
        ? Object.keys(data[0]).length  // ✅ count keys from first data row
        : 10;                          // fallback default if no data either

    const padCols = Math.max(0, Math.floor(colCount / 2) - 1);
    const pad = padCols > 0 ? ",".repeat(padCols) : "";

    if (meta?.centered) {
      // ── Centered style: title + dateRange ──
      if (meta?.title) {
        csvContent += `${pad}${escapeCSV(meta.title)}\n`;
      }
      if (meta?.dateRange) {
        csvContent += `${pad}${escapeCSV(meta.dateRange)}\n`;
      }
      if (meta?.title || meta?.dateRange) {
        csvContent += "\n";
      }
    } else {
      // ── Default style: key: value pairs ──
      const metaEntries = Object.entries(meta).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      );
      metaEntries.forEach(([key, value]) => {
        if (typeof value === "string" && value.includes(key)) {
          csvContent += `${escapeCSV(value)}\n`;
        } else {
          csvContent += `${escapeCSV(key)}: ${escapeCSV(value)}\n`;
        }
      });
      if (metaEntries.length > 0) csvContent += "\n";
    }
    // ───────────────────────────────────────────────────────────────────────────

    // Table headers
    if (meta?.monthHeaders && meta?.subColCount) {
      const fixedCount = meta.fixedColCount ?? 0;
      const subCount = meta.subColCount;
      const fixedPad = fixedCount > 0 ? ",".repeat(fixedCount) : "";

      // Row 1: Month names spanning subCount cols each
      const monthRow = meta.monthHeaders
        .map(m => escapeCSV(m) + (subCount > 1 ? ",".repeat(subCount - 1) : ""))
        .join(",");
      csvContent += fixedPad + monthRow + "\n";

      // Row 2: SubCol names (Opening, Pri.Sales...) each spanning 2 cols + spacer ← NEW
      if (meta?.subColHeaders) {
        const subColRowPerMonth = [
          ...meta.subColHeaders.flatMap(name => [escapeCSV(name), ""]),
          "" // spacer col
        ].join(",");
        const subColRow = meta.monthHeaders.map(() => subColRowPerMonth).join(",");
        csvContent += fixedPad + subColRow + "\n";
      }

      // Row 3: Qty / Value Rs column headers
      csvContent += filteredColumns.map(col => escapeCSV(col.headerName)).join(",") + "\n";
    } else {
      // Normal single header row
      csvContent += filteredColumns.map(col => escapeCSV(col.headerName)).join(",") + "\n";
    }

    // Data rows
    formattedData.forEach((row) => {
      const rowData = filteredColumns.map((col) =>
        escapeCSV(row[col.field])
      );
      csvContent += rowData.join(",") + "\n";
    });

    // ── Grand Total row (appended after all data rows) ──────────────────────────
    if (formattedGrandTotal) {
      csvContent += "\n";
      const gtRow = filteredColumns.map((col) =>
        escapeCSV(formattedGrandTotal[col.field])
      );
      csvContent += gtRow.join(",") + "\n";
    }
    // ───────────────────────────────────────────────────────────────────────────

    // Generate filename
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const finalFilename = filename
      ? `${filename}.csv`
      : `export_${timestamp}.csv`;

    self.postMessage({
      status: "success",
      csvContent: BOM + csvContent,
      filename: finalFilename,
    });
  } catch (err) {
    self.postMessage({ status: "error", error: err.message });
  }
};