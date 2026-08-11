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

/**
 * Mirrors PHP's #deleteCallModal / #delcall handler:
 *  - Requires non-empty remarks before allowing delete (PHP validates this
 *    client-side with a red border + "Please Enter Remarks!!" message).
 *  - POSTs to /dashboard/delete_call with { mas_id, deleteremarks }.
 *  - Backend returns "200" on success, "400" on failure.
 */
export default function DeleteCallModal({ open, onClose, callId, api, onDeleted }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setRemarks("");
    setError("");
    onClose();
  };

  const handleDelete = async () => {
    if (!remarks.trim()) {
      setError("Please Enter Remarks!!");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/dashboard/delete_call", {
        mas_id: callId,
        deleteremarks: remarks,
      });
      const result = String(res.data).trim();
      if (result === "200") {
        onDeleted && onDeleted(callId);
        handleClose();
      } else {
        setError("Unable to Delete Report");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to Delete Report");
    } finally {
      setSaving(false);
    }
  };

  return (
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
        <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}