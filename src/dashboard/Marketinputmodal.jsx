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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

/**
 * Mirrors PHP's #putMarketInputModal:
 *  - "Purpose" select — populated from `getSamples` (already fetched once via
 *    callSummaryDetails_new, mirrors PHP's <select id="getSamples">).
 *  - "Market Input" multi-select — populated from `marketInputOptions`
 *    (the full catalog, mirrors PHP's <select id="getMarketInput"> options list).
 *  - On open, calls /dashboard/getMarketInput with { mass_id: callId } to
 *    pre-select whichever market inputs + sample type are already saved for
 *    this call (PHP: $getMarketInput->samp_typ_id and the selected product ids).
 *  - On save, calls /dashboard/addMarketInput with { massId, marketdata, sampId, userType }.
 */
export default function MarketInputModal({
  open,
  onClose,
  callId,
  marketInputOptions = [], // full catalog: [{ id, Description }] — from callSummaryDetails_new's getMarketInput
  sampleOptions = [], // purpose/sample types: [{ id, sample_type }] — from callSummaryDetails_new's getSamples
  userType,
  api,
  onSaved, // (result) => void
}) {
  const [loading, setLoading] = useState(false);
  const [selectedInputs, setSelectedInputs] = useState([]);
  const [selectedSample, setSelectedSample] = useState("");

  useEffect(() => {
    if (!open || !callId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.post("/dashboard/getMarketInput", { mass_id: callId });
        const data = res.data;
        if (!cancelled) {
          if (data && data !== 0) {
            const selectedIds = data.map((d) => String(d.prod_id ?? d.id));
            setSelectedInputs(
              marketInputOptions.filter((opt) => selectedIds.includes(String(opt.id)))
            );
            setSelectedSample(String(data[0]?.samp_typ_id ?? ""));
          } else {
            setSelectedInputs([]);
            setSelectedSample(sampleOptions[0]?.id ? String(sampleOptions[0].id) : "");
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setSelectedInputs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, callId, marketInputOptions, sampleOptions, api]);

  const handleSave = async () => {
    try {
      const marketdata = selectedInputs.map((s) => s.id);
      const marketname = selectedInputs.map((s) => s.Description);
      const res = await api.post("/dashboard/addMarketInput", {
        massId: callId,
        marketdata,
        marketname,
        sampId: selectedSample,
        userType,
      });
      onSaved && onSaved(res.data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Market Input</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Purpose</InputLabel>
              <Select
                label="Purpose"
                value={selectedSample}
                onChange={(e) => setSelectedSample(e.target.value)}
              >
                {sampleOptions.map((opt) => (
                  <MenuItem key={opt.id} value={String(opt.id)}>
                    {opt.sample_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={marketInputOptions}
              getOptionLabel={(opt) => opt.Description || ""}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              value={selectedInputs}
              onChange={(e, newVal) => setSelectedInputs(newVal)}
              renderInput={(params) => (
                <TextField {...params} label="Market Input" placeholder="Select" />
              )}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
}