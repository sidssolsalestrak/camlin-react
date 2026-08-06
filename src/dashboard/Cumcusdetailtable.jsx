import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const styles = {
  theads: {
    backgroundColor: "#3464a7",
    color: "#fff",
    fontWeight: 600,
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
  },
  dataCell: {
    border: "1px solid #ddd",
    padding: "6px 8px",
    fontSize: "12px",
  },
};

/**
 * Mirrors admin/cumCusDetail.php exactly:
 *  - Sl No, Beat (with green/red dot per cus_type_id === 1), Doctor, Speciality,
 *    Phone, Email, Potential Class, Bioderma Class
 *  - "No Of Repeated Calls" column only appears when type === 3 (Repeat Call)
 */
export default function CumCusDetailTable({ type, cusDetail = [] }) {
  const typeNum = Number(type);
  const showRepeatCol = typeNum === 3;

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small" sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={styles.theads}>Sl No</TableCell>
            <TableCell sx={styles.theads}>Beat</TableCell>
            <TableCell sx={styles.theads}>Doctor</TableCell>
            <TableCell sx={styles.theads}>Speciality</TableCell>
            <TableCell sx={styles.theads}>Phone</TableCell>
            <TableCell sx={styles.theads}>Email</TableCell>
            <TableCell sx={styles.theads} align="center">Potential Class</TableCell>
            <TableCell sx={styles.theads} align="center">Bioderma Class</TableCell>
            {showRepeatCol && (
              <TableCell sx={styles.theads}>No Of Repeated Calls</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {cusDetail.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showRepeatCol ? 9 : 8} sx={styles.dataCell} align="center">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            cusDetail.map((key, idx) => {
              // PHP: cus_type == 1 -> green dot, else red dot
              const dotColor = Number(key.cus_type) === 1 ? "green" : "red";
              return (
                <TableRow key={key.cus_sub_id ?? idx}>
                  <TableCell sx={styles.dataCell}>{idx + 1}</TableCell>
                  <TableCell sx={styles.dataCell}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <i
                        className="fa fa-circle"
                        aria-hidden="true"
                        style={{ color: dotColor, fontSize: 10 }}
                      />
                      {key.beat_name}
                    </span>
                  </TableCell>
                  <TableCell sx={styles.dataCell}>{key.doctor_name}</TableCell>
                  <TableCell sx={styles.dataCell}>{key.speciality_name}</TableCell>
                  <TableCell sx={styles.dataCell}>{key.doctor_mob}</TableCell>
                  <TableCell sx={styles.dataCell}>{key.doctor_email}</TableCell>
                  <TableCell align="center" sx={styles.dataCell}>{key.p_class}</TableCell>
                  <TableCell align="center" sx={styles.dataCell}>{key.b_class}</TableCell>
                  {showRepeatCol && (
                    <TableCell align="center" sx={styles.dataCell}>{key.rep_cnt}</TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}