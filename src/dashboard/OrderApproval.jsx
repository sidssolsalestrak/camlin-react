import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../layout'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
    Box, FormControl, Grid, InputLabel, MenuItem, Select, Button, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
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
import { addSubtotalsOrderApproval } from './addSubtotalsOrderApproval';
import FormatCurrency from '../utils/formatCurrency';
import { jwtDecode } from "jwt-decode";
import { getMasterPanel } from "../services/masterPanelService";

const encode = (val) => btoa(String(val || ""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

// URL-safe decode - restore before atob
const decode = (str) => {
    if (!str) return "";
    const restored = str
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = restored + "==".slice((restored.length % 4) || 4);
    try { return atob(padded); } catch { return ""; }
};

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
// PHP: user_type != 6 && user_type != 8 shows Delete button
const CAN_DELETE_USER_TYPES_EXCLUDED = [6, 8];
// PHP: mailstat == 2 || mailstat == 4 || mailstat == 5 -> show FOP/POD block, hide read-only qty/disc only on 2
const FOP_POD_MAILSTATS = ['2', '4', '5'];

// Converts "On Call-01 Jul 2026 11:10:39" -> "On Call-01 Jul 2026 11:10 am"
const formatModeTime = (str) => {
    if (!str) return str;

    // Match a trailing time portion HH:MM:SS at the end of the string
    const match = str.match(/(\d{1,2}):(\d{2}):(\d{2})\s*$/);
    if (!match) return str;

    let [full, hh, mm] = match;
    let hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12;
    if (hour === 0) hour = 12;

    const formattedTime = `${String(hour).padStart(2, '0')}:${mm} ${ampm}`;

    // Replace the matched "HH:MM:SS" (with seconds) with the new formatted time
    return str.slice(0, match.index) + formattedTime;
};

// "On Call-01 Jul 2026 11:10:39 - New" -> "On Call- 01 Jul 2026 11:10 am - New"
const formatStatusName = (str) => {
    if (!str) return str;

    // format the HH:MM:SS -> hh:mm am/pm part
    let formatted = formatModeTime(str);

    // add a space right after "On Call-" (only the first hyphen following "On Call")
    formatted = formatted.replace(/^On Call-/, 'On Call- ');

    return formatted;
};

const OrderApproval = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const showAlert = useToast();
    const [userType, setUserType] = useState(null);

    // decode the url params
    let decodedFrom = decode(searchParams.get('from'));
    let decodedTo = decode(searchParams.get('to'));
    let decodedType = decode(searchParams.get('type'));
    let decodedRep = decode(searchParams.get('rep'));
    let decodedStatus = decode(searchParams.get('status'));
    let decodedStockist = decode(searchParams.get('stockist'));

    const [formData, setformData] = useState({
        from: dayjs().startOf("month"),
        to: dayjs(),
        type: "0",
        rep: "0",
        status: "1",
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

    // ---- Summary totals ----
    const [summaryTotals, setSummaryTotals] = useState({
        orderValue: 0,
        gst: 0,
        offerValue: 0,
        offerPercent: 0,
        mrpValue: 0,
        marginValue: 0,
        marginPercent: 0
    })

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
    const [masterPanel, setMasterPanel] = useState({});

    // labels derived from masterPanel with fallbacks
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const userLabel = masterPanel["USER"] || "Users";
    const beatLabel = masterPanel["BEAT"] || "Beat";
    const distributorLabel = masterPanel["STKS"] || "Distributor";
    const prodLabel = masterPanel["PROD"] || "Product";
    const psmLabel = masterPanel["PSM"] || "PSM";
    const kamLabel = masterPanel["KAM"] || "KAM";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

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

    // PHP: $(document).on('change','#psm', ...) reloads stockist list on rep change
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
        const token = localStorage.getItem("session-token");
        if (token) {
            try {
                let decoded = jwtDecode(token);
                setUserType(decoded.user_type);
            } catch (err) {
                console.log(err);
            }
        }
    }, []);

    useEffect(() => {
        fetchRepOptions();
        fetchStockistOptions();
    }, []);

    useEffect(() => {
        fetchStockistOptions(formData.rep);
        setformData((prev) => ({ ...prev, stockist: "0" }));
    }, [formData.rep]);

    // ---------------- Main list search ----------------
    const approvalSearch = useCallback(async (overrideData = null, clickType = null) => {
        const data = overrideData || formData;
        setloading(true);
        setDeletedLine('');
        try {
            const res = await api.post('/mobile/getApprovalDet', {
                psm: data.rep,
                orderStats: data.status,
                fromDate: data.from.format('DD MMM YYYY'),
                toDate: data.to.format('DD MMM YYYY'),
                clickType,
                del_stat: data.status === '5' ? 1 : 0,
                stokist: data.stockist,
                type: data.type,
            });
            setTableData(res.data?.rows || []);
            setGrandTotal(res.data?.grandTotal || null);
        } catch (err) {
            console.error(err);
            setTableData([]);
            setGrandTotal(null);
            showAlert.error('Failed to fetch order approval list');
        } finally {
            setloading(false);
        }
    }, [formData]);

    useEffect(() => {
        setformData((prev) => ({
            from: decodedFrom ? dayjs(decodedFrom) : dayjs().startOf("month"),
            to: decodedTo ? dayjs(decodedTo) : dayjs(),
            type: decodedType || "0",
            rep: decodedRep || "0",
            status: decodedStatus || "1",
            stockist: decodedStockist || "0",
        }));
        approvalSearch({
            from: decodedFrom ? dayjs(decodedFrom) : dayjs().startOf("month"),
            to: decodedTo ? dayjs(decodedTo) : dayjs(),
            type: decodedType || "0",
            rep: decodedRep || "0",
            status: decodedStatus || "1",
            stockist: decodedStockist || "0",
        });
    }, [decodedFrom, decodedTo, decodedType, decodedRep, decodedStatus, decodedStockist])

    const handleSearchClick = () => {
        let params = new URLSearchParams();
        params.append('from', encode(formData.from.format("YYYY-MM-DD")));
        params.append('to', encode(formData.to.format("YYYY-MM-DD")));
        if (formData.type > 0) params.append('type', encode(formData.type));
        if (formData.rep > 0) params.append('rep', encode(formData.rep));
        if (formData.status > 0) params.append('status', encode(formData.status));
        if (formData.stockist > 0) params.append('stockist', encode(formData.stockist));
        navigate(`${location.pathname}?${params.toString()}`);
    };

    // ---------------- Excel Export ----------------
    const handleExport = () => {
        try {
           setExporting(true);
        const flatData = tableData.filter(row => !row._isRegionHeader && !row._isRepHeader);

        if (flatData.length === 0) {
            showAlert.warning('No data to export');
            setExporting(false);
            return;
        }

        // Same override as the grid's Status column: force "Deleted" when that filter is active
        const isDeletedFilter = formData.status === '5';
        const exportRows = isDeletedFilter
            ? flatData.map(row => ({ ...row, statusname: 'Deleted' }))
            : flatData;

        const statusMap = {
            '1': 'New',
            '2': 'Approved',
            '3': 'Pending',
            '5': 'Deleted',
            '-3': 'FOP_Request',
            '-5': 'Giveaway_FOP',
            '-6': 'Referral_FOP'
        };
        const statusLabel = statusMap[formData.status] || 'All';

        exportOrderApprovalToExcel(exportRows, {
            fromDate: formData.from.format('DD-MMM-YYYY'),
            toDate: formData.to.format('DD-MMM-YYYY'),
            status: statusLabel,
            kamLabel: kamLabel,
            psmLabel: psmLabel,
            distributorLabel: distributorLabel,
            regionLabel: regionLabel,
            grandTotal: grandTotal,
            onSuccess: (message) => {
                // showAlert.success(message);
                setExporting(false);
            },
            onError: (message) => {
                showAlert.error(message);
                setExporting(false);
            }
        }); 
        } catch (error) {
            console.log(error);
        }finally{
            setExporting(false);
        }
    };

    // ---------------- Calculate summary totals ----------------
    const calculateTotals = (lines) => {
        let orderValue = 0;
        let offerValue = 0;
        let mrpValue = 0;

        lines.forEach(line => {
            const qty = parseFloat(line.prod_qty) || 0;
            const free = parseFloat(line.prod_free) || 0;
            const ptr = parseFloat(line.prod_ptr) || 0;
            const mrp = parseFloat(line.prod_mrp) || 0;
            const discValue = parseFloat(line.discount_value) || 0;

            orderValue += qty * ptr;
            offerValue += discValue;
            mrpValue += (qty + free) * mrp;
        });

        const gst = orderValue * 0.18;
        const marginValue = mrpValue - (orderValue + gst); // ✅ matches PHP
        const marginPercent = marginValue > 0 ? (marginValue / mrpValue) * 100 : 0; // see note below
        const offerPercent = offerValue > 0 ? (offerValue * 100) / (offerValue + orderValue) : 0; // see note below

        setSummaryTotals({
            orderValue, gst, offerValue, offerPercent, mrpValue, marginValue, marginPercent
        });
    };

    // ---------------- Row click -> open Product Summary modal ----------------
    // Mirrors PHP $(document).on('click', '.cusProd', ...)
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

        // PHP: textStatus=='New' ? textStatus : statusname
        const statusDisplay = formData.status === '5' ? 'Deleted' : (row.textStatus === 'New' ? row.textStatus : row.statusname);
        setSummaryHeader({
            orderNumber: row.ordNo,
            customer: row.cusProd,
            status: statusDisplay,
            date: row.ordDt,
            rep: row.psmName,
            stockist: row.stk,
            modeTime: formatModeTime(row.modname),
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
                del_stat: formData.status === '5' ? 5 : 0,
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
            const lines = data.orderConfirm || [];
            setSummaryLines(lines);
            setSummaryFooter({
                nextOrderStat: data.nextOrderStat,
                canApprove: !!data.canApprove,
                canReject: !!data.canReject,
            });
            setCtx((prev) => ({ ...prev, nextOrderStat: data.nextOrderStat }));

            // PHP: fopcount/podcount fallback to 0 when empty
            setCounts({
                fopcount: data.fopcount || 0,
                podcount: data.podcount || 0,
            });

            calculateTotals(lines);

            // PHP: del_stat==5 (Deleted filter) -> show "Deleted" label, hide delete/action controls
            if (formData.status === '5') {
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
    console.log("summary footer canApprove values", summaryFooter.canApprove)

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

    // PHP: mailstat==2 -> fopcountid>10 warn, else podcountid>2 warn, else generic confirm
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
    // PHP: .deleteOrder click -> checks ordStat < 7
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
                const updatedLines = summaryLines.filter((l) => l.prod_id !== line.prod_id);
                setSummaryLines(updatedLines);
                calculateTotals(updatedLines);
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

    // ---------------- Add / update discount on a line (list view) ----------------
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
    // PHP: .EditOrderLine click -> populate fields, mailstat==2 -> Qty/Disc readonly
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
                showAlert.success(`${prodLabel} Updated Successfully`);
                closeEditLine();
                const updatedLines = summaryLines.map((l) =>
                    l.prod_id === editLine.prod_id
                        ? { ...l, prod_qty: editLine.prod_qty, prod_free: editLine.prod_free, prod_disc: editLine.prod_disc }
                        : l
                );
                setSummaryLines(updatedLines);
                calculateTotals(updatedLines);
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

    // PHP: mailstat != 2 -> Qty required > 0
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
    // PHP: .update_file change -> validates extension, filename, size <=5MB
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
            const res = await api.post('/mobile/orderInvoiceUpload', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data?.success) {
                showAlert.success('Invoice Uploaded Successfully');
                approvalSearch();
            } else {
                showAlert.error('Failed to upload invoice');
            }
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
                return (row._isRegionHeader || row._isRepHeader || row._isSubtotal) ? '' : row.slnum;
            }
        },
        {
            field: 'ordDt', headerName: 'Date', type: "date",
            renderCell: (params) => {
                const row = params.row;
                return (row._isRegionHeader || row._isRepHeader || row._isSubtotal) ? '' : row.ordDt;
            }
        },
        {
            field: 'ordNo', headerName: 'Order No', width: 150,
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader) return <b style={{ color: '#fff' }}>{row.regName}</b>;
                if (row._isRepHeader) return <b>{row.psmName}</b>;
                if (row._isSubtotal) return '';
                return row.ordNo;
            }
        },
        {
            field: 'cusProd', headerName: 'Customer',
            renderCell: (params) => {
                const row = params.row;
                return <Button size="small" sx={{
                    textTransform: 'none',
                    '&:hover': {
                        textDecoration: 'underline',
                    },
                }}
                    onClick={() => openProductSummary(row)}>{(row._isRegionHeader || row._isRepHeader || row._isSubtotal) ? '' : row.cusProd}</Button>;
            }
        },
        {
            field: 'stk', headerName: distributorLabel,
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                if (row._isSubtotal) return <b style={{ display: 'block', textAlign: 'right' }}>{row.statusname}</b>;
                return row.stk;
            }
        },
        {
            field: 'totQty', headerName: 'Tot Qty',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                return row.totQty;
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
                if (row._isRegionHeader || row._isRepHeader) return '';
                return (Number(row.totVal) || 0).toFixed(2);
            }
        },
        {
            field: 'totOffer', headerName: 'Tot Offer',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                return (Number(row.totOffer) || 0).toFixed(2);
            }
        },
        {
            field: 'statusname', headerName: 'Status',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader || row._isSubtotal) return '';

                const isDeletedFilter = (decodedStatus || "1") === '5';

                if (isDeletedFilter) {
                    return <span style={{ color: 'red' }}>-Deleted</span>;
                }

                return formatStatusName(row.statusname);
            }
        },
        {
            field: 'discount', headerName: 'Disc. Val.',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader) return '';
                if (row._isSubtotal) return (Number(row.ordDiscVal) || 0).toFixed(2);
                if (Number(row.ordStat) > 2) return null;
                return <DiscountCell row={row} onUpdate={showAddDiscountConfirmation} />;
            }
        },
        {
            field: 'invoice', headerName: 'Upload Invoice',
            renderCell: (params) => {
                const row = params.row;
                if (row._isRegionHeader || row._isRepHeader || row._isSubtotal) return '';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {row.ordInv && (
                            <a
                                href={row.ordInv}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'green' }}
                            >
                                {row.ordInvName}
                            </a>
                        )
                        }
                        < IconButton size="large" component="label" >
                            <UploadFileIcon fontSize="large" />
                            <input type="file" hidden onChange={(e) => handleInvoiceUpload(e, row)} />
                        </IconButton >
                    </Box >
                );
            }
        },
    ]

    // PHP: showcount block visible only when mailstat is 2, 4, or 5
    const showFopPodBlock = FOP_POD_MAILSTATS.includes(String(ctx.mailstat));
    // PHP: !$this->session->userdata['user_type'] in [6,8]  AND del_stat != 5 (deletedLine empty)
    const canShowDeleteButton = !CAN_DELETE_USER_TYPES_EXCLUDED.includes(Number(userType)) && !deletedLine;
    console.log("can show Del Button", canShowDeleteButton)
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
                                {/* <MenuItem style={{ fontSize: "11px" }} value="2">Approved</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="3">Pending</MenuItem> */}
                                <MenuItem style={{ fontSize: "11px" }} value="5">Deleted</MenuItem>
                                {/* <MenuItem style={{ fontSize: "11px" }} value="-3">FOP Request</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-5">Giveaway FOP</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="-6">Referral FOP</MenuItem> */}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Stockist">{distributorLabel}</InputLabel>
                            <Select value={formData.stockist} onChange={(e) => handleChange("stockist", e.target.value)} id='Stockist' label={distributorLabel} MenuProps={menuStyle}
                                labelId="Stockist" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {stockistOptions.map((val) => (
                                    <MenuItem key={val.id} style={{ fontSize: "11px" }} value={String(val.id)}>{val.stk_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 1.5, lg: 1.5 }}>
                        <Button startIcon={<SearchIcon />} variant="contained" color="primary" onClick={handleSearchClick} disabled={loading}>
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
                    data={addSubtotalsOrderApproval(tableData)}
                    columns={columns}
                    loading={loading}
                    defaultPageSize={50}
                    rowStyle={(params) => {
                        const row = params.row ?? params;
                        if (row._isRegionHeader) return { "& td": { backgroundColor: "#6290d0", color: "#fff", fontWeight: 700 } };
                        if (row._isRepHeader) return { "& td": { backgroundColor: "#c8ddfb", fontWeight: 600 } };
                        if (row._grandTotal) return { "& td": { backgroundColor: "#bdbdbd", fontWeight: 700 } };
                        if (row._regionTotal) return { "& td": { backgroundColor: "#e0e0e0", fontWeight: 600 } };
                        if (row._repTotal) return { "& td": { backgroundColor: "#eeeeee", fontWeight: 600 } };
                        return {};
                    }}
                />
            </Box>

            {/* ================= Product Summary Modal — replica of PHP #productSummaryModal ================= */}
            <Dialog open={summaryOpen} onClose={closeSummary} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '17px', fontWeight: 300 }}>{prodLabel} Breakup</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {deletedLine && (
                            <Typography sx={{ color: 'red', fontWeight: 700, fontSize: '23px' }}>
                                {deletedLine}
                            </Typography>
                        )}
                        {canShowDeleteButton && (
                            <Button variant="contained" color="error" size="small" onClick={showDeleteOrderConfirmation}>
                                Delete
                            </Button>
                        )}
                        <IconButton onClick={closeSummary}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {/* ---- Header details block (matches PHP col-md-6 / col-md-6 split) ---- */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography>Order number: <b style={{ color: 'blue' }}>{summaryHeader.orderNumber}</b></Typography>
                            <Typography>Customer : <b style={{ color: 'blue' }}>{summaryHeader.customer}</b></Typography>
                            <Typography>Status : <b style={{ color: 'blue' }}>{summaryHeader.status}</b></Typography>
                            <Typography>Date : <b style={{ color: 'blue' }}>{summaryHeader.date}</b></Typography>
                            <Typography>{psmLabel}/{kamLabel} : <b style={{ color: 'blue' }}>{summaryHeader.rep}</b></Typography>
                            <Typography>{distributorLabel} : <b style={{ color: 'blue' }}>{summaryHeader.stockist}</b></Typography>
                            <Typography>Order Mode & Time: <b style={{ color: 'blue' }}>{decodedStatus == "5" ? "-" : summaryHeader.modeTime}</b></Typography>
                            <Typography>Order Remarks : <b style={{ color: 'blue' }}>{summaryHeader.remarks}</b></Typography>
                        </Grid>
                        {/* PHP: .showcount block — only for mailstat 2/4/5 */}
                        {showFopPodBlock && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography>
                                    POD DUE: <b style={{ color: 'blue' }}>{counts.podcount}</b>
                                </Typography>
                                <Typography>
                                    FOP  : {counts.fopcount > 10
                                        ? <b style={{ color: 'red' }}>{counts.fopcount} Quota Exceeded</b>
                                        : <b style={{ color: 'blue' }}>{counts.fopcount}</b>}
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

                    {/* ---- Product breakup table ---- */}
                    <TableContainer component={Paper} sx={{ mt: 2, border: '1px solid #ddd', overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>{prodLabel} name</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>PTR</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>MRP</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>Qty</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>Free</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>Offer(%)</TableCell>
                                    <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }}>Offer value</TableCell>
                                    {/* PHP: <td class="ordStat" colspan="2">Action</td> — hidden when del_stat==5 */}
                                    {!deletedLine && (
                                        <TableCell sx={{ bgcolor: '#3f6db3', color: '#fff', fontWeight: 700 }} colSpan={2}>
                                            Action
                                        </TableCell>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {summaryLines.map((line) => (
                                    <TableRow key={line.prod_id}>
                                        <TableCell sx={{ fontWeight: 600 }}>{line.code}-{line.prod_name}</TableCell>
                                        <TableCell>{FormatCurrency(line.prod_ptr)}</TableCell>
                                        <TableCell>{FormatCurrency(line.prod_mrp)}</TableCell>
                                        <TableCell>{line.prod_qty}</TableCell>
                                        <TableCell>{FormatCurrency(line.prod_free)}</TableCell>
                                        <TableCell>{FormatCurrency(line.prod_disc)}</TableCell>
                                        <TableCell>{FormatCurrency(line.discount_value)}</TableCell>
                                        {!deletedLine && (
                                            <TableCell>
                                                <IconButton size="small" onClick={() => openEditLine(line)}>
                                                    <EditIcon fontSize="small" sx={{ color: '#2e7d32' }} />
                                                </IconButton>
                                                {![6,8].includes(Number(userType)) && (
                                                <IconButton size="small" onClick={() => showDeleteLineConfirmation(line)}>
                                                    <DeleteIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                                                </IconButton>
                                                )}
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
                                {/* Totals row inline in same table, like PHP */}
                                {summaryLines.length > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                        <TableCell />
                                        <TableCell />
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {summaryLines.reduce((s, l) => s + (parseFloat(l.prod_qty) || 0), 0)}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {summaryLines.reduce((s, l) => s + (parseFloat(l.prod_free) || 0), 0)}
                                        </TableCell>
                                        <TableCell />
                                        <TableCell sx={{ fontWeight: 700 }}>
                                            {summaryLines.reduce((s, l) => s + (parseFloat(l.discount_value) || 0), 0).toFixed(2)}
                                        </TableCell>
                                        {!deletedLine && <TableCell colSpan={2} />}
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* ---- Totals summary block ---- */}
                    {summaryLines.length > 0 && (
                        <TableContainer component={Paper} sx={{ mt: 2, maxWidth: 480, border: '1px solid #ddd' }}>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Net Order Value (PTR)</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {summaryTotals.orderValue.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ color: '#1976d2', fontWeight: 700, fontStyle: 'italic', border: 'none' }}>
                                            + GST @18%
                                        </TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: '#f0f5fc' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Net offer value</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {summaryTotals.offerValue.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }} />
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Net offer %</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                            {summaryTotals.offerPercent.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }} />
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: '#dbe9fb' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Order MRP Value</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {summaryTotals.mrpValue.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }} />
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: '#dbe9fb' }}>
                                        <TableCell sx={{ fontWeight: 700 }}>Net Margin Value on MRP</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            {summaryTotals.marginValue.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }} />
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Net Margin % on MRP</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1976d2' }}>
                                            {summaryTotals.marginPercent.toFixed(2)}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none' }} />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                {/* PHP: #footerAction rendered server-side with Approve/Reject buttons */}
                <DialogActions>
                    {/* {summaryFooter.canApprove && (
                        <Button variant="contained" color="success" onClick={showApproveConfirmation}>Approve</Button>
                    )} */}
                    {/* {summaryFooter.canReject && (
                        <Button variant="contained" color="error" onClick={showRejectConfirmation}>Reject</Button>
                    )} */}
                    <Button onClick={closeSummary}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ================= Product Edit Modal — replica of PHP #productEditModal ================= */}
            <Dialog open={editOpen} onClose={closeEditLine} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '17px', fontWeight: 300 }}>{prodLabel} Edit</Typography>
                    <IconButton onClick={closeEditLine}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <Typography>{prodLabel} : <b>{editLine.prod_name}</b></Typography>
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

// ---- Inline discount cell (matches PHP .addDiscount row control) ----
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
                color="primary"
                onClick={() => onUpdate(row, value)}
            >
                Update
            </Button>
        </Box>
    );
};

export default OrderApproval