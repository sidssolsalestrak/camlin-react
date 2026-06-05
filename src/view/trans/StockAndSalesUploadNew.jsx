import React, { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../layout';
import {
    Box, Button, Typography, Switch, TextField, Autocomplete
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import CircularProgressLoading from '../../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import dayjs from 'dayjs';
import axios from "../../services/api";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useToast from '../../utils/useToast';
import DataTable from '../../utils/dataTable';
import ConfirmationDialog from "../../utils/confirmDialog";
import { excelWithFilters } from '../../utils/ExcelWithFilters';

const headContainer = {
    background: "#fff",
    display: "flex",
    flexDirection: 'column',
    gap: 2,
    m: 1.5,
    p: 1.5,
    borderRadius: '10px',
    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "16px 18px",
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
};

const encode = (val) => btoa(String(val || ""));

const safeDecode = (val) => {
    try {
        if (!val || val === "undefined" || val === "null") return null;
        return atob(val);
    } catch {
        return null;
    }
};

const cellSx = (readOnly = false) => ({
    '& .MuiInputBase-root': {
        height: 32,
        minWidth: '5rem',
        ...(readOnly ? { backgroundColor: '#EEEEEE' } : {})
    },
    '& .MuiInputBase-input': { padding: '4px 8px' },
});

const StockAndSalesUploadNew = () => {
    let { closeDate, stkid, stkLabel } = useParams();

    const decodedMonth = safeDecode(closeDate);
    const decodedDistributor = safeDecode(stkid);
    const decodedLabel = safeDecode(stkLabel);

    const location = useLocation();
    const showAlert = useToast();
    const navigate = useNavigate();

    const [month, setMonth] = useState(dayjs().startOf("month"));
    const [formData, setFormData] = useState({ Distributor: "0" });
    const [progress, setProgress] = useState(null);
    const [distribute, setDistribute] = useState([]);
    const [withValues, setWithValues] = useState(true);
    const [salesData, setSalesData] = useState([]);
    const [modifyLoading, setModifyLoading] = useState(false)
    const [masId, setMasId] = useState(0);
    const [loading, setLoading] = useState(false);

    const showToggle = formData.Distributor !== "0" && parseInt(formData.Distributor) > 0;

    const handleChange = (name, val) =>
        setFormData(prev => ({ ...prev, [name]: val }));

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

    const showUpdateConfirmation = (row) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: `Are you sure want to ${masId > 0 ? "Update" : "Submit"} Stock & Sales for ${month ? dayjs(month).format("MMM YYYY") : null}`,
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleSubmit(),
        });
    };

    const fetchDistributor = async () => {
        try {
            const res = await axios.post('/stock_and_sales_stklist');
            setDistribute(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
            console.error("fetchDistributor err", err);
            setDistribute([]);
        }
    };

    useEffect(() => { fetchDistributor(); }, []);

    const fetchTableData = async ({ mtd, stkID, val }) => {
        try {
            const res = await axios.post('/stock_sales', { month: mtd, stk_id: stkID, value: val });
            const resData = res.data?.data || {};
            const rows = Array.isArray(resData.salesdata) ? resData.salesdata : [];
            const mid = resData.mas_id ?? 0;

            const initialized = rows.map(row => ({
                ...row,
                open_qty: row.open_qty ?? 0,
                pur_qty: row.pur_qty ?? 0,
                tot_qty: row.tot_qty ?? 0,
                sec_qty: row.sec_qty ?? 0,
                physical_qty: row.physical_qty ?? 0,
            }));

            setSalesData(initialized);
            setMasId(mid);
        } catch (err) {
            console.error("fetchTableData err", err);
            setSalesData([]);
            setMasId(0);
        }
    };

    const handleload = () => {
        if (!formData.Distributor || formData.Distributor === "0") {
            showAlert.warning('Please Select Distributor');
            return;
        }
        const selected = distribute.find(d => String(d.id) === String(formData.Distributor));
        const encDate = encode(dayjs(month).format("YYYY-MM-DD"));
        const encStkId = encode(formData.Distributor);
        const encLabel = encode(
            selected
                ? `${selected.stk_code} - ${selected.stk_name}`
                : String(formData.Distributor)
        );
        navigate(`/input/stock_sales/${encDate}/${encStkId}/${encLabel}`);
    };

    const handleToggle = async (checked) => {
        setWithValues(checked);
        if (!decodedMonth || !decodedDistributor) return;
        setLoading(true);
        await fetchTableData({
            mtd: dayjs(decodedMonth).format("YYYY-MM-DD"),
            stkID: decodedDistributor,
            val: checked ? 1 : 0,
        });
        setLoading(false);
    };

    useEffect(() => {
        const loadData = async () => {
            if (!decodedDistributor && !decodedMonth) {
                setMonth(dayjs().startOf("month"));
                setFormData({ Distributor: "0" });
                setSalesData([]);
                setMasId(0);
                return;
            }

            setMonth(dayjs(decodedMonth));

            if (distribute.length > 0) {
                const match = distribute.find(d => String(d.id) === String(decodedDistributor));
                if (match) handleChange("Distributor", String(match.id));
            } else {
                handleChange("Distributor", String(decodedDistributor));
            }

            setWithValues(true);
            setLoading(true);
            await fetchTableData({
                mtd: dayjs(decodedMonth).format("YYYY-MM-DD"),
                stkID: decodedDistributor,
                val: 1,
            });
            setLoading(false);
        };

        loadData();
    }, [closeDate, stkid, distribute]);

    const handleInputChange = (prodId, field, rawValue) => {
        setSalesData(prev =>
            prev.map(row => {
                if (row.prod_id !== prodId) return row;

                const value = rawValue === "" ? 0 : Number(rawValue);
                const updated = { ...row, [field]: value };

                if (field === "open_qty" || field === "pur_qty") {
                    updated.tot_qty = Number(updated.open_qty) + Number(updated.pur_qty);
                    updated.sec_qty = updated.tot_qty - Number(updated.physical_qty);
                }
                if (field === "physical_qty") {
                    updated.sec_qty = Number(updated.tot_qty) - value;
                }

                return updated;
            })
        );
    };

    const tableData = useMemo(() => {
        if (!salesData.length) return [];
        const rows = [];
        let prevCat = null;

        salesData.forEach((row, idx) => {
            const cat = row.cat_name || "Uncategorized";
            if (cat !== prevCat) {
                rows.push({
                    id: `cat-header-${cat}-${idx}`,
                    _rowType: "cat_header",
                    cat_name: cat,
                });
                prevCat = cat;
            }
            rows.push({ ...row, id: row.prod_id ?? `row-${idx}`, _rowType: "data" });
        });

        return rows;
    }, [salesData]);

    const rowStyle = (row) => {
        if (row._rowType === "cat_header") {
            return {
                "& td": {
                    backgroundColor: "skyblue !important",
                    color: "#000",
                    fontWeight: 700,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                },
            };
        }
        return {};
    };

    const columns = [
        {
            field: "prod_code",
            headerName: "PRODUCT CODE",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header"
                    ? <strong>{row.cat_name}</strong>
                    : <Typography sx={{ color: '#212121' }}>{value}</Typography>,
        },
        {
            field: "prod_name",
            headerName: "NAME",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <Typography sx={{  whiteSpace: "nowrap", color: '#212121' }}>
                        {value}
                    </Typography>
                ),
        },
        {
            field: "prod_uom",
            headerName: "UOM",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? ""} sx={cellSx(true)}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center" } }} />
                ),
        },
        {
            field: "stk_price",
            headerName: "MRP",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx(true)}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center" } }} />
                ),
        },
        {
            field: "open_qty",
            headerName: "OPENING STOCK (O)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx()}
                        inputProps={{ style: { textAlign: "center" } }}
                        onChange={e => handleInputChange(row.prod_id, "open_qty",
                            e.target.value.replace(/\D/g, ""))} />
                ),
        },
        {
            field: "pur_qty",
            headerName: "PRIMARY QTY (P)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx()}
                        inputProps={{ style: { textAlign: "center" } }}
                        onChange={e => handleInputChange(row.prod_id, "pur_qty",
                            e.target.value.replace(/\D/g, ""))} />
                ),
        },
        {
            field: "tot_qty",
            headerName: "TOTAL STOCK (T=O+P)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx(true)}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center", color: "black" } }} />
                ),
        },
        {
            field: "sec_qty",
            headerName: "SEC. SALES (S=T-C)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx(true)}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center", color: "blue" } }} />
                ),
        },
        {
            field: "physical_qty",
            headerName: "CLOSING QTY (C)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField size="small" value={value ?? 0} sx={cellSx()}
                        inputProps={{ style: { textAlign: "center" } }}
                        onChange={e => handleInputChange(row.prod_id, "physical_qty",
                            e.target.value.replace(/\D/g, ""))} />
                ),
        },
    ];

    const handleSubmit = async () => {
        // Step 1: Validate — at least 1 product must have tot_qty or physical_qty > 0
        const hasValue = salesData.some(
            r => Number(r.tot_qty) > 0 || Number(r.physical_qty) > 0
        );
        if (!hasValue) {
            showAlert.error("At least 1 product should have a proper value");
            return;
        }

        // Step 2: Build payload — parallel arrays, same as PreviewStkSales
        const payload = {
            mas_id: masId,
            month: dayjs(month).format("YYYY-MM-DD"),
            stk_id: formData.Distributor,
            prod_code: salesData.map(r => r.prod_code),
            prod_id: salesData.map(r => r.prod_id),
            prod_name: salesData.map(r => r.prod_name),
            prod_uom: salesData.map(r => r.prod_uom),
            prod_price: salesData.map(r => r.stk_price ?? 0),
            open_qty: salesData.map(r => r.open_qty),
            pur_qty: salesData.map(r => r.pur_qty),
            tot_qty: salesData.map(r => r.tot_qty),
            sec_qty: salesData.map(r => r.sec_qty),
            physical_qty: salesData.map(r => r.physical_qty),
        };
        setModifyLoading(true)
        try {
            const saveRes = await axios.post('/stock_sales_save', payload);
            if (saveRes.data.status === 200) {
                showAlert.success(saveRes.data.message || (masId > 0 ? 'Updated successfully' : 'Saved successfully'));
                setMasId(saveRes.data.mas_id); // update masId so button switches to "Update"
            } else {
                showAlert.error(saveRes.data.message || 'Failed to save');
            }
        } catch (err) {
            console.error("Submit error:", err);
            showAlert.error('Failed to save');
        }
        finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    };

    const handleExcelExport = async () => {
        try {
            // ── 1. Build filters (matches excelWithFilters signature) ──────────
            const selectedDist = distribute.find(
                d => String(d.id) === String(formData.Distributor)
            );
            const distLabel = selectedDist
                ? `${selectedDist.stk_code} - ${selectedDist.stk_name}`
                : String(formData.Distributor);

            const filters = [
                { label: `Month - ${dayjs(month).format("MMM YYYY")}`, bold: false, sz: 10 },
                { label: `Distributor : ${distLabel}`, bold: false, sz: 10 },
            ];

            // ── 2. Map your columns → { id, label } (skip cat_header rows) ────
            const exportColumns = [
                { id: "prod_code", label: "PRODUCT CODE" },
                { id: "prod_name", label: "NAME" },
                { id: "prod_uom", label: "UOM" },
                { id: "stk_price", label: "MRP" },
                { id: "open_qty", label: "OPENING STOCK (O)" },
                { id: "pur_qty", label: "PRIMARY QTY (P)" },
                { id: "tot_qty", label: "TOTAL STOCK (T=O+P)" },
                { id: "sec_qty", label: "SEC. SALES (S=T-C)" },
                { id: "physical_qty", label: "CLOSING QTY (C)" },
            ];

            // ── 3. Flatten tableData: convert cat_header rows → styled data rows
            //       excelWithFilters colours rows that have _isGroupHeader = true
            const exportData = tableData.map(row => {
                if (row._rowType === "cat_header") {
                    // Spread cat_name into prod_code column, mark as group header
                    return {
                        prod_code: row.cat_name,
                        prod_name: "",
                        prod_uom: "",
                        stk_price: "",
                        open_qty: "",
                        pur_qty: "",
                        tot_qty: "",
                        sec_qty: "",
                        physical_qty: "",
                        _isGroupHeader: true,   // triggers skyblue-ish styling in excelWithFilters
                        bgcolor:"87CEEB",
                        color:"000000"
                    };
                }
                return row;
            });

            // ── 4. Fire export ─────────────────────────────────────────────────
            const fileName = `stock_sale_${dayjs(month).format("MMM_YYYY")}`;

            await excelWithFilters(
                exportData,
                exportColumns,
                fileName,
                filters,
                setProgress,                    
            );
        } catch (err) {
            console.error("Excel export error:", err);
            showAlert.error("Failed to export Excel");
        }
    };
    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: location.pathname },
            { label: "Stock & Sales Upload", path: location.pathname },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">Stock & Sales</h1>
                </Box>
            </Box>

            {/* Filter bar */}
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Month"
                            format="MMM YYYY"
                            views={["month", "year"]}
                            value={month}
                            onChange={setMonth}
                            slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
                        />
                    </LocalizationProvider>

                    {/* ── Autocomplete Distributor ── */}
                    <Autocomplete
                        size="small"
                        sx={{ width: 200 }}
                        options={distribute}
                        getOptionLabel={(option) =>
                            option.stk_code && option.stk_name
                                ? `${option.stk_code} - ${option.stk_name}`
                                : ""
                        }
                        value={distribute.find(d => String(d.id) === String(formData.Distributor)) || null}
                        onChange={(_, newValue) =>
                            handleChange("Distributor", newValue ? String(newValue.id) : "0")
                        }
                        isOptionEqualToValue={(option, value) =>
                            String(option.id) === String(value.id)
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Distributor" required />
                        )}
                        ListboxProps={{ style: { maxHeight: 200 } }}
                    />

                    <Button variant="contained" color="primary" onClick={handleload}>
                        Search
                    </Button>

                    {showToggle && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">Show All</Typography>
                            <Switch
                                checked={withValues}
                                onChange={e => handleToggle(e.target.checked)}
                                color="primary"
                            />
                            <Typography variant="body2" color="text.secondary">With Values</Typography>
                        </Box>
                    )}

                    {progress
                        ? <CircularProgressLoading progress={progress} />
                        : <AiOutlineFileExcel
                            style={{ color: "green", cursor: "pointer", height: 30, width: 30 }}
                            title="Download Excel"
                            onClick={()=>handleExcelExport()}
                        />
                    }
                </Box>
            </Box>

            {/* Table */}
            <Box sx={{
                m: 2,
                background: "#fff",
                borderRadius: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                "& td": { padding: "6px 8px" },
            }}>
                <Typography sx={{ px:2,py:1 }} variant="h6">Product View</Typography>
                <DataTable loading={loading} columns={columns} data={tableData} rowStyle={rowStyle} />
                
            </Box>

            {/* Submit / Update */}
            <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary" onClick={showUpdateConfirmation}>
                    {masId > 0 ? 'Update' : 'Submit'}
                </Button>
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
        </Layout>
    );
};

export default StockAndSalesUploadNew;