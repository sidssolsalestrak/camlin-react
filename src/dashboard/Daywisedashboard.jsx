import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import dayjs from "dayjs";

// PHP zeroTonullVal(): 0/empty/null -> '-'
const zeroTonullVal = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0) return "-";
  return v;
};

/* ── Style tokens — copied verbatim from CumulativeDashboard.jsx so both
   tables render with an identical look (header, data cell, clickable link,
   etc). Keep these two in sync if either changes. ───────────────────────── */
const styles = {
  border: { border: "1px solid rgba(0,0,0,0.08)" },
  theads: {
    backgroundColor: "#F6F5F2",
    color: "#A09D97",
    fontWeight: 400,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "11px 6px",
    whiteSpace: "normal",
    maxWidth: 200,
  },
  dataCell: {
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "4px 6px",
    fontSize: "12px",
    color: "#343A40",
    fontWeight: 400,
    maxWidth: 200,
  },
  noborder: {
    border: "none",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "4px 6px",
    maxWidth: 100,
  },
  link: {
    color: "#1565C0",
    fontWeight: 500,
    cursor: "pointer",
  },
  clickable: {
    cursor: "pointer",
    color: "#133BDE",
    "&:hover": {
      textDecoration: "underline",
    },
  },
};

function formatCallTime(t) {
  if (!t || t === "00:00:00" || t === " ") return "-";

  // Bare time like "10:22:58" -> anchor to a dummy date
  // Full datetime like "2026-08-31 10:22:58" -> parse as-is
  const isBareTime = /^\d{2}:\d{2}:\d{2}$/.test(t);
  const parsed = isBareTime ? dayjs(`2000-01-01 ${t}`) : dayjs(t);

  return parsed.isValid() ? parsed.format("h:mm a") : "-";
}

/**
 * Mirrors the PHP day-wise SellOutQTYUSD table.
 *
 * NOTE: The PHP source code technically contains logic to print a
 * region-subtotal row (on reg_id change) and a final subtotal row
 * after the loop — but the live PHP UI does NOT render these rows.
 * To match actual UI behavior, that logic has been removed here.
 * (Left commented below in case it needs to be re-enabled later.)
 */
export default function DayWiseDashboard({
  activityData = [],
  activityLoading,
  onSalePersonClick, // (userId, regId, name) => void
  onJointWorkClick, // (userId) => void — NOT YET WIRED, needs getSrJointWork API
  onRouteMapClick, // (userId) => void — NOT YET WIRED, needs activityMAP API
  onOrderDetailClick, // (row) => void — NOT YET WIRED, needs activity_summary_prodDetails API
  onSampleDetailClick, // (row) => void — NOT YET WIRED, needs activity_summary_sampDetails API
}) {
  const rows = useMemo(() => {
    // Simple pass-through — one row per SR, no region grouping/totals.
    return activityData.map((sale, idx) => ({
      _rowType: "data",
      sale,
      key: `sr-${sale.user_id}-${idx}`,
    }));

    /* ── Previous region-subtotal logic (disabled — not present in PHP UI) ──
    const out = [];
    let regId = "";
    let regName = "";
    let tot = emptyTotals();

    activityData.forEach((sale, idx) => {
      if (idx > 0 && regId !== sale.reg_id) {
        out.push({ _rowType: "regionTotal", regName, tot: { ...tot }, key: `region-${regId}` });
        tot = emptyTotals();
      }

      out.push({ _rowType: "data", sale, key: `sr-${sale.user_id}-${idx}` });

      tot.dist += Number(sale.dist_kms) || 0;
      tot.hcp += Number(sale.hcp_call) || 0;
      tot.ret += Number(sale.ret_call) || 0;
      tot.prodHcp += Number(sale.hcp_prod_call) || 0;
      tot.prodRet += Number(sale.ret_prod_call) || 0;
      tot.event += Number(sale.tot_event) || 0;
      tot.samp += Number(sale.tot_samp) || 0;
      tot.joint += Number(sale.tot_jnt) || 0;
      tot.bday += Number(sale.tot_dob_anniv) || 0;
      tot.ord += Number(sale.tot_ord) || 0;
      tot.ordVal += Number(sale.tot_ord_val) || 0;
      tot.survey += Number(sale.tot_cs) || 0;

      regId = sale.reg_id;
      regName = sale.reg_name;
    });

    if (activityData.length > 0) {
      out.push({ _rowType: "regionTotal", regName, tot: { ...tot }, key: "region-last" });
    }

    return out;
    ────────────────────────────────────────────────────────────────────── */
  }, [activityData]);

  return (
    <Paper elevation={0} sx={{ overflow: "auto" }}>
      <TableContainer>
        <Table size="small" sx={{ borderCollapse: "collapse", fontSize: "12px", ...styles.border }}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={7} sx={styles.theads} />
              <TableCell colSpan={2} align="center" sx={styles.theads}>Calls</TableCell>
              <TableCell colSpan={4} sx={styles.theads} />
              <TableCell colSpan={2} align="center" sx={styles.theads}>Total Orders</TableCell>
              <TableCell sx={styles.theads} />
            </TableRow>
            <TableRow>
              <TableCell align="left" sx={{ ...styles.theads, maxWidth: 200 }}>Name</TableCell>
              <TableCell sx={styles.theads}>Stat</TableCell>
              <TableCell sx={styles.theads}>Start</TableCell>
              <TableCell sx={styles.theads}>Last Call</TableCell>
              <TableCell sx={styles.theads}>Beat Planned</TableCell>
              <TableCell sx={styles.theads}>Beat Working</TableCell>
              <TableCell sx={styles.theads}>Distance(Kms)</TableCell>
              <TableCell sx={styles.theads}>Total Calls</TableCell>
              <TableCell sx={styles.theads}>Productive</TableCell>
              <TableCell sx={styles.theads}>Events</TableCell>
              <TableCell sx={styles.theads}>Samples</TableCell>
              <TableCell sx={styles.theads}>Joint Work</TableCell>
              <TableCell sx={styles.theads}>B'days</TableCell>
              <TableCell sx={styles.theads}>Qty</TableCell>
              <TableCell sx={styles.theads}>Values(Lacs)</TableCell>
              <TableCell sx={styles.theads}>Survey</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activityLoading ? (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ ...styles.dataCell, py: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16} align="center" sx={{ ...styles.dataCell, py: 4 }}>
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                // ── data row ──
                const sale = row.sale;
                const perHcpProdCall = sale.hcp_prod_call > 0 ? "%" : "";
                const perRetProdCall = sale.ret_prod_call > 0 ? "%" : "";
                const hcpProdCall = sale.hcp_prod_call > 0
                  ? Math.round((sale.hcp_prod_call / sale.hcp_call) * 100)
                  : "";
                const retProdCall = sale.ret_prod_call > 0
                  ? Math.round((sale.ret_prod_call / sale.ret_call) * 100)
                  : "";
                const isSpecialReportType = [2, 3, 4, 5].includes(Number(sale.report_type_id));
                const reported = Number(sale.report_type_id) > 0 && sale.report_type_id !== "";
                const showRouteMarker = sale.beat_work !== " " && Number(sale.location_stat) === 0;
                const showRouteMapIcon = Number(sale.location_stat) > 0 && sale.beat_work !== " ";

                return (
                  <TableRow key={row.key}>
                    <TableCell sx={{ ...styles.dataCell, maxWidth: 200 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <span
                          onClick={() => onSalePersonClick && onSalePersonClick(sale.user_id, sale.reg_id, sale.u_name)}
                          style={styles.link}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {sale.u_name}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <i
                            className={`fa fa-mobile`}
                            style={{ color: Number(sale.app_stat) === 1 ? "#09a12d" : "red" }}
                            title={Number(sale.app_stat) === 1 ? "Logged-in" : "Not Logged-in"}
                          />
                           <i
                            className="fa fa-unlock"
                            style={{ color: "#35bcf5" }}
                            title="No restrictions"
                          />
                        </span>
                      </Box>
                      <Box sx={{ fontSize: 11, color: "#9b9090", fontWeight: 600 }}>
                        {sale.desig_name} | {sale.area_name}
                        {sale.app_version ? <span style={{ color: "green" }}> | {sale.app_version}</span> : null}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">
                      {reported ? (
                        <i className="fa fa-check" title={sale.report_type} aria-hidden="true" />
                      ) : (
                        <i className="fa fa-close" style={{ color: "red" }} title="Not Reported" aria-hidden="true" />
                      )}
                    </TableCell>
                    {isSpecialReportType ? (
                      <>
                        <TableCell sx={styles.dataCell}>-</TableCell>
                        <TableCell sx={styles.dataCell}>-</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={styles.dataCell}>{formatCallTime(sale.start_call)}</TableCell>
                        <TableCell sx={{ ...styles.dataCell, color: "#0a52b5", fontWeight: 600 }}>
                          {formatCallTime(sale.last_call)}
                        </TableCell>
                      </>
                    )}
                    <TableCell sx={styles.dataCell}>{sale.beat_plan}</TableCell>
                    <TableCell sx={styles.dataCell}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{sale.beat_work}</span>
                        {showRouteMarker && (
                          <i className="fa fa-map-marker" style={{ color: "#ea4b35", fontSize: 18 }} />
                        )}
                        {showRouteMapIcon && (
                          <i
                            className="fa fa-map-marker"
                            style={{ color: "green", fontSize: 18, cursor: "pointer" }}
                            onClick={() => onRouteMapClick && onRouteMapClick(sale.user_id)}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">{zeroTonullVal(sale.dist_kms)}</TableCell>
                    <TableCell sx={styles.dataCell} align="center">
                      <b>{zeroTonullVal(sale.hcp_call)}</b> | <b>{zeroTonullVal(sale.ret_call)}</b>
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">
                      <b>{zeroTonullVal(hcpProdCall)}{perHcpProdCall}</b> | <b>{zeroTonullVal(retProdCall)}{perRetProdCall}</b>
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">{zeroTonullVal(sale.tot_event)}</TableCell>
                    <TableCell
                      sx={{ ...styles.dataCell, ...(onSampleDetailClick ? styles.clickable : {}) }}
                      align="center"
                      onClick={() => onSampleDetailClick && onSampleDetailClick(sale)}
                    >
                      {zeroTonullVal(sale.tot_samp)}
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">
                      {Number(sale.tot_jnt) > 0 && (
                        <i
                          className="fa fa-info-circle"
                          style={{ cursor: "pointer", marginRight: 4 }}
                          onClick={() => onJointWorkClick && onJointWorkClick(sale.user_id)}
                        />
                      )}
                      {zeroTonullVal(sale.tot_jnt)}
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">{zeroTonullVal(sale.tot_dob_anniv)}</TableCell>
                    <TableCell
                      sx={{ ...styles.dataCell, ...(onOrderDetailClick ? styles.clickable : {}) }}
                      align="center"
                      onClick={() => onOrderDetailClick && onOrderDetailClick(sale)}
                    >
                      {zeroTonullVal(sale.tot_ord)}
                    </TableCell>
                    <TableCell
                      sx={{ ...styles.dataCell, ...(onOrderDetailClick ? styles.clickable : {}) }}
                      align="center"
                      onClick={() => onOrderDetailClick && onOrderDetailClick(sale)}
                    >
                      {zeroTonullVal(sale.tot_ord_val)}
                    </TableCell>
                    <TableCell sx={styles.dataCell} align="center">{zeroTonullVal(sale.tot_cs)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}