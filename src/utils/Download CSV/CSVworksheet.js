/* eslint-disable no-restricted-globals */
import dayjs from "dayjs";

self.onmessage = function (e) {
  const { data, columns, filename, meta = {} } = e.data;

  try {
    // Filter out the index column
    const filteredColumns = columns.filter((col) => col.field !== "index");

    // Format main data - remove time from date+time values
    const formattedData = data.map((row) => {
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
        newRow[col.headerName] = value;
      });
      return newRow;
    });

    const BOM = "\uFEFF";

    // Helper to escape CSV values
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

    // ── Dynamic meta header rows ───────────────────────────────────────────────
    // Iterate over whatever keys are present in meta, skip empty values.
    // Each entry can be either:
    //   - a string  → written as-is on its own row  (e.g. "Zone- All")
    //   - anything else → written as "Key: Value"   (e.g. "From Date: 01-01-2025")
    const metaEntries = Object.entries(meta).filter(([, v]) => v !== null && v !== undefined && v !== "");

    metaEntries.forEach(([key, value]) => {
      if (typeof value === "string" && value.includes(key)) {
        // Value is already a pre-formatted label string — write it directly
        csvContent += `${escapeCSV(value)}\n`;
      } else {
        // Plain value — prepend the key as a label
        csvContent += `${escapeCSV(key)}: ${escapeCSV(value)}\n`;
      }
    });

    if (metaEntries.length > 0) csvContent += "\n"; // blank separator row
    // ─────────────────────────────────────────────────────────────────────────

    // Table headers
    const headerData = filteredColumns.map((col) => escapeCSV(col.headerName));
    csvContent += headerData.join(",") + "\n";

    // Data rows
    formattedData.forEach((row) => {
      const rowData = filteredColumns.map((col) =>
        escapeCSV(row[col.headerName])
      );
      csvContent += rowData.join(",") + "\n";
    });

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