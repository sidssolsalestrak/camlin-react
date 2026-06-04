import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../../layout';
import {
    Box, Button, FormControl, InputLabel, MenuItem,
    Select, Typography, Switch, FormControlLabel
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import CircularProgressLoading from '../../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import dayjs from 'dayjs';
import axios from "../../services/api";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useToast from '../../utils/useToast';

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
}

const menuStyle = {
    PaperProps: {
        style: { maxHeight: 200 }
    }
}

const encode = (val) =>
    btoa(String(val || ""))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

const decode = (str) => {
    if (!str) return "";
    const restored = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = restored + "==".slice((restored.length % 4) || 4);
    try { return atob(padded); } catch { return ""; }
};

// -------------------------------------------------------------------
// Editable cell input (mirrors PHP's <input> fields in each <td>)
// -------------------------------------------------------------------
const EditInput = ({ value, onChange, disabled = false, style = {} }) => (
    <input
        type="number"
        value={value ?? 0}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
            width: 70,
            textAlign: 'center',
            border: '1px solid #ccc',
            borderRadius: 3,
            padding: '2px 4px',
            fontSize: 12,
            color: disabled ? '#555' : 'black',
            background: disabled ? '#f5f5f5' : '#fff',
            ...style
        }}
    />
);

// -------------------------------------------------------------------
// Product table — grouped by category (sky-blue header rows like PHP)
// -------------------------------------------------------------------
const ProductTable = ({ rows, onChange }) => {
    if (!rows || rows.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No data found.
            </Typography>
        );
    }

    const thStyle = {
        whiteSpace: 'nowrap',
        fontSize: 12,
        padding: '5px',
        border: '1px solid #a9a9a9',
        background: '#f0f0f0',
        fontWeight: 600,
    };

    const tdStyle = {
        fontSize: 12,
        padding: '4px 5px',
        border: '1px solid #ddd',
    };

    let lastCatId = null;

    return (
        <Box sx={{ overflowX: 'auto' }}>
            <table
                style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: '#fff',
                    tableLayout: 'auto',
                }}
            >
                <thead>
                    <tr>
                        {[
                            'PRODUCT CODE', 'NAME', 'UOM', 'MRP',
                            'OPENING STOCK (O)', 'PRIMARY QTY (P)',
                            'TOTAL STOCK (T=O+P)', 'SEC. SALES (S=T-C)',
                            'CLOSING QTY (C)'
                        ].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => {
                        const showCatHeader = row.cat_id !== lastCatId;
                        lastCatId = row.cat_id;

                        return (
                            <React.Fragment key={`${row.prod_id}-${idx}`}>
                                {showCatHeader && (
                                    <tr style={{ background: 'skyblue', fontWeight: 700 }}>
                                        <td colSpan={9} style={{ ...tdStyle, border: '1px solid #a9a9a9' }}>
                                            {row.cat_name}
                                        </td>
                                    </tr>
                                )}
                                <tr style={{ background: idx % 2 === 0 ? '#f7f7f7' : '#fff' }}>
                                    {/* Hidden fields — kept in state, not rendered visibly */}
                                    {/* prod_id, prod_code, prod_name tracked via rows state in parent */}

                                    <td style={tdStyle}>{row.prod_code}</td>
                                    <td style={tdStyle}>{row.prod_name}</td>

                                    {/* UOM — editable like PHP */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.prod_uom}
                                            disabled
                                        />
                                    </td>

                                    {/* MRP / stk_price — disabled */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.stk_price}
                                            disabled
                                        />
                                    </td>

                                    {/* OPENING STOCK — editable */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.open_qty}
                                            onChange={v => onChange(idx, 'open_qty', v)}
                                        />
                                    </td>

                                    {/* PRIMARY QTY (pur_qty) — editable */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.pur_qty}
                                            onChange={v => onChange(idx, 'pur_qty', v)}
                                        />
                                    </td>

                                    {/* TOTAL STOCK (tot_qty) — disabled, computed */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.tot_qty}
                                            disabled
                                        />
                                    </td>

                                    {/* SEC. SALES (sec_qty) — disabled, blue text */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.sec_qty}
                                            disabled
                                            style={{ color: 'blue' }}
                                        />
                                    </td>

                                    {/* CLOSING QTY (physical_qty) — editable */}
                                    <td style={tdStyle}>
                                        <EditInput
                                            value={row.physical_qty}
                                            onChange={v => onChange(idx, 'physical_qty', v)}
                                        />
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </Box>
    );
};

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------
const StockAndSalesUpload = () => {
    const [searchParams] = useSearchParams();
    const encodedMonth = searchParams.get('mtd');
    const encodedDistributor = searchParams.get('distribute');
    const decodedMonth = encodedMonth ? decode(encodedMonth) : null;
    const decodedDistributor = encodedDistributor ? decode(encodedDistributor) : null;

    const location = useLocation();
    const showAlert = useToast();
    const navigate = useNavigate();

    const [month, setMonth] = useState(dayjs().startOf("month"));
    const [formData, setFormData] = useState({ Distributor: "0" });
    const [progress, setProgress] = useState(null);
    const [distribute, setdistribute] = useState([]);

    // PHP: value=1 means "With Values" (INNER JOIN), value=0 means "Show All" (LEFT JOIN)
    // Toggle: true = "With Values" (value=1), false = "Show All" (value=0)
    // PHP default: value=1 (checked = With Values)
    const [withValues, setWithValues] = useState(true);

    // salesData is kept in local state so editable cells can update it
    const [salesData, setSalesData] = useState([]);
    const [masId, setMasId] = useState(0);
    const [loading, setLoading] = useState(false);

    // Show toggle only when a distributor is selected (mirrors PHP's $hide)
    const showToggle = formData.Distributor !== "0" && parseInt(formData.Distributor) > 0;

    const handleChange = (name, val) => {
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // ---- Fetch distributor list ----
    const fetchDistributor = async () => {
        try {
            const response = await axios.post('/stock_and_sales_stklist');
            setdistribute(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            console.error("fetch distributor err", err);
            setdistribute([]);
        }
    };

    useEffect(() => { fetchDistributor(); }, []);

    // ---- Fetch table data ----
    // value: 1 = With Values (INNER JOIN), 0 = Show All (LEFT JOIN)  — matches PHP
    const fetchTableData = async ({ mtd, stkID, val }) => {
        try {
            const payload = { month: mtd, stk_id: stkID, value: val };
            const response = await axios.post('/stock_sales', payload);

            // API returns: { data: { salesdata: [...], mas_id: N } }
            const resData = response.data?.data || {};
            const rows = Array.isArray(resData.salesdata) ? resData.salesdata : [];
            const mid = resData.mas_id ?? 0;

            setSalesData(rows);
            setMasId(mid);
        } catch (error) {
            console.error("fetchTableData error:", error);
            setSalesData([]);
            setMasId(0);
        }
    };

    // ---- Search button ----
    const handleload = () => {
        if (!formData.Distributor || formData.Distributor === "0") {
            showAlert.warning('Please Select Distributor');
            return;
        }
        const params = new URLSearchParams();
        params.append('mtd', encode(dayjs(month).format("YYYY-MM-DD")));
        if (formData.Distributor > 0) params.append('distribute', encode(formData.Distributor));
        navigate(`/input/stock_sales?${params.toString()}`);
    };

    // ---- Toggle "Show All" / "With Values" ----
    // PHP: onchange calls toggleQty2() which re-fetches with new value
    const handleToggle = async (checked) => {
        setWithValues(checked);
        if (!decodedMonth || !decodedDistributor) return;
        setLoading(true);
        await fetchTableData({
            mtd: dayjs(decodedMonth).format("YYYY-MM-DD"),
            stkID: decodedDistributor,
            val: checked ? 1 : 0,   // 1 = With Values, 0 = Show All
        });
        setLoading(false);
    };

    // ---- URL param change effect ----
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
            setFormData({ Distributor: decodedDistributor });
            setWithValues(true); // PHP default: value=1 (With Values)

            setLoading(true);
            await fetchTableData({
                mtd: dayjs(decodedMonth).format("YYYY-MM-DD"),
                stkID: decodedDistributor,
                val: 1,  // PHP default value=1
            });
            setLoading(false);
        };

        loadData();
    }, [decodedMonth, decodedDistributor]);

    // ---- Inline cell edit handler ----
    const handleCellChange = (rowIdx, field, value) => {
        setSalesData(prev => {
            const updated = [...prev];
            updated[rowIdx] = { ...updated[rowIdx], [field]: value };
            return updated;
        });
    };

    // ---- Submit / Update ----
    const handleSubmit = async () => {
        // Build payload matching PHP's hidden fields per row
        const payload = {
            mas_id: masId,
            stk_id: formData.Distributor,
            month: dayjs(month).format("YYYY-MM-DD"),
            rows: salesData.map(row => ({
                prod_id: row.prod_id,
                prod_code: row.prod_code,
                prod_name: row.prod_name,
                prod_uom: row.prod_uom,
                open_qty: row.open_qty,
                pur_qty: row.pur_qty,
                pur_free: row.pur_free ?? 0,
                pur_ret_qty: row.pur_ret_qty ?? 0,
                pur_ret_free: row.pur_ret_free ?? 0,
                saleable_ret_qty: row.saleable_ret_qty ?? 0,
                damaged_ret_qty: row.damaged_ret_qty ?? 0,
                stk_in_qty: row.stk_in_qty ?? 0,
                stk_out_qty: row.stk_out_qty ?? 0,
                tot_qty: row.tot_qty,
                sec_qty: row.sec_qty,
                sec_free_qty: row.sec_free_qty ?? 0,
                physical_qty: row.physical_qty,
                transit_qty: row.transit_qty ?? 0,
                sec_sale_diff: row.sec_sale_diff ?? 0,
            }))
        };

        try {
            // Replace with your actual save endpoint
            await axios.post('/stock_sales_save', payload);
            showAlert.success(masId > 0 ? 'Updated successfully' : 'Saved successfully');
        } catch (err) {
            console.error("Submit error:", err);
            showAlert.error('Failed to save');
        }
    };

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: location.pathname },
            { label: "Stock & Sales Upload" },
        ]}>
            {/* Page title */}
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
                            onChange={(newValue) => setMonth(newValue)}
                            slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
                        />
                    </LocalizationProvider>

                    <FormControl size="small" sx={{ width: 200 }} required>
                        <InputLabel id="Distributor">Distributor</InputLabel>
                        <Select
                            id="Distributor"
                            label="Distributor"
                            MenuProps={menuStyle}
                            value={formData.Distributor}
                            onChange={(e) => handleChange("Distributor", e.target.value)}
                            labelId="Distributor"
                            variant="outlined"
                        >
                            <MenuItem style={{ fontSize: "11px" }} value="0">Select Distributor</MenuItem>
                            {distribute.map((val) => (
                                <MenuItem sx={{ textWrap: 'wrap' }} key={val.id} value={val.id}>
                                    {val.stk_code} - {val.stk_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button variant='contained' color="primary" onClick={handleload}>
                        Search
                    </Button>

                    {/* Toggle: Show All / With Values — hidden until distributor selected (PHP: $hide) */}
                    {showToggle && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">Show All</Typography>
                            <Switch
                                checked={withValues}
                                onChange={(e) => handleToggle(e.target.checked)}
                                color="primary"
                            />
                            <Typography variant="body2" color="text.secondary">With Values</Typography>
                        </Box>
                    )}

                    {/* Excel export icon */}
                    {progress
                        ? <CircularProgressLoading progress={progress} />
                        : (
                            <span>
                                <AiOutlineFileExcel
                                    style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }}
                                    title="Download Excel"
                                />
                            </span>
                        )
                    }
                </Box>
            </Box>

            {/* Product View table */}
            <Box sx={headContainer}>
                <Typography variant="h6" color="initial">Product View</Typography>
                {loading
                    ? <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CircularProgressLoading progress={null} />
                    </Box>
                    : <ProductTable rows={salesData} onChange={handleCellChange} />
                }
            </Box>

            {/* Submit / Update button — label depends on masId like PHP's $btnval */}
            <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    {masId > 0 ? 'Update' : 'Submit'}
                </Button>
            </Box>
        </Layout>
    );
};

export default StockAndSalesUpload;