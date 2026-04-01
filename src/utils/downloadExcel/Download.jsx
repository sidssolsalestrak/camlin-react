import { cleanColumns } from "./cleanColumns";

export const Download = async (
  data,
  columns,
  filename,
  setProgress,
  enqueueSnackbar,
  moduleType = "",
  additionalData={}
) => {
  if (!Array.isArray(data) || data.length === 0) {
    enqueueSnackbar("NO DATA AVAILABLE TO EXPORT", {
      variant: "error",
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
    return;
  }

  setProgress("0%");
  await new Promise((r) => setTimeout(r, 200));
  setProgress("25%");

  //Automatically sanitize columns
  const safeColumns = cleanColumns(columns);

  const worker = new Worker(new URL("./xlsxWorker.js", import.meta.url));
  worker.postMessage({ data, columns: safeColumns, filename, moduleType ,additionalData});

  worker.onmessage = async (e) => {
    const { status, buffer, error, filename: name } = e.data;
    await new Promise((r) => setTimeout(r, 200));
    setProgress("50%");

    if (status === "success") {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setProgress("100%");
      setTimeout(() => setProgress(null), 1500);
    } else {
      console.error(error);
      setTimeout(() => setProgress(null), 1500);
    }

    worker.terminate();
  };
};