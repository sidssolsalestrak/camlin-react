import { useState, useEffect, useMemo, useRef } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import {
    Box, Typography, Button, FormControl, Select, MenuItem, InputLabel, IconButton,
    Dialog, DialogActions, DialogTitle, DialogContent, Divider, Grid
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CloseIcon from "@mui/icons-material/Close";
import DataTable from "../../utils/dataTable";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AiOutlineFileExcel } from "react-icons/ai";
import useToast from "../../utils/useToast";
import { excelWithFilters } from '../../utils/ExcelWithFilters';
import { FaRegFileExcel } from "react-icons/fa";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const safeDecode = (val, fallback = 0, asNumber = true) => {
    if (!val || val === 'undefined') return fallback;
    try {
        const decoded = atob(val);
        return asNumber ? Number(decoded) : decoded;
    } catch {
        return fallback;
    }
};

function PrimarySales({ enType }) {
    const {
        enyear, engroupBy, enreportType,
        enZone, enRegion, enArea, enterritory,
        enDistributor, encategory, ensubcategory, enproduct
    } = useParams();

    const decodeYear = safeDecode(enyear, null, false);
    const decodeType = safeDecode(enType, 1);
    const decodegroupBy = safeDecode(engroupBy, 1);
    const decodeReportType = safeDecode(enreportType, 1);
    const decodeZone = safeDecode(enZone, 0);
    const decodeRegion = safeDecode(enRegion, 0);
    const decodeArea = safeDecode(enArea, 0);
    const decodeTerritory = safeDecode(enterritory, 0);
    const decodeDistributor = safeDecode(enDistributor, 0);
    const decodeCategory = safeDecode(encategory, 0);
    const decodeSubCategory = safeDecode(ensubcategory, 0);
    const decodeProduct = safeDecode(enproduct, 0);

    const [selYear, setSelYear] = useState(decodeYear ? dayjs(decodeYear) : dayjs());
    const [analyseType, setAnalyseType] = useState(decodeType);
    const [groupBy, setGroupBy] = useState(decodegroupBy);
    const [selRepType, setSelRepType] = useState(decodeReportType);
    const [selZone, setSelZone] = useState(decodeZone);
    const [selRegion, setSelRegion] = useState(decodeRegion);
    const [selArea, setSelArea] = useState(decodeArea);
    const [selTerritory, setSelTerritory] = useState(decodeTerritory);
    const [selDistributor, setSelDistributor] = useState(decodeDistributor);
    const [selCategory, setSelCategory] = useState(decodeCategory);
    const [selSubCategory, setSelSubCategory] = useState(decodeSubCategory);
    const [selProduct, setSelProduct] = useState(decodeProduct);

    const [allCatData, setAllCatData] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [allZone, setAllZone] = useState([]);
    const [allRegion, setAllRegion] = useState([]);
    const [allArea, setAllArea] = useState([]);
    const [allTerritory, setAllTerritory] = useState([]);
    const [allDistributor, setAllDistributor] = useState([]);
    const [allSubCategory, setAllSubCategory] = useState([]);
    const [allProduct, setAllProduct] = useState([]);
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad,setinitialLoad] =useState(false)

    // ✅ FIX: useRef instead of useState — no re-render on progress update
    const progressRef = useRef(null);
    const setProgress = (val) => { progressRef.current = val; };

    const yr = dayjs(selYear).format("YYYY");

    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    useEffect(() => {
        fetchCatName();
        fetchReportZone();
        if (decodeZone > 0) fetchRegionList(decodeZone);
        if (decodeRegion > 0) fetchAreaList(decodeRegion);
        if (decodeArea > 0) {
            fetchTerritoryList(decodeArea);
            fetchDistributor(decodeArea);
        }
        if (decodeCategory > 0) fetchSubCatData(decodeCategory);
        if (decodeSubCategory > 0) fetchProductList(decodeCategory, decodeSubCategory);
    }, []);

    useEffect(() => {
        if (!enyear) {
            handleReset();
            return;
        }
        fetchAnalysisData();
    }, [enyear, enType, engroupBy, enreportType,
        enZone, enRegion, enArea, enterritory,
        enDistributor, encategory, ensubcategory, enproduct, location.pathname]);

    useEffect(() => {
        if (!decodeType) return;
        setAnalyseType(decodeType);
    }, [decodeType]);

    useEffect(() => {
        if (selZone > 0) {
            fetchRegionList(selZone);
        } else {
            setAllRegion([]);
            setSelRegion(0);
        }
    }, [selZone]);

    useEffect(() => {
        if (selRegion > 0) {
            fetchAreaList(selRegion);
        } else {
            setAllArea([]);
            setSelArea(0);
        }
    }, [selRegion]);

    useEffect(() => {
        if (selArea > 0) {
            fetchTerritoryList(selArea);
            fetchDistributor(selArea);
        } else {
            setAllTerritory([]);
            setSelTerritory(0);
            setAllDistributor([]);
            setSelDistributor(0);
        }
    }, [selArea]);

    useEffect(() => {
        if (selCategory > 0) {
            fetchSubCatData(selCategory);
        } else {
            setAllSubCategory([]);
            setSelSubCategory(0);
        }
    }, [selCategory]);

    useEffect(() => {
        if (selSubCategory > 0) {
            fetchProductList(selCategory, selSubCategory);
        } else {
            setAllProduct([]);
            setSelProduct(0);
        }
    }, [selSubCategory]);

    const handleReset = () => {
        setSelYear(dayjs());
        setAnalyseType(decodeType);
        setGroupBy(1);
        setSelRepType(1);
        setSelZone(0);
        setSelRegion(0);
        setSelArea(0);
        setSelTerritory(0);
        setSelDistributor(0);
        setSelCategory(0);
        setSelSubCategory(0);
        setSelProduct(0);
        setAllRegion([]);
        setAllArea([]);
        setAllTerritory([]);
        setAllDistributor([]);
        setAllSubCategory([]);
        setAllProduct([]);
        setRawData([]);
        setinitialLoad(false)
        navigate(`/reports/trendanalysis/${enType}`);
    };

    const fetchCatName = async () => {
        try {
            const r = await api.post('/getReportCategory');
            setAllCatData(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchReportZone = async () => {
        try {
            const r = await api.post('/getReportsZone');
            setAllZone(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchRegionList = async (zoneId) => {
        try {
            const r = await api.post("/extractRegionList", { zone_id: zoneId });
            setAllRegion(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const fetchAreaList = async (regId) => {
        try {
            const r = await api.post("/extractAreaList", { reg_id: regId });
            setAllArea(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const fetchTerritoryList = async (area_id) => {
        try {
            const r = await api.post("/getReportsTerritory", { area_id });
            setAllTerritory(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchDistributor = async (area_id) => {
        try {
            const r = await api.post('/getLogStk', { area_id });
            setAllDistributor(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchSubCatData = async (catId) => {
        try {
            const r = await api.post('/getReportSubCat', { pCat: catId });
            setAllSubCategory(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchProductList = async (pcat, subCat) => {
        try {
            const r = await api.post("/getReportProdList", { pcat, subCat });
            setAllProduct(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (err) { console.log(err); }
    };

    const fetchAnalysisData = async () => {
        try {
            setLoading(true);
            const payload = {
                year: dayjs(selYear).format("YYYY"),
                analysisType: analyseType,
                group: groupBy,
                type: selRepType,
                zone: selZone,
                region: selRegion,
                area: selArea,
                ter: selTerritory,
                stk: selDistributor,
                pcat: selCategory,
                psub: selSubCategory,
                prod: selProduct,
            };
            const response = await api.post('/getAnalysisReport', payload);
            setRawData(Array.isArray(response.data.data) ? response.data.data : []);
            setinitialLoad(true)
        } catch (err) {
            console.log("fetching primary sale Data error", err);
        } finally {
            setLoading(false);
        }
    };

    const buildNavPath = () => {
        const encYear = btoa(selYear ? selYear.format("YYYY-MM") : dayjs().format("YYYY"));
        const entype = btoa(analyseType);
        const engrp = btoa(groupBy);
        const enreptype = btoa(selRepType);
        const enZoneE = btoa(selZone);
        const enRegionE = btoa(selRegion);
        const enAreaE = btoa(selArea);
        const enTerE = btoa(selTerritory);
        const enDistE = btoa(selDistributor);
        const enCatE = btoa(selCategory);
        const enSubCatE = btoa(selSubCategory);
        const enProdE = btoa(selProduct);
        return `/reports/trendanalysis/${entype}/${encYear}/${engrp}/${enreptype}/${enZoneE}/${enRegionE}/${enAreaE}/${enTerE}/${enDistE}/${enCatE}/${enSubCatE}/${enProdE}`;
    };

    const handleLoad = () => navigate(buildNavPath());

    const handleApply = () => {
        setFiltersOpen(false);
        navigate(buildNavPath());
    };

    const ExcelColumns = [
        { id: "cname", label: "Name" },
        ...MONTHS.map((m, i) => ({
            id: selRepType === 1 ? `m_qty_${i}` : `m_val_${i}`,
            label: `${m}-${yr}`,
        })),
        { id: selRepType === 1 ? "total_qty" : "total_val", label: "Total" },
        { id: selRepType === 1 ? "saliency_qty" : "saliency_val", label: "Saliency" },
    ];

    // ✅ FIX: useMemo — only recomputes when rawData or groupBy actually changes, not on every render
    const tableData = useMemo(() => {
        if (!decodeYear || !rawData || rawData.length === 0) return [];

        const rows = [];
        const grandMonthly = Array(12).fill(0);
        const grandMonthlyQty = Array(12).fill(0);
        let grandTotal = 0;
        let grandTotalQty = 0;

        const zoneMonthly = Array(12).fill(0);
        const zoneMonthlyQty = Array(12).fill(0);
        let zoneTotalVal = 0, zoneTotalQty = 0;
        let zoneId = null, zoneName = "";

        const regMonthly = Array(12).fill(0);
        const regMonthlyQty = Array(12).fill(0);
        let regTotalVal = 0, regTotalQty = 0;
        let regId = null, regName = "";

        rawData.forEach(row => {
            grandTotal += Number(row.prod_val);
            grandTotalQty += Number(row.prod_qty);
        });

        let prevId = null, prevCname = "";
        let monthCells = Array(12).fill(0);
        let monthCellsQty = Array(12).fill(0);
        let rowVal = 0, rowQty = 0;

        const flushDataRow = () => {
            const obj = {
                id: `data-${prevId}-${rows.length}`,
                _rowType: "data",
                cname: prevCname,
                total_val: rowVal,
                total_qty: rowQty,
                saliency_val: grandTotal > 0 ? ((rowVal / grandTotal) * 100).toFixed(2) : "0.00",
                saliency_qty: grandTotalQty > 0 ? ((rowQty / grandTotalQty) * 100).toFixed(2) : "0.00",
            };
            MONTHS.forEach((_, i) => {
                obj[`m_val_${i}`] = monthCells[i];
                obj[`m_qty_${i}`] = monthCellsQty[i];
            });
            rows.push(obj);
        };

        const flushZoneSubtotal = () => {
            const obj = {
                id: `zone-${zoneId}-${rows.length}`,
                _rowType: "zone_subtotal",
                cname: "Total - " + zoneName,
                total_val: zoneTotalVal,
                total_qty: zoneTotalQty,
                saliency_val: grandTotal > 0 ? ((zoneTotalVal / grandTotal) * 100).toFixed(2) : "0.00",
                saliency_qty: grandTotalQty > 0 ? ((zoneTotalQty / grandTotalQty) * 100).toFixed(2) : "0.00",
            };
            MONTHS.forEach((_, i) => {
                obj[`m_val_${i}`] = zoneMonthly[i];
                obj[`m_qty_${i}`] = zoneMonthlyQty[i];
            });
            rows.push(obj);
            zoneMonthly.fill(0); zoneMonthlyQty.fill(0);
            zoneTotalVal = 0; zoneTotalQty = 0;
        };

        const flushRegSubtotal = () => {
            const obj = {
                id: `reg-${regId}-${rows.length}`,
                _rowType: "reg_subtotal",
                cname: "Total - " + regName,
                total_val: regTotalVal,
                total_qty: regTotalQty,
                saliency_val: grandTotal > 0 ? ((regTotalVal / grandTotal) * 100).toFixed(2) : "0.00",
                saliency_qty: grandTotalQty > 0 ? ((regTotalQty / grandTotalQty) * 100).toFixed(2) : "0.00",
            };
            MONTHS.forEach((_, i) => {
                obj[`m_val_${i}`] = regMonthly[i];
                obj[`m_qty_${i}`] = regMonthlyQty[i];
            });
            rows.push(obj);
            regMonthly.fill(0); regMonthlyQty.fill(0);
            regTotalVal = 0; regTotalQty = 0;
        };

        rawData.forEach((key) => {
            const monthIdx = parseInt(key.cl_day, 10) - 1;

            if (prevId !== null && prevId !== key.id) {
                flushDataRow();
                if ([3, 4, 5, 8].includes(decodegroupBy) && regId !== null && regId !== key.reg_id)
                    flushRegSubtotal();
                if ([2, 3, 4, 5, 7, 8].includes(decodegroupBy) && zoneId !== null && zoneId !== key.zone_id)
                    flushZoneSubtotal();
                monthCells = Array(12).fill(0);
                monthCellsQty = Array(12).fill(0);
                rowVal = 0; rowQty = 0;
            }

            if (prevId === null) {
                zoneId = key.zone_id; zoneName = key.zone_name;
                regId = key.reg_id; regName = key.reg_name;
            }

            if (key.cl_date !== "01-1900") {
                monthCells[monthIdx] += Number(key.prod_val);
                monthCellsQty[monthIdx] += Number(key.prod_qty);
                rowVal += Number(key.prod_val);
                rowQty += Number(key.prod_qty);
                grandMonthly[monthIdx] += Number(key.prod_val);
                grandMonthlyQty[monthIdx] += Number(key.prod_qty);

                if ([2, 3, 4, 5, 7, 8].includes(decodegroupBy)) {
                    zoneMonthly[monthIdx] += Number(key.prod_val);
                    zoneMonthlyQty[monthIdx] += Number(key.prod_qty);
                    zoneTotalVal += Number(key.prod_val);
                    zoneTotalQty += Number(key.prod_qty);
                }
                if ([3, 4, 5, 8].includes(decodegroupBy)) {
                    regMonthly[monthIdx] += Number(key.prod_val);
                    regMonthlyQty[monthIdx] += Number(key.prod_qty);
                    regTotalVal += Number(key.prod_val);
                    regTotalQty += Number(key.prod_qty);
                }
            }

            prevId = key.id;
            prevCname = key.cname;
            zoneId = key.zone_id ?? zoneId;
            zoneName = key.zone_name ?? zoneName;
            regId = key.reg_id ?? regId;
            regName = key.reg_name ?? regName;
        });

        if (prevId !== null) {
            flushDataRow();
            if ([3, 4, 5, 8].includes(decodegroupBy)) flushRegSubtotal();
            if ([2, 3, 4, 5, 7, 8].includes(decodegroupBy)) flushZoneSubtotal();
        }

        const grandObj = {
            id: "grand-total", _rowType: "grand_total",
            cname: "Grand Total",
            total_val: grandTotal, total_qty: grandTotalQty,
            saliency_val: "100", saliency_qty: "100",
        };
        MONTHS.forEach((_, i) => {
            grandObj[`m_val_${i}`] = grandMonthly[i];
            grandObj[`m_qty_${i}`] = grandMonthlyQty[i];
        });
        rows.push(grandObj);
        return rows;

    }, [rawData, decodegroupBy, decodeYear]); // ✅ only these affect table structure

    const fmt = (val) => {
        const num = Number(val);
        return (!val || num === 0) ? "-" : num;
    };

    const fmtSaliency = (val) => (!val || Number(val) === 0 || val === "0.00") ? "-" : Number(val);

    const rowStyle = (row) => {
        if (row._rowType === "grand_total")   return { "& td": { backgroundColor: "#d8dee3 !important" } };
        if (row._rowType === "zone_subtotal") return { "& td": { backgroundColor: "#d8dee3 !important" } };
        if (row._rowType === "reg_subtotal")  return { "& td": { backgroundColor: "#e3dada !important" } };
        return {};
    };

       const getLabel = (list, selectedId, labelKey, prefix, idKey = "id") => {
                if (!selectedId || selectedId === 0 || selectedId === "0") return `${prefix} All`;
                const match = list.find((item) => String(item[idKey]) === String(selectedId));
                if (!match) return `${prefix} All`;
                const label = typeof labelKey === "function" ? labelKey(match) : match[labelKey];
                return `${prefix} ${label}`;
            };

    const handleDownLoadExcel = async () => {
        try {
         
    const excelTableData = tableData.map(row => {
    const updated = { ...row };

    // Replace 0 with "-" for monthly columns
    MONTHS.forEach((_, i) => {
        const valKey = `m_val_${i}`;
        const qtyKey = `m_qty_${i}`;
        updated[valKey] = (!updated[valKey] || Number(updated[valKey]) === 0) ? "-" : updated[valKey];
        updated[qtyKey] = (!updated[qtyKey] || Number(updated[qtyKey]) === 0) ? "-" : updated[qtyKey];
    });

    // Replace 0 with "-" for total columns
    updated.total_val = (!updated.total_val || Number(updated.total_val) === 0) ? "-" : updated.total_val;
    updated.total_qty = (!updated.total_qty || Number(updated.total_qty) === 0) ? "-" : updated.total_qty;

    // Existing saliency formatting
    updated.saliency_val = (!updated.saliency_val || Number(updated.saliency_val) === 0 || updated.saliency_val === "0.00") ? "-" : Number(updated.saliency_val);
    updated.saliency_qty = (!updated.saliency_qty || Number(updated.saliency_qty) === 0 || updated.saliency_qty === "0.00") ? "-" : Number(updated.saliency_qty);

    updated._grandTotal = row._rowType === "grand_total";
    updated._zoneTotal = row._rowType === "zone_subtotal";
    updated._isSubtotal = row._rowType === "reg_subtotal";

    return updated;
    });

            const filters = [
                { label: `Trend Analysis Data FY-${dayjs(selYear).format('YYYY')}`, bold: true, sz: 13 },
                { label: `Zone : ${getLabel(allZone, selZone, "zone_name", "")}`, bold: false, sz: 10 },
                { label: `Region : ${getLabel(allRegion, selRegion, "reg_name", "")}`, bold: false, sz: 10 },
                { label: `Area : ${getLabel(allArea, selArea, 'area_name', "")}`, bold: false, sz: 10 },
                { label: `Territory : ${getLabel(allTerritory, selTerritory, 'ter_name', "")}`, bold: false, sz: 10 },
                { label: `Distributor : ${getLabel(allDistributor, selDistributor, (m) => `${m.stk_code}-${m.stk_name}`, "")}`, bold: false, sz: 10 },
                { label: `Category : ${getLabel(allCatData, selCategory, 'cat_name', "")}`, bold: false, sz: 10 },
                { label: `Sub Category : ${getLabel(allSubCategory, selSubCategory, 'sub_name', "")}`, bold: false, sz: 10 },
                { label: `Product : ${getLabel(allProduct, selProduct, 'prod_name', "")}`, bold: false, sz: 10 },
            ];

            const filename = `Trend_Analysis_${yr}`;
            // ✅ FIX: passes setProgress (ref-based) — no state update, no re-render
            excelWithFilters(excelTableData, ExcelColumns, filename, filters, setProgress, {
                headerFontSize: 12,
                cellFontSize: 10
            });
        } catch (err) {
            console.log("Download Excel error", err);
        }
    };

    const COLUMNS = [
        {
            field: "cname",
            headerName: "Name",
            renderCell: ({ value, row }) => (
                <Box sx={{
                    textAlign: row._rowType === "data" ? "left" : "right",
                    fontWeight: row._rowType === "grand_total" ? 700 : row._rowType === "data" ? 500 : 600,
                    color: '#555',
                    whiteSpace: "nowrap",
                }}>
                    {value}
                </Box>
            )
        },
        ...MONTHS.map((m, i) => ({
            field: `m_val_${i}`,
            headerName: `${m}-${yr}`,
            renderCell: ({ row }) => {
                const v = selRepType === 1 ? row[`m_qty_${i}`] : row[`m_val_${i}`];
                return <Box sx={{ textAlign: "center" }}>{fmt(v)}</Box>;
            }
        })),
        {
            field: "total_val",
            headerName: "Total",
            renderCell: ({ row }) => {
                const v = selRepType === 1 ? row.total_qty : row.total_val;
                return <Box sx={{ textAlign: "center" }}>{fmt(v)}</Box>;
            }
        },
        {
            field: "saliency_val",
            headerName: "Saliency",
            renderCell: ({ row }) => {
                const v = selRepType === 1 ? row.saliency_qty : row.saliency_val;
                return <Box sx={{ textAlign: "center" }}>{fmtSaliency(v)}</Box>;
            }
        },
    ];

    console.log("selected category id",selCategory)

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "DashBoard", path: "/reports/trendanalysis/MQ==" },
            { label: "Trend Analysis", path: "/reports/trendanalysis/MQ==" },
            { label: Number(analyseType)===1?"Primary Sales": Number(analyseType)===2?"Secondary Sales": Number(analyseType)===3?"Closing":'', path:location.pathname },
        ]}>
            <Box p={0.5}>
                <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <h1 className="mainTitle">Trend Analysis</h1>
                    </Box>

                    <Box sx={{
                        mb: 0.5,
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px", borderRadius: "10px",
                    }}>
                        <Box sx={{width:'100%'}}>
                            <Grid container spacing={0.95} >
                            <Grid size={{ md:3, lg: 2, xs: 12,sm:6 }}>
                            <FormControl fullWidth >
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Year"
                                        views={["year"]}
                                        format="YYYY"
                                        value={selYear}
                                        onChange={(v) => setSelYear(v)}
                                        slotProps={{
                                            textField: { size: "small", className: "date-input" },
                                        }}
                                        maxDate={dayjs()}
                                    />
                                </LocalizationProvider>
                            </FormControl>
                            </Grid>
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm:6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="type">Type</InputLabel>
                                <Select labelId="type" label="Type" size="small"
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                    onChange={(e) => setAnalyseType(e.target.value)} value={analyseType}>
                                    <MenuItem value={1}>Primary Analysis</MenuItem>
                                    <MenuItem value={2}>Secondary Analysis</MenuItem>
                                    <MenuItem value={3}>Closing</MenuItem>
                                </Select>
                            </FormControl>
                            </Grid>
                            <Grid size={{ md: 3, lg:2, xs: 12, sm:6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="grpBy">Group By</InputLabel>
                                <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
                                    size="small"
                                    MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                    labelId="grpBy" label="Group By">
                                    <MenuItem value={1}>Zone</MenuItem>
                                    <MenuItem value={2}>Region</MenuItem>
                                    <MenuItem value={3}>Area</MenuItem>
                                    <MenuItem value={4}>Territory</MenuItem>
                                    <MenuItem value={5}>Distributor</MenuItem>
                                    <MenuItem value={6}>Category</MenuItem>
                                    <MenuItem value={7}>Sub Category</MenuItem>
                                    <MenuItem value={8}>Product</MenuItem>
                                </Select>
                            </FormControl>
                            </Grid>
                            <Grid size={{ md: 3, lg:2, xs: 12,sm:6 }}>
                            <FormControl fullWidth>
                                <InputLabel id="rep_type">Report Type</InputLabel>
                                <Select size="small" MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                  
                                    onChange={(e) => setSelRepType(e.target.value)}
                                    value={selRepType} labelId="rep_type" label="Report Type">
                                    <MenuItem value={1}>Qty</MenuItem>
                                    <MenuItem value={2}>Value (Lacs)</MenuItem>
                                </Select>
                            </FormControl>
                            </Grid>
                            <Grid size={{ md: 1.5, lg:1, xs:4,sm:2}}>
                            <Button color="warning" onClick={() => setFiltersOpen(true)} variant="contained">Filters</Button>
                            </Grid>
                            <Grid size={{ md:1.5, lg:1, xs: 4,sm:2 }}>
                            <Button variant="contained" onClick={handleLoad} disabled={loading}>
                                {loading ? "Loading..." : "Load"}
                            </Button>
                            </Grid>
                            <Grid size={{ md:1.5, lg:1, xs: 4,sm:2 }}>
                            <Button startIcon={<FaRegFileExcel size={15}/>} onClick={() => handleDownLoadExcel()} color="warning" variant="contained">Excel</Button>
                            </Grid>
                            </Grid>
                          
                           
                        </Box>
                    </Box>
                    {initialLoad &&
                    <Box sx={{display:'flex',gap:2,ml:2,flexWrap:'wrap'}}>
                        <Typography sx={{fontWeight:600}}>Zone:<span style={{fontWeight:500}}> {`${getLabel(allZone, decodeZone, "zone_name", "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Region:<span  style={{fontWeight:500}}>{`${getLabel(allRegion, decodeRegion, "reg_name", "")}`}</span></Typography>
                           <Typography sx={{fontWeight:600}}>Area:<span  style={{fontWeight:500}}>{`${getLabel(allArea, decodeArea, 'area_name', "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Territory:<span  style={{fontWeight:500}}>{`${getLabel(allTerritory, decodeTerritory, 'ter_name', "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Distributor:<span style={{fontWeight:500}}>{`${getLabel(allDistributor, decodeDistributor, (m) => `${m.stk_code}-${m.stk_name}`, "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Category:<span  style={{fontWeight:500}}>{`${getLabel(allCatData, decodeCategory, 'cat_name', "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Sub Category:<span  style={{fontWeight:500}}>{` ${getLabel(allSubCategory, decodeSubCategory, 'sub_name', "")}`}</span></Typography>
                        <Typography sx={{fontWeight:600}}>Product:<span  style={{fontWeight:500}}>{` ${getLabel(allProduct, decodeProduct, 'prod_name', "")}`}</span></Typography>

                    </Box>
                     }

                   {initialLoad && <Box sx={{ p: 0, backgroundColor: "#fff",
                                borderRadius: "10px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)", }}>
                        <Typography sx={{px:2.3,pt:1,pb:-1,fontFamily:'giespira',fontSize:'18.6px',color:'#121212'}}>Trend Analysis Data-{selYear.format('YYYY')}</Typography>
                        <DataTable
                            data={tableData}
                            columns={COLUMNS}
                            showHeader={false}
                            hideSubHeader
                            rowStyle={rowStyle}
                        />
                    </Box>
                  }
                </Box>

                <Dialog open={filtersOpen} aria-labelledby="filters-dialog"
                    PaperProps={{
                        sx: { width: { lg: "550px", md: "550px", sm: "450px" }, position: "absolute", top: 10, borderRadius: 1 },
                    }}>
                    <DialogTitle>
                        <Typography sx={{ fontSize: '1.2rem' }}>Filters</Typography>
                        <IconButton aria-label="close" onClick={() => setFiltersOpen(false)}
                            sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                            <CloseIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </DialogTitle>
                    <Divider />
                    <DialogContent>
                        <Grid container spacing={0.95}>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="zone">Zone</InputLabel>
                                    <Select MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        value={selZone} onChange={(e) => {
                                            setSelRegion(0)
                                            setAllRegion([])
                                            setSelZone(e.target.value)}}
                                        labelId="zone" label="Zone" size="small" fullWidth>
                                        <MenuItem value={0}>All</MenuItem>
                                        {allZone.map((val) => (<MenuItem key={val.id} value={val.id}>{val.zone_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="region">Region</InputLabel>
                                    <Select MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        value={selRegion} labelId="region"
                                        onChange={(e) => setSelRegion(e.target.value)} label="Region" size="small">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allRegion.map((val) => (<MenuItem key={val.id} value={val.id}>{val.reg_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="area">Area</InputLabel>
                                    <Select MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        value={selArea} onChange={(e) => setSelArea(e.target.value)}
                                        labelId="area" label="Area" size="small">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allArea.map((val) => (<MenuItem key={val.id} value={val.id}>{val.area_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="territory">Territory</InputLabel>
                                    <Select value={selTerritory}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        onChange={(e) => setSelTerritory(e.target.value)}
                                        size="small" label="Territory" labelId="territory">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allTerritory.map((val) => (<MenuItem key={val.id} value={val.id}>{val.ter_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="distributor">Distributor</InputLabel>
                                    <Select value={selDistributor}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        onChange={(e) => setSelDistributor(e.target.value)}
                                        size="small" labelId="distributor" label="Distributor">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allDistributor.map((val) => (<MenuItem key={val.id} value={val.id}>{val.stk_code}-{val.stk_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="category">Category</InputLabel>
                                    <Select value={selCategory}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        onChange={(e) =>{ 
                                            setSelSubCategory(0)
                                            setAllSubCategory([])
                                            setSelCategory(e.target.value)}}
                                        size="small" labelId="category" label="Category">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allCatData.map((val) => (<MenuItem key={val.id} value={val.id}>{val.cat_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="sub_category">Sub Category</InputLabel>
                                    <Select value={selSubCategory}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        onChange={(e) => {
                                            setSelProduct(0)
                                            setAllProduct([])
                                            setSelSubCategory(e.target.value)}}
                                        size="small" labelId="sub_category" label="Sub Category">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allSubCategory.map((val) => (<MenuItem key={val.id} value={val.id}>{val.sub_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 4, lg: 3, xs: 12 }}>
                                <FormControl sx={{ width: '100%' }}>
                                    <InputLabel id="product">Product</InputLabel>
                                    <Select value={selProduct}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                        onChange={(e) => setSelProduct(e.target.value)}
                                        size="small" labelId="product" label="Product">
                                        <MenuItem value={0}>All</MenuItem>
                                        {allProduct.map((val) => (<MenuItem key={val.id} value={val.id}>{val.prod_name}</MenuItem>))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" sx={{ textTransform: 'none' }} onClick={handleApply}>
                            Apply
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}

export default PrimarySales;