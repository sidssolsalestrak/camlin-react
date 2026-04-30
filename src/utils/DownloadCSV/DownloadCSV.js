import { cleanColumns } from "../CleanColumns";

export const DownloadCSV = async (
  data,
  columns,
  filename,
  setProgress,
  enqueueSnackbar,
  meta = {} // e.g. { fromDate: "01 Apr 2026", toDate: "16 Apr 2026", type: "Approved" }
) => {
  if (!Array.isArray(data) || data.length === 0) {
    enqueueSnackbar("No Data Available for Export", {
      variant: "error",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
    setProgress(null);
    return;
  }
  setProgress("0%");
  await new Promise((r) => setTimeout(r, 200));
  setProgress("25%");

  // Automatically sanitize columns
  const safeColumns = cleanColumns(columns);

  const worker = new Worker(new URL("./CSVworksheet.js", import.meta.url));
  worker.postMessage({
    data,
    columns: safeColumns,
    filename: filename || "export",
    meta, // pass meta to worker
  });

  worker.onmessage = async (e) => {
    const { status, csvContent, error, filename: generatedFilename } = e.data;
    await new Promise((r) => setTimeout(r, 200));
    setProgress("50%");

    if (status === "success") {
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generatedFilename;
      a.click();
      URL.revokeObjectURL(url);
      setProgress("100%");
      setTimeout(() => setProgress(null), 1500);
    } else {
      console.error(error);
      enqueueSnackbar(`CSV Export Error: ${error}`, {
        variant: "error",
        anchorOrigin: { vertical: "top", horizontal: "center" },
      });
      setTimeout(() => setProgress(null), 1500);
    }
    worker.terminate();
  };

  worker.onerror = (error) => {
    console.error("Worker error:", error);
    enqueueSnackbar("CSV Export Worker Error", {
      variant: "error",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
    setProgress(null);
    worker.terminate();
  };
};