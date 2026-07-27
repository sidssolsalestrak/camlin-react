import React, { useEffect, useState, useMemo, useRef } from "react";
import Layout from "../../layout";
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Dialog,
    DialogActions,
    DialogTitle,
    DialogContent,
    Divider,
    Typography,
    IconButton,
    Checkbox,
    Tooltip,
    Paper,
    ClickAwayListener,
    MenuList,
    FormControlLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import {
    FaFilter,
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
    FaMinusSquare,
    FaChevronDown,
    FaDesktop,
    FaMobileAlt,
    FaEnvelope,
} from "react-icons/fa";
import { AiOutlineFileExcel } from "react-icons/ai";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import "../../assets/css/accountMas.css";
import { TbClockHour9 } from "react-icons/tb";
import { IoTrashSharp } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmationDialog from "../../utils/confirmDialog";
import useToast from "../../utils/useToast";
import { excelWithFilters } from "../../utils/ExcelWithFilters";
import CircularProgressLoading from "../../utils/CircularProgressLoading";
import FilePreviewModal from "./FilePreviewModal";
import { getMasterPanel } from "../../services/masterPanelService";

// ─── Multi-Checkbox Group-By Dropdown ────────────────────────────────────────
function GroupByDropdown({ groupChecks, onChange, typeId, masterPanel }) {
    const [open, setOpen] = useState(false);

    const labels = {
        zone: masterPanel["ZONE"] || "Zone",
        reg: masterPanel["REGN"] || "Region",
        area: masterPanel["AREA"] || "Area",
        ter: masterPanel["TERR"] || "Territory",
        stk: masterPanel["STKS"] || "Distributor",
    };

    const visibleKeys = typeId === 1
        ? ["zone", "reg", "area", "ter", "stk"]
        : ["stk"];

    const summaryText =
        visibleKeys.filter((k) => groupChecks[k]).map((k) => labels[k]).join(", ") || "None";

    const handleToggle = (key) => {
        onChange({ ...groupChecks, [key]: !groupChecks[key] });
    };

    return (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
            <Box sx={{ position: "relative", height: '2.8rem' }}>
                <FormControl fullWidth size="small" onClick={() => setOpen((o) => !o)}>
                    <InputLabel shrink>Group By</InputLabel>
                    <Select
                        label="Group By"
                        open={false}
                        onClose={() => { }}
                        value=""
                        displayEmpty
                        notched
                        renderValue={() => (
                            <Typography
                                sx={{
                                    fontSize: 13,
                                    color: summaryText === "None" ? "text.secondary" : "text.primary",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {summaryText}
                            </Typography>
                        )}
                        IconComponent={() => (
                            <FaChevronDown
                                size={11}
                                style={{
                                    marginRight: 8,
                                    flexShrink: 0,
                                    transition: "transform 0.2s",
                                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                                }}
                            />
                        )}
                        inputProps={{ readOnly: true }}
                        sx={{
                            fontSize: 13,
                            cursor: "pointer",
                            "& .MuiSelect-select": { cursor: "pointer" },
                        }}
                    >
                        <MenuItem value="" sx={{ display: "none" }} />
                    </Select>
                </FormControl>
                <Typography
                    sx={{
                        fontSize: 9,
                        color: summaryText === "None" ? "text.disabled" : "#0000FF",
                        mt: 0.3,
                        pl: 0.5,
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    {summaryText === "None" ? "\u00A0" : summaryText}
                </Typography>

                {open && (
                    <Paper
                        elevation={4}
                        sx={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            zIndex: 1300,
                            minWidth: "100%",
                            mt: 0.5,
                            py: 0.5,
                        }}
                    >
                        <MenuList dense disablePadding>
                            {visibleKeys.map((key) => (
                                <MenuItem
                                    key={key}
                                    dense
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(key);
                                    }}
                                    sx={{ py: 0.25, px: 1 }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={!!groupChecks[key]}
                                                onChange={() => handleToggle(key)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        }
                                        label={
                                            <Typography sx={{ fontSize: 13 }}>
                                                {labels[key]}
                                            </Typography>
                                        }
                                        sx={{ m: 0 }}
                                    />
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Paper>
                )}
            </Box>
        </ClickAwayListener>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function DataSubmissionStatus() {

    // ─── State ────────────────────────────────────────────────────────────────
    const [type, setType] = useState(1);
    const [committedType, setCommittedType] = useState(1);
    const [selMonth, setSelMonth] = useState(dayjs().subtract(1, 'month'));
    const [status, setStatus] = useState(1);
    const [previewFile, setPreviewFile] = useState(null);
    const [groupChecks, setGroupChecks] = useState({
        zone: true,
        reg: true,
        area: false,
        ter: false,
        stk: true,
    });
    const [committedGroupChecks, setCommittedGroupChecks] = useState({
        zone: true,
        reg: true,
        area: false,
        ter: false,
        stk: true,
    });
    const [masterPanel, setMasterPanel] = useState({});

    const navigate = useNavigate();
    const location = useLocation();

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [progress, setProgress] = useState(null);

    // ─── Dropdown data lists ──────────────────────────────────────────────────
    const [allZone, setAllZone] = useState([]);
    const [allZBM, setAllZBM] = useState([]);
    const [allRegion, setAllRegion] = useState([]);
    const [allRSM, setAllRSM] = useState([]);
    const [allArea, setAllArea] = useState([]);
    const [allAMF, setAllAMF] = useState([]);
    const [allTerritory, setAllTerritory] = useState([]);
    const [allSrUser, setAllSRUser] = useState([]);
    const [allDistributor, setAllDistributor] = useState([]);

    // ─── Selected filter values ───────────────────────────────────────────────
    const [selZone, setSelZone] = useState(0);
    const [selZBM, setSelZBM] = useState(0);
    const [selRegion, setSelRegion] = useState(0);
    const [selRSM, setSelRSM] = useState(0);
    const [selArea, setSelArea] = useState(0);
    const [selAMF, setSelAMF] = useState(0);
    const [selTerritory, setSelTerritory] = useState(0);
    const [selSrUser, setSelSrUser] = useState(0);
    const [selDistributor, setSelDistributor] = useState(0);

    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checkedRows, setCheckedRows] = useState({});
    const [checkAll, setCheckAll] = useState(false);
    const [modifyLoading, setModifyLoading] = useState(false);
    const toast = useToast();

    // ─── Confirmation Dialog State ────────────────────────────────────────────
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary",
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));
    };

    // ─── Derived group flags (from committed state — controls table rendering) ─
    const zoneGroup = committedType === 1 && committedGroupChecks.zone ? 1 : 0;
    const regGroup  = committedType === 1 && committedGroupChecks.reg  ? 1 : 0;
    const areaGroup = committedType === 1 && committedGroupChecks.area ? 1 : 0;
    const terGroup  = committedType === 1 && committedGroupChecks.ter  ? 1 : 0;
    const stkGroup  = committedGroupChecks.stk ? 1 : 0;

    // ─── Effects ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchZone();
    }, []);

    useEffect(() => {
        setSelZBM(0); setAllZBM([]);
        setSelRegion(0); setAllRegion([]);
        setSelRSM(0); setAllRSM([]);
        setSelArea(0); setAllArea([]);
        setSelAMF(0); setAllAMF([]);
        setSelTerritory(0); setAllTerritory([]);
        setSelSrUser(0); setAllSRUser([]);
        setSelDistributor(0); setAllDistributor([]);
        if (selZone > 0) {
            fetchZBM(selZone);
            fetchRegion(selZone);
        }
    }, [selZone]);

    useEffect(() => {
        setSelRSM(0); setAllRSM([]);
        setSelAMF(0); setAllAMF([]);
        setSelSrUser(0); setAllSRUser([]);
        if (selRegion > 0) {
            fetchRSM(selRegion, selZBM);
        }
    }, [selZBM]);

    useEffect(() => {
        setSelRSM(0); setAllRSM([]);
        setSelArea(0); setAllArea([]);
        setSelAMF(0); setAllAMF([]);
        setSelTerritory(0); setAllTerritory([]);
        setSelSrUser(0); setAllSRUser([]);
        setSelDistributor(0); setAllDistributor([]);
        if (selRegion > 0) {
            fetchRSM(selRegion, selZBM);
            fetchArea(selRegion);
        }
    }, [selRegion]);

    useEffect(() => {
        setSelAMF(0); setAllAMF([]);
        setSelSrUser(0); setAllSRUser([]);
        if (selArea > 0) {
            fetchAMFS(selArea, selRSM);
        }
    }, [selRSM]);

    useEffect(() => {
        setSelAMF(0); setAllAMF([]);
        setSelTerritory(0); setAllTerritory([]);
        setSelSrUser(0); setAllSRUser([]);
        setSelDistributor(0); setAllDistributor([]);
        if (selArea > 0) {
            fetchAMFS(selArea, selRSM);
            fetchTerritory(selArea);
            fetchDistributor(selArea);
        }
    }, [selArea]);

    useEffect(() => {
        setSelSrUser(0); setAllSRUser([]);
        if (selAMF > 0) {
            fetchSRUser(selAMF);
        }
    }, [selAMF]);

    // ─── API fetchers ─────────────────────────────────────────────────────────
    const fetchZone = async () => {
        try {
            const r = await api.post("/getReportsZone");
            setAllZone(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchZBM = async (zone_id) => {
        try {
            const r = await api.post("/getZm", { zone_id });
            setAllZBM(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchRegion = async (zone_id) => {
        try {
            const r = await api.post("/extractRegionList", { zone_id });
            setAllRegion(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchRSM = async (reg_id, zm_id) => {
        try {
            const r = await api.post("/getRm", { reg_id, zm_id });
            setAllRSM(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchArea = async (reg_id) => {
        try {
            const r = await api.post("/extractAreaList", { reg_id });
            setAllArea(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchAMFS = async (area_id, rm_id) => {
        try {
            const r = await api.post("/getAsm", { area_id, rm_id });
            setAllAMF(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchTerritory = async (area_id) => {
        try {
            const r = await api.post("/getReportsTerritory", { area_id });
            setAllTerritory(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchSRUser = async (asm_id) => {
        try {
            const r = await api.post("/getUserTransact", { asm_id });
            setAllSRUser(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };
    const fetchDistributor = async (area_id) => {
        try {
            const r = await api.post("/getLogStk", { area_id });
            setAllDistributor(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    // ─── Validate at least one group is selected ──────────────────────────────
    const validateGroupBy = () => {
        const anyChecked = type === 2
            ? groupChecks.stk
            : Object.values(groupChecks).some(Boolean);
        if (!anyChecked) {
            alert("Please Select At Least One Grouping");
            return false;
        }
        return true;
    };

    const getLabel = (list, selectedId, labelKey, idKey = "id") => {
        if (!selectedId || selectedId === 0 || selectedId === "0") return "All";
        const match = list.find((item) => String(item[idKey]) === String(selectedId));
        if (!match) return "All";
        return typeof labelKey === "function" ? labelKey(match) : match[labelKey];
    };

    // ─── Excel Export Handler ─────────────────────────────────────────────────
    const handleExcelExport = async () => {
    if (!tableData || tableData.length === 0) {
        toast.error("No data to export");
        return;
    }

    const filters = [
        { label: `Month - ${dayjs(selMonth).format("MMM YYYY")}`, bold: false, sz: 10 },
        { label: `${masterPanel["ZONE"] || "Zone"} : ${getLabel(allZone, selZone, "zone_name")}`, bold: false, sz: 10 },
        { label: `${masterPanel["REGN"] || "Region"} : ${getLabel(allRegion, selRegion, "reg_name")}`, bold: false, sz: 10 },
        { label: `${masterPanel["AREA"] || "Area"} : ${getLabel(allArea, selArea, "area_name")}`, bold: false, sz: 10 },
        { label: `${masterPanel["TERR"] || "Territory"} : ${getLabel(allTerritory, selTerritory, "ter_name")}`, bold: false, sz: 10 },
        { label: `RSM : ${getLabel(allRSM, selRSM, "user_name")}`, bold: false, sz: 10 },
        { label: `ZBM : ${getLabel(allZBM, selZBM, "user_name")}`, bold: false, sz: 10 },
        { label: `AM/FSO : ${getLabel(allAMF, selAMF, "user_name")}`, bold: false, sz: 10 },
        { label: `SR: ${getLabel(allSrUser, selSrUser, "user_name")}`, bold: false, sz: 10 },
        { label: `${masterPanel["STKS"] || "Distributor"} : ${getLabel(allDistributor, selDistributor, (v) => `${v.stk_code} - ${v.stk_name}`)}`, bold: false, sz: 10 },
    ];

    const lastGroupColId = (() => {
        if (stkGroup === 1) {
            if (terGroup  === 1) return "ter_name";
            if (areaGroup === 1) return "area_name";
            return null;
        }
        if (terGroup  === 1) return "ter_name";
        if (areaGroup === 1) return "area_name";
        if (regGroup  === 1 && areaGroup === 0 && terGroup === 0) return "reg_name";
        if (zoneGroup === 1 && regGroup === 0 && areaGroup === 0 && terGroup === 0) return "zone_name";
        return null;
    })();

    const exportData = tableData.map((row) => {
        const newRow = { ...row };

        newRow._grandTotal = row._rowType === "grand_total";
        newRow._zoneTotal  = row._rowType === "zone_subtotal";
        newRow._isSubtotal = row._rowType === "reg_subtotal";

        if (row._rowType !== "data") {
            newRow.stk_name          = "";
            newRow._sl               = "";
            newRow.close_date        = "";
            newRow.stk_code          = "";
            newRow.reg_name          = "";
            newRow.area_name         = "";
            newRow.zone_name         = "";
            newRow.ter_name          = "";
            newRow.rate_score        = row._avg_rating ? `${row._avg_rating}%` : "0%";

            // Apply zeroToNull to ALL total fields, not just tot_stk/tot_recv
            newRow.tot_stk           = zeroToNull(row.tot_stk);
            newRow.tot_recv          = zeroToNull(row.tot_recv);
            newRow.tot_proc          = zeroToNull(row.tot_proc);
            newRow.tot_unproc        = zeroToNull(row.tot_unproc);
            newRow.tot_rej           = zeroToNull(row.tot_rej);
            newRow.tot_pend          = zeroToNull(row.tot_pend);

            newRow.process_stat_text = "";
            newRow.err_desc          = "";
            newRow.pri_stat_text     = "";
            newRow.upl_type_text     = "";
            newRow.create_dt         = "";

            if (stkGroup === 1) {
                newRow.stk_name = row._label || "";
            } else if (lastGroupColId) {
                newRow[lastGroupColId] = row._label || "";
            } else {
                newRow.stk_name = row._label || "";
            }
            return newRow;
        }

        // Data rows
        if (newRow.close_date)
            newRow.close_date = dayjs(newRow.close_date).format("MMM-YYYY");

        if (newRow.upl_type === 1)      newRow.upl_type_text = "App";
        else if (newRow.upl_type === 2) newRow.upl_type_text = "Website";
        else if (newRow.upl_type === 3) newRow.upl_type_text = "Email";
        else                            newRow.upl_type_text = "-";

        if (newRow.pri_stat === 0)      newRow.pri_stat_text = "No Data";
        else if (newRow.pri_stat === 1) newRow.pri_stat_text = "Pending";
        else if (newRow.pri_stat === 2) newRow.pri_stat_text = "Received";
        else                            newRow.pri_stat_text = "-";

        if (newRow.process_stat === 1 && (newRow.prod_unmap_cnt > 0 || newRow.qty_map_cnt > 0))
            newRow.process_stat_text = "Pending";
        else if (newRow.process_stat === 1 && newRow.prod_unmap_cnt === 0 && newRow.qty_map_cnt === 0)
            newRow.process_stat_text = "Confirmation Due";
        else if (newRow.process_stat === 2) newRow.process_stat_text = "Rejected";
        else if (newRow.process_stat === 3) newRow.process_stat_text = "Approved";
        else if (newRow.process_stat === 4) newRow.process_stat_text = "Pending";
        else                                newRow.process_stat_text = "-";

        if (newRow.create_dt && newRow.create_dt !== "1970-01-01")
            newRow.create_dt = dayjs(newRow.create_dt).format("DD-MMM-YYYY");
        else newRow.create_dt = "";

        newRow.rate_score          = newRow.rate_score ? `${newRow.rate_score}` : "-";

        // Apply zeroToNull to ALL total fields for data rows too
        newRow.tot_stk             = zeroToNull(newRow.tot_stk);
        newRow.tot_recv            = zeroToNull(newRow.tot_recv);
        newRow.tot_proc            = zeroToNull(newRow.tot_proc);
        newRow.tot_unproc          = zeroToNull(newRow.tot_unproc);
        newRow.tot_rej             = zeroToNull(newRow.tot_rej);
        newRow.tot_pend            = zeroToNull(newRow.tot_pend);

        newRow.stk_sales_stat_text = Number(newRow.cl_stat) === 1 ? "Yes" : "No";

        return newRow;
    });

    const groupExcelColumns = [];
    if (stkGroup === 1) {
        if (areaGroup === 1) groupExcelColumns.push({ label: masterPanel["AREA"] || "Area",      id: "area_name" });
        if (terGroup  === 1) groupExcelColumns.push({ label: masterPanel["TERR"] || "Territory", id: "ter_name"  });
    } else {
        if (zoneGroup === 1 && regGroup === 0 && areaGroup === 0 && terGroup === 0)
            groupExcelColumns.push({ label: masterPanel["ZONE"] || "Zone",      id: "zone_name" });
        if (regGroup === 1 && areaGroup === 0 && terGroup === 0)
            groupExcelColumns.push({ label: masterPanel["REGN"] || "Region",    id: "reg_name"  });
        if (areaGroup === 1)
            groupExcelColumns.push({ label: masterPanel["AREA"] || "Area",      id: "area_name" });
        if (terGroup === 1)
            groupExcelColumns.push({ label: masterPanel["TERR"] || "Territory", id: "ter_name"  });
    }

    const excelColumns = [
        { label: "#",                           id: "_sl"                  },
        ...groupExcelColumns,
        ...(stkGroup === 1
            ? [
                { label: "Month",            id: "close_date" },
                { label: "Code",              id: "stk_code"   },
                { label: `${masterPanel["STKS"] || "Distributor"} Name`,  id: "stk_name"    },
                { label: masterPanel["REGN"] || "Region", id: "reg_name" },
                ...(areaGroup === 0 ? [{ label: masterPanel["AREA"] || "Area",   id: "area_name" }] : []),
                { label: "Submit Mode",       id: "upl_type_text" },
            ]
            : []
        ),
        { label: "Total",                       id: "tot_stk"              },
        { label: "Received",                    id: "tot_recv"             },
        ...(stkGroup !== 1
            ? [
                { label: "Processed",    id: "tot_proc"   },
                { label: "Process Due",  id: "tot_unproc" },
                { label: "Rejected",     id: "tot_rej"    },
                { label: "Pending",      id: "tot_pend"   },
            ]
            : []
        ),
        ...(stkGroup === 1
            ? [
                { label: "Status",                        id: "process_stat_text"    },
                { label: "Stock and Sales Report Status", id: "stk_sales_stat_text"  },
                { label: "Rating",                        id: "rate_score"           },
                { label: "Errors",                        id: "err_desc"             },
                { label: "Primary",                       id: "pri_stat_text"        },
                { label: "Submission Date",               id: "create_dt"            },
            ]
            : []
        ),
    ];

    await excelWithFilters(
        exportData,
        excelColumns,
        `Stock_Sales_Data_Status_${dayjs(selMonth).format("YYYY_MM")}`,
        filters,
        setProgress,
        0
    );
};
    // ─── Load table data ──────────────────────────────────────────────────────
    const handleLoad = async () => {
        if (!validateGroupBy()) return;
        try {
            setLoading(true);
            setCheckedRows({});
            setCheckAll(false);

            // Commit type and group checks
            setCommittedType(type);
            setCommittedGroupChecks(groupChecks);

            // ── Compute flags fresh from live groupChecks + type
            //    so payload is always in sync regardless of render timing ──
            const _zoneGroup = type === 1 && groupChecks.zone ? 1 : 0;
            const _regGroup  = type === 1 && groupChecks.reg  ? 1 : 0;
            const _areaGroup = type === 1 && groupChecks.area ? 1 : 0;
            const _terGroup  = type === 1 && groupChecks.ter  ? 1 : 0;
            const _stkGroup  = groupChecks.stk ? 1 : 0;

            const payload = {
                month:        dayjs(selMonth).format("YYYY-MM-01"),
                type_id:      type,
                stat:         status,
                zoneGroup:    _zoneGroup,
                regGroup:     _regGroup,
                areaGroup:    _areaGroup,
                terGroup:     _terGroup,
                stkGroup:     _stkGroup,
                log_zone_id:  selZone,
                log_zm_id:    selZBM,
                log_reg_id:   selRegion,
                log_rm_id:    selRSM,
                log_area_id:  selArea,
                log_asm_id:   selAMF,
                log_ter_id:   selTerritory,
                log_user_id:  selSrUser,
                log_stk_id:   selDistributor,
            };
            const res = await api.post("/getsec_sales_data", payload);
            setRawData(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.log("Load error", err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Filter dialog apply ──────────────────────────────────────────────────
    const handleApply = () => {
        setFiltersOpen(false);
        handleLoad();
    };

    // ─── zeroToNull helper ────────────────────────────────────────────────────
    const zeroToNull = (val) => (Number(val) === 0 ? "-" : val);

    // ─── Row action handlers ──────────────────────────────────────────────────
    const handleReject = (primaryId) => {
        showConfirmationDialog({
            title:        "Confirmation",
            message:      "Are you sure you want to Reject?",
            confirmText:  "OK",
            cancelText:   "Close",
            confirmColor: "primary",
            onConfirm: async () => {
                try {
                    setModifyLoading(true);
                    let response = await api.post("/reject_stk_sales", { primary_id: primaryId });
                    if (response.data.status === 200) toast.success(response.data.message);
                    else toast.error("Unable To Reject");
                    handleLoad();
                } catch (e) {
                    console.error(e);
                } finally {
                    setModifyLoading(false);
                    closeConfirmationDialog();
                }
            },
        });
    };

    const handleDelete = (row) => {
        const month      = dayjs(selMonth).format("YYYY-MM-01");
        const monthLabel = dayjs(selMonth).format("MMM YYYY");
        showConfirmationDialog({
            title:        "Confirmation",
            message:      `Are you sure want Delete Selected ${masterPanel["STKS"] || "Distributor"} stock & sales for ${monthLabel}?`,
            confirmText:  "Yes! Delete",
            cancelText:   "Cancel",
            confirmColor: "primary",
            onConfirm: async () => {
                try {
                    setModifyLoading(true);
                    await api.post("/deleteStkSales", { month, ids: row.stk_id });
                    toast.success("Deleted Succesfully");
                    handleLoad();
                } catch (e) {
                    console.error(e);
                    toast.error("Unable to Delete");
                } finally {
                    setModifyLoading(false);
                    closeConfirmationDialog();
                }
            },
        });
    };

    const handleDeleteAll = (row) => {
        showConfirmationDialog({
            title:        "Confirmation",
            message:      "Are you sure you want to delete this Product?",
            confirmText:  "OK",
            cancelText:   "Close",
            confirmColor: "primary",
            onConfirm: async () => {
                try {
                    setModifyLoading(true);
                    let response = await api.post("/dltAll", {
                        month:     dayjs(row.close_date).format("MMM YYYY"),
                        ids:       row.stk_id,
                        primaryId: row.primary_id,
                    });
                    if (response.data.status === 200) toast.success(response.data.message);
                    else toast.error("Unable To Delete");
                    handleLoad();
                } catch (e) {
                    console.error(e);
                } finally {
                    setModifyLoading(false);
                    closeConfirmationDialog();
                }
            },
        });
    };

    const handleProcessSecSales = () => {
        const selectedIds = Object.keys(checkedRows).filter((k) => checkedRows[k]);
        if (selectedIds.length === 0) {
            toast.error(`Select at least 1 ${masterPanel["STKS"] || "Distributor"} to Continue to Proceed!`);
            return;
        }
        showConfirmationDialog({
            title:        "Confirmation",
            message:      `Are you sure you want to Update Stock & Sales for Selected ${masterPanel["STKS"] || "Distributor"}?`,
            confirmText:  "Yes",
            cancelText:   "Cancel",
            confirmColor: "primary",
            onConfirm: async () => {
                try {
                    setModifyLoading(true);
                    let response = await api.post("/renderStkSales", {
                        month: dayjs(selMonth).format("YYYY-MM-01"),
                        ids:   selectedIds.join(","),
                    });
                    if (response.data.status === 200) toast.success(response.data.msg);
                    else toast.error("Unable to Update Stock & Sales");
                    handleLoad();
                } catch (e) {
                    console.error(e);
                    toast.error("Unable to Update Stock & Sales");
                } finally {
                    setModifyLoading(false);
                    closeConfirmationDialog();
                }
            },
        });
    };

    // ─── Checkbox helpers ─────────────────────────────────────────────────────
    const handleCheckAll = (checked) => {
        setCheckAll(checked);
        const next = {};
        if (checked) processableRows.forEach((r) => { next[r.stk_id] = true; });
        setCheckedRows(next);
    };

    const handleRowCheck = (stkId, checked) => {
        setCheckedRows((prev) => ({ ...prev, [stkId]: checked }));
    };

    // ─── Upload type icon renderer ────────────────────────────────────────────
    const renderUplTypeIcon = (uplType) => {
        if (uplType === 2)
            return (
                <Tooltip title="Website">
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                        <FaDesktop style={{ color: "#585757", fontSize: 15 }} />
                    </span>
                </Tooltip>
            );
        if (uplType === 1)
            return (
                <Tooltip title="App">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", mt: 1 }}>
                        <FaMobileAlt style={{ color: "#585757", fontSize: 15 }} />
                    </span>
                </Tooltip>
            );
        if (uplType === 3)
            return (
                <Tooltip title="Email">
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                        <FaEnvelope style={{ color: "#585757", fontSize: 15 }} />
                    </span>
                </Tooltip>
            );
        return null;
    };

    // ─── Star rating renderer ─────────────────────────────────────────────────
    const renderStarRating = (score, processStat) => {
        if (!score && processStat === 0) return null;
        const s    = Number(score);
        const star = (color, key) => (
            <FaStar key={key} style={{ color, fontSize: 9 }} title={`${s}%`} />
        );
        if (s >= 90) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(5)].map((_, i) => star("green",    i))}</Box>;
        if (s >= 75) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(4)].map((_, i) => star("#16d616",  i))}</Box>;
        if (s >= 60) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(3)].map((_, i) => star("#ebda16",  i))}</Box>;
        if (s >= 50) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[...Array(2)].map((_, i) => star("#f37a8f",  i))}</Box>;
        if (s >= 30) return <Box sx={{ display: "flex", gap: "1px", justifyContent: "center" }}>{[star("red", 0)]}</Box>;
        if (s < 30 && processStat !== 0)
            return <Box sx={{ display: "flex", justifyContent: "center" }}><FaThumbsDown style={{ color: "red", fontSize: 12 }} title={`${s}%`} /></Box>;
        return null;
    };

    // ─── Status cell renderer ─────────────────────────────────────────────────
    const renderStatusCell = (row) => {
        const s = row.process_stat;
        if (s === 1 && (row.prod_unmap_cnt > 0 || row.qty_map_cnt > 0))
            return <span style={{ color: "red",     fontSize: 11, textAlign: "center" }}>Pending</span>;
        if (s === 1 && row.prod_unmap_cnt === 0 && row.qty_map_cnt === 0)
            return <span style={{ color: "#0051ff", fontSize: 11, textAlign: "center" }}>Confirmation<br />Due</span>;
        if (s === 2) return <span style={{ color: "red",   fontSize: 11, textAlign: "center" }}>Rejected</span>;
        if (s === 3) return <span style={{ color: "green", fontSize: 11, textAlign: "center" }}>Approved</span>;
        if (s === 4) return <span style={{ color: "red",   fontSize: 11, textAlign: "center" }}>Pending</span>;
        return null;
    };

    // ─── Primary icon renderer ────────────────────────────────────────────────
    const renderPrimaryIcon = (priStat) => {
        if (priStat === 0) return <TbClockHour9 style={{ color: "#585757", fontSize: 14 }} />;
        if (priStat === 1) return <FaSpinner    style={{ color: "#585757", fontSize: 14 }} />;
        if (priStat === 2) return <FaThumbsUp   style={{ color: "#585757", fontSize: 14 }} />;
        return null;
    };

    // ─── Doc icon renderer ────────────────────────────────────────────────────
    const renderDocIcon = (fileType, docName) => {
        const handleClick = (e) => {
            e.stopPropagation();
            setPreviewFile({ docName, fileType });
        };
        if (fileType === 1)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaRegImage style={{ color: "green",   fontSize: 15 }} />
                </span>
            );
        if (fileType === 2)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaFilePdf  style={{ color: "#e90505", fontSize: 14 }} />
                </span>
            );
        if (fileType === 3)
            return (
                <span style={{ cursor: "pointer" }} onClick={(e) => { if (docName !== "") handleClick(e); }}>
                    <FaFileExcel style={{ color: "#2ba604", fontSize: 14 }} />
                </span>
            );
        return null;
    };

    // ─── Row style ────────────────────────────────────────────────────────────
    const rowStyle = (row) => {
        if (row._rowType === "grand_total")   return { "& td": { backgroundColor: "#d0cece !important", fontWeight: 700 } };
        if (row._rowType === "zone_subtotal") return { "& td": { backgroundColor: "#f0f0f0 !important", fontWeight: 600 } };
        if (row._rowType === "reg_subtotal")  return { "& td": { backgroundColor: "#e9e3e3 !important", fontWeight: 550 } };
        return {};
    };

    // ─── Build table rows with subtotals ──────────────────────────────────────
    // All group flags are computed INSIDE the memo from committedGroupChecks +
    // committedType so that rawData, flags, and subtotal logic are always in
    // sync within the same render — no stale-closure flicker.
    const tableData = useMemo(() => {
        if (!rawData.length) return [];

        // Compute flags fresh inside memo
        const _zoneGroup = committedType === 1 && committedGroupChecks.zone ? 1 : 0;
        const _regGroup  = committedType === 1 && committedGroupChecks.reg  ? 1 : 0;
        const _areaGroup = committedType === 1 && committedGroupChecks.area ? 1 : 0;
        const _terGroup  = committedType === 1 && committedGroupChecks.ter  ? 1 : 0;
        const _stkGroup  = committedGroupChecks.stk ? 1 : 0;

        const _showRegSub =
            selRegion === 0 && (
                (_areaGroup === 1 && _stkGroup === 0) ||
                (_terGroup  === 1 && _stkGroup === 0) ||
                _stkGroup === 1
            );

        const _showZoneSub =
            (_regGroup === 1 && _areaGroup === 0 && _terGroup === 0 && _stkGroup === 0) ||
            (_areaGroup === 1 && _stkGroup === 0) ||
            (_terGroup  === 1 && _stkGroup === 0) ||
            _stkGroup === 1;

        const rows = [];
        let i = 1;
        let prevZoneId = null, prevRegId = null;
        let zoneName = "", regName = "";

        let grandStk = 0, grandRecv = 0, grandProc = 0, grandUnproc = 0, grandRej = 0, grandPend = 0, grandRating = 0;
        let zoneStk  = 0, zoneRecv  = 0, zoneProc  = 0, zoneUnproc  = 0, zoneRej  = 0, zonePend  = 0, zoneRating  = 0;
        let regStk   = 0, regRecv   = 0, regProc   = 0, regUnproc   = 0, regRej   = 0, regPend   = 0, regRating   = 0;

        const flushReg = (name) => {
            rows.push({
                id:          `reg-sub-${name}-${rows.length}`,
                _rowType:    "reg_subtotal",
                _label:      `Total ${name}`,
                tot_stk:     regStk,   tot_recv:  regRecv,  tot_proc: regProc,
                tot_unproc:  regUnproc, tot_rej:  regRej,   tot_pend: regPend,
                _avg_rating: regStk > 0 ? Math.round(regRating / regStk) : 0,
            });
            regStk = regRecv = regProc = regUnproc = regRej = regPend = regRating = 0;
        };

        const flushZone = (name) => {
            rows.push({
                id:          `zone-sub-${name}-${rows.length}`,
                _rowType:    "zone_subtotal",
                _label:      `Total ${name}`,
                tot_stk:     zoneStk,   tot_recv:  zoneRecv,  tot_proc: zoneProc,
                tot_unproc:  zoneUnproc, tot_rej:  zoneRej,   tot_pend: zonePend,
                _avg_rating: zoneStk > 0 ? Math.round(zoneRating / zoneStk) : 0,
            });
            zoneStk = zoneRecv = zoneProc = zoneUnproc = zoneRej = zonePend = zoneRating = 0;
        };

        rawData.forEach((key) => {
            if (prevZoneId !== null) {
                if (_showRegSub  && prevRegId  !== key.reg_id)  flushReg(regName);
                if (_showZoneSub && prevZoneId !== key.zone_id) flushZone(zoneName);
            }

            rows.push({ ...key, id: `data-${key.stk_id ?? i}-${i}`, _rowType: "data", _sl: i });

            grandStk    += Number(key.tot_stk    || 0);
            grandRecv   += Number(key.tot_recv   || 0);
            grandProc   += Number(key.tot_proc   || 0);
            grandUnproc += Number(key.tot_unproc || 0);
            grandRej    += Number(key.tot_rej    || 0);
            grandPend   += Number(key.tot_pend   || 0);
            grandRating += Number(key.rate_score || 0);

            zoneStk    += Number(key.tot_stk    || 0);
            zoneRecv   += Number(key.tot_recv   || 0);
            zoneProc   += Number(key.tot_proc   || 0);
            zoneUnproc += Number(key.tot_unproc || 0);
            zoneRej    += Number(key.tot_rej    || 0);
            zonePend   += Number(key.tot_pend   || 0);
            zoneRating += Number(key.rate_score || 0);

            regStk    += Number(key.tot_stk    || 0);
            regRecv   += Number(key.tot_recv   || 0);
            regProc   += Number(key.tot_proc   || 0);
            regUnproc += Number(key.tot_unproc || 0);
            regRej    += Number(key.tot_rej    || 0);
            regPend   += Number(key.tot_pend   || 0);
            regRating += Number(key.rate_score || 0);

            prevZoneId = key.zone_id;
            prevRegId  = key.reg_id;
            zoneName   = key.zone_name;
            regName    = key.reg_name;
            i++;
        });

        if (_showRegSub)  flushReg(regName);
        if (_showZoneSub) flushZone(zoneName);

        rows.push({
            id:          "grand-total",
            _rowType:    "grand_total",
            _label:      "Grand Total",
            tot_stk:     grandStk,   tot_recv:  grandRecv,  tot_proc: grandProc,
            tot_unproc:  grandUnproc, tot_rej:  grandRej,   tot_pend: grandPend,
            _avg_rating: grandStk > 0 ? Math.round(grandRating / grandStk) : 0,
        });

        return rows;
    }, [rawData, committedType, committedGroupChecks, selRegion]);

    // ─── Rows eligible for "Process" checkbox ─────────────────────────────────
    const processableRows = useMemo(
        () => tableData.filter((r) => r._rowType === "data" && r.cl_stat === 0 && r.process_stat === 3),
        [tableData]
    );

    // ─── Dynamic grouping-level columns ───────────────────────────────────────
    const levelColumns = useMemo(() => {
        const cols = [];

        if (stkGroup === 1) {
            if (areaGroup === 1) {
                cols.push({
                    field: "area_name",
                    headerName: masterPanel["AREA"] || "Area",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.area_name}</Typography>;
                    },
                });
            }
            if (terGroup === 1) {
                cols.push({
                    field: "ter_name",
                    headerName: masterPanel["TERR"] || "Territory",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.ter_name}</Typography>;
                    },
                });
            }
        } else {
            if (zoneGroup === 1 && regGroup === 0 && areaGroup === 0 && terGroup === 0) {
                cols.push({
                    field: "zone_name",
                    headerName: masterPanel["ZONE"] || "Zone",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.zone_name}</Typography>;
                    },
                });
            }
            if (regGroup === 1 && areaGroup === 0 && terGroup === 0) {
                cols.push({
                    field: "reg_name",
                    headerName: masterPanel["REGN"] || "Region",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.reg_name}</Typography>;
                    },
                });
            }
            if (areaGroup === 1) {
                cols.push({
                    field: "area_name",
                    headerName: masterPanel["AREA"] || "Area",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.area_name}</Typography>;
                    },
                });
            }
            if (terGroup === 1) {
                cols.push({
                    field: "ter_name",
                    headerName: masterPanel["TERR"] || "Territory",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.ter_name}</Typography>;
                    },
                });
            }
        }

        return cols;
    }, [zoneGroup, regGroup, areaGroup, terGroup, stkGroup, masterPanel]);

    // ─── Columns ──────────────────────────────────────────────────────────────
    const columns = useMemo(() => {
        const cols = [
            {
                field: "_sl",
                headerName: "#",
                renderCell: ({ row }) => {
                    if (row._rowType !== "data") return null;
                    return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row._sl}</Typography>;
                },
            },
            ...levelColumns,
        ];

        if (stkGroup === 1) {
            cols.push(
                {
                    field: "close_date",
                    headerName: "Month",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return (
                            <Typography sx={{ textWrap: "nowrap", color: "#212121", fontSize: "11px" }}>
                                {row.close_date ? dayjs(row.close_date).format("MMM YYYY") : ""}
                            </Typography>
                        );
                    },
                },
                {
                    field: "stk_code",
                    headerName: "Code",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Typography sx={{ color: "#212121", fontSize: "11px" }}>{row.stk_code}</Typography>;
                    },
                },
                {
                    field: "stk_name",
                    headerName: `${masterPanel["STKS"] || "Distributor"} Name`,
                    renderCell: ({ row }) => {
                        if (row._rowType === "grand_total")
                            return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
                        if (row._rowType === "zone_subtotal")
                            return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", color: "#3a3a3a", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
                        if (row._rowType === "reg_subtotal")
                            return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", color: "#555", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
                        return (
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", whiteSpace: "nowrap", gap: 0.5 }}>
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
                    },
                }
            );
        } else {
            if (levelColumns.length === 0) {
                cols.push({
                    field: "_label",
                    headerName: "",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data") return null;
                        return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
                    },
                });
            } else {
                const lastIdx  = cols.length - 1;
                const original = cols[lastIdx].renderCell;
                cols[lastIdx]  = {
                    ...cols[lastIdx],
                    renderCell: (params) => {
                        const { row } = params;
                        if (row._rowType !== "data") {
                            return <strong style={{ display: "block", width: "100%", whiteSpace: "nowrap", fontSize: 11, textAlign: "right" }}>{row._label}</strong>;
                        }
                        return original(params);
                    },
                };
            }
        }

        cols.push(
            {
                field: "tot_stk",
                headerName: "Total",
                headerAlign: "right",
                renderCell: ({ row }) => {
                    if (row._rowType === "data")
                        return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_stk)}</Typography>;
                    return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_stk)}</strong>;
                },
            },
            {
                field: "tot_recv",
                headerName: "Received",
                headerAlign: "right",
                renderCell: ({ row }) => {
                    if (row._rowType === "data")
                        return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_recv)}</Typography>;
                    return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_recv)}</strong>;
                },
            }
        );

        if (stkGroup !== 1) {
            cols.push(
                {
                    field: "tot_proc",
                    headerName: "Processed",
                    headerAlign: "right",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data")
                            return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_proc)}</Typography>;
                        return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_proc)}</strong>;
                    },
                },
                {
                    field: "tot_unproc",
                    headerName: "Process Due",
                    headerAlign: "right",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data")
                            return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_unproc)}</Typography>;
                        return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_unproc)}</strong>;
                    },
                },
                {
                    field: "tot_rej",
                    headerName: "Rejected",
                    headerAlign: "right",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data")
                            return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_rej)}</Typography>;
                        return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_rej)}</strong>;
                    },
                },
                {
                    field: "tot_pend",
                    headerName: "Pending",
                    headerAlign: "right",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data")
                            return <Typography sx={{ textAlign: "right", width: "100%", color: "#212121", fontSize: "11px" }}>{zeroToNull(row.tot_pend)}</Typography>;
                        return <strong style={{ display: "block", width: "100%", textAlign: "right" }}>{zeroToNull(row.tot_pend)}</strong>;
                    },
                }
            );
        }

        if (stkGroup === 1) {
            cols.push(
                {
                    field: "process_stat",
                    headerName: "Status",
                    renderHeader: () => (
                        <Typography sx={{ textAlign: "center" }}>Status</Typography>
                    ),
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return (
                            <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: 0.3 }}>
                                {renderStatusCell(row)}
                                {Number(row.base_data_stat) === 1 &&
                                    row.process_stat !== 2 &&
                                    row.process_stat !== 3 && (
                                        <Tooltip title="Reject">
                                            <span style={{ cursor: "pointer", alignSelf: "end" }}>
                                                <FaMinusSquare
                                                    style={{ color: "white", border: "0.1px solid #ce2323", backgroundColor: "red", fontSize: 11, borderRadius: "2px" }}
                                                    onClick={() => handleReject(row.primary_id)}
                                                />
                                            </span>
                                        </Tooltip>
                                    )}
                            </Box>
                        );
                    },
                },
                {
                    field: "rate_score",
                    headerName: "Rating",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType === "data")
                            return renderStarRating(row.rate_score, row.process_stat);
                        if (row._avg_rating != null)
                            return <Box sx={{ textAlign: "center", width: "100%" }}><strong>{row._avg_rating}%</strong></Box>;
                        return null;
                    },
                },
                {
                    field: "err_desc",
                    headerName: "Errors",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        return <Box sx={{ textAlign: "center", width: "100%", textWrap: "nowrap", color: "#212121", fontSize: "11px" }}>{row.err_desc}</Box>;
                    },
                },
                {
                    field: "base_data_stat",
                    headerName: "Raw",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        const closeDate = row.close_date
                            ? dayjs(row.close_date).format("MMM YYYY")
                            : dayjs(selMonth).format("MMM YYYY");
                        const pstat = row.process_stat === 3 ? 1 : row.process_stat;

                        if (Number(row.base_data_stat) === 1) {
                            return (
                                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
                                    <Tooltip title="View Raw Data">
                                        <Box
                                            sx={{ cursor: "pointer" }}
                                            onClick={() =>
                                                navigate(
                                                    `/upload_closing/index/${btoa(1)}/${btoa(closeDate)}/${btoa(
                                                        `${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`
                                                    )}/${btoa(pstat)}/${btoa(1)}`
                                                )
                                            }
                                        >
                                            <FaDatabase style={{ color: "#6e6767", fontSize: 15 }} />
                                        </Box>
                                    </Tooltip>
                                    <Box>{renderDocIcon(row.file_type, row.doc_name)}</Box>
                                </Box>
                            );
                        }
                        if (Number(row.base_data_stat) !== 1 && row.process_stat === 0) {
                            return (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                    <Tooltip title="Upload Data">
                                        <a
                                            href={`/upload_closing/index/${btoa(1)}/${btoa(closeDate)}/${btoa(
                                                `${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`
                                            )}/${btoa(pstat)}/${btoa(1)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaPlus style={{ color: "green", fontSize: 15 }} />
                                        </a>
                                    </Tooltip>
                                </Box>
                            );
                        }
                        return null;
                    },
                },
                {
                    field: "proc_data_stat",
                    headerName: "Processed",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        if (row.proc_data_stat === 1) {
                            const closeDate = row.close_date
                                ? dayjs(row.close_date).format("MMM YYYY")
                                : dayjs(selMonth).format("MMM YYYY");
                            return (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                    <Tooltip title="View Processed Data">
                                        <a
                                            href={`/upload_closing/index/${btoa(1)}/${btoa(closeDate)}/${btoa(
                                                `${row.stk_id}|${row.stk_name}|${row.stk_code}|${row.ter_name}`
                                            )}/${btoa(row.process_stat)}/${btoa(2)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaRegFileAlt style={{ color: "#0614ee", fontSize: 15 }} />
                                        </a>
                                    </Tooltip>
                                </Box>
                            );
                        }
                        return null;
                    },
                },
                {
                    field: "pri_stat",
                    headerName: "Primary",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        if (row.pri_stat === 2) {
                            const closeDate = row.close_date
                                ? dayjs(row.close_date).format("MMM YYYY")
                                : dayjs(selMonth).format("MMM YYYY");
                            return (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                    <Tooltip title="View Primary Sale">
                                        <a
                                            href={`/reports/primary_sale_report/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(2)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {renderPrimaryIcon(row.pri_stat)}
                                        </a>
                                    </Tooltip>
                                </Box>
                            );
                        }
                        return (
                            <Box sx={{ display: "flex", justifyContent: "center" }}>
                                {renderPrimaryIcon(row.pri_stat)}
                            </Box>
                        );
                    },
                },
                {
                    field: "create_dt",
                    headerName: "Submission Date",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        if (!row.create_dt || row.create_dt === "1970-01-01") return "";
                        return <Typography sx={{ textAlign: "right", color: "#212121", fontSize: "11px" }}>{dayjs(row.create_dt).format("DD MMM YYYY")}</Typography>;
                    },
                },
                {
                    field: "_checkbox",
                    headerAlign: "center",
                    align: "center",
                    headerName: committedType === 1 ? (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <Checkbox
                                sx={{ p: 0 }}
                                size="small"
                                checked={checkAll}
                                onChange={(e) => handleCheckAll(e.target.checked)}
                            />
                            <Typography sx={{ fontSize: 12 }}>Check All</Typography>
                        </Box>
                    ) : <Typography>Stock &amp; Sales</Typography>,
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;

                        if (Number(row.cl_stat) === 0 && Number(row.process_stat) === 3 && stkGroup === 1) {
                            const closeDate = row.close_date
                                ? dayjs(row.close_date).format("MMM YYYY")
                                : dayjs(selMonth).format("MMM YYYY");
                            return (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, width: "100%", height: "100%" }}>
                                    <Tooltip title="Preview Stock & Sales">
                                        <Box
                                            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                                            onClick={() => navigate(
                                                `/reports/preview_stk_sales/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(`${row.stk_code}-${row.stk_name}`)}`
                                            )}
                                        >
                                            <FaBars style={{ color: "#585757", fontSize: 14 }} />
                                        </Box>
                                    </Tooltip>
                                    {committedType === 1 && (
                                        <Checkbox
                                            sx={{ p: 0, m: 0 }}
                                            size="small"
                                            checked={!!checkedRows[row.stk_id]}
                                            onChange={(e) => handleRowCheck(row.stk_id, e.target.checked)}
                                        />
                                    )}
                                </Box>
                            );
                        }
                        if (Number(row.cl_stat) === 1) {
                            const closeDate = row.close_date
                                ? dayjs(row.close_date).format("MMM YYYY")
                                : dayjs(selMonth).format("MMM YYYY");
                            return (
                                <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", justifyContent: "center" }}>
                                    {committedType === 1 && (
                                        <Tooltip title="Delete Stock & Sales">
                                            <span style={{ cursor: "pointer" }}>
                                                <IoTrashSharp
                                                    style={{ color: "#e90505", fontSize: 18 }}
                                                    onClick={() => handleDelete(row)}
                                                />
                                            </span>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="View Stock & Sales">
                                        <a
                                            href={`/input/stock_sales/${btoa(closeDate)}/${btoa(row.stk_id)}/${btoa(1)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FaRegFileAlt style={{ color: "#0614ee", fontSize: 15 }} />
                                        </a>
                                    </Tooltip>
                                </Box>
                            );
                        }
                        return null;
                    },
                },
                {
                    field: "_delete_all",
                    headerName: "Delete All",
                    headerAlign: "center",
                    align: "center",
                    renderCell: ({ row }) => {
                        if (row._rowType !== "data") return null;
                        if (Number(row.base_data_stat) === 1) {
                            return (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                    <Tooltip title="Delete All">
                                        <span style={{ cursor: "pointer" }}>
                                            <IoTrashSharp
                                                style={{ color: "#e90505", fontSize: 18 }}
                                                onClick={() => handleDeleteAll(row)}
                                            />
                                        </span>
                                    </Tooltip>
                                </Box>
                            );
                        }
                        return null;
                    },
                }
            );
        }

        return cols;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelColumns, stkGroup, zoneGroup, regGroup, areaGroup, terGroup, checkAll, checkedRows, committedType, selMonth, masterPanel]);

    // ─── Show "Process" button only when eligible rows exist ──────────────────
    const showProcessButton = processableRows.length > 0 && stkGroup === 1 && committedType === 1;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Layout breadcrumb={[
            { label: "Home",                 path: "/" },
            { label: "Transactions",         path: location.pathname },
            { label: "Data Submission Status", path: location.pathname },
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>

                <Box>
                    <h2>STOCK &amp; SALES DATA STATUS</h2>
                </Box>

                {/* Filter bar */}
                <Box sx={{ backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)", padding: "16px 18px", borderRadius: "10px" }}>
                    <Grid container spacing={0.95} alignItems="flex-end">

                        <Grid size={{ xs: 12, md: 3, lg: 1.8 }}>
                            <FormControl fullWidth>
                                <InputLabel id="type">Type</InputLabel>
                                <Select
                                    labelId="type"
                                    value={type}
                                    label="Type"
                                    size="small"
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        setType(newType);
                                        if (newType === 2) {
                                            setGroupChecks((prev) => ({ ...prev, zone: false, reg: false, area: false, ter: false }));
                                        } else if (newType === 1) {
                                            setGroupChecks((prev) => ({ ...prev, zone: true, reg: true }));
                                        }
                                    }}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                >
                                    <MenuItem value={1}>By Closing Month</MenuItem>
                                    <MenuItem value={2}>By Submission Month</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3, lg: 1.8 }}>
                            <FormControl fullWidth>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Month"
                                        views={["month", "year"]}
                                        format="MMM YYYY"
                                        value={selMonth}
                                        onChange={(v) => setSelMonth(v)}
                                        slotProps={{ textField: { size: "small", className: "date-input" } }}
                                        maxDate={dayjs()}
                                    />
                                </LocalizationProvider>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3, lg: 1.8 }}>
                            <FormControl fullWidth>
                                <InputLabel id="status">Status</InputLabel>
                                <Select
                                    labelId="status"
                                    value={status}
                                    label="Status"
                                    size="small"
                                    onChange={(e) => setStatus(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                >
                                    <MenuItem value={0}>All</MenuItem>
                                    <MenuItem value={1}>Received</MenuItem>
                                    <MenuItem value={2}>Not Received</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 3, lg: 1.8 }}>
                            <GroupByDropdown groupChecks={groupChecks} onChange={setGroupChecks} typeId={type} masterPanel={masterPanel} />
                        </Grid>

                        <Grid size={{ xs: 4, md: 1.5, lg: 0.9 }}>
                            <Box sx={{ position: "relative", height: "2.5rem", mt: { xs: 2, sm: 2 } }}>
                                <Button
                                    sx={{ backgroundColor: "white", width: "1rem", height: "2.6rem" }}
                                    variant="contained"
                                    onClick={() => setFiltersOpen(true)}
                                >
                                    <FaFilter color="#5bc0de" size={17} />
                                </Button>
                                <Typography sx={{ fontSize: "9px", color: "#0000FF", mt: 0.3, pl: 0.5, lineHeight: 1.2, width: "35rem" }}>
                                    {[
                                        getLabel(allZone,        selZone,        "zone_name") !== "All" ? `${masterPanel["ZONE"] || "Zone"}:${getLabel(allZone, selZone, "zone_name")}`                                            : null,
                                        getLabel(allRegion,      selRegion,      "reg_name")  !== "All" ? `${masterPanel["REGN"] || "Region"}:${getLabel(allRegion, selRegion, "reg_name")}`                                       : null,
                                        getLabel(allArea,        selArea,        "area_name") !== "All" ? `${masterPanel["AREA"] || "Area"}:${getLabel(allArea, selArea, "area_name")}`                                            : null,
                                        getLabel(allTerritory,   selTerritory,   "ter_name")  !== "All" ? `${masterPanel["TERR"] || "Territory"}:${getLabel(allTerritory, selTerritory, "ter_name")}`                              : null,
                                        getLabel(allZBM,         selZBM,         "user_name") !== "All" ? `ZBM:${getLabel(allZBM, selZBM, "user_name")}`                                               : null,
                                        getLabel(allRSM,         selRSM,         "user_name") !== "All" ? `RSM:${getLabel(allRSM, selRSM, "user_name")}`                                               : null,
                                        getLabel(allAMF,         selAMF,         "user_name") !== "All" ? `AM/FSO:${getLabel(allAMF, selAMF, "user_name")}`                                           : null,
                                        getLabel(allSrUser,      selSrUser,      "user_name") !== "All" ? `SR:${getLabel(allSrUser, selSrUser, "user_name")}`                                          : null,
                                        getLabel(allDistributor, selDistributor, (v) => `${v.stk_code}-${v.stk_name}`) !== "All"
                                            ? `${masterPanel["STKS"] || "Distributor"}:${getLabel(allDistributor, selDistributor, (v) => `${v.stk_code}-${v.stk_name}`)}`
                                            : null,
                                    ].filter(Boolean).join(", ") || "\u00A0"}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2, lg: 0.9 }} sx={{ mt: { xs: 2, sm: 2 } }}>
                            <Button variant="contained" sx={{ textTransform: "none" }} onClick={handleLoad} disabled={loading}>
                                {loading ? "Loading..." : "Load"}
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2, lg: 1.8 }}>
                            <Button sx={{ textTransform: "none" }} onClick={() => navigate("/reports/email_process_data")} variant="contained">
                                Email Unprocess Data
                            </Button>
                        </Grid>

                        <Grid size={{ xs: 4, md: 2, lg: 0.5 }}>
                            <Box sx={{ mb: "-0.3rem" }}>
                                {progress
                                    ? <CircularProgressLoading progress={progress} />
                                    : (
                                        <span onClick={handleExcelExport} style={{ cursor: tableData.length === 0 ? "not-allowed" : "pointer" }}>
                                            <AiOutlineFileExcel style={{ color: "green", height: "30px", width: "30px" }} />
                                        </span>
                                    )
                                }
                            </Box>
                        </Grid>

                    </Grid>
                </Box>

                {/* Data Table */}
                <Box sx={{ background: "#fff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)", "& td": { padding: "4px 6px" } }}>
                    <DataTable
                        data={tableData}
                        columns={columns}
                        loading={loading}
                        pagination={false}
                        showHeader={true}
                        rowStyle={rowStyle}
                        headerLegend={
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
                        }
                    />
                </Box>

                {showProcessButton && (
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                        <Button variant="contained" onClick={handleProcessSecSales}>
                            Process Stock &amp; Sales
                        </Button>
                    </Box>
                )}

            </Box>

            {/* Filters dialog */}
            <Dialog
                open={filtersOpen}
                aria-labelledby="filters-dialog"
                PaperProps={{ sx: { width: { lg: "600px", md: "550px", sm: "450px" }, position: "absolute", top: 10, borderRadius: 1 } }}
            >
                <DialogTitle>
                    <Typography sx={{ fontSize: "1.2rem" }}>Filters</Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setFiltersOpen(false)}
                        sx={{ position: "absolute", right: 8, top: 8, color: (t) => t.palette.grey[500] }}
                    >
                        <CloseIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Grid container spacing={0.95}>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="zone">{masterPanel["ZONE"] || "Zone"}</InputLabel>
                                <Select labelId="zone" label={masterPanel["ZONE"] || "Zone"} size="small" fullWidth value={selZone}
                                    onChange={(e) => setSelZone(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allZone.map((v) => <MenuItem key={v.id} value={v.id}>{v.zone_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="region">{masterPanel["REGN"] || "Region"}</InputLabel>
                                <Select labelId="region" label={masterPanel["REGN"] || "Region"} size="small" value={selRegion}
                                    onChange={(e) => setSelRegion(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allRegion.map((v) => <MenuItem key={v.id} value={v.id}>{v.reg_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="area">{masterPanel["AREA"] || "Area"}</InputLabel>
                                <Select labelId="area" label={masterPanel["AREA"] || "Area"} size="small" value={selArea}
                                    onChange={(e) => setSelArea(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allArea.map((v) => <MenuItem key={v.id} value={v.id}>{v.area_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="territory">{masterPanel["TERR"] || "Territory"}</InputLabel>
                                <Select labelId="territory" label={masterPanel["TERR"] || "Territory"} size="small" value={selTerritory}
                                    onChange={(e) => setSelTerritory(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allTerritory.map((v) => <MenuItem key={v.id} value={v.id}>{v.ter_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="zbm">ZBM</InputLabel>
                                <Select labelId="zbm" label="ZBM" size="small" value={selZBM}
                                    onChange={(e) => setSelZBM(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allZBM.map((v) => <MenuItem key={v.id} value={v.id}>{v.user_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="rsm">RSM</InputLabel>
                                <Select labelId="rsm" label="RSM" size="small" value={selRSM}
                                    onChange={(e) => setSelRSM(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allRSM.map((v) => <MenuItem key={v.id} value={v.id}>{v.user_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="amf">AMF</InputLabel>
                                <Select labelId="amf" label="AMF" size="small" value={selAMF}
                                    onChange={(e) => setSelAMF(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allAMF.map((v) => <MenuItem key={v.id} value={v.id}>{v.user_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="sr-user">SR User</InputLabel>
                                <Select labelId="sr-user" label="SR User" size="small" value={selSrUser}
                                    onChange={(e) => setSelSrUser(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allSrUser.map((v) => <MenuItem key={v.id} value={v.id}>{v.user_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                            <FormControl sx={{ width: "100%" }}>
                                <InputLabel id="distributor">{masterPanel["STKS"] || "Distributor"}</InputLabel>
                                <Select labelId="distributor" label={masterPanel["STKS"] || "Distributor"} size="small" value={selDistributor}
                                    onChange={(e) => setSelDistributor(e.target.value)}
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}>
                                    <MenuItem value={0}>All</MenuItem>
                                    {allDistributor.map((v) => (
                                        <MenuItem key={v.id} value={v.id}>{v.stk_code} - {v.stk_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" sx={{ textTransform: "none" }} onClick={handleApply}>
                        Apply Filters
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ textTransform: "none" }}
                        color="success"
                        onClick={async () => {
                            setSelZone(0); setSelZBM(0); setSelRegion(0); setSelRSM(0);
                            setSelArea(0); setSelAMF(0); setSelTerritory(0); setSelSrUser(0); setSelDistributor(0);
                            setAllZBM([]); setAllRegion([]); setAllRSM([]); setAllArea([]);
                            setAllAMF([]); setAllTerritory([]); setAllSRUser([]); setAllDistributor([]);
                            setFiltersOpen(false);
                            setLoading(true);
                            setCheckedRows({});
                            setCheckAll(false);

                            // Commit current type + group before reset load
                            setCommittedType(type);
                            setCommittedGroupChecks(groupChecks);

                            // Compute fresh flags from live state
                            const _zoneGroup = type === 1 && groupChecks.zone ? 1 : 0;
                            const _regGroup  = type === 1 && groupChecks.reg  ? 1 : 0;
                            const _areaGroup = type === 1 && groupChecks.area ? 1 : 0;
                            const _terGroup  = type === 1 && groupChecks.ter  ? 1 : 0;
                            const _stkGroup  = groupChecks.stk ? 1 : 0;

                            try {
                                const res = await api.post("/getsec_sales_data", {
                                    month:       dayjs(selMonth).format("YYYY-MM-01"),
                                    type_id:     type,
                                    stat:        status,
                                    zoneGroup:   _zoneGroup,
                                    regGroup:    _regGroup,
                                    areaGroup:   _areaGroup,
                                    terGroup:    _terGroup,
                                    stkGroup:    _stkGroup,
                                    log_zone_id: 0,
                                    log_zm_id:   0,
                                    log_reg_id:  0,
                                    log_rm_id:   0,
                                    log_area_id: 0,
                                    log_asm_id:  0,
                                    log_ter_id:  0,
                                    log_user_id: 0,
                                    log_stk_id:  0,
                                });
                                setRawData(Array.isArray(res.data.data) ? res.data.data : []);
                            } catch (err) {
                                console.log("Load error", err);
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Reset
                    </Button>
                    <Button variant="contained" sx={{ textTransform: "none" }} color="error" onClick={() => setFiltersOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={modifyLoading}
                confirmColor={confirmationDialog.confirmColor}
            />

            <FilePreviewModal
                file={previewFile}
                onClose={() => setPreviewFile(null)}
            />

        </Layout>
    );
}

export default DataSubmissionStatus;