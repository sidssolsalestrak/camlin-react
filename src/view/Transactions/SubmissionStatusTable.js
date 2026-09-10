import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import {
    Box,
    Typography,
    Tooltip,
    Checkbox,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    CircularProgress,
    Paper,
    FormControl,
    Select,
    MenuItem,
    Stack,
    Pagination,
    PaginationItem,
    TextField,
    InputAdornment,
} from "@mui/material";
import { KeyboardArrowDown, Search, Clear } from "@mui/icons-material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
    FaStar,
    FaThumbsUp,
    FaThumbsDown,
    FaDatabase,
    FaPlus,
    FaRegFileAlt,
    FaSpinner,
    FaBars,
    FaFilePdf,
    FaRegImage,
    FaFileExcel,
    FaMinus,
    FaDesktop,
    FaMobileAlt,
    FaEnvelope,
} from "react-icons/fa";
import { TbClockHour9 } from "react-icons/tb";
import { IoTrashSharp } from "react-icons/io5";
import dayjs from "dayjs";

const ROW_HEIGHT = 33;
const OVERSCAN = 8;
const VIEWPORT_HEIGHT = 600;

function useVirtualRows(rowCount, rowHeight = ROW_HEIGHT, viewportHeight = VIEWPORT_HEIGHT, overscan = OVERSCAN) {
    const scrollRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);

    const onScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
    const endIndex = Math.min(rowCount, startIndex + visibleCount);

    const topSpacerHeight = startIndex * rowHeight;
    const bottomSpacerHeight = Math.max(0, (rowCount - endIndex) * rowHeight);

    return { scrollRef, onScroll, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight };
}

// NOTE: columns.map now includes the column index `i` so the first and last
// cells can be given px: 2 edge padding — matching the `mx: 1.5` + `px: 2`
// inset rhythm used by ManualProductTable's rows. The table container itself
// gets `mx: 1.5` (see the scroll wrapper Box below) so the whole table sits
// inset from the Paper edges the same way the manual table's rows do.
const SubmissionRow = React.memo(
    function SubmissionRow({ row, columns, renderCell, rowStyle, checked }) {
        const rowSx = rowStyle ? rowStyle(row) : {};
        return (
            <TableRow sx={{ "&:hover td": { backgroundColor: "#FAFAF8" }, ...rowSx }}>
                {columns.map((col, i) => (
                    <TableCell
                        key={`${row.id}-${col.field}`}
                        align={
                            col.type === "number" || col.type === "currency"
                                ? "right"
                                : col.field === "stk_name"
                                    ? "left"
                                    : "center"
                        }
                        sx={{
                            fontSize: "12px",
                            color: "#343A40",
                            fontWeight: 400,
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                            pl: i === 0 ? 2 : undefined,
                            pr: i === columns.length - 1 ? 2 : undefined,
                        }}
                    >
                        {renderCell(col, row, checked)}
                    </TableCell>
                ))}
            </TableRow>
        );
    },
    (prev, next) =>
        prev.row === next.row &&
        prev.checked === next.checked &&
        prev.columns === next.columns &&
        prev.renderCell === next.renderCell &&
        prev.rowStyle === next.rowStyle
);
SubmissionRow.displayName = "SubmissionRow";

const SubmissionStatusTableComponent = ({
    tableData = [],
    loading = false,
    rowStyle = null,
    masterPanel = {},
    selMonth = null,
    stkGroup = 0,
    zoneGroup = 0,
    regGroup = 0,
    areaGroup = 0,
    terGroup = 0,
    committedType = 1,
    checkedRows = {},
    checkAll = false,
    onCheckAll = null,
    onRowCheck = null,
    onReject = null,
    onDelete = null,
    onDeleteAll = null,
    onNavigate = null,
    onPreviewFile = null,
    userType = null,
    pagination = true,
    defaultPageSize = 50,
    pageSizeOptions = [10, 25, 50, 100, 200, 500],
    footerActions = null,
    searchable = true,
    searchPlaceholder = "Search",
}) => {
    const lastGroupField = useMemo(() => {
        if (stkGroup === 1) {
            if (terGroup === 1) return "ter_name";
            if (areaGroup === 1) return "area_name";
            return "stk_name";
        }
        if (terGroup === 1) return "ter_name";
        if (areaGroup === 1) return "area_name";
        if (regGroup === 1 && areaGroup === 0 && terGroup === 0) return "reg_name";
        if (zoneGroup === 1 && regGroup === 0 && areaGroup === 0 && terGroup === 0) return "zone_name";
        return "_label";
    }, [stkGroup, zoneGroup, regGroup, areaGroup, terGroup]);
     let falbackDt=dayjs(selMonth).format("MMM YYYY");

    const columns = useMemo(() => {
        const cols = [];

        cols.push({ field: "_sl", headerName: "#", width: 20, type: "number" });

        if (stkGroup === 1) {
            if (areaGroup === 1) {
                cols.push({ field: "area_name", headerName: masterPanel["AREA"] || "Area", width: 120 });
            }
            if (terGroup === 1) {
                cols.push({ field: "ter_name", headerName: masterPanel["TERR"] || "Territory", width: 120 });
            }
            cols.push({ field: "close_date", headerName: "Month", width: 100 });
            cols.push({ field: "stk_code", headerName: "Code", width: 80 });
            cols.push({ field: "stk_name", headerName: `${masterPanel["STKS"] || "Distributor"} Name`, width: 150 });
        } else {
            if (zoneGroup === 1 && regGroup === 0 && areaGroup === 0 && terGroup === 0) {
                cols.push({ field: "zone_name", headerName: masterPanel["ZONE"] || "Zone", width: 120 });
            }
            if (regGroup === 1 && areaGroup === 0 && terGroup === 0) {
                cols.push({ field: "reg_name", headerName: masterPanel["REGN"] || "Region", width: 120 });
            }
            if (areaGroup === 1) {
                cols.push({ field: "area_name", headerName: masterPanel["AREA"] || "Area", width: 120 });
            }
            if (terGroup === 1) {
                cols.push({ field: "ter_name", headerName: masterPanel["TERR"] || "Territory", width: 120 });
            }
            if (lastGroupField === "_label") {
                cols.push({ field: "_label", headerName: "", width: 120 });
            }
        }

        cols.push({ field: "tot_stk", headerName: "Total", width: 20, type: "number" });
        cols.push({ field: "tot_recv", headerName: "Received", width: 20, type: "number" });

        if (stkGroup !== 1) {
            cols.push({ field: "tot_proc", headerName: "Processed", width: 85, type: "number" });
            cols.push({ field: "tot_unproc", headerName: "Process Due", width: 95, type: "number" });
            cols.push({ field: "tot_rej", headerName: "Rejected", width: 85, type: "number" });
            cols.push({ field: "tot_pend", headerName: "Pending", width: 80, type: "number" });
        }

        if (stkGroup === 1) {
            cols.push({ field: "process_stat", headerName: "Status", width: 100 });
            cols.push({ field: "rate_score", headerName: "Rating", width: 100 });
            cols.push({ field: "err_desc", headerName: "Errors", width: 100 });
            cols.push({ field: "base_data_stat", headerName: "Raw", width: 80 });
            cols.push({ field: "proc_data_stat", headerName: "Processed", width: 90 });
            cols.push({ field: "pri_stat", headerName: "Primary", width: 80 });
            cols.push({ field: "create_dt", headerName: "Submission Date", width: 160 });
            cols.push({ field: "_checkbox", headerName: committedType === 1 ? "Check All" : "Stock & Sales", width: 120 });
            cols.push({ field: "_delete_all", headerName: "Delete", width: 80 });
        }

        return cols;
    }, [masterPanel, stkGroup, zoneGroup, regGroup, areaGroup, terGroup, committedType, lastGroupField]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setPage(0);
    }, [tableData]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return tableData;

        const term = searchTerm.toLowerCase().trim();
        return tableData.filter((row) => {
            const searchParts = [];

            Object.values(row).forEach((val) => {
                if (val === null || val === undefined) return;
                if (typeof val === "object") return;
                searchParts.push(String(val));
            });

            columns.forEach((col) => {
                const val = row[col.field];
                if (val === null || val === undefined) return;

                if (col.field === "close_date" && dayjs(val).isValid()) {
                    searchParts.push(dayjs(val).format("MMM YYYY"));
                    searchParts.push(dayjs(val).format("YYYY-MM-DD"));
                } else if (col.field === "create_dt" && val !== "1970-01-01" && dayjs(val).isValid()) {
                    searchParts.push(dayjs(val).format("DD MMM YYYY"));
                    searchParts.push(dayjs(val).format("DD-MM-YYYY"));
                } else {
                    searchParts.push(String(val));
                }
            });

            const searchableText = searchParts.join(" ").toLowerCase();
            return searchableText.includes(term);
        });
    }, [tableData, searchTerm, columns]);

    const pageCount = pagination ? Math.max(1, Math.ceil(filteredData.length / rowsPerPage)) : 1;

    const paginatedRows = useMemo(() => {
        if (!pagination) return filteredData;
        const start = page * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, pagination, page, rowsPerPage]);

    const { scrollRef, onScroll, startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } =
        useVirtualRows(pagination ? 0 : filteredData.length);

    const visibleRows = useMemo(() => {
        if (pagination) return paginatedRows;
        return filteredData.slice(startIndex, endIndex);
    }, [pagination, paginatedRows, filteredData, startIndex, endIndex]);

    const renderStarRating = useCallback((score, processStat) => {
        if (!score && processStat === 0) return null;
        const s = Number(score);
        const star = (color, key) => (
            <FaStar key={key} style={{ color, fontSize: 9 }} title={`${s}%`} />
        );
        if (s >= 90) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(5)].map((_, i) => star("green", i))}</Box>;
        if (s >= 75) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(4)].map((_, i) => star("#16d616", i))}</Box>;
        if (s >= 60) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(3)].map((_, i) => star("#ebda16", i))}</Box>;
        if (s >= 50) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(2)].map((_, i) => star("#f37a8f", i))}</Box>;
        if (s >= 30) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[star("red", 0)]}</Box>;
        if (s < 30 && processStat !== 0)
            return <Box sx={{ display: "flex", justifyContent: "center" }}><FaThumbsDown style={{ color: "red", fontSize: 12 }} title={`${s}%`} /></Box>;
        return null;
    }, []);

    const renderStatusCell = useCallback((row) => {
        const s = row.process_stat;
        if (s === 1 && (row.prod_unmap_cnt > 0 || row.qty_map_cnt > 0))
            return <span style={{ color: "red", fontSize: 11, textAlign: "center" }}>Pending</span>;
        if (s === 1 && row.prod_unmap_cnt === 0 && row.qty_map_cnt === 0)
            return <span style={{ color: "#0051ff", fontSize: 11, textAlign: "center" }}>Confirmation<br />Due</span>;
        if (s === 2) return <span style={{ color: "red", fontSize: 11, textAlign: "center" }}>Rejected</span>;
        if (s === 3) return <span style={{ color: "green", fontSize: 11, textAlign: "center" }}>Approved</span>;
        if (s === 4) return <span style={{ color: "red", fontSize: 11, textAlign: "center" }}>Pending</span>;
        return null;
    }, []);

    const renderPrimaryIcon = useCallback((priStat) => {
        if (priStat === 0) return <TbClockHour9 style={{ color: "#585757", fontSize: 14 }} />;
        if (priStat === 1) return <FaSpinner style={{ color: "#585757", fontSize: 14 }} />;
        if (priStat === 2) return <FaThumbsUp style={{ color: "#585757", fontSize: 14 }} />;
        return null;
    }, []);

    const renderUplTypeIcon = useCallback((uplType) => {
        if (uplType === 2) return (
            <Tooltip title="Website">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <FaDesktop style={{ color: "#585757", fontSize: 13 }} />
                </span>
            </Tooltip>
        );
        if (uplType === 1) return (
            <Tooltip title="App">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <FaMobileAlt style={{ color: "#585757", fontSize: 13 }} />
                </span>
            </Tooltip>
        );
        if (uplType === 3) return (
            <Tooltip title="Email">
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                    <FaEnvelope style={{ color: "#585757", fontSize: 13 }} />
                </span>
            </Tooltip>
        );
        return null;
    }, []);

    const renderDocIcon = useCallback((fileType, docName) => {
        const handleClick = (e) => {
            e.stopPropagation();
            onPreviewFile?.({ docName, fileType });
        };
        if (fileType === 1)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaRegImage style={{ color: "green", fontSize: 15 }} />
                </span>
            );
        if (fileType === 2)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaFilePdf style={{ color: "#e90505", fontSize: 14 }} />
                </span>
            );
        if (fileType === 3)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaFileExcel style={{ color: "#2ba604", fontSize: 14 }} />
                </span>
            );
        return null;
    }, [onPreviewFile]);

    const headerLegend = useMemo(() => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <TbClockHour9 style={{ color: "#585757", fontSize: 15 }} />
                <Typography sx={{ fontSize: 13, color: "#585757" }}>No Data</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FaSpinner style={{ color: "#585757", fontSize: 13 }} />
                <Typography sx={{ fontSize: 13, color: "#585757" }}>Pending</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <FaThumbsUp style={{ color: "#585757", fontSize: 13 }} />
                <Typography sx={{ fontSize: 13, color: "#585757" }}>Received</Typography>
            </Box>
        </Box>
    ), []);

    const formatCellData = useCallback((value, field) => {
        if (value === null || value === undefined || value === "") return " ";
        if (field === "close_date" && value) {
            return dayjs(value).isValid() ? dayjs(value).format("MMM YYYY") : value;
        }
        if (field === "create_dt" && value && value !== "1970-01-01") {
            return dayjs(value).isValid() ? dayjs(value).format("DD MMM YYYY") : value;
        }
        if (typeof value === "number") {
            if (Number(value) === 0) return "-";
            if (["tot_stk", "tot_recv", "tot_proc", "tot_unproc", "tot_rej", "tot_pend"].includes(field)) {
                return value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
        }
        return value;
    }, []);

    const renderCell = useCallback((col, row, checked) => {
        const field = col.field;

        if (row._rowType !== "data" && field === lastGroupField) {
            return (
                <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", textAlign: "center" }}>
                    {row._label}
                </strong>
            );
        }

        if (field === "stk_name" && stkGroup === 1) {
            if (row._rowType === "grand_total")
                return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
            if (row._rowType === "zone_subtotal")
                return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", color: "#3a3a3a", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
            if (row._rowType === "reg_subtotal")
                return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", color: "#555", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
            if (row._rowType === "data")
                return (
                    <Box>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap", mt: 0.2 }}>
                            <span style={{ color: "#212121", fontSize: "11px" }}>{row.stk_name}</span>
                            <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
                                {renderUplTypeIcon(row.upl_type)}
                            </Box>
                        </Box>
                        <Box sx={{ fontSize: "9px", color: "#585757" }}>
                            {row.reg_name} | {row.area_name}
                        </Box>
                    </Box>
                );
            return null;
        }

        const closeDate = row._closeDate ?? (row.close_date ? dayjs(row.close_date).format("MMM YYYY") : dayjs(selMonth).format("MMM YYYY"));
        const pstat = row.process_stat === 3 ? 1 : row.process_stat;

        if (field === "tot_stk") {
            if (row._rowType === "data") return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{Number(row.tot_stk) === 0 ? "-" : row.tot_stk.toLocaleString("en-IN")}</Typography>;
            return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{Number(row.tot_stk) === 0 ? "-" : row.tot_stk.toLocaleString("en-IN")}</strong>;
        }

        if (field === "tot_recv") {
            if (row._rowType === "data") return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{Number(row.tot_recv) === 0 ? "-" : row.tot_recv.toLocaleString("en-IN")}</Typography>;
            return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{Number(row.tot_recv) === 0 ? "-" : row.tot_recv.toLocaleString("en-IN")}</strong>;
        }

        if (field === "close_date") {
            return row._closeDate ?? formatCellData(row[field], field);
        }

        if (field === "process_stat" && stkGroup === 1 && row._rowType === "data") {
            return (
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: 0.3, alignItems: "center" }}>
                    {renderStatusCell(row)}
                    {Number(row.base_data_stat) === 1 && row.process_stat !== 2 && row.process_stat !== 3 && (
                        <Tooltip title="Reject">
                            <span style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "10px", height: "10px", border:"0.1px solid red", borderRadius: "3px",marginTop:'10px' }} onClick={() => onReject?.(row.primary_id)}>
                                <FaMinus style={{ color: "red", fontSize: 6 }} />
                            </span>
                        </Tooltip>
                    )}
                </Box>
            );
        }

        if (field === "err_desc") {
        return <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", display: "block" }}>{formatCellData(row[field], field)}</div>;
        }
 

        if (field === "rate_score" && stkGroup === 1) {
            if (row._rowType === "data") return renderStarRating(row.rate_score, row.process_stat);
            if (row._avg_rating != null) return <Box sx={{ textAlign: "center" }}><strong>{Number(row._avg_rating) === 0 ? "-" : `${row._avg_rating}%`}</strong></Box>;
            return null;
        }

        if ((field === "tot_unproc" || field === "tot_rej" || field === "tot_proc" || field === "tot_pend") && stkGroup !== 1) {
            if (row._rowType === "data") return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{Number(row[field]) === 0 ? "-" : row[field].toLocaleString("en-IN")}</Typography>;
            return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{Number(row[field]) === 0 ? "-" : row[field].toLocaleString("en-IN")}</strong>;
        }

        if (field === "base_data_stat" && stkGroup === 1 && row._rowType === "data") {
            if (Number(row.base_data_stat) === 1) {
                return (
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
                        <Tooltip title="View Raw Data">
                            <Box sx={{ cursor: "pointer" }} onClick={() => onNavigate?.(`/upload_closing/index/${btoa(1)}/${btoa(closeDate)}/${btoa(`${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`)}/${btoa(pstat)}/${btoa(1)}`)}>
                                <FaDatabase style={{ color: "#6e6767", fontSize: 15 }} />
                            </Box>
                        </Tooltip>
                        {renderDocIcon(row.file_type, row.doc_name)}
                    </Box>
                );
            }
            if (Number(row.base_data_stat) !== 1 && row.process_stat === 0) {
                return (
                    <Tooltip title="Upload Data">
                        <a href={`/upload_closing/index/${btoa(1)}/${btoa(falbackDt)}/${btoa(`${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`)}/${btoa(pstat)}/${btoa(1)}`} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "center" }}>
                            <FaPlus style={{ color: "green", fontSize: 15 }} />
                        </a>
                    </Tooltip>
                );
            }
            return null;
        }

        if (field === "proc_data_stat" && stkGroup === 1 && row._rowType === "data" && row.proc_data_stat === 1) {
            return (
                <Tooltip title="View Processed Data">
                    <a href={`/upload_closing/index/${btoa(1)}/${btoa(closeDate)}/${btoa(`${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`)}/${btoa(row.process_stat)}/${btoa(2)}`} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "center" }}>
                        <FaRegFileAlt style={{ color: "#0614ee", fontSize: 15 }} />
                    </a>
                </Tooltip>
            );
        }

        if (field === "pri_stat" && stkGroup === 1 && row._rowType === "data") {
            const icon = renderPrimaryIcon(row.pri_stat);
            if (row.pri_stat === 2) {
                return (
                    <Tooltip title="View Primary Sale">
                        <a href={`/reports/primary_sale_report/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(2)}`} target="_blank" rel="noreferrer" style={{ display: "flex", justifyContent: "center" }}>
                            {icon}
                        </a>
                    </Tooltip>
                );
            }
            return <Box sx={{ display: "flex", justifyContent: "center" }}>{icon}</Box>;
        }

        if (field === "_checkbox" && row._rowType === "data") {
            if (Number(row.cl_stat) === 0 && Number(row.process_stat) === 3 && stkGroup === 1) {
                return (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title="Preview Stock & Sales">
                            <Box sx={{ cursor: "pointer" }} onClick={() => onNavigate?.(`/reports/preview_stk_sales/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(`${row.stk_code}-${row.stk_name}`)}`)}>
                                <FaBars style={{ color: "#585757", fontSize: 14 }} />
                            </Box>
                        </Tooltip>
                        {committedType === 1 && (
                            <Checkbox sx={{ p: 0, m: 0 }} size="small" checked={!!checked} onChange={(e) => onRowCheck?.(row.stk_id, e.target.checked)} />
                        )}
                    </Box>
                );
            }
            if (Number(row.cl_stat) === 1) {
                return (
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
                        {committedType === 1 && (
                            <Tooltip title="Delete Stock & Sales">
                                <span style={{ cursor: "pointer" }} onClick={() => onDelete?.(row)}>
                                    <IoTrashSharp style={{ color: "#e90505", fontSize: 18 }} />
                                </span>
                            </Tooltip>
                        )}
                        <Tooltip title="View Stock & Sales">
                            <a href={`/input/stock_sales/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(1)}`} target="_blank" rel="noreferrer" style={{ display: "flex" }}>
                                <FaRegFileAlt style={{ color: "#0614ee", fontSize: 15 }} />
                            </a>
                        </Tooltip>
                    </Box>
                );
            }
            return null;
        }

        if (field === "_delete_all" && row._rowType === "data" && [2, 3].includes(Number(userType)) && Number(row.base_data_stat) === 1) {
            return (
                <Tooltip title="Delete All">
                    <span style={{ cursor: "pointer" }} onClick={() => onDeleteAll?.(row)}>
                        <IoTrashSharp style={{ color: "#e90505", fontSize: 18 }} />
                    </span>
                </Tooltip>
            );
        }

        return formatCellData(row[field], field);
    }, [stkGroup, committedType, selMonth, userType, lastGroupField, renderStatusCell, renderStarRating, renderPrimaryIcon, renderDocIcon, renderUplTypeIcon, onReject, onNavigate, onRowCheck, onDelete, onDeleteAll, formatCellData]);

    if (loading) {
        return (
            <Paper sx={{ background: "#fff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)", display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>Loading...</Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ background: "#fff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <Box sx={{ mx: 1.5, py: 1.5, borderBottom: "1px solid #e5e7eb", display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 1.5 }}>
                {pagination ? (
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <FormControl size="small" sx={{ minWidth: 70 }}>
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
                                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                                }}
                            >
                                {pageSizeOptions.map((s) => (
                                    <MenuItem key={s} value={s} sx={{ fontSize: "0.875rem" }}>{s}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography
                            variant="body2"
                            sx={{ color: "#6b7280", backgroundColor: "#f3f4f6", px: 1.5, py: 0.25, borderRadius: 1, fontSize: "0.875rem", whiteSpace: "nowrap" }}
                        >
                            {filteredData.length > 0
                                ? `Showing ${page * rowsPerPage + 1} to ${Math.min((page + 1) * rowsPerPage, filteredData.length)} of ${filteredData.length.toLocaleString()} entries`
                                : "Showing 0 to 0 of 0 entries"}
                        </Typography>
                    </Box>
                ) : (
                    <Box />
                )}
                <Box display="flex" alignItems="center" gap={1}>
                    {headerLegend}
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

            <Box
                ref={pagination ? null : scrollRef}
                onScroll={pagination ? undefined : onScroll}
                sx={
                pagination
                    ? {
                        overflowX: "auto",
                        mx: 1.5,
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
                    }
                    : {
                        overflowY: "auto",
                        overflowX: "auto",
                        maxHeight: VIEWPORT_HEIGHT,
                        mx: 1.5,
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
                    }
            }
            >
                <Table
                    size="small"
                    stickyHeader={!pagination}
                    sx={{
                        "& td": { padding: "2px 6px", lineHeight: 1.3 },
                        "& td strong": { lineHeight: 1.3 },
                    }}
                >
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#F6F5F2" }}>
                            {columns.map((col, i) => {
                                let headerContent = col.headerName;

                                if (col.field === "_checkbox" && committedType === 1) {
                                    headerContent = (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                            <Checkbox sx={{ p: 0 }} size="small" checked={checkAll} onChange={(e) => onCheckAll?.(e.target.checked)} />
                                            <Typography sx={{ fontSize: 12 }}>Check All</Typography>
                                        </Box>
                                    );
                                }

                                return (
                                    <TableCell
                                        key={i}
                                        align={col.field === "stk_name" ? "left" : "center"}
                                        sx={{
                                            color: "#A09D97",
                                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                                            fontWeight: 600,
                                            fontSize: "11px",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            width: col.width,
                                            minWidth: col.width || 80,
                                            backgroundColor: "#F6F5F2",
                                            pl: i === 0 ? 2 : 1,
                                            pr: i === columns.length - 1 ? 2 : 1,
                                        }}
                                    >
                                        {typeof headerContent === "string" ? (
                                            <Typography sx={{ fontSize: 11, textAlign: col.field === "stk_name" ? "left" : "center" }}>{headerContent}</Typography>
                                        ) : (
                                            headerContent
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                    <Typography variant="body1" sx={{ color: "#4a4e55" }}>
                                        {searchTerm ? "No matching records found" : "No data available"}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {!pagination && topSpacerHeight > 0 && (
                                    <TableRow style={{ height: topSpacerHeight }}>
                                        <TableCell colSpan={columns.length} sx={{ padding: 0, border: 0 }} />
                                    </TableRow>
                                )}
                                {visibleRows.map((row) => (
                                    <SubmissionRow
                                        key={row.id}
                                        row={row}
                                        columns={columns}
                                        renderCell={renderCell}
                                        rowStyle={rowStyle}
                                        checked={!!checkedRows[row.stk_id]}
                                    />
                                ))}
                                {!pagination && bottomSpacerHeight > 0 && (
                                    <TableRow style={{ height: bottomSpacerHeight }}>
                                        <TableCell colSpan={columns.length} sx={{ padding: 0, border: 0 }} />
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </Box>

            {pagination && (
            <Box sx={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#fafbfc", padding: 1 }}>
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
                    {footerActions}
                </Stack>
            </Box>
        )}
        </Paper>
    );
};

const SubmissionStatusTable = React.memo(SubmissionStatusTableComponent, (prevProps, nextProps) => {
    return (
        prevProps.tableData === nextProps.tableData &&
        prevProps.loading === nextProps.loading &&
        prevProps.checkedRows === nextProps.checkedRows &&
        prevProps.checkAll === nextProps.checkAll &&
        prevProps.stkGroup === nextProps.stkGroup &&
        prevProps.zoneGroup === nextProps.zoneGroup &&
        prevProps.regGroup === nextProps.regGroup &&
        prevProps.areaGroup === nextProps.areaGroup &&
        prevProps.terGroup === nextProps.terGroup &&
        prevProps.committedType === nextProps.committedType &&
        prevProps.masterPanel === nextProps.masterPanel &&
        prevProps.pagination === nextProps.pagination &&
        prevProps.searchable === nextProps.searchable
    );
});

SubmissionStatusTable.displayName = "SubmissionStatusTable";

export default SubmissionStatusTable;