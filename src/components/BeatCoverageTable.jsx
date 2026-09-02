import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  buildMonthNames,
  groupBeatCoverageRows,
  buildDisplayRows,
} from "../utils/beatCoverageHelpers";

const QUARTER_END_MONTHS = [3, 6, 9, 12];

const HEADER_BG = "#F6F5F2";
const HEADER_TEXT = "#A09D97";
const BORDER = "1px solid rgba(0,0,0,0.08)";
const QTR_BORDER = "1px solid rgba(0,0,0,0.15)"; // slightly stronger for quarter separators

const cellBase = {
  fontSize: "12px",
  color: "#343A40",
  padding: "4px 6px",
  borderBottom: BORDER,
};

const headerCellBase = {
  fontSize: "11px",
  fontWeight: 400,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: HEADER_TEXT,
  backgroundColor: HEADER_BG,
  padding: "8px 6px",
  whiteSpace: "nowrap",
};

const BeatCoverageTable = ({
  rawData,
  yr,
  loading,
  areaLabel = "Area",
  beatLabel = "Beat",
}) => {
  const { monthNames, displayRows, grandTotals } = useMemo(() => {
    const monthNames = buildMonthNames(yr);
    const grouped = groupBeatCoverageRows(rawData || []);
    const { displayRows, grandTotals } = buildDisplayRows(grouped);
    return { monthNames, displayRows, grandTotals };
  }, [rawData, yr]);

  const qtrBorder = (mthNo) =>
    QUARTER_END_MONTHS.includes(mthNo) ? { borderRight: QTR_BORDER } : {};

  return (
    <Paper
      elevation={0}
      sx={{
        background: "#fff",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 850,
          overflow: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#c1c1c1 #f1f1f1",
          "&::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: 8,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1",
            borderRadius: 8,
          },
          "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#a8a8a8" },
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  ...headerCellBase,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  borderRight: BORDER,
                }}
              >
                SI
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  ...headerCellBase,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  width: "18%",
                }}
              >
                Sales Person
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  ...headerCellBase,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  width: "15%",
                }}
              >
                {areaLabel}
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  ...headerCellBase,
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  width: "15%",
                }}
              >
                {beatLabel}
              </TableCell>
              {[1, 2, 3, 4].map((q) => (
                <TableCell
                  key={q}
                  colSpan={3}
                  align="center"
                  sx={{
                    ...headerCellBase,
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                    borderLeft: BORDER,
                    borderRight: q !== 4 ? QTR_BORDER : "none",
                  }}
                >
                  Qtr {q}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {Object.entries(monthNames).map(([mthNo, label]) => (
                <TableCell
                  key={mthNo}
                  align="center"
                  sx={{
                    ...headerCellBase,
                    position: "sticky",
                    top: 33, // adjust to match actual row-1 rendered height
                    zIndex: 5,
                    borderLeft: BORDER,
                    ...qtrBorder(Number(mthNo)),
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={16}
                  align="center"
                  sx={{ py: 4, border: "none" }}
                >
                  <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                    <CircularProgress />
                  </Typography>
                </TableCell>
              </TableRow>
            ) : displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={16}
                  align="center"
                  sx={{ py: 4, border: "none" }}
                >
                  <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, idx) =>
                row.type === "groupTotal" ? (
                  <TableRow key={`total-${idx}`}>
                    <TableCell
                      colSpan={4}
                      align="right"
                      sx={{
                        ...cellBase,
                        fontWeight: 600,
                        backgroundColor: "#f8f8f8",
                        borderTop: BORDER,
                      }}
                    >
                      Total {row.label}
                    </TableCell>
                    {Object.entries(row.totals).map(([mthNo, val]) => (
                      <TableCell
                        key={mthNo}
                        align="center"
                        sx={{
                          ...cellBase,
                          fontWeight: 600,
                          backgroundColor: "#f8f8f8",
                          borderTop: BORDER,
                          ...qtrBorder(Number(mthNo)),
                        }}
                      >
                        {val}
                      </TableCell>
                    ))}
                  </TableRow>
                ) : (
                  <TableRow
                    key={`row-${idx}`}
                    sx={{
                      "& td": { backgroundColor: "#ffffff" },
                      "&:hover td": { backgroundColor: "#FAFAF8" },
                    }}
                  >
                    <TableCell sx={cellBase}>{row.si ?? ""}</TableCell>
                    <TableCell sx={cellBase}>
                      {row.si != null && (
                        <Box>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              color: "#133bde",
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {row.sr_name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "11px",
                              fontStyle: "italic",
                              color: "#9ca3af",
                            }}
                            title={row.hq_name}
                          >
                            HQ:{row.hq_name}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={cellBase}>{row.area_name ?? ""}</TableCell>
                    <TableCell sx={cellBase}>{row.beat_name}</TableCell>
                    {Object.entries(row.months).map(([mthNo, val]) => (
                      <TableCell
                        key={mthNo}
                        align="center"
                        sx={{ ...cellBase, ...qtrBorder(Number(mthNo)) }}
                      >
                        {val}
                      </TableCell>
                    ))}
                  </TableRow>
                ),
              )
            )}
          </TableBody>

          {(!loading && displayRows.length > 0) && (
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="right"
                  sx={{
                    ...cellBase,
                    fontWeight: 600,
                    backgroundColor: "#f9fafb",
                    borderTop: "1px solid #d1d5db",
                    position: "sticky",
                    bottom: 0,
                  }}
                >
                  Grand Total
                </TableCell>
                {Object.entries(grandTotals).map(([mthNo, val]) => (
                  <TableCell
                    key={mthNo}
                    align="center"
                    sx={{
                      ...cellBase,
                      fontWeight: 600,
                      backgroundColor: "#f9fafb",
                      borderTop: "1px solid #d1d5db",
                      position: "sticky",
                      bottom: 0,
                      ...qtrBorder(Number(mthNo)),
                    }}
                  >
                    {typeof val === "number" ? val.toFixed(2) : val}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default BeatCoverageTable;
