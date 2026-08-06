import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
} from "@mui/material";
import dayjs from "dayjs";

// PHP zeroTonull(): 0/empty/null -> '-' (same pattern used across the app)
const zeroTonull = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0) return "-";
  return v;
};

const styles = {
  theads: {
    backgroundColor: "#3464a7",
    color: "#fff",
    fontWeight: 600,
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "13px",
  },
  dataCell: {
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "13px",
    verticalAlign: "top",
  },
  center: { textAlign: "center" },
};

/**
 * Mirrors admin/callSummaryDetails_new.php (+ the _filters partial):
 *  - Header row shows PSM name (profile.sr_name) and, only when type === 1
 *    (day-wise) and the viewer isn't userType 6, a "View Reporting Route Map" button.
 *  - One row per activitySummary entry, columns: Sl, Date, Customer|Class (dot
 *    colored green if cus_type_id===1 else red), Call time, Detailing (clm_secs),
 *    Joint Work (jnt_user), Market Input, Orders, Free, Samples, Remarks, Display.
 *  - The "Type" select (All/Retailer/Other) re-fetches via callSummaryDetails_new_filters
 *    and replaces only the table body — mirrored here via onTypeFilterChange.
 */
export default function CallSummaryTable({
  srId,
  type, // activityType (1 = day wise, 2 = cumulative) — controls the route-map button
  profile,
  activitySummary = [],
  onTypeFilterChange, // (custype) => void — refetches via callSummaryDetails_new_filters
  onRouteMapClick, // () => void — optional, only relevant when type === 1
  onAddJointWork, // (callId, cusId, mainId) => void
  onAddMarketInput, // (callId) => void
  onDeleteCall, // (callId) => void — omit to hide the trash icon entirely
}) {
  const [custype, setCustype] = useState("0");

  const handleCustypeChange = (e) => {
    const val = e.target.value;
    setCustype(val);
    onTypeFilterChange && onTypeFilterChange(val);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Typography>Type</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={custype} onChange={handleCustypeChange}>
            <MenuItem value="0">All</MenuItem>
            <MenuItem value="2">Retailer</MenuItem>
            <MenuItem value="3">Other</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2">
          <i className="fa fa-circle" aria-hidden="true" style={{ color: "red", fontSize: 10 }} /> Retailer
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={styles.theads}>Sl</TableCell>
              <TableCell sx={styles.theads} align="center">Date</TableCell>
              <TableCell sx={styles.theads} align="center">
                Customer Name / Class
              </TableCell>
              <TableCell sx={styles.theads} align="center">Call time</TableCell>
              <TableCell sx={styles.theads} align="center">Detailing</TableCell>
              <TableCell sx={styles.theads} align="center">Joint Work</TableCell>
              <TableCell sx={styles.theads} align="center">Market Input</TableCell>
              <TableCell sx={styles.theads} align="center">Orders</TableCell>
              <TableCell sx={styles.theads} align="center">Free</TableCell>
              <TableCell sx={styles.theads} align="center">Samples</TableCell>
              <TableCell sx={styles.theads} align="center">Remarks</TableCell>
              <TableCell sx={styles.theads} align="center">Display</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Header/profile summary row */}
            <TableRow sx={{ backgroundColor: "#eee" }}>
              <TableCell colSpan={12} sx={{ ...styles.dataCell, fontWeight: 600 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                    {profile?.sr_name || ""}
                  </Typography>
                  {Number(type) === 1 && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={onRouteMapClick}
                    >
                      View Reporting Route Map
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>

            {activitySummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} sx={styles.dataCell} align="center">
                  No Data
                </TableCell>
              </TableRow>
            ) : (
              activitySummary.map((key, idx) => {
                const dotColor = Number(key.cus_type_id) === 1 ? "green" : "red";
                const callTime =
                  key.call_time && dayjs(key.call_time).isValid()
                    ? dayjs(key.call_time).format("h:mm a")
                    : key.call_time;
                return (
                  <TableRow key={key.call_id ?? idx}>
                    <TableCell sx={styles.dataCell}>
                      {idx + 1}
                      <Box sx={{ mt: 0.5, display: "flex", gap: 1 }}>
                        <i
                          className="fa fa-plus-circle"
                          title="Add Joint Work"
                          aria-hidden="true"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            onAddJointWork && onAddJointWork(key.call_id, key.cus_id, key.call_id)
                          }
                        />
                        <i
                          className="fa fa-plus-square"
                          title="Add Market Input"
                          aria-hidden="true"
                          style={{ cursor: "pointer", color: "rgba(239,50,32,1)" }}
                          onClick={() => onAddMarketInput && onAddMarketInput(key.call_id)}
                        />
                        {onDeleteCall && (
                          <i
                            className="fa fa-trash"
                            title="Delete Call"
                            aria-hidden="true"
                            style={{ cursor: "pointer", color: "rgba(239,50,32,1)" }}
                            onClick={() => onDeleteCall(key.call_id)}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      {dayjs(key.call_date).format("DD MMM YYYY")}
                    </TableCell>
                    <TableCell sx={styles.dataCell}>
                      <span>
                        <i
                          className="fa fa-circle"
                          aria-hidden="true"
                          style={{ color: dotColor, fontSize: 10, marginRight: 6 }}
                        />
                        <b>
                          {key.cus_name
                            ? key.cus_name.charAt(0).toUpperCase() + key.cus_name.slice(1)
                            : ""}
                        </b>{" "}
                        | {key.doc_class}, {key.practice_type}
                      </span>
                      <br />
                      {key.beat_name}
                    </TableCell>
                    <TableCell sx={styles.dataCell}>{callTime}</TableCell>
                    <TableCell sx={{ ...styles.dataCell, wordWrap: "break-word" }}>
                      {key.clm_secs}
                    </TableCell>
                    <TableCell sx={styles.dataCell}>{key.jnt_user}</TableCell>
                    <TableCell sx={{ ...styles.dataCell, ...styles.center }}>
                      {key.market_ip_qty}
                    </TableCell>
                    <TableCell sx={{ ...styles.dataCell, ...styles.center }}>
                      {zeroTonull(key.ord_qty)}
                    </TableCell>
                    <TableCell sx={{ ...styles.dataCell, ...styles.center }}>
                      {zeroTonull(key.free_qty)}
                    </TableCell>
                    <TableCell sx={{ ...styles.dataCell, ...styles.center }}>
                      {zeroTonull(key.samp_qty)}
                    </TableCell>
                    <TableCell sx={styles.dataCell}>{key.call_rem}</TableCell>
                    <TableCell sx={{ ...styles.dataCell, ...styles.center }}>
                      {key.display_count}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}