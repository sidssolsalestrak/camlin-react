import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import dayjs from "dayjs";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// PHP zeroTonullVal(): 0/empty/null -> '-'
const zeroTonullVal = (v) => {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || Number.isNaN(n) || n === 0)
    return "-";
  return round2(n);
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const styles = {
  theads: {
    backgroundColor: "#3464a7",
    color: "#fff",
    fontWeight: 600,
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
  },
  subHeading: {
    backgroundColor: "#6398c3",
    color: "#fff",
    fontWeight: 600,
    fontSize: "12px",
    border: "1px solid #6398c3",
    padding: "6px 8px",
  },
  dataCell: {
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
  },
};

/**
 * Mirrors admin/FieldDetail.php exactly:
 *  - type === 10  -> unreported-dates list (Sl No, Date)
 *  - type === 1|9 -> Call Days column (f_day label + call_day value)
 *  - type === 2   -> Other Days column (o_day label + oth_call value)
 *  - type === 3   -> both columns + a combined Total Days column
 * Any other type falls back to the same shape as 1/9 (matches PHP's implicit behavior
 * since the SQL branch for "others" still returns call_day/oth_call/f_day/o_day).
 */
export default function FieldDetailTable({ type, cusDetail = [] }) {
  const typeNum = Number(type);

  if (typeNum === 10) {
    return (
      <TableContainer component={Paper} elevation={0}>
        <Table size="small" sx={{ borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={styles.theads}>Sl No</TableCell>
              <TableCell sx={styles.theads}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cusDetail.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} sx={styles.dataCell} align="center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              cusDetail.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={styles.dataCell}>{idx + 1}</TableCell>
                  <TableCell sx={styles.dataCell}>
                    {dayjs(row.un_rep_dt).format("DD MMM YYYY")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  const showCallDays = typeNum === 1 || typeNum === 9 || typeNum === 3;
  const showOtherDays = typeNum === 2 || typeNum === 3;
  const showTotal = typeNum === 3;

  let totCallDay = 0;
  let totOthDay = 0;
  let grandTotal = 0;

  const rows = cusDetail.map((key, idx) => {
    const callDay = num(key.call_day);
    const othCall = num(key.oth_call);
    const rowTotal = callDay + othCall;
    totCallDay += callDay;
    totOthDay += othCall;
    grandTotal += rowTotal;

    return (
      <TableRow key={idx}>
        <TableCell sx={styles.dataCell}>{idx + 1}</TableCell>
        <TableCell sx={styles.dataCell}>
          {dayjs(key.call_date).format("DD MMM YYYY")}
        </TableCell>
        {(typeNum === 1 || typeNum === 9) && (
          <TableCell sx={styles.dataCell}>{key.f_day}</TableCell>
        )}
        {typeNum === 2 && <TableCell sx={styles.dataCell}>{key.o_day}</TableCell>}
        {typeNum === 3 && (
          <TableCell sx={styles.dataCell}>
            {key.f_day} {key.o_day}
          </TableCell>
        )}
        {showCallDays && (
          <TableCell align="center" sx={styles.dataCell}>
            {zeroTonullVal(callDay)}
          </TableCell>
        )}
        {showOtherDays && (
          <TableCell align="center" sx={styles.dataCell}>
            {zeroTonullVal(othCall)}
          </TableCell>
        )}
        {showTotal && (
          <TableCell align="center" sx={styles.dataCell}>
            {zeroTonullVal(rowTotal)}
          </TableCell>
        )}
      </TableRow>
    );
  });

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small" sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#3464a7" }}>
            <TableCell sx={styles.theads}>Sl No</TableCell>
            <TableCell sx={styles.theads}>Date</TableCell>
            <TableCell sx={styles.theads}>Type</TableCell>
            {showCallDays && <TableCell sx={styles.theads} align="center">Call Days</TableCell>}
            {showOtherDays && <TableCell sx={styles.theads} align="center">Other Days</TableCell>}
            {showTotal && <TableCell sx={styles.theads} align="center">Total Days</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {cusDetail.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={2 + (showCallDays ? 1 : 0) + (showOtherDays ? 1 : 0) + (showTotal ? 1 : 0) + 1}
                sx={styles.dataCell}
                align="center"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows}
              <TableRow>
                <TableCell sx={styles.subHeading} colSpan={3}>Total</TableCell>
                {showCallDays && (
                  <TableCell align="center" sx={styles.subHeading}>
                    {zeroTonullVal(totCallDay)}
                  </TableCell>
                )}
                {showOtherDays && (
                  <TableCell align="center" sx={styles.subHeading}>
                    {zeroTonullVal(totOthDay)}
                  </TableCell>
                )}
                {showTotal && (
                  <TableCell align="center" sx={styles.subHeading}>
                    {zeroTonullVal(grandTotal)}
                  </TableCell>
                )}
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}