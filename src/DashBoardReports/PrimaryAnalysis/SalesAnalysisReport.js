// SalesAnalysisReport.jsx
import { useState, useEffect, useMemo } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import {
    Box, Button, FormControl, Select, MenuItem,
    InputLabel, Grid,
    Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { AiOutlineFileExcel } from "react-icons/ai";
import CircularProgress from "../../utils/CircularProgressLoading";
import DataTable from "../../utils/dataTable";
import SalesAnalysisCharts from "./SalesAnalyzeChart";
import { Download } from "../../utils/downloadExcel/Download";
import useToast from "../../utils/useToast";
import { getMasterPanel } from "../../services/masterPanelService";

function SalesAnalysisReport() {
    const [selYear, setSelYear] = useState(dayjs());
    const [selType, setSelType] = useState(2);
    const [selSubCat, setSelSubCat] = useState(0);
    const [allSubCat, setAllSubCat] = useState([]);
    const [tableData, setTableData] = useState([]);   // flat pivoted rows
    const [regions, setRegions] = useState([]);   // [{reg_id, regName}]
    const [years, setYears] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [showTable, setShowTable] = useState(false)
    const [masterPanel, setMasterPanel] = useState({});
    const [tableTitle, setTableTitle] = useState("PRODUCT CATEGORY WISE PRIMARY SALES ANALYSIS");
    const [nameHeader, setNameHeader] = useState("Brand");
    const toast = useToast()

    useEffect(() => { fetchSubCats(); }, []);

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const fetchSubCats = async () => {
        try {
            const res = await api.post('/salesAnalzeSubCat');
            setAllSubCat(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.error("fetchSubCats error", err);
        }
    };

    const zeroToNull = (val) =>
        Number(val) === 0 || val === null || val === undefined ? "-" : val;

    const redIfNegative = (val) => (
        <span style={{ color: val < 0 ? "red" : "inherit" }}>
            {zeroToNull(val)}
        </span>
    );

    const pivotData = (processed) => {
        // collect all unique labels (brands/SKUs) in order
        const allLabels = [];
        const labelSet = new Set();
        for (const region of processed) {
            for (const row of region.rows) {
                if (!labelSet.has(row.label)) {
                    labelSet.add(row.label);
                    allLabels.push(row.label);
                }
            }
        }

        // build one flat row per label
        const pivoted = allLabels.map((label) => {
            const flatRow = { label, isTotal: false };

            // Initialize all regions totals
            let allRegions_fy1 = 0;
            let allRegions_fy2 = 0;
            let allRegions_fy3 = 0;
            let allRegions_growth = 0;

            for (const region of processed) {
                const match = region.rows.find((r) => r.label === label);
                const key = `r${region.reg_id}`;
                flatRow[`${key}_fy1`] = match?.fy1 ?? 0;
                flatRow[`${key}_fy2`] = match?.fy2 ?? 0;
                flatRow[`${key}_fy3`] = match?.fy3 ?? 0;
                flatRow[`${key}_growth`] = match?.growth ?? 0;

                // Accumulate for all regions
                allRegions_fy1 += Number(match?.fy1) ?? 0;
                allRegions_fy2 += Number(match?.fy2) ?? 0;
                allRegions_fy3 += Number(match?.fy3) ?? 0;
                allRegions_growth += Number(match?.growth ?? 0);
            }


            flatRow.all_fy1 = allRegions_fy1;
            flatRow.all_fy2 = allRegions_fy2;
            flatRow.all_fy3 = allRegions_fy3;
            flatRow.all_growth = +allRegions_growth.toFixed(2);

            return flatRow;
        });

        // grand total row
        const totalRow = { label: "TOTAL", isTotal: true };
        let grandTotal_fy1 = 0;
        let grandTotal_fy2 = 0;
        let grandTotal_fy3 = 0;
        let grandTotal_growth = 0;

        for (const region of processed) {
            const key = `r${region.reg_id}`;
            totalRow[`${key}_fy1`] = region.total.fy1;
            totalRow[`${key}_fy2`] = region.total.fy2;
            totalRow[`${key}_fy3`] = region.total.fy3;
            totalRow[`${key}_growth`] = region.total.growth;

            // Accumulate for all regions total
            grandTotal_fy1 += region.total.fy1;
            grandTotal_fy2 += region.total.fy2;
            grandTotal_fy3 += region.total.fy3;
            grandTotal_growth += Number(region.total.growth);
        }

        totalRow.all_fy1 = grandTotal_fy1;
        totalRow.all_fy2 = grandTotal_fy2;
        totalRow.all_fy3 = grandTotal_fy3;
        totalRow.all_growth = +grandTotal_growth.toFixed(2);

        return [...pivoted, totalRow];
    };

    const handleLoad = async () => {
        setShowTable(true)
        setTableTitle(`${selType == 3 ? "SKU WISE" : "PRODUCT CATEGORY WISE"} PRIMARY SALES ANALYSIS`);
        setNameHeader(selType == 3 ? "SKU" : (masterPanel["BRND"] || "Brand"));
        try {
            setLoading(true);
            setTableData([]);
            setRegions([]);

            const year = selYear.format('YYYY');
            const dt = dayjs(`${year}-01-01`);
            const currentYear = dt.format('YYYY');
            const nextYear = dt.add(1, 'year').format('YYYY');
            const lastYear = dt.subtract(1, 'year').format('YYYY');
            const secondLastYear = dt.subtract(2, 'year').format('YYYY');
            const yearLabels = { secondLastYear, lastYear, currentYear, nextYear };
            setYears(yearLabels);

            const res = await api.post('/salesYearlyDashBoard', {
                selYear: year,
                type: selType,
                subCat: selSubCat || null,
            });

            if (res.data.status === 200) {
                // inline processSalesData logic (same as before)
                const rows = res.data.data || [];
                const allSKUs = res.data.subData || [];

                const regionsMap = {};
                for (const row of rows) {
                    if (!regionsMap[row.reg_id]) {
                        regionsMap[row.reg_id] = {
                            reg_id: row.reg_id,
                            regName: row.reg_name,
                            items: {},
                        };
                    }
                    const itemKey = selType == 3 ? row.prod_id : row.subcatId;
                    const label = selType == 3 ? row.prod_name : row.sub_name;
                    const growth =
                        row.fy_sale2 > 0 && row.fy_sale3 > 0
                            ? +(((row.fy_sale3 / row.fy_sale2) * 100) - 100).toFixed(2)
                            : 0;
                    regionsMap[row.reg_id].items[itemKey] = {
                        label, fy1: row.fy_sale1, fy2: row.fy_sale2,
                        fy3: row.fy_sale3, growth,
                    };
                }

                // gap-fill
                for (const region of Object.values(regionsMap)) {
                    for (const sku of allSKUs) {
                        const key = sku.id;
                        if (!region.items[key]) {
                            region.items[key] = {
                                label: selType == 3 ? sku.prod_name : sku.sub_name,
                                fy1: 0, fy2: 0, fy3: 0, growth: 0,
                            };
                        }
                    }
                }

                const processed = Object.values(regionsMap).map((region) => {
                    const rowArr = Object.values(region.items);
                    const total = rowArr.reduce(
                        (acc, r) => ({
                            fy1: acc.fy1 + Number(r.fy1), fy2: acc.fy2 + Number(r.fy2),
                            fy3: acc.fy3 + Number(r.fy3), growth: acc.growth + Number(r.growth),
                        }),
                        { fy1: 0, fy2: 0, fy3: 0, growth: 0 }
                    );
                    total.growth = +total.growth.toFixed(2);
                    return { ...region, rows: rowArr, total };
                });

                setRegions(processed.map((r) => ({ reg_id: r.reg_id, regName: r.regName })));
                setTableData(pivotData(processed));
            }
        } catch (err) {
            console.error("handleLoad error", err);
        } finally {
            setLoading(false);
        }
    };


    // ── Build columns dynamically: first col = Brand, then one group per region, then All Regions ──
    const columns = useMemo(() => {
        const fyLabel1 = `FY${String(years.secondLastYear).slice(2)}-${String(years.lastYear).slice(2)}`;
        const fyLabel2 = `FY${String(years.lastYear).slice(2)}-${String(years.currentYear).slice(2)}`;
        const fyLabel3 = `FY${String(years.currentYear).slice(2)}-${String(years.nextYear).slice(2)}`;

        return [
            // ── Brand / SKU column ──
            {
                field: "label",
                headerName: nameHeader,
            },

            ...regions.map((region) => {
                const key = `r${region.reg_id}`;
                return {
                    field: "",
                    headerName: region.regName,
                    subColumns: [
                        {
                            field: `${key}_fy1`,
                            headerName: fyLabel1,
                            renderCell: (params) => {
                                const row = params?.row ?? params;
                                return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row[`${key}_fy1`])}</Typography>);
                            },
                        },
                        {
                            field: `${key}_fy2`,
                            headerName: fyLabel2,
                            renderCell: (params) => {
                                const row = params?.row ?? params;
                                return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row[`${key}_fy2`])}</Typography>)
                            },
                        },
                        {
                            field: `${key}_fy3`,
                            headerName: fyLabel3,
                            renderCell: (params) => {
                                const row = params?.row ?? params;
                                return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row[`${key}_fy3`])}</Typography>);
                            },
                        },
                        {
                            field: `${key}_growth`,
                            headerName: "Growth",
                            renderCell: (params) => {
                                const row = params?.row ?? params;
                                return (<Typography sx={{ textAlign: 'center' }}>{zeroToNull(row[`${key}_growth`])}</Typography>);
                            },
                        },
                    ]
                };
            }),

            // ── All Regions column ──
            {
                field: "",
                headerName: "Total",
                subColumns: [
                    {
                        field: "all_fy1",
                        headerName: fyLabel1,
                        renderCell: (params) => {
                            const row = params?.row ?? params;
                            return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row.all_fy1)}</Typography>);
                        },
                    },
                    {
                        field: "all_fy2",
                        headerName: fyLabel2,
                        renderCell: (params) => {
                            const row = params?.row ?? params;
                            return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row.all_fy2)}</Typography>);
                        },
                    },
                    {
                        field: "all_fy3",
                        headerName: fyLabel3,
                        renderCell: (params) => {
                            const row = params?.row ?? params;
                            return (<Typography sx={{ textAlign: 'right' }}>{zeroToNull(row.all_fy3)}</Typography>);
                        },
                    },
                    {
                        field: "all_growth",
                        headerName: "Growth",
                        type: "number",
                        renderCell: (params) => {
                            const row = params?.row ?? params;
                            return (<Typography sx={{ textAlign: 'center' }}>{zeroToNull(Number(row.all_growth).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }))}</Typography>);
                        },
                    },
                ]
            },
        ];
    }, [regions, years, nameHeader]);

    const excelColumns = useMemo(() => {
        const fyLabel1 = `FY${String(years.secondLastYear).slice(2)}-${String(years.lastYear).slice(2)}`;
        const fyLabel2 = `FY${String(years.lastYear).slice(2)}-${String(years.currentYear).slice(2)}`;
        const fyLabel3 = `FY${String(years.currentYear).slice(2)}-${String(years.nextYear).slice(2)}`;

        return [
            { field: "label", headerName: nameHeader },

            ...regions.map((region) => {
                const key = `r${region.reg_id}`;
                return {
                    field: "",
                    headerName: region.regName,
                    subColumns: [
                        { field: `${key}_fy1`, headerName: fyLabel1 },
                        { field: `${key}_fy2`, headerName: fyLabel2 },
                        { field: `${key}_fy3`, headerName: fyLabel3 },
                        { field: `${key}_growth`, headerName: "Growth" },
                    ],
                };
            }),

            {
                field: "",
                headerName: "Total",
                subColumns: [
                    { field: "all_fy1", headerName: fyLabel1 },
                    { field: "all_fy2", headerName: fyLabel2 },
                    { field: "all_fy3", headerName: fyLabel3 },
                    { field: "all_growth", headerName: "Growth" },
                ],
            },
        ];
    }, [regions, years, nameHeader]);

    const columnBgColors = useMemo(() => {
        const colors = {};
        regions.forEach((region) => {
            const key = `r${region.reg_id}`;
            colors[`${key}_growth`] = '#F0FDE7';
        });
        colors['all_growth'] = '#F0FDE7';
        return colors;
    }, [regions]);

    const handleDownLoadExcel = async () => {
        const safeColumns = excelColumns.map(({ renderCell, renderHeader, ...rest }) => rest);
        const dynamicTitle = `${Number(selType === 2) ? "PRODUCT CATEGORY WISE" : Number(selType === 3) ? "SKU WISE" : "MONTH WISE"}PRIMARY SALES ANALYSIS`;

        const excelData = tableData.map((row) => {
            const newRow = {};
            for (const key in row) {
                if (key === "label" || key === "isTotal") {
                    newRow[key] = row[key];
                } else {
                    const val = row[key];
                    newRow[key] = (val === 0 || val === "0" || val === null || val === undefined || val === "")
                        ? "-"
                        : val;
                }
            }
            return newRow;
        });

        Download(excelData, safeColumns, 'Sales_Analysis', setProgress, toast, 'Sales_Analysis', { titleRow1: dynamicTitle, highlightHeaders: [] })
    }

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "DashBoard", path: "/dashboard/salesanalysis" },
            { label: "Sales Analysis", path: "/dashboard/salesanalysis" },
        ]}>
            <Box p={0.5}>
                <Box p={2} display="flex" flexDirection="column" gap={2}>
                    <h1 className="mainTitle">Sales Analysis</h1>

                    {/* ── Filters ── */}
                    <Box sx={{
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px",
                    }}>
                        <Grid container spacing={0.95}>
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Year"
                                        views={["year"]}
                                        format="YYYY"
                                        value={selYear}
                                        onChange={(v) => setSelYear(v)}
                                        maxDate={dayjs()}
                                        slotProps={{ textField: { size: "small", className: "date-input" } }}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select label="Type" value={selType} onChange={(e) => setSelType(e.target.value)}>
                                        <MenuItem value={2}>{masterPanel["BRND"] || "Brand"} Wise</MenuItem>
                                        <MenuItem value={3}>SKU Wise</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{masterPanel["PSUB"] || "Sub-Category"}</InputLabel>
                                    <Select
                                        label={masterPanel["PSUB"] || "Sub-Category"}
                                        value={selSubCat}
                                        onChange={(e) => setSelSubCat(e.target.value)}
                                    >
                                        <MenuItem value={0}>All</MenuItem>
                                        {allSubCat.map((v) => (
                                            <MenuItem key={v.id} value={v.id}>{v.sub_name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ md: 2, lg: 1, xs: 6, sm: 3 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleLoad}
                                    disabled={loading}
                                >
                                    {loading ? "Loading…" : "Load"}
                                </Button>
                            </Grid>

                            <Grid size={{ md: 1.5, lg: 1, xs: 2.5, sm: 1.2 }}>
                                {progress ? (
                                    <CircularProgress progress={progress} />
                                ) : (
                                    <span style={{ cursor: "pointer" }} onClick={() => handleDownLoadExcel()}>
                                        <AiOutlineFileExcel
                                            style={{ color: "green", height: "30px", width: "30px" }}
                                        />
                                    </span>
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* ── Single DataTable with all regions as column groups ── */}
                    {showTable && (
                        <DataTable
                            searchable={false}
                            columns={columns}
                            data={tableData}
                            getRowClassName={(row) => row.isTotal ? "total-row" : ""}
                            tableTitle={tableTitle}
                            showTableTitle={true}
                            showHeader={false}
                            sx={{
                                backgroundColor: "#fff",
                                borderRadius: "10px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                            }}
                            columnBgColors={columnBgColors}
                            loading={loading}

                        />)}
                    {showTable && (
                        <SalesAnalysisCharts
                            regions={regions}
                            tableData={tableData}
                            years={years}
                        />
                    )}
                </Box>
            </Box>
        </Layout>
    );
}

export default SalesAnalysisReport;