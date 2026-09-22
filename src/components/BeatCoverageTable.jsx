import React, { useMemo, useCallback } from "react";
import {
  TableCell,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { TableVirtuoso } from "react-virtuoso";
import {
  buildMonthNames,
  groupBeatCoverageRows,
  buildDisplayRows,
} from "../utils/beatCoverageHelpers";

const QUARTER_END_MONTHS = [3, 6, 9, 12];

const HEADER_BG = "#F6F5F2";
const HEADER_TEXT = "#A09D97";
const BORDER = "1px solid rgba(0,0,0,0.08)";
const QTR_BORDER = "1px solid rgba(0,0,0,0.15)";

// Static style objects (not recreated per cell) — merged via plain JS object
// spread only once per row type, not per render of the whole table.
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

const qtrBorder = (mthNo) =>
  QUARTER_END_MONTHS.includes(mthNo) ? { borderRight: QTR_BORDER } : {};

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

  const monthEntries = useMemo(() => Object.entries(monthNames), [monthNames]);

  // ---- Fixed table header, rendered once, sticky via TableVirtuoso's own
  //      sticky-header support (fixedHeaderContent) ----
  const fixedHeaderContent = useCallback(
    () => (
      <>
        <tr>
          <TableCell
            rowSpan={2}
            sx={{
              ...headerCellBase,
              position: "sticky",
              top: 0,
              zIndex: 5,
              borderRight: BORDER,
              background: HEADER_BG,
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
              background: HEADER_BG,
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
              background: HEADER_BG,
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
              background: HEADER_BG,
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
                background: HEADER_BG,
              }}
            >
              Qtr {q}
            </TableCell>
          ))}
        </tr>
        <tr>
          {monthEntries.map(([mthNo, label]) => (
            <TableCell
              key={mthNo}
              align="center"
              sx={{
                ...headerCellBase,
                position: "sticky",
                top: 33,
                zIndex: 5,
                borderLeft: BORDER,
                background: HEADER_BG,
                ...qtrBorder(Number(mthNo)),
              }}
            >
              {label}
            </TableCell>
          ))}
        </tr>
      </>
    ),
    [monthEntries, areaLabel, beatLabel],
  );

  // ---- Per-row renderer — only called for rows currently in viewport ----
  const itemContent = useCallback(
    (idx, row) => {
      if (row.type === "groupTotal") {
        return (
          <>
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
          </>
        );
      }

      return (
        <>
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
        </>
      );
    },
    [],
  );

  const fixedFooterContent = useCallback(() => {
    if (loading || displayRows.length === 0) return null;
    return (
      <tr>
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
      </tr>
    );
  }, [loading, displayRows.length, grandTotals]);

  if (loading) {
    return (
      <Paper elevation={0} sx={{ background: "#fff", py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (displayRows.length === 0) {
    return (
      <Paper elevation={0} sx={{ background: "#fff", py: 4, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          No data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ background: "#fff" }}>
      <TableVirtuoso
        style={{ height: 850 }}
        data={displayRows}
        components={{
          Scroller: React.forwardRef((props, ref) => (
            <div
              {...props}
              ref={ref}
              style={{
                ...props.style,
                scrollbarWidth: "thin",
              }}
            />
          )),
          Table: (props) => (
            <table
              {...props}
              style={{ borderCollapse: "collapse", width: "100%" }}
            />
          ),
          TableHead: React.forwardRef((props, ref) => (
            <thead {...props} ref={ref} style={{ zIndex: 5 }} />
          )),
          TableRow: (props) => (
            <tr
              {...props}
              style={{
                backgroundColor: "#ffffff",
              }}
            />
          ),
          TableBody: React.forwardRef((props, ref) => (
            <tbody {...props} ref={ref} />
          )),
          TableFoot: React.forwardRef((props, ref) => (
            <tfoot {...props} ref={ref} />
          )),
        }}
        fixedHeaderContent={fixedHeaderContent}
        fixedFooterContent={fixedFooterContent}
        itemContent={itemContent}
        increaseViewportBy={{ top: 200, bottom: 400 }}
      />
    </Paper>
  );
};

export default BeatCoverageTable;