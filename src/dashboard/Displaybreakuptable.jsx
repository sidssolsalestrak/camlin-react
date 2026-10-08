import React, { useMemo, useCallback, useRef } from "react";
import {
  TableCell,
  Paper,
  Box,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import dayjs from "dayjs";
import { TableVirtuoso } from "react-virtuoso";

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

// ─────────────────────────────────────────────────────────────────────────
// Same fix as BeatCoverageTable: these must be stable, module-scope
// references — never defined inline in JSX — or TableVirtuoso treats
// `components` as "changed" on every render and remounts its internal
// virtualizer (full layout recompute = the freeze).
//
// TableRow needs onRowClick, which changes per-render (new callback from
// the parent) and per-row (depends on img_cnt). Since the component
// reference itself must stay stable, we can't close over onRowClick
// directly — instead it reads the current handler off a module-scope ref
// that the table component updates on every render. The ref write is
// cheap; it never triggers a re-render or remount.
// ─────────────────────────────────────────────────────────────────────────
const rowClickRef = { current: null }; // set to (key) => void | null

const VirtuosoScroller = React.forwardRef((props, ref) => (
  <div {...props} ref={ref} style={{ ...props.style, scrollbarWidth: "thin" }} />
));

const VirtuosoTableEl = (props) => (
  <table {...props} style={{ borderCollapse: "collapse", width: "100%" }} />
);

const VirtuosoTableHead = React.forwardRef((props, ref) => (
  <thead {...props} ref={ref} style={{ zIndex: 5 }} />
));

// react-virtuoso passes the row's data item as the `item` prop to a custom
// TableRow component (in addition to the DOM props it needs spread onto
// the <tr>). We use that to decide clickability per row without needing an
// unstable closure.
const VirtuosoTableRow = ({ item, ...props }) => {
  const imgCount = Number(item?.img_cnt) || 0;
  const clickable = imgCount > 0 && !!rowClickRef.current;
  return (
    <tr
      {...props}
      onClick={clickable ? () => rowClickRef.current(item) : undefined}
      style={clickable ? { cursor: "pointer" } : undefined}
    />
  );
};

const VirtuosoTableBody = React.forwardRef((props, ref) => (
  <tbody {...props} ref={ref} />
));

const virtuosoComponents = {
  Scroller: VirtuosoScroller,
  Table: VirtuosoTableEl,
  TableHead: VirtuosoTableHead,
  TableRow: VirtuosoTableRow,
  TableBody: VirtuosoTableBody,
};

/**
 * Mirrors admin/getSummary_img_breakUp.php:
 *  - One row per call, columns: Sl, Name (cus_name / class-chain), Account Owner
 *    (user_name), Call Date, Tools Implemented, Image Rating.
 *  - Image Rating is a 5-star display based on round(img_rate) — filled stars up
 *    to that count — plus the image count label, only shown when img_cnt > 0
 *    (otherwise the cell just shows '-').
 *  - Clicking a rated row opens the photo detail breakup (PHP: .sumMer_rate ->
 *    getSummary_mer_breakUpRate), wired via onRowClick.
 *
 * Virtualized with TableVirtuoso (same approach as BeatCoverageTable) so
 * only rows in/near the viewport are ever mounted — large result sets from
 * getSummary_img_breakUp no longer mount thousands of <TableRow>s at once.
 */
function DisplayBreakupTable({ displayData = [], onRowClick, masterPanel = {} }) {
  const accLabel = masterPanel["ACCM"] || "Account";

  // displayData is [rows] (backend wraps it in an array).
  const rows = useMemo(() => displayData?.[0] || [], [displayData]);

  // Keep the ref in sync with the latest handler every render — cheap, no
  // re-render or remount triggered by this.
  rowClickRef.current = onRowClick || null;

  const fixedHeaderContent = useCallback(
    () => (
      <tr>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }} align="center">
          Sl
        </TableCell>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }}>
          Name
        </TableCell>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }} align="center">
          {accLabel} Owner
        </TableCell>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }} align="center">
          Call Date
        </TableCell>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }}>
          Tools Implemented
        </TableCell>
        <TableCell sx={{ ...styles.theads, position: "sticky", top: 0, zIndex: 5 }} align="center">
          Image Rating
        </TableCell>
      </tr>
    ),
    [accLabel],
  );

  const itemContent = useCallback((idx, key) => {
    const filledStars = Math.round(Number(key.img_rate) || 0);
    const imgCount = Number(key.img_cnt) || 0;

    return (
      <>
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
      </>
    );
  }, []);

  if (rows.length === 0) {
    return (
      <Paper elevation={0}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>{fixedHeaderContent()}</thead>
          <tbody>
            <tr>
              <TableCell colSpan={6} sx={styles.dataCell} align="center">
                No data available
              </TableCell>
            </tr>
          </tbody>
        </table>
      </Paper>
    );
  }

  return (
    <Paper elevation={0}>
      <TableVirtuoso
        style={{ height: 650 }}
        data={rows}
        components={virtuosoComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={itemContent}
        increaseViewportBy={{ top: 200, bottom: 400 }}
      />
    </Paper>
  );
}

export default DisplayBreakupTable;