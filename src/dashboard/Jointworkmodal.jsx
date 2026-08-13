import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Autocomplete,
  TextField,
  Typography,
} from "@mui/material";
import useToast from '../utils/useToast';

/**
 * Mirrors PHP's #putJointWorkModal:
 *  - On open, fetches /dashboard/getJointWorkSr with { mass_id: callId } to get
 *    already-tagged joint_id values, and pre-selects those from the `userJoint`
 *    PSM list (already fetched once via callSummaryDetails_new, mirrors PHP's
 *    $userJoint used to populate <select id="getJointWorkSr">).
 *  - On save, calls /dashboard/addJointWorkSr — NOT YET WIRED, backend route
 *    not shared yet. Save button is disabled with an explanatory tooltip until
 *    that endpoint is provided.
 */
export default function JointWorkModal({
  open,
  onClose,
  callId,
  cusId,
  mainId,
  userJoint = [], // [{ id, name, type, mas_id, ... }] from callSummaryDetails_new
  api,
  onSaved, // (result) => void — called after a successful save, once addJointWorkSr exists
}) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const showAlert = useToast();

  useEffect(() => {
    if (!open || !callId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.post("/dashboard/getJointWorkSr", { mass_id: callId });
        const data = res.data?.data;
        const preselectedIds =
          data && data !== 0 ? data.map((d) => String(d.joint_id)) : [];
        if (!cancelled) {
          setSelected(
            userJoint.filter((u) => preselectedIds.includes(String(u.id)))
          );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setSelected([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, callId, userJoint, api]);

  const handleSave = async () => {
    if (!onSaved) return; // addJointWorkSr not wired yet
    try {
      const jointWorkSr = selected.map((s) => s.id);
      const jointSrType = selected[0]?.type ?? "";
      const res = await api.post("/dashboard/addJointWorkSr", {
        jointWorkSr,
        cusId,
        jointSrType,
        massId: callId,
        mainId,
      });
      if (res?.data) {
        showAlert.success("Joint work Updated")
      }
      onSaved(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      showAlert.error("Failed to Update")
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Joint Work</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Autocomplete
            multiple
            options={userJoint}
            getOptionLabel={(opt) => opt.name || ""}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={selected}
            onChange={(e, newVal) => setSelected(newVal)}
            renderInput={(params) => <TextField {...params} label="PSM" placeholder="Select PSM" />}
          />
        )}
        {!onSaved && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            Saving is disabled until the addJointWorkSr endpoint is wired up.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!onSaved || loading}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}