import { useEffect, useState } from "react";
import Layout from "../layout";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import { Box, Button, FormControl, IconButton, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { Download } from "../utils/downloadExcel/Download";
import useToast from "../utils/useToast";
import { MdOutlineLoop } from "react-icons/md";
import ConfirmationDialog from "../utils/confirmDialog";
import { getMasterPanel } from "../services/masterPanelService";


function KPIReport() {
    const [selMonth, setSelMonth] = useState(dayjs());
    const [zoneData, setZoneData] = useState([]);
    const [expanded, setExpanded] = useState(new Set());
    const [allKpiReportData, setAllKpiReportData] = useState([])
    const [progress, setProgress] = useState(null);
    const [modifyLoading, setModifyLoading] = useState(false)
    const [reportMonth, setReportMonth] = useState(dayjs());
    const toast = useToast()
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    const [masterPanel, setMasterPanel] = useState({});

    // labels derived from masterPanel with fallbacks
    const areaLabel = masterPanel["AREA"] || "Area";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const HCOLOR = {
        backgroundColor: "#d0e8f5",
        color: "#0047ab",
        fontWeight: 600,
        display: "block",
        width: "100%",
        textAlign: "center",
        padding: "2px 0",
        margin: "0px !important",
        borderRadius: "3px",
    };


    const fetchKpiReport = async () => {
        try {
            const response = await api.post("/getCapabilityReport", { month: selMonth });
            const raw = Array.isArray(response.data.data) ? response.data.data : [];
            setZoneData(buildZoneData(raw));
            setExpanded(new Set());
            setAllKpiReportData(raw)
            setReportMonth(selMonth)
        } catch (err) {
            console.error(err);
        }
    };


    const toggleZone = (zoneId) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(zoneId) ? next.delete(zoneId) : next.add(zoneId);
            return next;
        });
    };

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `Confirm Render`,
            message: `Are you sure to Render Data for ${selMonth.format("MMM YYYY")} month?`,
            confirmText: 'Yes',
            confirmColor: "primary",
            onConfirm: () => handleRender()
        })
    }

    const buildZoneData = (rows) => {
        const map = new Map();
        rows.forEach((r) => {
            if (!map.has(r.zone_id))
                map.set(r.zone_id, { zone_id: r.zone_id, zone_name: r.zone_name, reps: [] });
            map.get(r.zone_id).reps.push(r);
        });

        const zones = [];
        map.forEach(({ zone_id, zone_name, reps }) => {
            let call_dy_tgt = 0, mtd_tot_call = 0, prod_dy_tgt = 0, mtd_tot_pc = 0,
                visible_dy_tgt = 0, mtd_visible_cnt = 0, tot_cus = 0, eco_no = 0,
                exp_sec_val = 0, exp_pri_val = 0, sec_val = 0, pri_val = 0,
                tot_tgt = 0, sec_diff = 0, pri_diff = 0,
                total_calls = 0, total_repeated = 0, field_days = 0;

            reps.forEach((r) => {
                call_dy_tgt += Number(r.call_dy_tgt) || 0;
                mtd_tot_call += Number(r.mtd_tot_call) || 0;
                prod_dy_tgt += Number(r.prod_dy_tgt) || 0;
                mtd_tot_pc += Number(r.mtd_tot_pc) || 0;
                visible_dy_tgt += Number(r.visible_dy_tgt) || 0;
                mtd_visible_cnt += Number(r.mtd_visible_cnt) || 0;
                tot_cus += Number(r.tot_cus) || 0;
                eco_no += Number(r.eco_no) || 0;
                exp_sec_val += Number(r.exp_sec_val) || 0;
                exp_pri_val += Number(r.exp_pri_val) || 0;
                sec_val += Number(r.sec_val) || 0;
                pri_val += Number(r.pri_val) || 0;
                tot_tgt += Number(r.sale_tgt) || 0;
                sec_diff += Number(r.sec_diff) || 0;
                pri_diff += Number(r.pri_diff) || 0;
                total_calls += Number(r.tot_call) || 0;
                total_repeated += Number(r.repeated) || 0;
                field_days += Number(r.tot_field_day) || 0;
            });

            const coverage_per = call_dy_tgt > 0 ? (mtd_tot_call / call_dy_tgt) * 100 : 0;
            const prod_per = prod_dy_tgt > 0 ? (mtd_tot_pc / prod_dy_tgt) * 100 : 0;
            const visible_per = visible_dy_tgt > 0 ? (mtd_visible_cnt / visible_dy_tgt) * 100 : 0;
            const cap_index = ((coverage_per * 40) + (prod_per * 40) + (visible_per * 20)) / 100;
            const num_dist_per = tot_cus > 0 ? (eco_no / tot_cus) * 100 : 0;
            const pot_diff = 1 + ((cap_index % 100) - 1) * 0.5;
            const exe_tier = cap_index >= 90 ? "Strategic" : cap_index >= 80 ? "Predictive" : "Reactive";

            zones.push({
                zoneRow: {
                    id: `zone-${zone_id}`,
                    _rowType: "zone",          // explicit — never overridden
                    _zoneId: zone_id,
                    _name: `Total ${zone_name}`,
                    area_name: "",
                    sale_tgt: tot_tgt, tot_cus,
                    tot_call: total_calls, eco_no,
                    repeated: total_repeated, num_dist_per,
                    tot_field_day: field_days,
                    call_dy_tgt, mtd_tot_call, coverage_per,
                    prod_dy_tgt, mtd_tot_pc, prod_per,
                    visible_dy_tgt, mtd_visible_cnt, visible_per,
                    train_stat: "Y",
                    cap_index, exe_tier, p_mult: pot_diff,
                    exp_sec_val, exp_pri_val,
                    sec_val, pri_val,
                    sec_diff, pri_diff,
                },
                // _rowType: "rep" placed AFTER the spread so API data can never override it
                repRows: reps.map((r, i) => ({
                    ...r,
                    id: `rep-${zone_id}-${r.user_id ?? i}`,
                    _rowType: "rep",           // after spread — cannot be overridden by r
                    _zoneId: zone_id,
                    _name: r.full_name,
                })),
            });
        });

        return zones;
    }

    const fmt = (val) => (!val || Number(val) === 0 ? "-" : val);
    const fmtF = (val) => (!val || Number(val) === 0 ? "-" : Number(val).toFixed(2));
    const zeroToNullRound = (n) => {
        if (n == 0 || n == null || n === '') return '-';
        return Math.round(Number(n));
    };

    const tierStyle = (tier) => {
        if (tier === "Strategic") return { color: "darkgreen", fontWeight: 500 };
        if (tier === "Predictive") return { color: "blue", fontWeight: 500 };
        return { color: "orange", fontWeight: 500 };
    };

    // Static columns with no state dependency
    const STATIC_COLUMNS = [
        {
            field: "_name",
            headerName: "",
            subColumns: [{
                field: '_name', headerName: ' ', renderCell: ({ value, row }) =>
                    row._rowType === "zone" ? (
                        <Box sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: 13 }}>{value}</Box>
                    ) : (
                        <Box >
                            <Box sx={{ fontWeight: 500, fontSize: 12, textWrap: 'nowrap' }}>{row.full_name}</Box>
                            <Box sx={{ fontSize: 9, color: "grey" }}>HQ: {row.hq_name}</Box>
                        </Box>
                    )
            },
            {
                field: 'area_name', headerName: '', renderCell: ({ value, row }) =>
                    row._rowType === "zone" ? "" : (
                        <Typography sx={{ fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>
                            {value || "-"}
                        </Typography>
                    ),
            },],

        },
        { field: "sale_tgt", headerName: `${dayjs(reportMonth).format('MMM YYYY')}-Tgt`, renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "tot_cus", headerName: "Total Outlets", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "tot_call", headerName: "Total Calls", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "eco_no", headerName: "Total Outlets Visited", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "repeated", headerName: "Total Outlets Repeated", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "num_dist_per", width: 30, headerName: "Numeric Distribution %", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }} >{fmtF(value)}</Box> },
        { field: "tot_field_day", headerName: "Field Days", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "call_dy_tgt", headerName: "Calls/Day Target", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "mtd_tot_call", headerName: "Actual", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "coverage_per", headerName: "Coverage %", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }}>{fmtF(value)}</Box> },
        { field: "prod_dy_tgt", headerName: "Productivity Tgt", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "mtd_tot_pc", headerName: "Actual", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "prod_per", headerName: "Productivity %", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }}>{fmtF(value)}</Box> },
        { field: "unq_mtd_pc_call", headerName: "Unique Productive Calls", renderCell: ({ value }) => <Box>{zeroToNullRound(value)}</Box> },
        { field: "unq_prod_per", headerName: "Unique Productivity %", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }}>{fmtF(value)}</Box> },
        { field: "tot_prod_call", headerName: "Productive Calls", renderCell: ({ value }) => <Box>{zeroToNullRound(value)}</Box> },
        { field: "lpc_cnt", headerName: "Total LPC", renderCell: ({ value }) => <Box>{zeroToNullRound(value)}</Box> },
        { field: "lpc_per", headerName: "Avg. LPC", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }}>{fmtF(value)}</Box> },
        { field: "visible_dy_tgt", headerName: "Visibility Tgt", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "mtd_visible_cnt", headerName: "Actual", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "visible_per", headerName: "Visibility %", renderCell: ({ value }) => <Box sx={{ textAlign: 'center', fontWeight: 600 }}>{fmtF(value)}</Box> },
        { field: "train_stat", headerName: "Training Done (Y/N)", renderCell: ({ value }) => value || "-" },
        { field: "cap_index", headerName: "Capability Index %", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmtF(value)}</Typography> },
        { field: "exe_tier", headerName: "Execution Tier", renderCell: ({ value }) => <Box sx={tierStyle(value)}>{value || "-"}</Box> },
        { field: "p_mult", headerName: "Potential Multiplier", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{value ? `${Number(value).toFixed(2)}%` : "-"}</Typography> },
        { field: "exp_sec_val", headerName: "Expected Secondary", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "exp_pri_val", headerName: "Expected Primary", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "sec_val", headerName: "Actual Secondary", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "pri_val", headerName: "Actual Primary", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "sec_diff", headerName: "Secondary Difference", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
        { field: "pri_diff", headerName: "Primary Difference", renderCell: ({ value }) => <Typography sx={{ textAlign: 'right' }}>{fmt(value)}</Typography> },
    ];



    // Built inside component so renderCell closes over live `expanded` state
    const COLUMNS = [
        ...STATIC_COLUMNS,
        {
            field: "_expand",
            headerName: "",
            width: 50,
            sortable: false,
            renderCell: ({ row }) => {
                if (row._rowType !== "zone") return null;
                const isOpen = expanded.has(row._zoneId);
                return (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleZone(row._zoneId);
                        }}
                        sx={{ color: "#2e7d32", p: 0.5 }}
                    >
                        {isOpen
                            ? <FaMinus sx={{ fontSize: 22 }} />
                            : <FaPlus sx={{ fontSize: 22 }} />
                        }
                    </IconButton>
                );
            },
        },
    ];

    const excelColumns = [
        { field: 'full_name', headerName: 'Sales Rep' },
        { field: 'hq_name', headerName: 'HQ' },
        { field: 'area_name', headerName: areaLabel },
        { field: 'sale_tgt', headerName: `${dayjs(reportMonth).format('MMM YYYY')}-TGT` },
        { field: "tot_cus", headerName: "Total Outlets" },
        { field: "tot_call", headerName: "Total Calls" },
        { field: "eco_no", headerName: "Total Outlets Visited" },
        { field: "repeated", headerName: "Total Outlets Repeated" },
        { field: "num_dist_per", headerName: "Numeric Distribution %" },
        { field: "tot_field_day", headerName: "Field Days" },
        { field: "call_dy_tgt", headerName: "Calls/Day Target" },
        { field: "mtd_tot_call", headerName: "Actual " },
        { field: "coverage_per", headerName: "Coverage %" },
        { field: "prod_dy_tgt", headerName: "Productivity Tgt" },
        { field: "mtd_tot_pc", headerName: "Actual" },
        { field: "prod_per", headerName: "Productivity %" },
        { field: "unq_mtd_pc_call", headerName: "Unique Productive Calls" },
        { field: "unq_prod_per", headerName: "Unique Productivity %" },
        { field: "tot_prod_call", headerName: "Productive Calls" },
        { field: "lpc_cnt", headerName: "Total LPC" },
        { field: "lpc_per", headerName: "Avg. LPC" },
        { field: "visible_dy_tgt", headerName: "Visibility Tgt" },
        { field: "mtd_visible_cnt", headerName: "Actual" },
        { field: "visible_per", headerName: "Visibility %" },
        { field: "train_stat", headerName: "Training Done (Y/N)" },
        { field: "cap_index", headerName: "Capability Index %" },
        { field: "exe_tier", headerName: "Execution Tier" },
        { field: "p_mult", headerName: "Potential Multiplier" },
        { field: "exp_sec_val", headerName: "Expected Secondary" },
        { field: "exp_pri_val", headerName: "Expected Primary" },
        { field: "sec_val", headerName: "Actual Secondary" },
        { field: "pri_val", headerName: "Actual Primary" },
        { field: "sec_diff", headerName: "Secondary Difference" },
        { field: "pri_diff", headerName: "Primary Difference" },
    ];

    // ── Build flat row list — zone row first, then rep rows if expanded ────────
    // Use a plain index-based loop instead of flatMap to guarantee ordering
    // and avoid any key-collision issues across zones.
    const tableData = [];
    zoneData.forEach(({ zoneRow, repRows }) => {
        const isOpen = expanded.has(zoneRow._zoneId);
        // Always push the zone summary row
        tableData.push({ ...zoneRow, _expanded: isOpen });
        // Only push rep rows when this zone is expanded
        if (isOpen) {
            repRows.forEach((rep) => tableData.push(rep));
        }
    });

    const handleDownloadExcel = () => {
        try {
            const safe = (val) => (!val || Number(val) === 0 ? "-" : val);
            const safeF = (val) => (!val || Number(val) === 0 ? "-" : Number(val).toFixed(2));
            const safeRound = (val) => (!val || Number(val) === 0 ? "-" : Math.round(Number(val)))
            const allRows = [];
            zoneData.forEach(({ zoneRow, repRows }) => {
                repRows.forEach((rep) => allRows.push(rep));
                allRows.push(zoneRow);

            });

            const excelData = allRows.map((row) => ({
                full_name: row._rowType === "zone" ? row._name : (row.full_name || "-"),
                hq_name: row._rowType === "zone" ? "" : (row.hq_name || "-"),
                area_name: row._rowType === "zone" ? "" : (row.area_name || "-"),
                sale_tgt: safe(row.sale_tgt),
                tot_cus: safe(row.tot_cus),
                tot_call: safe(row.tot_call),
                eco_no: safe(row.eco_no),
                repeated: safe(row.repeated),
                num_dist_per: safeF(row.num_dist_per),
                tot_field_day: safe(row.tot_field_day),
                call_dy_tgt: safe(row.call_dy_tgt),
                mtd_tot_call: safeF(row.mtd_tot_call),
                coverage_per: safeF(row.coverage_per),
                prod_dy_tgt: safeF(row.prod_dy_tgt),
                mtd_tot_pc: safeF(row.mtd_tot_pc),
                prod_per: safeF(row.prod_per),
                unq_mtd_pc_call: safeRound(row.unq_mtd_pc_call),
                unq_prod_per: safeF(row.unq_prod_per),
                tot_prod_call: safeRound(row.tot_prod_call),
                lpc_cnt: safeRound(row.lpc_cnt),
                lpc_per: safeF(row.lpc_per),
                visible_dy_tgt: safeF(row.visible_dy_tgt),
                mtd_visible_cnt: safeF(row.mtd_visible_cnt),
                visible_per: safeF(row.visible_per),
                train_stat: row.train_stat || "-",
                cap_index: safeF(row.cap_index),
                exe_tier: row.exe_tier || "-",
                p_mult: row.p_mult ? `${Number(row.p_mult).toFixed(2)}%` : "-",
                exp_sec_val: safe(row.exp_sec_val),
                exp_pri_val: safe(row.exp_pri_val),
                sec_val: safe(row.sec_val),
                pri_val: safe(row.pri_val),
                sec_diff: safe(row.sec_diff),
                pri_diff: safe(row.pri_diff),
                _iszone: row._rowType === "zone"
            }));

            console.log("Zone rows in Excel:", excelData.filter(r => r._iszone))

            const fileName = `KPI_Report_${dayjs(selMonth).format('MMM YYYY')}`;
            const dynamicTitle = `KPI Report - ${dayjs(selMonth).format('MMM YYYY')}`;

            Download(
                excelData,
                excelColumns,
                fileName,
                setProgress,
                toast,
                'KPI_Report',
                {
                    titleRow1: dynamicTitle,
                    // ✅ Pass highlight columns by their headerName
                    highlightHeaders: [
                        "Numeric Distribution %",
                        "Actual ",
                        "Productivity Tgt",
                        "Productivity %",
                    ],
                    zoneRowColor: "d0e8f5",
                }
            );
        } catch (err) {
            console.log("Excel Export Error", err);
        }
    };

    const handleRender = async () => {
        try {
            setModifyLoading(true)
            let payload = {
                month: selMonth
            }
            console.log("payload for Render", payload)
            let response = await api.post("/renderCap", payload)
            if (response.data.status === 200) {
                toast.success("Rendered Successfuly")
            }
            else {
                toast.warning("Unable to Render")
            }

        }
        catch (err) {
            console.log("rendering month error", err)
            toast.warning("Unable to Render")
        }
        finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: "/reports/capability_report" },
            { label: "KPI Report", path: "/reports/capability_report" }
        ]}>
            <Box p={0.5}>
                <Box p={2} display="flex" flexDirection="column" gap={2}>
                    <h1 className="mainTitle">KPI Report</h1>
                    <Box sx={{
                        display: "flex", gap: 1.5, flexWrap: "wrap",
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px", borderRadius: "10px",
                        alignItems: "center",
                        justifyContent: "space-between",  // ✅ pushes render to end
                    }}>
                        {/* Left side controls */}
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                            <FormControl>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Month"
                                        views={["month", "year"]}
                                        format="MMM YYYY"
                                        value={selMonth}
                                        onChange={(v) => setSelMonth(v)}
                                        slotProps={{
                                            textField: {
                                                sx: { minWidth: 90, maxWidth: 220 },
                                                size: "small",
                                                className: "date-input",
                                            },
                                        }}
                                        maxDate={dayjs()}
                                    />
                                </LocalizationProvider>
                            </FormControl>
                            <Button variant="contained" onClick={fetchKpiReport}>Load</Button>
                            <Button onClick={() => handleDownloadExcel()} color="warning" variant="contained">Excel</Button>
                        </Box>


                        <Button color="warning" variant="contained" onClick={() => showSubmitConfirmation()}>
                            <MdOutlineLoop size={15} /> Render
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ p: 1.5 }}>
                    <DataTable
                        data={tableData}
                        columns={COLUMNS}
                        searchable={false}
                        showHeader={true}
                        hideSubHeader
                        columnBgColors={{
                            "num_dist_per": "#d0e8f5",
                            "coverage_per": "#d0e8f5",
                            "prod_per": "#d0e8f5",
                            "unq_prod_per": "#d0e8f5",
                            "lpc_per": "#d0e8f5",
                            "visible_per": "#d0e8f5",

                        }}
                        rowStyle={(row) => {
                            if (row._rowType === 'zone' && row._expanded) return { "& td": { backgroundColor: "#eeeeee !important", color: row._expanded ? '#555' : null } };
                            return {};
                        }}
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                    />
                </Box>
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
            </Box>
        </Layout>
    );
}

export default KPIReport;