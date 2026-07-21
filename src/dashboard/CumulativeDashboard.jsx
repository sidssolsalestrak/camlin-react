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

const zeroTonullVal = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0)
    return "-";
  return n;
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

function emptyTotals() {
  return {
    call_days: 0,
    oth_call: 0,
    totalCall: 0,
    totalnotCall: 0,
    tot_call: 0,
    tot_pc_call: 0,
    tot_cus: 0,
    cus_met: 0,
    repeatCall: 0,
    tot_miss_a: 0,
    tot_miss_c: 0,
    tot_miss_b: 0,
    tot_miss: 0,
    tot_met: 0,
    tot_ord_val: 0,
  };
}

/* ── PHP-equivalent style tokens ─────────────────────────────────────────── */
const styles = {
  border: { border: "1px solid #ddd" },
  theads: {
    backgroundColor: "#3464a7",
    color: "#fff",
    fontWeight: 600,
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
    whiteSpace: "normal",
    maxWidth: 100,
  },
  totTr: {
    backgroundColor: "#ddd",
    fontWeight: 600,
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
    maxWidth: 100,
    color: "#000",
  },
  subHeading: {
    backgroundColor: "#6398c3",
    color: "#fff",
    fontWeight: 600,
    fontSize: "12px",
    border: "1px solid #6398c3",
    padding: "6px 8px",
    maxWidth: 100,
  },
  dataCell: {
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
    color: "#133bde",
    maxWidth: 100,
  },
  noborder: {
    border: "1px solid #fff",
    borderRight: "1px solid #ddd",
    padding: "6px 8px",
    maxWidth: 100,
  },
  link: {
    color: "#1565C0",
    fontWeight: 500,
    cursor: "pointer",
  },
  clickable: {
    cursor: "pointer",
    '&:hover': {
      textDecoration: "underline"
    }
  },
};

const NumCell = ({ value, onClick, cellSx = {} }) => (
  <TableCell
    align="right"
    onClick={onClick}
    sx={{
      ...styles.dataCell, ...(onClick ? styles.clickable : {}), ...cellSx
    }}
  >
    {zeroTonullVal(value)}
  </TableCell>
);

export default function CumulativeDashboard({
  activityData = [],
  fromDate,
  toDate,
  onSalePersonClick,
  onFieldDetailClick,
  onCumCusDetailClick,
  activityLoading
}) {
  const totaldays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    return Math.abs(dayjs(toDate).diff(dayjs(fromDate), "day")) + 1;
  }, [fromDate, toDate]);

  const tableData = useMemo(() => {
    const out = [];
    let regId = "";
    let regName = "";
    let tot = emptyTotals();
    const gr = emptyTotals();

    activityData.forEach((key, idx) => {
      if (idx > 0 && regId !== key.reg_id) {
        out.push(buildRegionRow(regName, regId, tot));
        tot = emptyTotals();
      }

      const totalCall = num(key.call_days) + num(key.oth_call);
      const totalnotCall =
        totaldays - (num(key.tot_call_day) + num(key.oth_call));
      const callAvg = num(key.call_days) ? num(key.tot_call) / num(key.call_days) : 0;
      const prodAvg = num(key.call_days)
        ? num(key.tot_pc_call) / num(key.call_days)
        : 0;
      const repeatCall = num(key.tot_met) - num(key.cus_met);
      const perMissed = num(key.tot_cus)
        ? (num(key.tot_miss) / num(key.tot_cus)) * 100
        : 0;

      out.push({
        ...key,
        id: `sr-${key.sr_id}-${idx}`,
        _rowType: "data",
        totalCall,
        totalnotCall,
        callAvg: round2(callAvg),
        prodAvg: round2(prodAvg),
        repeatCall,
        perMissed: round2(perMissed),
      });

      const acc = {
        call_days: num(key.call_days),
        oth_call: num(key.oth_call),
        totalCall,
        totalnotCall,
        tot_call: num(key.tot_call),
        tot_pc_call: num(key.tot_pc_call),
        tot_cus: num(key.tot_cus),
        cus_met: num(key.cus_met),
        repeatCall,
        tot_miss_a: num(key.tot_miss_a),
        tot_miss_c: num(key.tot_miss_c),
        tot_miss_b: num(key.tot_miss_b),
        tot_miss: num(key.tot_miss),
        tot_met: num(key.tot_met),
        tot_ord_val: num(key.tot_ord_val),
      };
      Object.keys(acc).forEach((k) => {
        tot[k] += acc[k];
        gr[k] += acc[k];
      });

      regId = key.reg_id;
      regName = key.reg_name;
    });

    if (activityData.length > 0) {
      out.push(buildRegionRow(regName, regId, tot));
      out.push(buildGrandTotalRow(gr, tot.tot_call));
    }

    return out;
  }, [activityData, totaldays]);

  return (
    <Paper elevation={0} sx={{ overflow: "hidden" }}>
      <TableContainer>
        <Table
          size="small"
          sx={{ borderCollapse: "collapse", fontSize: "12px", ...styles.border }}
        >
          <TableHead>
            {/* Group header row */}
            <TableRow>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }} />
              <TableCell sx={{ ...styles.theads, zIndex: 4 }} />
              <TableCell
                colSpan={7}
                align="center"
                sx={{ ...styles.theads, zIndex: 4 }}
              >
                MAN DAYS REPORTED
              </TableCell>
              <TableCell
                colSpan={8}
                align="center"
                sx={{ ...styles.theads, zIndex: 4 }}
              >
                CALL SUMMARY
              </TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }} />
              <TableCell sx={{ ...styles.theads, zIndex: 4 }} />
            </TableRow>

            {/* Column header row */}
            <TableRow>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }} />
              <TableCell align="left" sx={{ ...styles.theads, maxWidth: 200, zIndex: 4 }}>
                PSM Name
              </TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Field Days</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Other Reporting</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Total Days Reported</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Total Days Not Reported</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Total Calls</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Call Avg</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Productive Calls</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Productive %</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Total Customers in List</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Visited</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Repeat Calls</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>A Class Missed</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>B Class Missed</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>C Class Missed</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>Total Missed</TableCell>
              <TableCell sx={{ ...styles.theads, zIndex: 4 }}>% Missed</TableCell>
              <TableCell align="center" sx={{ ...styles.theads, zIndex: 4 }}>
                Secondary Sales (In Lakh)
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {activityLoading ? (
              <TableRow>
                <TableCell colSpan={19} align="center" sx={{ ...styles.dataCell, py: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={19} align="center" sx={{ ...styles.dataCell, py: 4 }}>
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => {
                if (row._rowType === "regionTotal") {
                  return (
                    <TableRow key={row.id}>
                      <TableCell sx={styles.noborder} style={{ cursor: "pointer", color: "#1565C0" }}>
                        <i className="fa fa-line-chart" aria-hidden="true" />
                      </TableCell>
                      <TableCell sx={{ ...styles.totTr, maxWidth: 200, textAlign: "left" }}>
                        Total {row.reg_name}
                      </TableCell>
                      <NumCell value={row.call_days} cellSx={styles.totTr} />
                      <NumCell value={row.oth_call} cellSx={styles.totTr} />
                      <NumCell value={row.totalCall} cellSx={styles.totTr} />
                      <NumCell value={row.totalnotCall} cellSx={styles.totTr} />
                      <NumCell value={row.tot_call} cellSx={styles.totTr} />
                      <NumCell value={round2(row.callAvg)} cellSx={styles.totTr} />
                      <NumCell value={row.tot_pc_call} cellSx={styles.totTr} />
                      <NumCell value={round2(row.prodAvg)} cellSx={styles.totTr} />
                      <NumCell value={row.tot_cus} cellSx={styles.totTr} />
                      <NumCell value={row.cus_met} cellSx={styles.totTr} />
                      <NumCell value={row.repeatCall} cellSx={styles.totTr} />
                      <NumCell value={row.tot_miss_a} cellSx={styles.totTr} />
                      <NumCell value={row.tot_miss_c} cellSx={styles.totTr} />
                      <NumCell value={row.tot_miss_b} cellSx={styles.totTr} />
                      <NumCell value={row.tot_miss} cellSx={styles.totTr} />
                      <TableCell align="right" sx={styles.totTr}>
                        {round2(row.perMissed)}
                      </TableCell>
                      <NumCell value={row.tot_ord_val} cellSx={styles.totTr} />
                    </TableRow>
                  );
                }

                if (row._rowType === "grandTotal") {
                  return (
                    <TableRow key={row.id}>
                      <TableCell sx={styles.noborder} style={{ cursor: "pointer", color: "#1565C0" }}>
                        <i className="fa fa-line-chart" aria-hidden="true" />
                      </TableCell>
                      <TableCell sx={{ ...styles.subHeading, maxWidth: 200 }}>Grand Total</TableCell>
                      <NumCell value={row.call_days} cellSx={styles.subHeading} />
                      <NumCell value={row.oth_call} cellSx={styles.subHeading} />
                      <NumCell value={row.totalCall} cellSx={styles.subHeading} />
                      <NumCell value={row.totalnotCall} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_call} cellSx={styles.subHeading} />
                      <TableCell align="right" sx={styles.subHeading}>
                        {round2(row.callAvg)}
                      </TableCell>
                      <NumCell value={row.tot_pc_call} cellSx={styles.subHeading} />
                      <NumCell value={round2(row.prodAvg)} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_cus} cellSx={styles.subHeading} />
                      <NumCell value={row.cus_met} cellSx={styles.subHeading} />
                      <NumCell value={row.repeatCall} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_miss_a} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_miss_c} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_miss_b} cellSx={styles.subHeading} />
                      <NumCell value={row.tot_miss} cellSx={styles.subHeading} />
                      <TableCell align="right" sx={styles.subHeading}>
                        {round2(row.perMissed)}
                      </TableCell>
                      <NumCell value={row.tot_ord_val} cellSx={styles.subHeading} />
                    </TableRow>
                  );
                }

                // ── data row ──
                return (
                  <TableRow key={row.id}>
                    <TableCell sx={styles.noborder} style={{ cursor: "pointer", color: "#1565C0" }}>
                      <i className="fa fa-line-chart" aria-hidden="true" />
                    </TableCell>
                    <TableCell sx={{ ...styles.dataCell, maxWidth: 200 }}>
                      <span
                        onClick={() =>
                          onSalePersonClick &&
                          onSalePersonClick(row.sr_id, row.reg_id, row.sr_name)
                        }
                        style={styles.link}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                      >
                        {row.sr_name}
                      </span>
                    </TableCell>
                    <NumCell
                      value={row.call_days}
                      onClick={onFieldDetailClick ? () => onFieldDetailClick(1, row) : undefined}
                    />
                    <NumCell
                      value={row.oth_call}
                      onClick={onFieldDetailClick ? () => onFieldDetailClick(2, row) : undefined}
                    />
                    <NumCell
                      value={row.totalCall}
                      onClick={onFieldDetailClick ? () => onFieldDetailClick(3, row) : undefined}
                    />
                    <NumCell
                      value={row.totalnotCall}
                      onClick={onFieldDetailClick ? () => onFieldDetailClick(10, row) : undefined}
                    />
                    <NumCell value={row.tot_call} />
                    <TableCell align="right" sx={styles.dataCell}>
                      {zeroTonullVal(row.callAvg)}
                    </TableCell>
                    <NumCell value={row.tot_pc_call} />
                    <TableCell align="right" sx={styles.dataCell}>
                      {zeroTonullVal(row.prodAvg)}
                    </TableCell>
                    <NumCell
                      value={row.tot_cus}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(1, row) : undefined}
                    />
                    <NumCell
                      value={row.cus_met}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(2, row) : undefined}
                    />
                    <NumCell
                      value={row.repeatCall}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(3, row) : undefined}
                    />
                    <NumCell
                      value={row.tot_miss_a}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(4, row) : undefined}
                    />
                    <NumCell
                      value={row.tot_miss_c}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(7, row) : undefined}
                    />
                    <NumCell
                      value={row.tot_miss_b}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(5, row) : undefined}
                    />
                    <NumCell
                      value={row.tot_miss}
                      onClick={onCumCusDetailClick ? () => onCumCusDetailClick(6, row) : undefined}
                    />
                    <TableCell align="right" sx={styles.dataCell}>
                      {zeroTonullVal(row.perMissed)}
                    </TableCell>
                    <NumCell value={row.tot_ord_val} />
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

function buildRegionRow(regName, regId, t) {
  const totalCall = t.call_days + t.oth_call;
  return {
    id: `region-${regId}`,
    _rowType: "regionTotal",
    reg_id: regId,
    reg_name: regName,
    call_days: t.call_days,
    oth_call: t.oth_call,
    totalCall,
    totalnotCall: t.totalnotCall,
    tot_call: t.tot_call,
    callAvg: totalCall ? t.tot_call / totalCall : 0,
    tot_pc_call: t.tot_pc_call,
    prodAvg: t.tot_pc_call ? t.tot_call / t.tot_pc_call : 0,
    tot_cus: t.tot_cus,
    cus_met: t.cus_met,
    repeatCall: t.tot_call - t.cus_met,
    tot_miss_a: t.tot_miss_a,
    tot_miss_c: t.tot_miss_c,
    tot_miss_b: t.tot_miss_b,
    tot_miss: t.tot_miss,
    perMissed: t.tot_cus ? (t.tot_miss / t.tot_cus) * 100 : 0,
    tot_ord_val: t.tot_ord_val,
  };
}

function buildGrandTotalRow(gr, lastRegionTotCall) {
  const totalCall = gr.call_days + gr.oth_call;
  return {
    id: "grand-total",
    _rowType: "grandTotal",
    call_days: gr.call_days,
    oth_call: gr.oth_call,
    totalCall,
    totalnotCall: gr.totalnotCall,
    tot_call: gr.tot_call,
    callAvg: totalCall ? gr.tot_call / totalCall : 0,
    tot_pc_call: gr.tot_pc_call,
    prodAvg: gr.tot_pc_call ? lastRegionTotCall / gr.tot_pc_call : 0,
    tot_cus: gr.tot_cus,
    cus_met: gr.cus_met,
    repeatCall: gr.tot_met - gr.cus_met,
    tot_miss_a: gr.tot_miss_a,
    tot_miss_c: gr.tot_miss_c,
    tot_miss_b: gr.tot_miss_b,
    tot_miss: gr.tot_miss,
    perMissed: gr.tot_cus ? (gr.tot_miss / gr.tot_cus) * 100 : 0,
    tot_ord_val: gr.tot_ord_val,
  };
}