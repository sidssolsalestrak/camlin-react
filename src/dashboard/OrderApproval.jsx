import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../layout'
import { useLocation } from 'react-router-dom'
import {
    Box, FormControl, Grid, InputLabel, MenuItem, Select, Button, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DataTable from '../utils/dataTable';
import api from '../services/api';
import useToast from '../utils/useToast';
import ConfirmationDialog from '../utils/confirmDialog';
import { exportOrderApprovalToExcel } from './orderRepExcel';

const headContainer = {
    background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
    m: 1.5, p: 1.5, borderRadius: '10px', boxShadow:
        "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "16px 18px",
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const menuStyle = {
    PaperProps: { style: { maxHeight: 200 } }
}

const BIO_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const b64 = (val) => window.btoa(val ?? "");

const CAN_DELETE_USER_TYPES_EXCLUDED = [6, 8];

// ---- Region / Rep grouping helper ----
// API returns flat rows with regId/regName/psmName. We inject synthetic
// header rows (mirrors PHP's inline <tr> region/rep banners).
const buildGroupedRows = (rows) => {
    const grouped = [];
    let lastReg = null, lastRep = null;

    rows.forEach((row, idx) => {
        if (row.regId !== lastReg) {
            grouped.push({ _isRegionHeader: true, regName: row.regName, id: `reg-${row.regId}-${idx}` });
            lastReg = row.regId;
            lastRep = null;
        }
        if (row.psmName !== lastRep) {
            grouped.push({ _isRepHeader: true, psmName: row.psmName, id: `rep-${row.psmName}-${idx}` });
            lastRep = row.psmName;
        }
        grouped.push({ ...row, id: row.id || `row-${row.ordNo}-${idx}` });
    });
    return grouped;
};

const OrderApproval = () => {
    const location = useLocation();
    const showAlert = useToast();
    const currentUserType = Number(localStorage.getItem('user_type') || 0); // TODO: wire to real auth source

    const [formData, setformData] = useState({
        from: dayjs().startOf("month"),
        to: dayjs(),
        type: "0",
        rep: "0",
        status: "1",     // "1" = New (default), matches API status codes
        stockist: "0"
    })
    const [loading, setloading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [tableData, setTableData] = useState([])
    const [grandTotal, setGrandTotal] = useState(null)
    const [repOptions, setRepOptions] = useState([])
    const [stockistOptions, setStockistOptions] = useState([])

    // ---- Product Summary modal state ----
    const [summaryOpen, setSummaryOpen] = useState(false)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [summaryHeader, setSummaryHeader] = useState({
        orderNumber: '', customer: '', status: '', date: '', rep: '',
        stockist: '', modeTime: '', remarks: '',
    })
    const [summaryLines, setSummaryLines] = useState([])
    const [summaryFooter, setSummaryFooter] = useState({ nextOrderStat: '', canApprove: false, canReject: false })
    const [remarkText, setRemarkText] = useState('')
    const [counts, setCounts] = useState({ fopcount: 0, podcount: 0 })
    const [deletedLine, setDeletedLine] = useState('')

    const [ctx, setCtx] = useState({
        ordType: '', ordNo: '', ordStat: '', nextOrderStat: '',
        orderappname: '', orderappid: '', ordflag: '', mailstat: '',
        sr_type: '', repflow: '', filterstat: '', stktype: '',
    })

    // ---- Product Edit modal state ----
    const [editOpen, setEditOpen] = useState(false)
    const [editLine, setEditLine] = useState({
        prod_id: '', prod_name: '', prod_ptr: '', prod_mrp: '',
        prod_qty: '', prod_free: '', prod_disc: '', stktypeid: '',
    })
    const [qtyError, setQtyError] = useState('')

    // ---- Confirmation dialog ----
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true,
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
            loading: false,
        });
    };

    const handleChange = (name, value) => {
        setformData((prev) => ({ ...prev, [name]: value }))
    }

    // ---------------- Dropdown loaders ----------------
    const fetchRepOptions = async () => {
        try {
            const res = await api.post('/dashboard/getPsmMas');
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setRepOptions(data);
        } catch (err) {
            console.error(err);
            setRepOptions([]);
        }
    };

    const fetchStockistOptions = async (psmId = "0") => {
        try {
            const res = await api.post('/mobile/getstkonpsm', { psm: psmId });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setStockistOptions(data);
        } catch (err) {
            console.error(err);
            setStockistOptions([]);
        }
    };

    useEffect(() => {
        fetchRepOptions();
        fetchStockistOptions();
    }, []);

    useEffect(() => {
        fetchStockistOptions(formData.rep);
        setformData((prev) => ({ ...prev, stockist: "0" }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.rep]);

    // ---------------- Main list search ----------------
    const approvalSearch = useCallback(async (clickType = null) => {
        setloading(true);
        setDeletedLine('');
        try {
            const res = await api.post('/mobile/getApprovalDet', {
                psm: formData.rep,
                orderStats: formData.status,
                fromDate: formData.from.format('DD MMM YYYY'),
                toDate: formData.to.format('DD MMM YYYY'),
                clickType,
                del_stat: formData.status === '-1' ? 1 : 0,
                stokist: formData.stockist,
                type: formData.type,
            });
            setTableData(buildGroupedRows(res.data?.rows || []));
            setGrandTotal(res.data?.grandTotal || null);
        } catch (err) {
            console.error(err);
            setTableData([]);
            setGrandTotal(null);
            showAlert.error('Failed to fetch order approval list');
        } finally {
            setloading(false);
        }
    }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        approvalSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------- Excel Export ----------------
    const handleExport = () => {
        setExporting(true);

        // Get flat data from grouped rows
        const flatData = tableData.filter(row => !row._isRegionHeader && !row._isRepHeader);

        if (flatData.length === 0) {
            showAlert.warning('No data to export');
            setExporting(false);
            return;
        }

        // Get status label
        const statusMap = {
            '1': 'New',
            '2': 'Approved',
            '3': 'Pending',
            '-1': 'Deleted',
            '-3': 'FOP_Request',
            '-5': 'Giveaway_FOP',
            '-6': 'Referral_FOP'
        };
        const statusLabel = statusMap[formData.status] || 'All';

        // Call the export function
        exportOrderApprovalToExcel(flatData, {
            fromDate: formData.from.format('DD-MMM-YYYY'),
            toDate: formData.to.format('DD-MMM-YYYY'),
            status: statusLabel,
            onSuccess: (message) => {
                showAlert.success(message);
                setExporting(false);
            },
            onError: (message) => {
                showAlert.error(message);
                setExporting(false);
            }
        });
    };

    // ---------------- Row click -> open Product Summary modal ----------------
    const openProductSummary = async (row) => {
        setDeletedLine('');
        setSummaryLoading(true);

        setCtx({
            ordType: row.ordType,
            ordNo: row.ordNo,
            ordStat: row.ordStat,
            nextOrderStat: '',
            orderappname: row.orderappname,
            orderappid: row.orderappid,
            ordflag: row.ordflag,
            mailstat: row.mailstat,
            sr_type: row.sr_type,
            repflow: row.repflow,
            filterstat: row.filterstat,
            stktype: row.stktype,
        });

        setSummaryHeader({
            orderNumber: row.ordNo,
            customer: row.cusProd,
            status: row.statusname,
            date: row.ordDt,
            rep: row.psmName,
            stockist: row.stk,
            modeTime: row.modname,
            remarks: row.callrem,
        });

        try {
            const res = await api.post('/mobile/getCustomerProducts', {
                customerId: row.cusId,
                customerName: row.cusProd,
                status: row.status,
                productDate: row.ordDt,
                ordType: row.ordType,
                cusType: row.cusType,
                ordStat: row.ordStat,
                textStatus: row.textStatus,
                ordNo: row.ordNo,
                sr_type: row.sr_type,
                del_stat: formData.status === '-1' ? 1 : 0,
                ordflag: row.ordflag,
                orderappname: row.orderappname,
                orderappid: row.orderappid,
                mailstat: row.mailstat,
                filterstat: row.filterstat,
                stktype: row.stktype,
                fopcount: row.fopcount,
                podcount: row.podcount,
                slnum: row.slnum,
            });

            const data = res.data;
            setSummaryLines(data.orderConfirm || []);
            setSummaryFooter({
                nextOrderStat: data.nextOrderStat,
                canApprove: !!data.canApprove,
                canReject: !!data.canReject,
            });
            setCtx((prev) => ({ ...prev, nextOrderStat: data.nextOrderStat }));
            setCounts({
                fopcount: data.fopcount || 0,
                podcount: data.podcount || 0,
            });

            if (formData.status === '-1') {
                setDeletedLine('Deleted');
            }

            setSummaryOpen(true);
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to load product breakup');
        } finally {
            setSummaryLoading(false);
        }
    };

    const closeSummary = () => {
        setSummaryOpen(false);
        setRemarkText('');
    };

    // ---------------- Approve ----------------
    const doApprove = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            await api.post('/mobile/approveOrders', {
                orderType: ctx.ordType,
                orderNo: ctx.ordNo,
                nextOrderStat: ctx.nextOrderStat,
                remark: remarkText,
                orderappid: ctx.orderappid,
                orderappname: ctx.orderappname,
                ordflag: ctx.ordflag,
                mailstat: ctx.mailstat,
                repflow: ctx.repflow,
            });
            showAlert.success('Order Approved Successfully');
            approvalSearch();
            closeSummary();
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to approve order');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showApproveConfirmation = () => {
        const fopExceeded = counts.fopcount > 10;
        const podPending = counts.podcount > 2;

        let message = "Are you sure you want to approve this order?";
        if (String(ctx.mailstat) === '2') {
            if (fopExceeded) message = "FOP Quota Exceeded. Are you sure you want to still approve?";
            else if (podPending) message = "POD Upload is Pending. Are you sure you want to still approve?";
        }

        showConfirmationDialog({
            title: "Approve Order",
            message,
            confirmText: "Approve",
            confirmColor: "success",
            onConfirm: doApprove,
        });
    };

    // ---------------- Reject ----------------
    const doReject = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            await api.post('/mobile/rejectOrders', {
                orderType: ctx.ordType,
                orderNo: ctx.ordNo,
                nextOrderStat: ctx.nextOrderStat,
                remark: remarkText,
                orderappid: ctx.orderappid,
                orderappname: ctx.orderappname,
                ordflag: ctx.ordflag,
                mailstat: ctx.mailstat,
            });
            showAlert.success('Order Rejected Successfully');
            approvalSearch();
            closeSummary();
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to reject order');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showRejectConfirmation = () => {
        showConfirmationDialog({
            title: "Reject Order",
            message: "Are you sure you want to reject this order?",
            confirmText: "Reject",
            confirmColor: "error",
            onConfirm: doReject,
        });
    };

    // ---------------- Delete whole order ----------------
    const doDeleteOrder = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await api.post('/mobile/delete_order', {
                orderNo: ctx.ordNo, ordType: ctx.ordType, prod_id: "",
            });
            if (res.data === 1 || res.data?.success) {
                showAlert.success('Order Deleted Successfully');
                closeSummary();
                approvalSearch();
            } else {
                showAlert.error('Failed to delete order');
            }
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to delete order');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showDeleteOrderConfirmation = () => {
        if (Number(ctx.ordStat) >= 7) {
            showAlert.error('Sorry! You can not delete this order!');
            return;
        }
        showConfirmationDialog({
            title: "Delete Order",
            message: "Are you sure you want to delete this order?",
            confirmText: "Delete",
            confirmColor: "error",
            onConfirm: doDeleteOrder,
        });
    };

    // ---------------- Delete single line item ----------------
    const doDeleteLine = async (line) => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await api.post('/mobile/delete_order', {
                orderNo: ctx.ordNo, ordType: ctx.ordType, prod_id: line.prod_id,
            });
            if (res.data === 1 || res.data?.success) {
                showAlert.success('Line Item Deleted Successfully');
                setSummaryLines((prev) => prev.filter((l) => l.prod_id !== line.prod_id));
            } else {
                showAlert.error('Failed to delete line item');
            }
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to delete line item');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showDeleteLineConfirmation = (line) => {
        if (Number(ctx.ordStat) >= 7) {
            showAlert.error('Sorry! You can not delete this order!');
            return;
        }
        showConfirmationDialog({
            title: "Delete Line Item",
            message: "Are you sure you want to delete this line item?",
            confirmText: "Delete",
            confirmColor: "error",
            onConfirm: () => doDeleteLine(line),
        });
    };

    // ---------------- Add / update discount on a line ----------------
    const doAddDiscount = async (line, discountValue) => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            await api.post('/mobile/update_discount', {
                discount: discountValue, ordNo: line.ordNo || ctx.ordNo, ordType: line.ordType || ctx.ordType,
            });
            showAlert.success('Discount Updated Successfully');
            approvalSearch();
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to update discount');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showAddDiscountConfirmation = (line, discountValue) => {
        if (!discountValue || Number(discountValue) <= 0) return;
        showConfirmationDialog({
            title: "Update Discount",
            message: "Are you sure you want to update this discount?",
            confirmText: "Update",
            confirmColor: "primary",
            onConfirm: () => doAddDiscount(line, discountValue),
        });
    };

    // ---------------- Edit line ----------------
    const openEditLine = (line) => {
        setEditLine({
            prod_id: line.prod_id,
            prod_name: line.prod_name,
            prod_ptr: line.prod_ptr,
            prod_mrp: line.prod_mrp,
            prod_qty: line.prod_qty,
            prod_free: line.prod_free,
            prod_disc: line.prod_disc,
            stktypeid: line.stktypeid,
        });
        setQtyError('');
        setEditOpen(true);
    };

    const closeEditLine = () => {
        setEditOpen(false);
    };

    const isReadOnlyQtyDisc = String(ctx.mailstat) === '2';

    const handleEditFieldChange = (field, value) => {
        if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
        setEditLine((prev) => ({ ...prev, [field]: value }));
    };

    const doProdSave = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await api.post('/mobile/prodSave', {
                ProductQty: editLine.prod_qty,
                ProductFree: editLine.prod_free,
                ProductDisc: editLine.prod_disc,
                ProductId: editLine.prod_id,
                orderNo: ctx.ordNo,
                ProductPtr: editLine.prod_ptr,
                stktypeid: editLine.stktypeid,
            });
            if (res.data === 1 || res.data?.success) {
                showAlert.success('Product Updated Successfully');
                closeEditLine();
                setSummaryLines((prev) => prev.map((l) =>
                    l.prod_id === editLine.prod_id
                        ? { ...l, prod_qty: editLine.prod_qty, prod_free: editLine.prod_free, prod_disc: editLine.prod_disc }
                        : l
                ));
            } else {
                showAlert.error('Unable to Update. Please Try Again!');
            }
        } catch (err) {
            console.error(err);
            showAlert.error('Failed to update product');
        } finally {
            closeConfirmationDialog();
        }
    };

    const showProdSaveConfirmation = () => {
        setQtyError('');
        if (String(ctx.mailstat) !== '2') {
            if (!editLine.prod_qty || Number(editLine.prod_qty) === 0) {
                setQtyError('Qty Must be Greater Than 0');
                return;
            }
        }
        showConfirmationDialog({
            title: "Update Product",
            message: "Are you sure you want to update this product?",
            confirmText: "Update",
            confirmColor: "primary",
            onConfirm: doProdSave,
        });
    };

    // ---------------- Invoice file upload ----------------
    const handleInvoiceUpload = async (e, line) => {
        const file = e.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        const allowed = ['png', 'jpg', 'jpeg', 'xls', 'xlsx', 'doc'];
        if (!allowed.includes(extension)) {
            showAlert.error('Only .jpeg, .jpg, .png, .doc, .xlsx, .xls are allowed');
            e.target.value = '';
            return;
        }
        const dotCount = (file.name.split('.').length - 1);
        if (dotCount > 1 || /[()]/.test(file.name)) {
            showAlert.error('File name is not valid! Please change File name.');
            return;
        }
        if (file.size > 5000000) {
            showAlert.error('Please reduce size to 5Mb');
            e.target.value = '';
            return;
        }

        const form = new FormData();
        form.append('file', file);
        form.append('orderType', line.ordType || ctx.ordType);
        form.append('orderNumber', line.ordNo || ctx.ordNo);

        try {
            await api.post('/mobile/orderInvoiceUpload', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showAlert.success('Invoice Uploaded Successfully');
            approvalSearch();
        } catch (err) {
            console.error(err);
            showAlert.error("Couldn't Add! Contact Administrator");
        }
    };

    // ---------------- Table columns ----------------
    const columns = [
        {
            field: 'slnum', headerName: 'SL',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.slnum;
            }
        },
        {
            field: 'ordDt', headerName: 'Date',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.ordDt;
            }
        },
        {
            field: 'ordNo', headerName: 'Order No',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader) return <b style={{ color: '#fff' }}>{row.regName}</b>;
                if (row._isRepHeader) return <b>{row.psmName}</b>;
                return <Button size="small" onClick={() => openProductSummary(row)}>{row.ordNo}</Button>;
            }
        },
        {
            field: 'cusProd', headerName: 'Customer',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.cusProd;
            }
        },
        // {
        //     field: 'psmName', headerName: 'Rep',
        //     renderCell: (params) => {
        //         const row = params.row;
        //         return (row._isRegionHeader || row._isRepHeader) ? '' : row.psmName;
        //     }
        // },
        {
            field: 'stk', headerName: 'Stockist',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.stk;
            }
        },
        {
            field: 'totQty', headerName: 'Tot Qty',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.totQty;
            }
        },
        {
            field: 'totFree', headerName: 'Tot Free',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.totFree;
            }
        },
        {
            field: 'totVal', headerName: 'Tot Value',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.totVal;
            }
        },
        {
            field: 'totOffer', headerName: 'Tot Offer',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.totOffer;
            }
        },
        {
            field: 'statusname', headerName: 'Status',
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader) ? '' : row.statusname;
            }
        },
        {
            field: 'discount', headerName: 'Disc. Val.',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                if (Number(row.ordStat) > 2) return null;
                return <DiscountCell row={row} onUpdate={showAddDiscountConfirmation} />;
            }
        },
        {
            field: 'invoice', headerName: 'Upload Invoice',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {row.ordInv && (
                            <a
                                href={`${BIO_URL}/assets/upload/order_invoice/${row.ordInv}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'green' }}
                            >
                                {row.ordInvName}
                            </a>
                        )}
                        <IconButton size="small" component="label">
                            <UploadFileIcon fontSize="small" />
                            <input type="file" hidden onChange={(e) => handleInvoiceUpload(e, row)} />
                        </IconButton>
                    </Box>
                );
            }
        },
    ]

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Daywise Log", path: location.pathname },
            { label: "Order approval" },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">Order approval</h1>
                </Box>
            </Box>

            <Box sx={headContainer}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                value={formData.from}
                                onChange={(newValue) => handleChange("from", newValue)}
                                label="From"
                                format="DD MMM YYYY"
                                views={["day", "month", "year"]}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                value={formData.to}
                                onChange={(newValue) => handleChange("to", newValue)}
                                label="To"
                                format="DD MMM YYYY"
                                views={["day", "month", "year"]}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="type">Type</InputLabel>
                            <Select value={formData.type} onChange={(e) => handleChange("type", e.target.value)} id='type' label="Type" MenuProps={menuStyle}
                                labelId="type" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">Orders</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Rep">Rep</InputLabel>
                            <Select value={formData.rep} onChange={(e) => handleChange("rep", e.target.value)} id='Rep' label="Rep" MenuProps={menuStyle}
                                labelId="Rep" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {repOptions.map((val) => (
                                    <MenuItem key={val.id} style={{ fontSize: "11px" }} value={String(val.id)}>{val.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Status">Status</InputLabel>
                            <Select value={formData.status} onChange={(e) => handleChange("status", e.target.value)} id='Status' label="Status" MenuProps={menuStyle}
                                labelId="Status" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="1">New</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="2">Approved</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="3">Pending</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-1">Deleted</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-3">FOP Request</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-5">Giveaway FOP</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-6">Referral FOP</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Stockist">Stockist</InputLabel>
                            <Select value={formData.stockist} onChange={(e) => handleChange("stockist", e.target.value)} id='Stockist' label="Stockist" MenuProps={menuStyle}
                                labelId="Stockist" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {stockistOptions.map((val) => (
                                    <MenuItem key={val.id} style={{ fontSize: "11px" }} value={String(val.id)}>{val.stk_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 1.5, lg: 1.5 }}>
                        <Button startIcon={<SearchIcon />} variant="contained" color="primary" onClick={() => approvalSearch()} disabled={loading}>
                            Search
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 1.5, lg: 1.5 }}>
                        <Button startIcon={<FileDownloadIcon />} variant="contained" color="primary" onClick={handleExport} disabled={exporting}>
                            {exporting ? "Exporting..." : "Export"}
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={headContainer}>
                <Box>
                    <Typography variant="h5" color="initial">
                        Order approval list
                    </Typography>
                </Box>
                <DataTable
                    data={tableData}
                    columns={columns}
                    loading={loading}
                    defaultPageSize={50}
                    rowStyle={(params) => {
                        const row = params.row ?? params; // handles either shape, verify against your DataTable source
                        if (row._isRegionHeader) return { "& td": { backgroundColor: "#6290d0", color: "#fff", fontWeight: 700 } };
                        if (row._isRepHeader) return { "& td": { backgroundColor: "#c8ddfb", fontWeight: 600 } };
                        return {};
                    }}
                />
                {grandTotal && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 1.5, p: 1, fontWeight: 600, borderTop: '1px solid #ddd' }}>
                        <Typography variant="body2">Total Qty: {grandTotal.qty}</Typography>
                        <Typography variant="body2">Total Free: {grandTotal.free}</Typography>
                        <Typography variant="body2">Total Value: {Number(grandTotal.val).toFixed(2)}</Typography>
                        <Typography variant="body2">Total Offer: {Number(grandTotal.offer).toFixed(2)}</Typography>
                        <Typography variant="body2">Total Disc: {Number(grandTotal.discVal).toFixed(2)}</Typography>
                    </Box>
                )}
            </Box>

            {/* ================= Product Summary Modal ================= */}
            <Dialog open={summaryOpen} onClose={closeSummary} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Product Breakup</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {deletedLine && <Typography sx={{ color: 'red', fontWeight: 700 }}>{deletedLine}</Typography>}
                        {!CAN_DELETE_USER_TYPES_EXCLUDED.includes(currentUserType) && !deletedLine && (
                            <Button variant="contained" color="error" size="small" onClick={showDeleteOrderConfirmation}>
                                Delete
                            </Button>
                        )}
                        <IconButton onClick={closeSummary}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography>Order number: <b style={{ color: '#1976d2' }}>{summaryHeader.orderNumber}</b></Typography>
                            <Typography>Customer: <b style={{ color: '#1976d2' }}>{summaryHeader.customer}</b></Typography>
                            <Typography>Status: <b style={{ color: '#1976d2' }}>{summaryHeader.status}</b></Typography>
                            <Typography>Date: <b style={{ color: '#1976d2' }}>{summaryHeader.date}</b></Typography>
                            <Typography>PSM/KAM: <b style={{ color: '#1976d2' }}>{summaryHeader.rep}</b></Typography>
                            <Typography>Stockist: <b style={{ color: '#1976d2' }}>{summaryHeader.stockist}</b></Typography>
                            <Typography>Order Mode & Time: <b style={{ color: '#1976d2' }}>{summaryHeader.modeTime}</b></Typography>
                            <Typography>Order Remarks: <b style={{ color: '#1976d2' }}>{summaryHeader.remarks}</b></Typography>
                        </Grid>
                        {(['2', '4', '5'].includes(String(ctx.mailstat))) && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography>
                                    POD DUE: <b style={{ color: '#1976d2' }}>{counts.podcount}</b>
                                </Typography>
                                <Typography>
                                    FOP: {counts.fopcount > 10
                                        ? <b style={{ color: 'red' }}>{counts.fopcount} Quota Exceeded</b>
                                        : <b style={{ color: '#1976d2' }}>{counts.fopcount}</b>}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            minRows={2}
                            value={remarkText}
                            onChange={(e) => setRemarkText(e.target.value)}
                        />
                    </Box>

                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product name</TableCell>
                                    <TableCell>PTR</TableCell>
                                    <TableCell>MRP</TableCell>
                                    <TableCell>Qty</TableCell>
                                    <TableCell>Free</TableCell>
                                    <TableCell>Offer(%)</TableCell>
                                    <TableCell>Offer value</TableCell>
                                    {!deletedLine && <TableCell colSpan={2}>Action</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {summaryLines.map((line) => (
                                    <TableRow key={line.prod_id}>
                                        <TableCell>{line.prod_name}</TableCell>
                                        <TableCell>{line.prod_ptr}</TableCell>
                                        <TableCell>{line.prod_mrp}</TableCell>
                                        <TableCell>{line.prod_qty}</TableCell>
                                        <TableCell>{line.prod_free}</TableCell>
                                        <TableCell>{line.prod_disc}</TableCell>
                                        <TableCell>{line.discount_value}</TableCell>
                                        {!deletedLine && (
                                            <TableCell>
                                                <IconButton size="small" onClick={() => openEditLine(line)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => showDeleteLineConfirmation(line)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                                {summaryLines.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            {summaryLoading ? 'Loading...' : 'No products'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    {summaryFooter.canApprove && (
                        <Button variant="contained" color="success" onClick={showApproveConfirmation}>Approve</Button>
                    )}
                    {summaryFooter.canReject && (
                        <Button variant="contained" color="error" onClick={showRejectConfirmation}>Reject</Button>
                    )}
                    <Button onClick={closeSummary}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ================= Product Edit Modal ================= */}
            <Dialog open={editOpen} onClose={closeEditLine} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Product Edit</Typography>
                    <IconButton onClick={closeEditLine}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <Typography>Product: <b>{editLine.prod_name}</b></Typography>
                        </Grid>
                        <Grid size={12}>
                            <TextField label="PTR" fullWidth size="small" value={editLine.prod_ptr} disabled />
                        </Grid>
                        <Grid size={12}>
                            <TextField label="MRP" fullWidth size="small" value={editLine.prod_mrp} disabled />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Qty" fullWidth size="small"
                                value={editLine.prod_qty}
                                onChange={(e) => handleEditFieldChange('prod_qty', e.target.value)}
                                disabled={isReadOnlyQtyDisc}
                                error={!!qtyError}
                                helperText={qtyError}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Free" fullWidth size="small"
                                value={editLine.prod_free}
                                onChange={(e) => handleEditFieldChange('prod_free', e.target.value)}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Disc %" fullWidth size="small"
                                value={editLine.prod_disc}
                                onChange={(e) => handleEditFieldChange('prod_disc', e.target.value)}
                                disabled={isReadOnlyQtyDisc}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" color="primary" onClick={showProdSaveConfirmation}>Save</Button>
                </DialogActions>
            </Dialog>

            {/* ================= Shared Confirmation Dialog ================= */}
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={confirmationDialog.loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}

// ---- Inline discount cell: local text state + Update button ----
// Mirrors PHP's <input class="discount"> + <button class="addDiscount"> per row.
const DiscountCell = ({ row, onUpdate }) => {
    const [value, setValue] = useState(row.ordDiscVal || '');

    const handleChange = (e) => {
        const v = e.target.value;
        if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
        setValue(v);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
                size="small"
                placeholder="Enter discount value"
                value={value}
                onChange={handleChange}
                sx={{ width: 110 }}
            />
            <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => onUpdate(row, value)}
            >
                Update
            </Button>
        </Box>
    );
};

export default OrderApproval