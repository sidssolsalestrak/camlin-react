import { useState } from "react";
import Layout from "../layout";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import { Box, Button, FormControl, IconButton } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FaPlus } from "react-icons/fa";
import { FaMinus } from "react-icons/fa";
import { render } from "@testing-library/react";

const HCOLOR = {
    backgroundColor: "#d0e8f5",
    color: "#0047ab",
    fontWeight: 600,
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "2px 0",
    borderRadius: "3px",
};

const fmt  = (val) => (!val || Number(val) === 0 ? "-" : val);
const fmtF = (val) => (!val || Number(val) === 0 ? "-" : Number(val).toFixed(2));

const tierStyle = (tier) => {
    if (tier === "Strategic") return { color: "darkgreen", fontWeight: 500 };
    if (tier === "Predictive") return { color: "blue",      fontWeight: 500 };
    return { color: "orange", fontWeight: 500 };
};

function buildZoneData(rows) {
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
            call_dy_tgt     += Number(r.call_dy_tgt)     || 0;
            mtd_tot_call    += Number(r.mtd_tot_call)    || 0;
            prod_dy_tgt     += Number(r.prod_dy_tgt)     || 0;
            mtd_tot_pc      += Number(r.mtd_tot_pc)      || 0;
            visible_dy_tgt  += Number(r.visible_dy_tgt)  || 0;
            mtd_visible_cnt += Number(r.mtd_visible_cnt) || 0;
            tot_cus         += Number(r.tot_cus)         || 0;
            eco_no          += Number(r.eco_no)          || 0;
            exp_sec_val     += Number(r.exp_sec_val)     || 0;
            exp_pri_val     += Number(r.exp_pri_val)     || 0;
            sec_val         += Number(r.sec_val)         || 0;
            pri_val         += Number(r.pri_val)         || 0;
            tot_tgt         += Number(r.sale_tgt)        || 0;
            sec_diff        += Number(r.sec_diff)        || 0;
            pri_diff        += Number(r.pri_diff)        || 0;
            total_calls     += Number(r.tot_call)        || 0;
            total_repeated  += Number(r.repeated)        || 0;
            field_days      += Number(r.tot_field_day)   || 0;
        });

        const coverage_per = call_dy_tgt    > 0 ? (mtd_tot_call    / call_dy_tgt)    * 100 : 0;
        const prod_per     = prod_dy_tgt    > 0 ? (mtd_tot_pc      / prod_dy_tgt)    * 100 : 0;
        const visible_per  = visible_dy_tgt > 0 ? (mtd_visible_cnt / visible_dy_tgt) * 100 : 0;
        const cap_index    = ((coverage_per * 40) + (prod_per * 40) + (visible_per * 20)) / 100;
        const num_dist_per = tot_cus > 0 ? (eco_no / tot_cus) * 100 : 0;
        const pot_diff     = 1 + ((cap_index % 100) - 1) * 0.5;
        const exe_tier     = cap_index >= 90 ? "Strategic" : cap_index >= 80 ? "Predictive" : "Reactive";

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

// Static columns with no state dependency
const STATIC_COLUMNS = [
    {
        field: "_name",
        headerName: "",
        width: 220,
        subColumns:[{field:'_name',headerName:' ', renderCell: ({ value, row }) =>
            row._rowType === "zone" ? (
                <Box sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: 13 }}>{value}</Box>
            ) : (
                <Box >
                    <Box sx={{ fontWeight: 500, fontSize: 12,textWrap:'nowrap'}}>{row.full_name}</Box>
                    <Box sx={{ fontSize: 9, color: "grey" }}>HQ: {row.hq_name}</Box>
                </Box>
            )},
        {field:'area_name',headerName:'', renderCell: ({ value, row }) => row._rowType === "zone" ? "" : (value || "-") },],
       
    },
    { field: "sale_tgt",        headerName: "Tgt",                    width: 70,  renderCell: ({ value }) => fmt(value) },
    { field: "tot_cus",         headerName: "Total Outlets",          width: 90,  renderCell: ({ value }) => fmt(value) },
    { field: "tot_call",        headerName: "Total Calls",            width: 90,  renderCell: ({ value }) => fmt(value) },
    { field: "eco_no",          headerName: "Total Outlets Visited",  width: 110, renderCell: ({ value }) => fmt(value) },
    { field: "repeated",        headerName: "Total Outlets Repeated", width: 130, renderCell: ({ value }) => fmt(value) },
    { field: "num_dist_per",    headerName: "Numeric Distribution %", width: 130, renderCell: ({ value }) => <Box sx={HCOLOR}>{fmtF(value)}</Box> },
    { field: "tot_field_day",   headerName: "Field Days",             width: 80,  renderCell: ({ value }) => fmt(value) },
    { field: "call_dy_tgt",     headerName: "Calls/Day Tgt",         width: 100, renderCell: ({ value }) => fmt(value) },
    { field: "mtd_tot_call",    headerName: "Actual",                 width: 70,  renderCell: ({ value }) => fmtF(value) },
    { field: "coverage_per",    headerName: "Coverage %",             width: 90,  renderCell: ({ value }) => <Box sx={HCOLOR}>{fmtF(value)}</Box> },
    { field: "prod_dy_tgt",     headerName: "Productivity Tgt",      width: 110, renderCell: ({ value }) => fmtF(value) },
    { field: "mtd_tot_pc",      headerName: "Actual",                 width: 70,  renderCell: ({ value }) => fmtF(value) },
    { field: "prod_per",        headerName: "Productivity %",         width: 100, renderCell: ({ value }) => <Box sx={HCOLOR}>{fmtF(value)}</Box> },
    { field: "visible_dy_tgt",  headerName: "Visibility Tgt",        width: 90,  renderCell: ({ value }) => fmtF(value) },
    { field: "mtd_visible_cnt", headerName: "Actual",                 width: 70,  renderCell: ({ value }) => fmtF(value) },
    { field: "visible_per",     headerName: "Visibility %",           width: 90,  renderCell: ({ value }) => <Box sx={HCOLOR}>{fmtF(value)}</Box> },
    { field: "train_stat",      headerName: "Training Done (Y/N)",    width: 120, renderCell: ({ value }) => value || "-" },
    { field: "cap_index",       headerName: "Capability Index %",     width: 110, renderCell: ({ value }) => fmtF(value) },
    { field: "exe_tier",        headerName: "Execution Tier",         width: 100, renderCell: ({ value }) => <Box sx={tierStyle(value)}>{value || "-"}</Box> },
    { field: "p_mult",          headerName: "Potential Multiplier",   width: 120, renderCell: ({ value }) => value ? `${Number(value).toFixed(2)}%` : "-" },
    { field: "exp_sec_val",     headerName: "Expected Secondary",     width: 120, renderCell: ({ value }) => fmt(value) },
    { field: "exp_pri_val",     headerName: "Expected Primary",       width: 110, renderCell: ({ value }) => fmt(value) },
    { field: "sec_val",         headerName: "Actual Secondary",       width: 110, renderCell: ({ value }) => fmt(value) },
    { field: "pri_val",         headerName: "Actual Primary",         width: 110, renderCell: ({ value }) => fmt(value) },
    { field: "sec_diff",        headerName: "Secondary Diff",         width: 100, renderCell: ({ value }) => fmt(value) },
    { field: "pri_diff",        headerName: "Primary Diff",           width: 100, renderCell: ({ value }) => fmt(value) },
];

function KPIReport() {
    const [selMonth, setSelMonth] = useState(dayjs());
    const [zoneData, setZoneData] = useState([]);
    const [expanded, setExpanded] = useState(new Set());

    const fetchKpiReport = async () => {
        try {
            const response = await api.post("/getCapabilityReport", { month: selMonth });
            const raw = Array.isArray(response.data.data) ? response.data.data : [];
            setZoneData(buildZoneData(raw));
            setExpanded(new Set());
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
                        sx={{ color:"#2e7d32", p: 0.5 }}
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

    return (
        <Layout>
            <Box p={0.5}>
                <Box p={2} display="flex" flexDirection="column" gap={2}>
                    <h1 className="mainTitle">KPI Report</h1>
                    <Box sx={{
                        display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap",
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px", borderRadius: "10px",
                    }}>
                        <FormControl>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Month"
                                    views={["year", "month"]}
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
                        <Button color="warning" variant="contained">Excel</Button>
                    </Box>
                </Box>

                <Box sx={{ p: 1.5 }}>
                    <DataTable
                        data={tableData}
                        columns={COLUMNS}
                        searchable={false}
                        showHeader={true}
                        stickyHeader
                        hideSubHeader
                        rowStyle={(row) =>
                            row._rowType === "zone"
                                ? {
                                    "& td": {
                                        backgroundColor: "#f0f0f0 !important",
                                        fontWeight: "700 !important",
                                        borderTop: "2px solid #ccc",
                                        borderBottom: "2px solid #ccc",
                                        fontSize: "13px",
                                    },
                                }
                                : {
                                    "& td": {
                                        backgroundColor: "#ffffff !important",
                                    },
                                }
                        }
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                    />
                </Box>
            </Box>
        </Layout>
    );
}

export default KPIReport;