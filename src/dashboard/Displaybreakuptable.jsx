import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import dayjs from "dayjs";

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
    verticalAlign: "top",
  },
};

// PHP builds "Tools Implemented" from up to 6 non-empty photo_type_name{n} fields,
// each on its own line.
function toolsImplemented(key) {
  const names = [1, 2, 3, 4, 5, 6]
    .map((n) => key[`photo_type_name${n}`])
    .filter((v) => v && v !== "");
  return names.map((name, idx) => (
    <span key={idx}>
      {name}
      {idx < names.length - 1 && <br />}
    </span>
  ));
}

/**
 * Mirrors admin/getSummary_img_breakUp.php:
 *  - One row per call, columns: Sl, Name (cus_name / class-chain), Account Owner
 *    (user_name), Call Date, Tools Implemented, Image Rating.
 *  - Image Rating is a 5-star display based on round(img_rate) — filled stars up
 *    to that count — plus the image count label, only shown when img_cnt > 0
 *    (otherwise the cell just shows '-').
 *  - Clicking a rated row opens the photo detail breakup (PHP: .sumMer_rate ->
 *    getSummary_mer_breakUpRate), wired via onRowClick.
 */
export default function DisplayBreakupTable({ displayData = [], onRowClick }) {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size="small" sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={styles.theads} align="center">Sl</TableCell>
            <TableCell sx={styles.theads}>Name</TableCell>
            <TableCell sx={styles.theads} align="center">Account Owner</TableCell>
            <TableCell sx={styles.theads} align="center">Call Date</TableCell>
            <TableCell sx={styles.theads}>Tools Implemented</TableCell>
            <TableCell sx={styles.theads} align="center">Image Rating</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} sx={styles.dataCell} align="center">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((key, idx) => {
              const filledStars = Math.round(Number(key.img_rate) || 0);
              const imgCount = Number(key.img_cnt) || 0;
              const clickable = imgCount > 0 && !!onRowClick;

              return (
                <TableRow
                  key={key.id ?? idx}
                  hover={clickable}
                  onClick={clickable ? () => onRowClick(key) : undefined}
                  sx={clickable ? { cursor: "pointer" } : undefined}
                >
                  <TableCell sx={styles.dataCell} align="center">
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={styles.dataCell}>
                    <b>{key.cus_name}</b>
                    <br />
                    {key.class_name}
                    {key.chain_name ? `-${key.chain_name}` : ""}
                  </TableCell>
                  <TableCell sx={styles.dataCell} align="center">
                    {key.user_name}
                  </TableCell>
                  <TableCell sx={styles.dataCell} align="center">
                    {dayjs(key.call_date).format("DD MMM YYYY, ddd")}
                  </TableCell>
                  <TableCell sx={styles.dataCell}>{toolsImplemented(key)}</TableCell>
                  <TableCell sx={styles.dataCell} align="center">
                    {imgCount > 0 ? (
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <StarIcon
                              key={n}
                              fontSize="small"
                              sx={{ color: n <= filledStars ? "#9f931d" : "#e1d0d0" }}
                            />
                          ))}
                        </Box>
                        <Box>{imgCount} Images</Box>
                      </Box>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}