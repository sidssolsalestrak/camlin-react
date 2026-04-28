import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Stack,
  Pagination,
  PaginationItem,
  Tooltip,
  Collapse,
} from "@mui/material";
import { Search, KeyboardArrowDown, Clear } from "@mui/icons-material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import dayjs from "dayjs";

// ── ExpandedContent: handles both sync JSX and async functions ───────────────
function ExpandedContent({ row, expandableRow, cacheKey }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setLoading(true);
    const run = async () => {
      try {
        const result = expandableRow(row);
        const resolved = result instanceof Promise ? await result : result;
        if (!cancelled) {
          setContent(resolved);
          setLoading(false);
        }
      } catch (e) {
        console.error("ExpandedContent error:", e);
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [cacheKey]);

  if (loading) return (
    <Box display="flex" justifyContent="center" p={2}>
      <CircularProgress size={20} />
    </Box>
  );

  return content;
}

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  title = "Data Table",
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick = null,
  sx = {},
  additionalFilters = [],
  statusFields = [],
  statusColors = {},
  highlightColor = "#fef3c7",
  searchPlaceholder = "Search",
  noDataMessage = "No data available",
  noResultsMessage = "No matching records found",
  tooltipThreshold = 20,
  searchable = true,
  pagination = true,
  showHeader = true,
  rowStyle = null,
  stickyHeader = false,
  stickyLastColumn = false,
  stickyColumnsCount = 0,
  headerActions = null,
  footerActions = null,
  expandableRow = null,
  expandableRowBeat = null,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });

  // expandedRows: { [rowKey]: 'focus' | 'beat' | undefined }
  const [expandedRows, setExpandedRows] = useState({});

  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  const flatColumns = useMemo(() => {
    const result = [];
    columns.forEach((col) => {
      if (col.subColumns?.length) {
        col.subColumns.forEach((sub) => result.push(sub));
      } else {
        result.push(col);
      }
    });
    return result;
  }, [columns]);

  const hasSubColumns = useMemo(
    () => columns.some((col) => col.subColumns?.length > 0),
    [columns],
  );

  // Track header height for sticky sub-row positioning
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [columns, stickyHeader]);

  // Reset to first page and clear expanded rows whenever data changes
  useEffect(() => {
    setPage(0);
    setExpandedRows({});
  }, [data]);

  // ── Stable row key ───────────────────────────────────────────────────────
  const getRowKey = (row, ri) =>
    row.id ?? `row-${ri}`;

  // ── Toggle expand: same type = close, different type = switch ────────────
  const handleRowExpand = (rowKey, type) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: prev[rowKey] === type ? undefined : type,
    }));
  };

  const handleSort = (field) => {
    if (!field) return;
    setSortConfig((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" },
    );
  };

  const getStickyStyles = (
    index,
    colList,
    { isHeader = false, isFooter = false } = {},
  ) => {
    if (!stickyLastColumn || stickyColumnsCount <= 0) return {};
    const startIdx = colList.length - stickyColumnsCount;
    if (index < startIdx) return {};

    const rightOffset = colList
      .slice(index + 1)
      .reduce((sum, col) => sum + (col.width || 0), 0);

    return {
      position: "sticky",
      right: rightOffset,
      ...(isFooter && { bottom: 0 }),
      zIndex: isHeader ? 7 : isFooter ? 6 : 3,
      backgroundColor: isHeader ? "#eaf0f6" : isFooter ? "#f9fafb" : "#ffffff",
      borderLeft: "1px solid #e5e7eb",
      boxShadow: index === startIdx ? "-1px 0 2px rgba(0,0,0,0.08)" : "none",
    };
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined || value === "") return " ";

    if (column.valueFormatter) return column.valueFormatter(value);

    switch (column.type) {
      case "date":
        return dayjs(value).isValid()
          ? dayjs(value).format("DD-MM-YYYY")
          : value;
      case "number":
      case "currency":
        return typeof value === "number"
          ? value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
          : value;
      case "boolean":
        return value ? "Yes" : "No";
      default:
        return value;
    }
  };

  // ─── Search highlight ────────────────────────────────────────────────────────
  const highlightText = (text, term) => {
    if (!term?.trim() || !text) return text;
    const str = String(text);
    const lower = str.toLowerCase();
    const termLower = term.toLowerCase().trim();
    if (!lower.includes(termLower)) return text;

    const parts = [];
    let last = 0;
    let idx = lower.indexOf(termLower, last);
    while (idx !== -1) {
      if (idx > last) parts.push(str.slice(last, idx));
      parts.push(
        <span
          key={idx}
          style={{ backgroundColor: highlightColor, borderRadius: 2 }}
        >
          {str.slice(idx, idx + termLower.length)}
        </span>,
      );
      last = idx + termLower.length;
      idx = lower.indexOf(termLower, last);
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts;
  };

  const isReactElement = (v) =>
    typeof v === "object" && v !== null && v.$$typeof;

  const renderCellContent = (content, isStatus, term) => {
    if (isReactElement(content)) return content;
    if (isStatus) return content;

    const displayed = term?.trim() ? highlightText(content, term) : content;

    if (typeof content === "string" && content.length > tooltipThreshold) {
      return (
        <Tooltip title={content} arrow placement="top-start">
          <span
            style={{
              cursor: "help",
              display: "inline-block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayed}
          </span>
        </Tooltip>
      );
    }
    return displayed;
  };

  const getStatusStyle = (value, field) =>
    statusColors[field]?.[value] ?? {
      color: "#6b7280",
      backgroundColor: "#f9fafb",
    };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter((row) => {
      // Combined name support
      const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
      if (fullName.toLowerCase().includes(term)) return true;

      return flatColumns.some((col) => {
        const val = row[col.field];
        if (val === null || val === undefined) return false;

        if (col.type === "date" && dayjs(val).isValid()) {
          return (
            String(val).toLowerCase().includes(term) ||
            dayjs(val).format("DD-MM-YYYY").toLowerCase().includes(term) ||
            dayjs(val).format("DD MMM YYYY").toLowerCase().includes(term)
          );
        }
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, flatColumns]);

  const sortedData = useMemo(() => {
    if (!sortConfig.field) return filteredData;
    return [...filteredData].sort((a, b) => {
      const vA = a[sortConfig.field];
      const vB = b[sortConfig.field];
      if (vA == null) return 1;
      if (vB == null) return -1;
      if (typeof vA === "number" && typeof vB === "number")
        return sortConfig.direction === "asc" ? vA - vB : vB - vA;
      const sA = String(vA).toLowerCase();
      const sB = String(vB).toLowerCase();
      if (sA < sB) return sortConfig.direction === "asc" ? -1 : 1;
      if (sA > sB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const calcTotal = (field) =>
    data.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);

  const formatTotal = (total) =>
    total.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{ border: "1px solid #e5e7eb", borderRadius: 2, ...sx }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <CircularProgress size={32} sx={{ color: "primary.main" }} />
          <Typography
            variant="body2"
            sx={{ mt: 1.5, color: "#6b7280", fontSize: "0.875rem" }}
          >
            Loading...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        padding: "1.5% 2%",
        ...sx,
      }}
    >
      {/* ── Header Controls ── */}
      {showHeader && (
        <Box
          sx={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            pb: 1,
          }}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            gap={2}
          >
            {/* Left: rows-per-page + extra filters + count */}
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
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
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d1d5db",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  {pageSizeOptions.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.875rem" }}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {additionalFilters.map((filter, i) => (
                <FormControl key={i} size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={filter.value}
                    onChange={filter.onChange}
                    displayEmpty
                    IconComponent={KeyboardArrowDown}
                    sx={{
                      fontSize: "0.875rem",
                      height: 32,
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    }}
                  >
                    <MenuItem
                      value=""
                      sx={{ fontSize: "0.875rem", color: "#9ca3af" }}
                    >
                      {filter.placeholder || `All ${filter.label}`}
                    </MenuItem>
                    {filter.options.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        sx={{ fontSize: "0.875rem" }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}

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
                {filteredData.length > 0
                  ? `Showing ${page * rowsPerPage + 1} to ${Math.min(
                    (page + 1) * rowsPerPage,
                    filteredData.length,
                  )} of ${filteredData.length.toLocaleString()} entries`
                  : "Showing 0 to 0 of 0 entries"}
              </Typography>
            </Box>

            {/* Right: search + optional headerActions slot */}
            <Box display="flex" alignItems="center" gap={1}>
              {headerActions}
              {searchable && (
                <TextField
                  size="small"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "#9ca3af", fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <Clear
                          sx={{
                            color: "#9ca3af",
                            fontSize: 16,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSearchTerm("");
                            setPage(0);
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: 200,
                    "& .MuiOutlinedInput-root": {
                      height: 32,
                      fontSize: "0.875rem",
                      "& fieldset": { borderColor: "#d1d5db" },
                      "&:hover fieldset": { borderColor: "primary.main" },
                      "&.Mui-focused fieldset": { borderColor: "primary.main" },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Table ── */}
      <TableContainer
        sx={{
          maxHeight: stickyHeader ? "70vh" : "auto",
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
        <Table size="small" stickyHeader={stickyHeader}>
          <TableHead>
            {/* Main header row */}
            <TableRow ref={headerRef}>
              {columns.map((col, i) => (
                <TableCell
                  key={i}
                  colSpan={col.subColumns?.length || 1}
                  align={
                    col.subColumns
                      ? "center"
                      : col.type === "number" || col.type === "currency"
                        ? "right"
                        : "left"
                  }
                  sx={{
                    minWidth: col.type === "date" ? 80 : col.width,
                    width: col.width,
                    // borderRight:
                    //   i !== columns.length - 1 ? "1px solid #e5e7eb" : "none",
                    padding: "11px 6px",
                    color: "#A09D97",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    backgroundColor: "#F6F5F2",
                    verticalAlign: "top",
                    ...(stickyHeader && {
                      position: "sticky",
                      top: 0,
                      zIndex: 4,
                    }),
                    ...getStickyStyles(i, columns, { isHeader: true }),
                  }}
                >
                  {col.renderHeader ? (
                    col.renderHeader()
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        whiteSpace: "nowrap",
                        flexDirection: "column",
                        cursor:
                          col.sortable && !col.subColumns
                            ? "pointer"
                            : "default",
                        userSelect: "none",
                      }}
                      onClick={() =>
                        col.sortable && !col.subColumns && handleSort(col.field)
                      }
                    >
                      <Typography
                        sx={{
                          // fontFamily: '"Open Sans", sans-serif',
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {col.headerName}
                      </Typography>
                      {!col.subColumns &&
                        sortConfig.field === col.field &&
                        (sortConfig.direction === "asc" ? (
                          <ArrowDropUpIcon
                            sx={{ color: "#1976d2", fontSize: 18 }}
                          />
                        ) : (
                          <ArrowDropDownIcon
                            sx={{ color: "#1976d2", fontSize: 18 }}
                          />
                        ))}
                    </Box>
                  )}
                </TableCell>
              ))}
            </TableRow>

            {/* Sub-header row */}
            {hasSubColumns && (
              <TableRow>
                {columns.map((col, pi) =>
                  col.subColumns?.length ? (
                    col.subColumns.map((sub, si) => (
                      <TableCell
                        key={`${pi}-${si}`}
                        align="center"
                        sx={{
                          minWidth: sub.width,
                          width: sub.width,
                          // borderRight: "1px solid #e5e7eb",
                          p: 0.5,
                          // borderBottom: "1px solid #e5e7eb",
                          // borderBottom: "1px solid rgba(0,0,0,0.08)",
                          // transition: "background 0.1s",
                          // animation: "rowIn 0.3s ease both",
                          ...(stickyHeader && {
                            position: "sticky",
                            top: headerHeight,
                            zIndex: 4,
                          }),
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            cursor: sub.sortable ? "pointer" : "default",
                            userSelect: "none",
                          }}
                          onClick={() => sub.sortable && handleSort(sub.field)}
                        >
                          <Typography
                            sx={{
                              // fontFamily: '"Open Sans", sans-serif',
                              fontSize: "11px",
                            }}
                          >
                            {sub.headerName}
                          </Typography>
                          {sortConfig.field === sub.field &&
                            (sortConfig.direction === "asc" ? (
                              <ArrowDropUpIcon
                                sx={{ color: "#1976d2", fontSize: 16 }}
                              />
                            ) : (
                              <ArrowDropDownIcon
                                sx={{ color: "#1976d2", fontSize: 16 }}
                              />
                            ))}
                        </Box>
                      </TableCell>
                    ))
                  ) : (
                    <TableCell
                      key={pi}
                      sx={{
                        // borderRight:
                        //   pi !== columns.length - 1
                        //     ? "1px solid #e5e7eb"
                        //     : "none",
                        p: 0.5,
                        borderBottom: "1px solid #e5e7eb",
                        ...(stickyHeader && {
                          position: "sticky",
                          top: headerHeight,
                          zIndex: 4,
                        }),
                      }}
                    />
                  ),
                )}
              </TableRow>
            )}

            {/* Header totals row */}
            {flatColumns.some((c) => c.showHeaderTotal) && (
              <TableRow
                sx={{
                  position: "sticky",
                  top: stickyHeader ? headerHeight : 0,
                  zIndex: 6,
                  backgroundColor: "#eef2ff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                {flatColumns.map((col, i) => {
                  const firstIdx = flatColumns.findIndex(
                    (c) => c.showHeaderTotal,
                  );
                  const total = col.showHeaderTotal
                    ? calcTotal(col.field)
                    : null;
                  return (
                    <TableCell
                      key={col.field}
                      align="right"
                      sx={{
                        backgroundColor: "#eef2ff",
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRight:
                          i !== flatColumns.length - 1
                            ? "1px solid #c7d2fe"
                            : "none",
                        ...getStickyStyles(i, flatColumns),
                      }}
                    >
                      {col.showHeaderTotal
                        ? formatTotal(total)
                        : i === firstIdx - 1
                          ? "Total"
                          : ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            )}
          </TableHead>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={flatColumns.length}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body1" sx={{ color: "#4a4e55" }}>
                    {searchTerm ? noResultsMessage : noDataMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, ri) => {
                const rowKey = getRowKey(row, ri);

                // 'focus' | 'beat' | undefined
                const expandedType = expandedRows[rowKey];

                return (
                  <React.Fragment key={rowKey}>

                    {/* ── Main data row ── */}
                    <TableRow
                      onClick={() => onRowClick?.(row)}
                      sx={{
                        ...(rowStyle ? rowStyle(row) : {}),
                        cursor: onRowClick ? "pointer" : "default",
                        "& td": { backgroundColor: "#ffffff" },
                        // "&:nth-of-type(even) td": { backgroundColor: "#f7fbff" },
                        // "&:hover td": { backgroundColor: "#e1f3ff" },
                        "&:hover td": { backgroundColor: "#FAFAF8" },
                        "& td": { color: "#706E69" },
                      }}
                    >
                      {flatColumns.map((col, ci) => {

                        // ── ✅ __expand__ → Focus Range expansion ───────────
                        if (col.field === "__expand__" && expandableRow) {
                          return (
                            <TableCell
                              key="__expand__"
                              sx={{
                                padding: "4px 6px",
                                borderBottom: "1px solid rgba(0,0,0,0.08)",
                                cursor: "pointer",
                                textAlign: "center",
                                ...getStickyStyles(ci, flatColumns),
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowExpand(rowKey, "focus");
                              }}
                            >
                              <Typography
                                component="span"
                                sx={{
                                  color: "#1976d2",
                                  fontWeight: "bold",
                                  fontSize: 18,
                                  lineHeight: 1,
                                  userSelect: "none",
                                }}
                              >
                                {expandedType === "focus" ? "−" : "+"}
                              </Typography>
                            </TableCell>
                          );
                        }

                        // ── ✅ __expand_beat__ → Beat expansion ─────────────
                        if (col.field === "__expand_beat__" && expandableRowBeat) {
                          const hasBeat = row.beat_work && row.beat_work.trim() !== "";

                          // No beat — render cell normally, no expand behavior
                          if (!hasBeat) {
                            return (
                              <TableCell
                                key="__expand_beat__"
                                sx={{
                                  padding: "4px 6px",
                                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                                  cursor: "default",
                                  ...getStickyStyles(ci, flatColumns),
                                }}
                              >
                                {col.renderCell
                                  ? col.renderCell({ value: row[col.field], row, isExpanded: false })
                                  : "-"
                                }
                              </TableCell>
                            );
                          }

                          // Has beat — render with expand toggle
                          return (
                            <TableCell
                              key="__expand_beat__"
                              sx={{
                                padding: "4px 6px",
                                borderBottom: "1px solid rgba(0,0,0,0.08)",
                                cursor: "pointer",
                                ...getStickyStyles(ci, flatColumns),
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowExpand(rowKey, "beat");
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography
                                  component="span"
                                  sx={{
                                    fontWeight: "bold",
                                    fontSize: 15,
                                    lineHeight: 1,
                                    userSelect: "none",
                                  }}
                                >
                                  {expandedType === "beat" ? "−" : "+"}
                                </Typography>
                                {col.renderCell
                                  ? col.renderCell({ value: row[col.field], row, isExpanded: expandedType === "beat" })
                                  : null
                                }
                              </Box>
                            </TableCell>
                          );
                        }

                        // ── Normal cell rendering ───────────────────────────
                        const rawContent = col.renderCell
                          ? col.renderCell({ value: row[col.field], row })
                          : formatCellValue(row[col.field], col);
                        const isStatus = statusFields.includes(col.field);
                        const statusStyle = isStatus
                          ? getStatusStyle(rawContent, col.field)
                          : {};

                        return (
                          <TableCell
                            key={col.field ?? `col-${ci}`}
                            align={["number", "currency", "date"].includes(col.type) ? "right"
                              : col.type === "alignCenter" ? "center" : "left"
                            }
                            sx={{
                              fontSize: "12px",
                              // fontFamily: '"Open Sans", sans-serif',
                              // borderRight:
                              //   ci !== flatColumns.length - 1
                              //     ? "1px solid #e5e7eb"
                              //     : "none",
                              // p: 0.5,
                              padding: "4px 6px",
                              color: "#343A40",
                              fontWeight: 400,
                              // borderBottom: "1px solid #f3f4f6",
                              borderBottom: "1px solid rgba(0,0,0,0.08)",
                              transition: "background 0.1s",
                              animation: "rowIn 0.3s ease both",
                              ...getStickyStyles(ci, flatColumns),
                            }}
                          >
                            {isStatus ? (
                              <Chip
                                label={rawContent}
                                size="small"
                                sx={{
                                  fontSize: "11px",
                                  height: 20,
                                  "& .MuiChip-label": { px: 1 },
                                  ...statusStyle,
                                }}
                              />
                            ) : col.headerName === "Customer Name" ||
                              col.headerName === "Territory Details" ||
                              col.headerName === "Invoice Remark" ||
                              col.headerName === "Reporting To" ? (
                              (() => {
                                const showTooltip =
                                  typeof rawContent === "string" &&
                                  rawContent.length > 20;

                                const contentSpan = (
                                  <span
                                    style={{
                                      display: "inline-block",
                                      maxWidth: "200px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      verticalAlign: "middle",
                                      cursor: showTooltip ? "pointer" : "default",
                                    }}
                                  >
                                    {rawContent}
                                  </span>
                                );

                                return showTooltip ? (
                                  <Tooltip
                                    arrow
                                    placement="top-start"
                                    title={
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {rawContent}
                                      </span>
                                    }
                                  >
                                    {contentSpan}
                                  </Tooltip>
                                ) : (
                                  contentSpan
                                );
                              })()
                            ) : (
                              renderCellContent(rawContent, false, searchTerm)
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* ── ✅ Expansion row (single row, two Collapses inside) ── */}
                    {(expandableRow || expandableRowBeat) && (
                      <TableRow>
                        <TableCell
                          colSpan={flatColumns.length}
                          sx={{
                            p: 0,
                            borderBottom: expandedType
                              ? "2px solid #e5e7eb"
                              : "none",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          {/* Focus Range expansion */}
                          <Collapse
                            in={expandedType === "focus"}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ p: 0.5, margin: 0 }}>
                              {expandableRow && (
                                <ExpandedContent
                                  key={`focus-${rowKey}`}
                                  row={row}
                                  expandableRow={expandableRow}
                                  cacheKey={`focus-${rowKey}`}
                                />
                              )}
                            </Box>
                          </Collapse>

                          {/* Beat expansion */}
                          <Collapse
                            in={expandedType === "beat"}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ p: 0.5, margin: 0 }}>
                              {expandableRowBeat && (
                                <ExpandedContent
                                  key={`beat-${rowKey}`}
                                  row={row}
                                  expandableRow={expandableRowBeat}
                                  cacheKey={`beat-${rowKey}`}
                                />
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}

                  </React.Fragment>
                );
              })
            )}
          </TableBody>

          {/* Footer totals row */}
          {flatColumns.some((c) => c.showTotal) && (
            <TableBody>
              <TableRow
                sx={{
                  "& td": {
                    backgroundColor: "#f9fafb",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 5,
                  },
                  borderTop: "1px solid #d1d5db",
                }}
              >
                {flatColumns.map((col, i) => {
                  const firstIdx = flatColumns.findIndex((c) => c.showTotal);
                  const total = col.showTotal ? calcTotal(col.field) : null;
                  const isNumeric =
                    col.type === "number" || col.type === "currency";
                  return (
                    <TableCell
                      key={col.field}
                      align="right"
                      sx={{
                        fontSize: "12px",
                        borderRight:
                          i !== flatColumns.length - 1
                            ? "1px solid #e5e7eb"
                            : "none",
                        py: 1.5,
                        px: 1.5,
                        ...getStickyStyles(i, flatColumns, { isFooter: true }),
                      }}
                    >
                      {col.showTotal
                        ? formatTotal(total)
                        : i === firstIdx - 1
                          ? "Total"
                          : ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {/* ── Footer: pagination + optional footerActions ── */}
      {pagination && (
        <Box
          sx={{
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fafbfc",
            padding: 1,
          }}
        >
          <Stack
            spacing={2}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Pagination
              variant="text"
              count={Math.ceil(filteredData.length / rowsPerPage)}
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
            {footerActions}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default DataTable;