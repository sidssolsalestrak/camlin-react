import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import ConfirmationDialog from "../utils/confirmDialog";
import useToast from '../utils/useToast';

/**
 * Mirrors PHP's #deleteCallModal / #delcall handler:
 *  - Requires non-empty remarks before allowing delete (PHP validates this
 *    client-side with a red border + "Please Enter Remarks!!" message).
 *  - Shows a "Are you sure?" confirmation (matches OrderApproval's pattern)
 *    before actually calling the delete API.
 *  - POSTs to /dashboard/delete_call with { mas_id, deleteremarks }.
 *  - Backend returns "200" on success, "400" on failure.
 */
export default function DeleteCallModal({ open, onClose, callId, api, onDeleted }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const showAlert = useToast();

  // ---- Confirmation dialog (same shape as OrderApproval) ----
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
    confirmText: "Confirm",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const showConfirmationDialog = (config) => {
    setConfirmationDialog((prev) => ({
      ...prev,
      ...config,
      open: true,
    }));
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({
      ...prev,
      open: false,
      loading: false,
    }));
  };

  const handleClose = () => {
    setRemarks("");
    setError("");
    onClose();
  };

  // ---- Actual delete call (fires after confirmation) ----
  const doDelete = async () => {
    try {
      setConfirmationDialog((prev) => ({ ...prev, loading: true }));
      const res = await api.post("/dashboard/delete_call", {
        mas_id: callId,
        deleteremarks: remarks,
      });
      const result = String(res.data).trim();
      if (result === "200") {
        onDeleted && onDeleted(callId);
        handleClose();
        showAlert.success("Deleted Successfully")
      } else {
        showAlert.error("Unable to Delete");
      }
    } catch (err) {
      console.error(err);
      showAlert.error("Unable to Delete");
    } finally {
      closeConfirmationDialog();
    }
  };

  // ---- Validate remarks, then show "Are you sure?" ----
  const showDeleteConfirmation = () => {
    if (!remarks.trim()) {
      setError("Please Enter Remarks!!");
      return;
    }
    showConfirmationDialog({
      title: "Delete Call Report",
      message: "Are you sure?",
      confirmText: "Yes, Delete it!",
      confirmColor: "error",
      onConfirm: doDelete,
    });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Call Report</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Remarks"
            required
            fullWidth
            multiline
            minRows={3}
            value={remarks}
            onChange={(e) => {
              const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
              setRemarks(onlyText);
              if (error && onlyText.trim()) setError("");
            }}
            error={!!error}
          />
          {error && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="error" onClick={showDeleteConfirmation}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= Shared Confirmation Dialog ================= */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={closeConfirmationDialog}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        loading={confirmationDialog.loading}
        confirmColor={confirmationDialog.confirmColor}
      />
    </>
  );
}