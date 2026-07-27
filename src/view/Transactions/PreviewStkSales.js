import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../layout";
import {
    Box, Grid, Typography, TextField, Button,
} from "@mui/material";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { useNavigate,useLocation } from "react-router-dom";
import ConfirmationDialog from "../../utils/confirmDialog";
import useToast from "../../utils/useToast";
import { getMasterPanel } from "../../services/masterPanelService";

function PreviewStkSales() {

    const safeDecode = (val) => {
        try {
            if (!val || val === "undefined" || val === "null") return null;
            return atob(val);
        } catch {
            return null;
        }
    };
    const [open, setOpen] = useState(false);

    let { closeDate, stkid, stkLabel } = useParams();
    const navigate = useNavigate();

    let decodemonth = closeDate !== null && closeDate !== "undefined" ? dayjs(safeDecode(closeDate)) : dayjs();
    let decodedStkId = safeDecode(stkid);
    let decodedlabel = safeDecode(stkLabel);
    const[masId,setMasId]=useState(0)
    let frmMonth = decodemonth ? dayjs(decodemonth).format("MMM YYYY") : null;
    const [modifyLoading, setModifyLoading] = useState(false)
    const toast = useToast()
    const [allPreviewData, setAllPreviewData] = useState([]);
    const location=useLocation()
    const [masterPanel, setMasterPanel] = useState({});
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

    const showConfirmConfirmation = (row) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: `Are you sure want to Submit Stock & Sales for ${frmMonth} ?`,
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleConfirm(),
        });
    };

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        if (!closeDate) return;
        fetchpreviewStkData();
    }, [closeDate, stkid]);

    const fetchpreviewStkData = async () => {
        try {
            let response = await api.post('/previewStkSales', { month: decodemonth, stk_id: decodedStkId });
            let data = Array.isArray(response.data.salesData) ? response.data.salesData : [];

            // ✅ Initialize editable fields from API data
            const initialized = data.map((row) => ({
                ...row,
                open_qty: row.open_qty ?? 0,
                pur_qty: row.pur_qty ?? 0,
                tot_qty: row.tot_qty ?? 0,
                sec_qty: row.sec_qty ?? 0,
                physical_qty: row.physical_qty ?? 0,
            }));
            if(response.data.mas_id){
                setMasId(response.data.mas_id)
            }

            setAllPreviewData(initialized);
        } catch (err) {
            console.log("fetchpreviewStkData error", err);
        }
    };

    // ✅ Handle input change — mirrors PHP jQuery logic
    const handleInputChange = (rowId, field, rawValue) => {
        setAllPreviewData((prev) =>
            prev.map((row) => {
                if (row.prod_id !== rowId) return row;

                const value = rawValue === "" ? 0 : Number(rawValue);
                const updated = { ...row, [field]: value };

                // Recalculate derived fields like PHP keyup handlers
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

    // ✅ Inject cat_name header rows into flat array
    const tableData = useMemo(() => {
        if (!allPreviewData.length) return [];

        const rows = [];
        let prevCat = null;

        allPreviewData.forEach((row, idx) => {
            const cat = row.cat_name || "Uncategorized";

            if (cat !== prevCat) {
                rows.push({
                    id: `cat-header-${cat}-${idx}`,
                    _rowType: "cat_header",
                    cat_name: cat,
                });
                prevCat = cat;
            }

            rows.push({
                ...row,
                id: row.prod_id ?? `row-${idx}`,
                _rowType: "data",
            });
        });

        return rows;
    }, [allPreviewData]);

    // ✅ Confirm — check existing then save (mirrors PHP confirm_stk_sale + insertstock_sales)
    const handleConfirm = async () => {
        setModifyLoading(true)
        try {
            // Step 1: Check if already exists
            const checkRes = await api.post('/check_stk_sales', {
                month: decodemonth,
                stk_id: decodedStkId,
            });

            if (checkRes.data.status !== 200) {
                toast.error(`Stock & Sales Already Exists for month ${frmMonth}`);
                return;
            }

            // Step 2: Validate — at least 1 product must have tot_qty or physical_qty > 0
            const hasValue = allPreviewData.some(
                (r) => Number(r.tot_qty) > 0 || Number(r.physical_qty) > 0
            );
            if (!hasValue) {
                toast.error("At least 1 product should have a proper value");
                return;
            }

            // Step 3: Build payload — mirrors PHP FormData fields
            const payload = {
                month: decodemonth,
                stk_id: decodedStkId,
                prod_code: allPreviewData.map((r) => r.prod_code),
                prod_id: allPreviewData.map((r) => r.prod_id),
                prod_name: allPreviewData.map((r) => r.prod_name),
                prod_uom: allPreviewData.map((r) => r.prod_uom),
                prod_price: allPreviewData.map((r) => r.stk_price),
                open_qty: allPreviewData.map((r) => r.open_qty),
                pur_qty: allPreviewData.map((r) => r.pur_qty),
                tot_qty: allPreviewData.map((r) => r.tot_qty),
                sec_qty: allPreviewData.map((r) => r.sec_qty),
                physical_qty: allPreviewData.map((r) => r.physical_qty),
            };

            const saveRes = await api.post('/saveSalesPreview', payload);

            if (saveRes.data.status === 200) {
                toast.success(saveRes.data.message || "Saved successfully");
                navigate(`/input/stock_sales/${closeDate}/${stkid}/${btoa("1")}`);
            } else {
                toast.error("Unable to Update");
            }

        } catch (err) {
            console.log("handleConfirm error", err);
            toast.error("Unable to Update");
        }
        finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    };

    const rowStyle = (row) => {
        if (row._rowType === "cat_header") {
            return {
                "& td": {
                    backgroundColor: "#c0c0c0 !important",
                    color: "#000000",
                    fontWeight: 800,
                    fontSize: "0.88rem",
                    pointerEvents: "none",
                    textWrap: "nowrap",
                },
            };
        }
        return {};
    };

    const column = [
        {
            field: "prod_code",
            headerName: `${(masterPanel["PROD"] || "PRODUCT").toUpperCase()} CODE`,
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header"
                    ? <strong>{row.cat_name}</strong>
                    : <Typography sx={{color:'#212121'}}>{value}</Typography>,
        },
        {
            field: "prod_name",
            headerName: "NAME",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <Typography sx={{ fontSize: "0.92rem", whiteSpace: "nowrap", color:'#212121' }}>{value}</Typography>
                ),
        },
        {
            field: "open_qty",
            headerName: "OPENING STOCK (O)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField
                        size="small"
                        value={value ?? 0}
                        inputProps={{ style: { textAlign: "center" } }}
                        sx={{
                            '& .MuiInputBase-root': { height: 32 },
                            '& .MuiInputBase-input': { padding: '4px 8px' },
                        }}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            handleInputChange(row.prod_id, "open_qty", val)
                        }}
                    />
                ),
        },
        {
            field: "pur_qty",
            headerName: "PRIMARY QTY (P)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField
                        size="small"
                        value={value ?? 0}
                        sx={{
                            '& .MuiInputBase-root': { height: 32 },
                            '& .MuiInputBase-input': { padding: '4px 8px' },
                        }}
                        inputProps={{ style: { textAlign: "center" } }}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            handleInputChange(row.prod_id, "pur_qty", val)
                        }}
                    />
                ),
        },
        {
            field: "tot_qty",
            headerName: "TOTAL STOCK (T=O+P)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField
                        size="small"
                        value={value ?? 0}
                        sx={{
                            '& .MuiInputBase-root': { height: 32,backgroundColor:'#EEEEEE'},
                            '& .MuiInputBase-input': { padding: '4px 8px' },
                        }}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center", color: "black"} }}
                    />
                ),
        },
        {
            field: "sec_qty",
            headerName: "SEC. SALES (S=T-C)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField
                        size="small"
                        value={value ?? 0}
                        sx={{
                            '& .MuiInputBase-root': { height: 32,backgroundColor:'#EEEEEE'  },
                            '& .MuiInputBase-input': { padding: '4px 8px' },
                        }}
                        InputProps={{ readOnly: true }}
                        inputProps={{ style: { textAlign: "center", color: "blue"} }}
                    />
                ),
        },
        {
            field: "physical_qty",
            headerName: "CLOSING QTY (C)",
            renderCell: ({ row, value }) =>
                row._rowType === "cat_header" ? null : (
                    <TextField
                        size="small"
                        value={value ?? 0}
                        sx={{
                            '& .MuiInputBase-root': { height: 32 },
                            '& .MuiInputBase-input': { padding: '4px 8px' },
                        }}
                        inputProps={{ style: { textAlign: "center" } }}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            handleInputChange(row.prod_id, "physical_qty", val)
                        }}
                    />
                ),
        },
    ];

    return (
        <Layout    breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: "/reports/sec_sales_data"},
            { label: "Data Submission Status", path:"/reports/sec_sales_data" },
            { label:"Preview Stock & Sales", path:location.pathname}
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h2>PREVIEW STOCK & SALES</h2>
                </Box>

                <Box sx={{
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    padding: "16px 18px",
                    borderRadius: "10px",
                }}>
                    <Grid container spacing={0.95} alignItems="center">
                        <Grid size={{ xs: 12, md: 3, lg: 2.9 }}>
                            <Typography sx={{ fontWeight: 600 }}>
                                Month: <span style={{ fontWeight: 400 }}>{frmMonth}</span>
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3, lg: 2.9 }}>
                            <Typography sx={{ fontWeight: 600, textWrap: 'nowrap' }}>
                                {masterPanel["STKS"] || "Distributor"}: <span style={{ fontWeight: 400 }}>{decodedlabel}</span>
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                <DataTable
                    columns={column}
                    data={tableData}
                    rowStyle={rowStyle}
                />


                {allPreviewData.length > 0 && Number(masId)===0 && (
                    <Box display="flex" pr={2} pb={2}>
                        <Button variant="contained" color="primary" onClick={showConfirmConfirmation}>
                            Confirm
                        </Button>
                    </Box>
                )}
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
}

export default PreviewStkSales;