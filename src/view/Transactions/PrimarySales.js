import React, { useEffect, useState } from "react";
import Layout from "../../layout";
import {
    Box, Grid, Typography, MenuItem, Select, InputLabel, FormControl,
    Autocomplete, TextField
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AiOutlineFileExcel } from 'react-icons/ai';
import CircularProgressLoading from '../../utils/CircularProgressLoading';
import { excelWithFilters } from '../../utils/ExcelWithFilters';
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import dayjs from "dayjs";
import useToast from "../../utils/useToast";
import { useParams, useNavigate } from "react-router-dom";

function PrimarySalesTransact() {

    const { decMonth, decStkId, decValue } = useParams();

    const safeDecode = (val) => {
        try {
            if (!val || val === "undefined" || val === "null") return null;
            return atob(val);
        } catch { return null; }
    };

    const initMonth = safeDecode(decMonth) ? dayjs(safeDecode(decMonth), "MMM YYYY") : dayjs();
    const initStkId = safeDecode(decStkId) ? Number(safeDecode(decStkId)) : 0;

    const [dateselect, setDateselect] = useState(initMonth);
    const [stockist,   setStockist]   = useState(initStkId);
    const [catId,      setCatId]      = useState(0);
    const [stkList,    setStkList]    = useState([]);
    const [subCatList, setSubCatList] = useState([]);
    const [salesData,  setSalesData]  = useState([]);
    const [progress,   setProgress]   = useState(null);
    const toast    = useToast();
    const navigate = useNavigate();

    const menuProps = {
        PaperProps: { style: { maxHeight: 250 } },
        MenuListProps: {
            sx: {
                "& .MuiMenuItem-root": {
                    minHeight: "25px",
                    py: "2px",
                },
            },
        },
    };

    const updateUrl = (month, stkId, cId) => {
        const m = btoa(dayjs(month).format("MMM YYYY"));
        const s = btoa(String(stkId));
        const c = btoa(String(cId));
        navigate(`/reports/primary_sale_report/${m}/${s}/${c}`, { replace: true });
    };

    useEffect(() => {
        fetchStkList();
        fetchSubCat();
    }, []);

    const fetchStkList = async () => {
        try {
            const response = await api.post('/stock_and_sales_stklist', {});
            setStkList(response.data.data ?? []);
        } catch (err) {
            console.log("fetchStkList error", err);
        }
    };

    const fetchSubCat = async () => {
        try {
            const response = await api.post('/getSubCatTransact', {});
            setSubCatList(response.data.data ?? []);
        } catch (err) {
            console.log("fetchSubCat error", err);
        }
    };

    useEffect(() => {
        if (!stockist || Number(stockist) === 0) return;
        fetchPrimarySales(dateselect, stockist, catId);
        updateUrl(dateselect, stockist, catId);
    }, [dateselect, stockist, catId]);

    const fetchPrimarySales = async (month, stkId, cId) => {
        try {
            const response = await api.post('/getPrimarySales', {
                month:  dayjs(month).format("YYYY-MM-DD"),
                stk_id: stkId,
                cat_id: cId,
            });
            setSalesData(response.data.data ?? []);
        } catch (err) {
            console.log("fetchPrimarySales error", err);
        }
    };

    const handleMonthChange = (newVal) => {
        if (!newVal || !newVal.isValid()) return;
        setDateselect(newVal);
    };

    const handleStockistChange = (event, selectedOption) => {
        if (!selectedOption) {
            setStockist(0);
            return;
        }
        setStockist(selectedOption.id);
    };

    const { tableData, totQty, totVal } = React.useMemo(() => {
        if (!salesData.length) return { tableData: [], totQty: 0, totVal: 0 };

        const rows = [];
        let prevCat = null;
        let tQty = 0, tVal = 0, idx = 1;

        salesData.forEach((row) => {
            if (row.cat_id !== prevCat) {
                rows.push({
                    id:       `cat-header-${row.cat_id}-${idx}`,
                    _rowType: "cat_header",
                    cat_name: row.cat_name,
                });
                prevCat = row.cat_id;
            }
            rows.push({
                ...row,
                id:       row.prod_code ?? `row-${idx}`,
                _rowType: "data",
                sl_no:    idx,
            });
            tQty += Number(row.sale_qty) || 0;
            tVal += Number(row.sale_val) || 0;
            idx++;
        });

        return { tableData: rows, totQty: tQty, totVal: tVal };
    }, [salesData]);

    const dataWithTotal = tableData.length
        ? [
            ...tableData,
            {
                id:        "grand-total",
                _rowType:  "total",
                prod_name: "GRAND TOTAL",
                sale_qty:  totQty,
                sale_val:  parseFloat(totVal).toFixed(2),
            },
          ]
        : [];

    const finalRowStyle = (row) => {
        if (row._rowType === "cat_header" || row._rowType === "total") {
            return {
                "& td": {
                    backgroundColor: "#06060a1c !important",
                    fontWeight: 700,
                    pointerEvents: "none",
                },
            };
        }
        return {};
    };

    const finalColumns = [
        {
            field:      "sl_no",
            headerName: "#",
            width:      60,
            renderCell: ({ row, value }) =>
                row._rowType !== "data" ? null : <Typography>{value}</Typography>,
        },
        {
            field:      "prod_name",
            headerName: "PRODUCT NAME",
            flex:       1,
            renderCell: ({ row, value }) => {
                if (row._rowType === "cat_header") return <strong>{row.cat_name}</strong>;
                if (row._rowType === "total")      return <strong>GRAND TOTAL</strong>;
                return (
                    <Typography sx={{ whiteSpace: "nowrap" }}>
                        {row.prod_code} | {value}
                    </Typography>
                );
            },
        },
        {
            field:      "sale_qty",
            headerName: "SALES QTY",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <Typography sx={{ textAlign: "center", width: "100%", fontWeight: row._rowType === "total" ? 700 : 400 }}>
                        {value}
                    </Typography>
                ),
        },
        {
            field:      "sale_val",
            headerName: "SALES VALUE",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <Typography sx={{ textAlign: "center", width: "100%", fontWeight: row._rowType === "total" ? 700 : 400 }}>
                        {value}
                    </Typography>
                ),
        },
    ];

    const handleExcelDownload = async () => {
        if (!stockist || Number(stockist) === 0) {
            toast.error("Please Select Distributor");
            return;
        }
        try {
            const stkLabel = stkList.find((s) => String(s.id) === String(stockist));
            const stkName  = stkLabel ? `${stkLabel.stk_code} ${stkLabel.stk_name}` : String(stockist);

            const filters = [
                { label: `Month : ${dayjs(dateselect).format("MMM YYYY")}`, bold: false, sz: 10 },
                { label: `Distributor : ${stkName}`,                         bold: false, sz: 10 },
            ];

            const exportColumns = [
                { id: "sl_no",     label: "#"            },
                { id: "prod_name", label: "PRODUCT NAME" },
                { id: "sale_qty",  label: "SALES QTY"    },
                { id: "sale_val",  label: "SALES VALUE"  },
            ];

            const exportData = dataWithTotal.map((row) => {
                if (row._rowType === "cat_header") {
                    return {
                        sl_no:          "",
                        prod_name:      row.cat_name,
                        sale_qty:       "",
                        sale_val:       "",
                        _isGroupHeader: true,
                        bgcolor:        "D3D3D3",
                        color:          "000000",
                    };
                }
                if (row._rowType === "total") {
                    return {
                        sl_no:          "",
                        prod_name:      "GRAND TOTAL",
                        sale_qty:       row.sale_qty,
                        sale_val:       row.sale_val,
                        _isGroupHeader: true,
                        bgcolor:        "D3D3D3",
                        color:          "000000",
                    };
                }
                return {
                    sl_no:     row.sl_no,
                    prod_name: `${row.prod_code} | ${row.prod_name}`,
                    sale_qty:  row.sale_qty,
                    sale_val:  row.sale_val,
                };
            });

            const fileName = `Primary_Sales_${dayjs(dateselect).format("YYYY-MM-DD")}`;
            await excelWithFilters(exportData, exportColumns, fileName, filters, setProgress, 0, { headerFontSize: 11, cellFontSize: 11 });

        } catch (err) {
            console.error("Excel export error:", err);
            toast.error("Failed to export Excel");
        }
    };

    return (
        <Layout
            breadcrumb={[
                { label: "Home",          path: "/" },
                { label: "Reports",       path: "/reports/primary_sale_report" },
                { label: "Primary Sales", path: "/reports/primary_sale_report" },
            ]}
        >
            <Box p={2} display="flex" flexDirection="column" gap={2}>

                <Box><h2>PRIMARY SALES</h2></Box>

                <Box sx={{
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    padding: "16px 18px",
                    borderRadius: "10px",
                }}>
                    <Grid container spacing={1.5} alignItems="flex-end">

                        <Grid size={{ xs: 12, md: 3 }}>
                            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Month</Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    views={["month", "year"]}
                                    value={dateselect}
                                    onChange={handleMonthChange}
                                    format="MMM YYYY"
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <Autocomplete
                                size="small"
                                fullWidth
                                options={stkList}
                                value={stkList.find((s) => String(s.id) === String(stockist)) || null}
                                onChange={handleStockistChange}
                                getOptionLabel={(option) => `${option.stk_code} ${option.stk_name}`}
                                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                                ListboxProps={{ style: { maxHeight: 250 } }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Distributor" placeholder="Select Distributor" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3, lg:2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="category-label">Category</InputLabel>
                                <Select
                                    labelId="category-label"
                                    value={catId}
                                    onChange={(e) => setCatId(e.target.value)}
                                    label="Category"
                                    MenuProps={menuProps}
                                >
                                    <MenuItem value={0}>ALL</MenuItem>
                                    {subCatList.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>
                                            {cat.cat_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex", alignItems: "center" }}>
                            {progress
                                ? <CircularProgressLoading progress={progress} />
                                : <AiOutlineFileExcel
                                    style={{ color: "green", cursor: "pointer", height: 30, width: 30 }}
                                    title="Download Excel"
                                    onClick={handleExcelDownload}
                                  />
                            }
                        </Grid>

                    </Grid>
                </Box>

                {salesData.length > 0 && (
                    <Box sx={{
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "12px 18px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                    }}>
                        <Typography sx={{ fontWeight: 600 }}>
                            TOTAL &rarr; <span>{salesData.length}</span>
                        </Typography>
                    </Box>
                )}

                <DataTable
                    columns={finalColumns}
                    data={dataWithTotal}
                    rowStyle={finalRowStyle}
                    getRowId={(row) => row.id}
                    searchPlaceholder="Type ProdName to Search"
                />


            </Box>
        </Layout>
    );
}

export default PrimarySalesTransact;