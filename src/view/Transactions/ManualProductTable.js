import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Switch,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  PaginationItem,
  Stack,
} from "@mui/material";
import { TableVirtuoso } from "react-virtuoso";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const pageSizeOptionsDefault = [25, 50, 100, 200, 500];

const QTY_COL_WIDTH = 260;

// Extra px added to the measured height. Virtuoso already includes the fixed
// header in totalListHeightChanged, so this stays 0. Raise by a few px only
// if the last row ever gets clipped.
const HEADER_HEIGHT = 0;

const MAP_COLORS = {
  mapped: "#16a34a",
  semi: "#f97316",
  unmapped: "#dc2626",
  invalid: "#6c5dc5",
};

const isRowMapped = (r) => r.prod_map_stat !== 1 || r.strak_prod_name != null;

const MapDot = React.memo(function MapDot({ row }) {
  const color = !isRowMapped(row)
    ? row.pn
      ? MAP_COLORS.semi
      : MAP_COLORS.unmapped
    : row.qty_map_stat === 1
      ? MAP_COLORS.invalid
      : MAP_COLORS.mapped;
  return (
    <Box
      component="span"
      sx={{
        width: 9,
        height: 9,
        borderRadius: "2px",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
});

const QtyInput = React.memo(function QtyInput({ rowKey, value, onCommit }) {
  const toStr = (v) => (v === 0 || v == null ? "" : String(v));
  const [local, setLocal] = useState(toStr(value));
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocal(toStr(value));
  }, [rowKey]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const commit = (val) => onCommit(rowKey, val);

  const handleChange = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commit(v), 250);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    commit(local);
  };

  return (
    <input
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      style={{
        width: 100,
        height: 23,
        boxSizing: "border-box",
        textAlign: "center",
        fontSize: 12,
        fontFamily: "inherit",
        border: "1px solid rgba(0,0,0,0.23)",
        borderRadius: 4,
        padding: "0 8px",
        background: "transparent",
      }}
    />
  );
});

const ProductRow = React.memo(function ProductRow({ row, onCommitQty }) {
  if (row._rowType === "message") {
    return (
      <td colSpan={3} style={{ padding: 32, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {row.text}
        </Typography>
      </td>
    );
  }

  if (row._rowType === "cat_header") {
    return (
      <td
        colSpan={3}
        style={{
          padding: "2px 28px 2px 68px",
          backgroundColor: "#c0c0c0da",
          fontWeight: 600,
          fontSize: "0.88rem",
        }}
      >
        {row.cat_name}
      </td>
    );
  }

  if (row._isGrandTotal) {
    const style = {
      padding: "6px 8px",
      borderTop: "2px solid rgba(0,0,0,0.12)",
      backgroundColor: "rgba(0,0,0,0.04)",
      fontWeight: 600,
      fontSize: 12,
    };
    return (
      <>
        <td colSpan={2} style={{ ...style, paddingLeft: 28 }}>
          GRAND TOTAL (Qty)
        </td>
        <td style={{ ...style, paddingRight: 28, textAlign: "center" }}>
          {row.prod_qty}
        </td>
      </>
    );
  }

  const label = `${row.cat_code_1 || ""} ${
    row.prod_code ? `| ${row.prod_code}` : ""
  } | ${row.prod_name || ""}`;

  const cell = {
    padding: "6px 8px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    verticalAlign: "middle",
  };

  return (
    <>
      <td style={{ ...cell, paddingLeft: 28 }}>
        <Typography variant="caption" color="text.secondary">
          {row._sl}
        </Typography>
      </td>
      <td style={{ ...cell, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <MapDot row={row} />
          <Typography
            variant="body2"
            noWrap
            title={label}
            sx={{ fontSize: 12, color: "#343A40", minWidth: 0 }}
          >
            {label}
          </Typography>
        </Box>
      </td>
      <td style={{ ...cell, paddingRight: 28, textAlign: "center" }}>
        <QtyInput
          rowKey={row._rowKey}
          value={row.prod_qty}
          onCommit={onCommitQty}
        />
      </td>
    </>
  );
});

const VirtuosoScroller = React.forwardRef(function VirtuosoScroller(props, ref) {
  return (
    <Box
      {...props}
      ref={ref}
      sx={{
        overflowX: "hidden",
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
    />
  );
});

const VirtuosoTable = React.forwardRef(function VirtuosoTable(
  { children, style, ...props },
  ref,
) {
  return (
    <table
      ref={ref}
      {...props}
      style={{
        ...style,
        width: "100%",
        tableLayout: "fixed",
        borderCollapse: "separate",
        borderSpacing: 0,
      }}
    >
      <colgroup>
        <col style={{ width: 68 }} />
        <col />
        <col style={{ width: QTY_COL_WIDTH + 28 }} />
      </colgroup>
      {children}
    </table>
  );
});

const VirtuosoTableRow = React.forwardRef(function VirtuosoTableRow(
  { item, context, ...props },
  ref,
) {
  const plain =
    item._rowType === "message" ||
    item._rowType === "cat_header" ||
    item._isGrandTotal;
  return (
    <Box
      component="tr"
      ref={ref}
      {...props}
      sx={plain ? {} : { "&:hover": { backgroundColor: "#FAFAF8" } }}
    />
  );
});

const virtuosoComponents = {
  Scroller: VirtuosoScroller,
  Table: VirtuosoTable,
  TableRow: VirtuosoTableRow,
};

function ManualProductTable({
  rows,
  onQtyChange,
  tglVal,
  onToggleAll,
  masterPanel = {},
  loading = false,
  defaultPageSize = 50,
  pageSizeOptions = pageSizeOptionsDefault,
  showToggle = true,
  maxHeight = "calc(100vh - 280px)",
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  const [contentHeight, setContentHeight] = useState(null);
  const virtuosoRef = useRef(null);

  const handleHeightChange = useCallback((h) => setContentHeight(h), []);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase().trim();

    const matched = new Set(
      rows.filter((r) => {
        if (r._rowType === "cat_header" || r._isGrandTotal) return false;
        const hay = `${r.prod_code ?? ""} ${r.prod_name ?? ""} ${
          r.cat_code_1 ?? ""
        }`.toLowerCase();
        return hay.includes(term);
      }),
    );

    const result = [];
    let lastCat = null;

    rows.forEach((r) => {
      if (r._rowType === "cat_header") {
        lastCat = r;
        return;
      }
      if (r._isGrandTotal) {
        if (matched.size > 0) result.push(r);
        return;
      }
      if (matched.has(r)) {
        if (lastCat) result.push(lastCat);
        result.push(r);
        lastCat = null;
      }
    });

    return result;
  }, [rows, search]);

  useEffect(() => {
    setPage(0);
  }, [rows.length, search]);

  useEffect(() => {
    if (virtuosoRef.current) virtuosoRef.current.scrollTo({ top: 0 });
  }, [page, rowsPerPage]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const tableData = useMemo(() => {
    if (loading) {
      return [{ _rowKey: "__loading", _rowType: "message", text: "Loading…" }];
    }
    if (paginatedRows.length === 0) {
      return [
        {
          _rowKey: "__empty",
          _rowType: "message",
          text: search ? "No matching records found" : "No data available",
        },
      ];
    }
    return paginatedRows;
  }, [loading, paginatedRows, search]);

  const entryInfo = useMemo(() => {
    const isEntry = (r) => r._rowType !== "cat_header" && !r._isGrandTotal;
    const total = filteredRows.filter(isEntry).length;
    const before = filteredRows.slice(0, page * rowsPerPage).filter(isEntry).length;
    const inPage = paginatedRows.filter(isEntry).length;
    return {
      total,
      from: inPage > 0 ? before + 1 : before,
      to: before + inPage,
    };
  }, [filteredRows, paginatedRows, page, rowsPerPage]);

  const handleCommitQty = useCallback(
    (rowKey, value) => onQtyChange(rowKey, value),
    [onQtyChange],
  );

  const prodLabel = masterPanel["PROD"] || "Product";
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

  // Start at maxHeight so Virtuoso renders rows and can report their height,
  // then shrink to fit the content (capped at maxHeight).
  const tableHeight =
    contentHeight == null
      ? maxHeight
      : `min(${contentHeight + HEADER_HEIGHT}px, ${maxHeight})`;

  const headStyle = {
    padding: "6px 8px",
    backgroundColor: "#F6F5F2",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    fontWeight: 400,
    textAlign: "left",
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <Box
        sx={{
          p: "10px 0px",
          px: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 50 }}>
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(+e.target.value);
              setPage(0);
            }}
            IconComponent={KeyboardArrowDown}
            sx={{
              fontSize: "0.875rem",
              height: 32,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#d1d5db" },
            }}
          >
            {pageSizeOptions.map((s) => (
              <MenuItem key={s} value={s} sx={{ fontSize: "0.875rem" }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            backgroundColor: "#f3f4f6",
            px: 1.5,
            py: 0.25,
            borderRadius: 1,
            fontSize: "0.875rem",
            whiteSpace: "nowrap",
          }}
        >
          {entryInfo.total > 0
            ? `Showing ${entryInfo.from} to ${entryInfo.to} of ${entryInfo.total.toLocaleString()} entries`
            : "Showing 0 to 0 of 0 entries"}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#9ca3af", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <ClearIcon
                  sx={{ color: "#9ca3af", fontSize: 16, cursor: "pointer" }}
                  onClick={() => setSearch("")}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 200,
            "& .MuiOutlinedInput-root": { height: 32, fontSize: "0.875rem" },
          }}
        />
      </Box>

      <TableVirtuoso
        ref={virtuosoRef}
        style={{ height: tableHeight }}
        totalListHeightChanged={handleHeightChange}
        data={tableData}
        components={virtuosoComponents}
        computeItemKey={(_, row) => row._rowKey}
        increaseViewportBy={400}
        fixedHeaderContent={() => (
          <tr>
            <th style={{ ...headStyle, paddingLeft: 28 }}>
              <Typography sx={{ fontSize: 11, textTransform: "uppercase", color: "#A09D97" }}>
                #
              </Typography>
            </th>
            <th style={headStyle}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Typography sx={{ fontSize: 11, textTransform: "uppercase", color: "#A09D97" }}>
                  {prodLabel} Name
                </Typography>
                {showToggle && (
                  <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 12, color: "#A09D97", whiteSpace: "nowrap" }}>
                      All Products
                    </Typography>
                    <Switch
                      disableRipple
                      checked={tglVal === 1}
                      onChange={onToggleAll}
                      sx={{
                        width: 29,
                        height: 14,
                        p: 0,
                        mx: 0.75,
                        overflow: "visible",
                        "& .MuiSwitch-switchBase": {
                          p: 0,
                          top: 0,
                          left: 0,
                          color: "#9e9e9e",
                          "&.Mui-checked": {
                            transform: "translateX(15px)",
                            color: "#1a73e8",
                            "& + .MuiSwitch-track": {
                              backgroundColor: "#a8c7fa",
                              opacity: 1,
                            },
                          },
                        },
                        "& .MuiSwitch-thumb": {
                          width: 14,
                          height: 14,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        },
                        "& .MuiSwitch-track": {
                          position: "absolute",
                          top: 2,
                          left: 0,
                          width: "100%",
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#cfcfcf",
                          opacity: 1,
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: 12, color: "#A09D97", whiteSpace: "nowrap" }}>
                      with values
                    </Typography>
                  </Box>
                )}
              </Box>
            </th>
            <th style={{ ...headStyle, paddingRight: 28, textAlign: "center" }}>
              <Typography
                sx={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: "#A09D97",
                  whiteSpace: "nowrap",
                }}
              >
                Closing Qty
              </Typography>
            </th>
          </tr>
        )}
        itemContent={(_, row) => (
          <ProductRow row={row} onCommitQty={handleCommitQty} />
        )}
      />

      <Box
        sx={{
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#fafbfc",
          padding: 1,
        }}
      >
        <Stack spacing={2} direction="row" alignItems="center" justifyContent="space-between">
          <Pagination
            variant="text"
            count={pageCount}
            page={page + 1}
            onChange={(_, val) => setPage(val - 1)}
            renderItem={(item) => (
              <PaginationItem
                slots={{ previous: ChevronLeftIcon, next: NavigateNextIcon }}
                {...item}
                sx={{ color: "#343A40" }}
              />
            )}
          />
        </Stack>
      </Box>
    </Paper>
  );
}

export default React.memo(ManualProductTable);