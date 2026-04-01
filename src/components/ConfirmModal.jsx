import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
  title = "Confirmation",
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Typography>
          {message || "Are you sure you want to proceed?"}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="error" variant="outlined">
          Cancel
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Processing..." : "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmModal;
