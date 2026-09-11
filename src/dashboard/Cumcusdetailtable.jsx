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
    backgroundColor: "#F6F5F2",
    color: "#A09D97",
    fontWeight: 400,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "11px 6px",
  },
  dataCell: {
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    padding: "4px 6px",
    fontSize: "12px",
    color: "#343A40",
    fontWeight: 400,
  },
};

/**
 * Mirrors admin/cumCusDetail.php exactly:
 *  - Sl No, Beat (with green/red dot per cus_type_id === 1), Doctor, Speciality,
 *    Phone, Email, Potential Class, Bioderma Class
 *  - "No Of Repeated Calls" column only appears when type === 3 (Repeat Call)
 */
export default function CumCusDetailTable({ type, cusDetail = [],masterPanel = {} }) {
  const typeNum = Number(type);
  const showRepeatCol = typeNum === 3;
const beatLabel = masterPanel["BEAT"] || "Beat";
  const potentialClassLabel = masterPanel["PCLS"] || "Potential Class";
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small" sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={styles.theads}>Sl No</TableCell>
            <TableCell sx={styles.theads}>{beatLabel}</TableCell>
            <TableCell sx={styles.theads}>Doctor</TableCell>
            <TableCell sx={styles.theads}>Speciality</TableCell>
            <TableCell sx={styles.theads}>Phone</TableCell>
            <TableCell sx={styles.theads}>Email</TableCell>
            <TableCell sx={styles.theads} align="center">{potentialClassLabel}</TableCell>
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