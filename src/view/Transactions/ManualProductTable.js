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
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const pageSizeOptionsDefault = [25, 50, 100, 200, 500];

const QTY_COL_WIDTH = 260;

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
  const [local, setLocal] = useState(value === 0 ? "" : (value ?? ""));
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocal(value === 0 ? "" : (value ?? ""));
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
    <TextField
      size="small"
      value={local}
      onChange={handleChange}
      onBlur={handleBlur}
      inputProps={{
        style: { textAlign: "center", fontSize: 13 },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontSize: 13,
          width: 110,
          mx: "auto",
        },
      }}
    />
  );
});

const ProductRow = React.memo(function ProductRow({ row, onCommitQty }) {
  if (row._rowType === "cat_header") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          mx: 1.5,
          py: 0.75,
          backgroundColor: "#c0c0c0da",
          fontWeight: 600,
          fontSize: "0.88rem",
          gap: 1,
        }}
      >
        <Box sx={{ width: 40, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>{row.cat_name}</Box>
        <Box sx={{ width: QTY_COL_WIDTH, flexShrink: 0 }} />
      </Box>
    );
  }

  if (row._isGrandTotal) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          mx: 1.5,
          py: 0.75,
          borderTop: "2px solid",
          borderColor: "divider",
          backgroundColor: "rgba(0,0,0,0.04)",
          fontWeight: 600,
        }}
      >
        <Box sx={{ flex: 1, fontSize: 13 }}>GRAND TOTAL (Qty)</Box>
        <Box sx={{ width: QTY_COL_WIDTH, textAlign: "center", fontSize: 13 }}>
          {row.prod_qty}
        </Box>
      </Box>
    );
  }

  const label = `${row.cat_code_1 || ""} ${
    row.prod_code ? `| ${row.prod_code}` : ""
  } | ${row.prod_name || ""}`;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        mx: 1.5,
        py: 0.75,
        gap: 1,
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        "&:hover": { backgroundColor: "#FAFAF8" },
      }}
    >
      <Box sx={{ width: 40, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {row._sl}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1 }}>
        <MapDot row={row} />
        <Typography
          variant="body2"
          noWrap
          title={label}
          sx={{ fontSize: 12, color: "#343A40" }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ width: QTY_COL_WIDTH, flexShrink: 0, textAlign: "center" }}>
        <QtyInput
          rowKey={row._rowKey}
          value={row.prod_qty}
          onCommit={onCommitQty}
        />
      </Box>
    </Box>
  );
});

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
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase().trim();

    const matched = rows.filter((r) => {
      if (r._rowType === "cat_header" || r._isGrandTotal) return false;
      const hay = `${r.prod_code ?? ""} ${r.prod_name ?? ""} ${
        r.cat_code_1 ?? ""
      }`.toLowerCase();
      return hay.includes(term);
    });

    const result = [];
    let lastCat = null;

    rows.forEach((r) => {
      if (r._rowType === "cat_header") {
        lastCat = r;
        return;
      }
      if (r._isGrandTotal) {
        if (matched.length > 0) result.push(r);
        return;
      }
      if (matched.includes(r)) {
        if (lastCat && !result.includes(lastCat)) {
          result.push(lastCat);
        }
        result.push(r);
        lastCat = null;
      }
    });

    return result;
  }, [rows, search]);

  useEffect(() => {
    setPage(0);
  }, [rows.length, search]);

  const paginatedRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const handleCommitQty = useCallback(
    (rowKey, value) => onQtyChange(rowKey, value),
    [onQtyChange],
  );

  const prodLabel = masterPanel["PROD"] || "Product";
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));

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
          mx: 1.5,
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
          {filteredRows.length > 0
            ? `Showing ${page * rowsPerPage + 1} to ${Math.min(
                (page + 1) * rowsPerPage,
                filteredRows.length,
              )} of ${filteredRows.length.toLocaleString()} entries`
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

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          mx: 1.5,
          py: "8px",
          backgroundColor: "#F6F5F2",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ width: 40, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 11, textTransform: "uppercase", color: "#A09D97" }}>
            #
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
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
                checked={tglVal === 1}
                onChange={onToggleAll}
                sx={{ transform: "scale(0.7)" }}
              />
              <Typography sx={{ fontSize: 12, color: "#A09D97", whiteSpace: "nowrap" }}>
                with values
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ width: QTY_COL_WIDTH, flexShrink: 0, textAlign: "center" }}>
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
        </Box>
      </Box>

      <Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          </Box>
        ) : paginatedRows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {search ? "No matching records found" : "No data available"}
            </Typography>
          </Box>
        ) : (
          paginatedRows.map((row) => (
            <ProductRow
              key={row._rowKey}
              row={row}
              onCommitQty={handleCommitQty}
            />
          ))
        )}
      </Box>

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