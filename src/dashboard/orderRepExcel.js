export const exportOrderApprovalToExcel = (data, options = {}) => {
  // Functions can't be sent to a worker, so split them out
  const { onSuccess = () => {}, onError = () => {}, ...workerOptions } = options;

  if (!data || data.length === 0) {
    onError("No data to export");
    return;
  }

  const worker = new Worker(new URL("./excelWorker.js", import.meta.url));

  worker.onmessage = (e) => {
    worker.terminate();
    if (!e.data.ok) {
      onError("Failed to export data: " + e.data.error);
      return;
    }
    try {
      const blob = new Blob([e.data.buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Order_Approval_Details.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onSuccess("Export completed successfully");
    } catch (err) {
      onError("Failed to export data: " + err.message);
    }
  };

  worker.onerror = (err) => {
    worker.terminate();
    onError("Failed to export data: " + (err.message || "worker error"));
  };

  worker.postMessage({ data, options: workerOptions });
};