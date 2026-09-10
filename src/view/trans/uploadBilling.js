import React, { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom';
import Layout from '../../layout';
import api from '../../services/api';
import {
    Box, Grid, Paper, Typography, Button, IconButton, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Divider, Chip, Alert, Tabs, Tab,
} from '@mui/material';
import { FiRefreshCw } from "react-icons/fi";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import MappingTable from './MappingTable';
import useToast from '../../utils/useToast'
import DataTable from '../../utils/dataTable';
import ConfirmationDialog from '../../utils/confirmDialog';
import { GrUploadOption } from "react-icons/gr";
import { FaDownload } from "react-icons/fa";
import { IoMdCloudUpload } from "react-icons/io";


const UploadBilling = () => {
    const location = useLocation();

    const [lastUpdated, setLastUpdated] = useState('');
    const [unmappedInfo, setUnmappedInfo] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [uploadMonth, setUploadMonth] = useState(dayjs());
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState({ text: '', type: 'info' });

    const [logDate, setLogDate] = useState(dayjs());
    const [billingLogs, setBillingLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [totals, setTotals] = useState({ qty: 0, kg: 0, val: 0 });

    const [billModalOpen, setBillModalOpen] = useState(false);
    const [billDetails, setBillDetails] = useState(null);
    const [billLoading, setBillLoading] = useState(false);

    const [mappingOpen, setMappingOpen] = useState(false);
    const [mappingLoading, setMappingLoading] = useState(false);
    const [mappingSaving, setMappingSaving] = useState(false);

    const [unmappedProducts, setUnmappedProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSelections, setProductSelections] = useState({});

    const [unmappedCustomers, setUnmappedCustomers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSelections, setCustomerSelections] = useState({});
    const [tabNumber, setTabNumber] = useState(0)

    const [uploadedBilling, setUploadedBilling] = useState([])
    const toast = useToast()
    const [ignoreLoading, setIgnoreLoading] = useState(false);
    const [stockistUploading, setStockistUploading] = useState(false);
    const [billingDateRange, setBillingDateRange] = useState(null)
    const [tempval, setTempVal] = useState(0)

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmColor: 'primary',
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));
    };

    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const { data } = await api.post(`/lastUploadedData`);
            let lasupdtdt = data.lastUpdated ? dayjs(data?.lastUpdated).format('DD MMM YYYY hh:mm A') : ''
            setLastUpdated(lasupdtdt || '');
            setUnmappedInfo(data.unmappedInfo || '');
        } catch (err) {
            console.error('Failed to fetch EDI summary', err);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const fetchRefreshBillingData = async () => {
        try {
            let response = await api.get('/ftp_primary_sales')
            console.log("refreshed billingdata response", response)
            // if(response.data.status === 100){
            //     toast.error(response.data.message)
            // }
        }
        catch (err) {
            
            console.log("Refresh billing data Error", err)
        }
    }

    const fetchBillingLogs = useCallback(async (date) => {
        setLogsLoading(true);
        try {
            const { data } = await api.post(`/getBillingLogs`, {
                params: { date: date.format('DD MMM YYYY') }
            });
            const logs = data.logs || [];
            setBillingLogs(logs);
            setTotals(
                logs.reduce(
                    (acc, row) => ({
                        qty: acc.qty + Number(row.tot_qty || 0),
                        kg: acc.kg + Number(row.tot_kg || 0),
                        val: acc.val + Number(row.tot_val || 0),
                    }),
                    { qty: 0, kg: 0, val: 0 }
                )
            );
        } catch (err) {
            console.error('Failed to fetch billing logs', err);
            setBillingLogs([]);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBillingLogs(logDate);
    }, [logDate, fetchBillingLogs]);

    const fetchUnmappedCount = async () => {
        try {
            const response = await api.post('/getUnMappedData');
            setUnmappedInfo(response.data?.unmap_cout ?? 0);
        } catch (error) {
            console.error('Get unmapped count error:', error);
            setUnmappedInfo(0);
        }
    };

    const loadUploadedBilling = async () => {
        try {
            let response = await api.post('/viewUploadedBilling')
            let billingdata = Array.isArray(response.data.data) ? response.data.data : []
            setUploadedBilling(billingdata)
            if(billingdata.length>0){
                setTempVal(1)
            }
            let billingDaterange = response?.data?.summaryDate[0]
            setBillingDateRange(billingDaterange)
        }
        catch (err) {
            console.log("load uploaded billing data err", err)
        }
    }

    const loadUnmappedProducts = async () => {
        try {
            const { data } = await api.get('/unmappedbillingproducts');
            setUnmappedProducts(data.unmappedProducts || []);
            setProducts(data.products || []);
            if(data.count !== 0){
                setTempVal(1)
            }
            setProductSelections({});
        } catch (err) {
            toast.error('Unable to load unmapped products.')
        }
    };

    const loadUnmappedCustomers = async () => {
        try {
            const { data } = await api.get('/unmappedbillingcustomers');
            setUnmappedCustomers(data.unmappedCustomers || []);
            setCustomers(data.customers || []);
            setCustomerSelections({});
            if(data.count !== 0){
                setTempVal(1)
            }
        } catch (err) {
            toast.error('Unable to load unmapped customers.')
        }
    };

    // Central "what should the page show" check:
    // - unmapped products/customers exist -> load them and show the mapping tabs
    // - nothing unmapped -> skip the tabs entirely, just load and show the uploaded billing table
    const fetchUnmappedData = useCallback(async () => {
        try {
            const { data } = await api.post('/getUnMappedData');
            const unmapCount = Number(data.unmap_cout ?? 0);
            setUnmappedInfo(data.unmap_cout ?? 0);

            if (unmapCount > 0) {
                setTabNumber(0);
                setMappingLoading(true);
                try {
                    await Promise.all([loadUnmappedProducts(), loadUnmappedCustomers()]);
                    setMappingOpen(true);
                } finally {
                    setMappingLoading(false);
                }
            } else {
                setMappingOpen(false);
                await loadUploadedBilling();
            }
        } catch (err) {
            console.error('Failed to fetch unmapped count', err);
            setUnmappedInfo(0);
        }
    }, []);

    // Kept for the manual click on the "Unmapped" counter — just re-runs the same check.
    const openMappingDialog = async () => {
        if (!Number(unmappedInfo)) return;
        await fetchUnmappedData();
    };

    const saveProductMappings = async () => {
        const mappings = unmappedProducts
            .filter(row => productSelections[row.prod_name])
            .map((row) => ({
                sourceProductName: row.prod_name,
                productId: productSelections[row.prod_name],
            }));

        if (mappings.length === 0) {
            toast.error('Please select at least one product.');
            return;
        }

        setMappingSaving(true);

        try {
            const { data } = await api.post('/unmappedbillingproductsmap', { mappings });
            toast.success('Products mapped successfully.');
            await fetchUnmappedData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to save product mappings.');
        } finally {
            setMappingSaving(false);
            closeConfirmationDialog();
        }
    };

    const showSaveProductsConfirmation = () => {
        const selectedCount = unmappedProducts.filter(row => productSelections[row.prod_name]).length;
        if (selectedCount === 0) {
            toast.error('Please select at least one product.');
            return;
        }
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Are you sure you want to map ${selectedCount} selected product${selectedCount > 1 ? 's' : ''}?`,
            confirmText: 'Save',
            cancelText: 'Cancel',
            confirmColor: 'primary',
            onConfirm: () => saveProductMappings(),
        });
    };

    const saveCustomerMappings = async () => {
        const mappings = unmappedCustomers
            .filter(row => customerSelections[row.cus_name])
            .map((row) => ({
                sourceCustomerName: row.cus_name,
                customerId: customerSelections[row.cus_name],
            }));

        if (mappings.length === 0) {
            toast.error('Please select at least one customer.');
            return;
        }

        setMappingSaving(true);

        try {
            const { data } = await api.post('/unmappedbillingcustomersmap', { mappings });
            toast.success('Customers mapped successfully.');
            await fetchUnmappedData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to save customer mappings.');
        } finally {
            setMappingSaving(false);
            closeConfirmationDialog();
        }
    };

    const showSaveCustomersConfirmation = () => {
        const selectedCount = unmappedCustomers.filter(row => customerSelections[row.cus_name]).length;
        if (selectedCount === 0) {
            toast.error('Please select at least one customer.');
            return;
        }
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Save mapping for ${selectedCount} selected customer${selectedCount > 1 ? 's' : ''}?`,
            confirmText: 'Save',
            cancelText: 'Cancel',
            confirmColor: 'primary',
            onConfirm: () => saveCustomerMappings(),
        });
    };

    const columns = [
        { field: 'invoice_no', headerName: 'Invoice No' },
        { field: 'cus_type_name', headerName: 'Distributor Type' },
        { field: 'cus_name', headerName: 'Distributor Code' },
        { field: 'stk_name', headerName: 'Distributor' },
        { field: 'prod_name', headerName: 'Product Code' },
        { field: 'sku_name', headerName: 'Product Name' },
        {
            field: 'prod_qty',
            headerName: 'Prod Qty',
            renderCell: (row) => (
                <Typography sx={{ textAlign: 'right' }}>{row.value}</Typography>
            )
        }
    ]

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files?.[0] || null);
        setUploadMessage({ text: '', type: 'info' });
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadMessage({ text: 'Please choose a file first.', type: 'error' });
            return;
        }
        const formData = new FormData();
        formData.append('xls_file', selectedFile);
        formData.append('month', uploadMonth.format('MMM YYYY'));

        setUploading(true);
        setUploadMessage({ text: '', type: 'info' });
        try {
            const { data } = await api.post(`/uploadExcel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Backend responds with HTTP 200 even for validation failures
            // (status 100 / 101 / etc). A non-empty status means it failed.
            if (data.status) {
                const errorText = data.message || 'Upload failed. Please try again.';
                setUploadMessage({ text: errorText, type: 'error' });
                return;
            }

            setSelectedFile(null);
            fetchSummary();
            fetchBillingLogs(logDate);
            toast.success(data.message || 'File uploaded successfully.');
        } catch (err) {
            console.error('Upload failed', err);
            const errorText = err.response?.data?.message || 'Upload failed. Please try again.';
            toast.error(errorText);
            setUploadMessage({ text: errorText, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const shiftDate = (days) => setLogDate((d) => d.add(days, 'day'));

    const openBillModal = async (row) => {
        setBillModalOpen(true);
        setBillLoading(true);
        try {
            const { data } = await api.post(`/getBillingDetails`, {
                date: logDate.format('DD MMM YYYY'),
                type: row.cus_type_id,
                cus: row.cus_name,
            });
            setBillDetails(data);
        } catch (err) {
            console.error('Failed to load bill details', err);
            setBillDetails(null);
        } finally {
            setBillLoading(false);
        }
    };

    const closeBillModal = () => {
        setBillModalOpen(false);
        setBillDetails(null);
    };

    const handleIgnoreUnmappedProducts = async () => {
        setIgnoreLoading(true);
        try {
            const month = uploadMonth.format('YYYY-MM-DD');
            const { data } = await api.post('/deleteUnMapProd', { month });

            if (data?.success) {
                toast.success('Unmapped products removed.');
                await fetchUnmappedData();
            } else {
                toast.error('Unable to delete unmapped products.');
            }
        } catch (err) {
            console.log("ignore unmapped products err", err);
            toast.error(err.response?.data?.message || 'Unable to delete unmapped products.');
        } finally {
            setIgnoreLoading(false);
            closeConfirmationDialog();
        }
    };

    const handleIgnoreUnmappedCustomers = async () => {
        setIgnoreLoading(true);
        try {
            const month = uploadMonth.format('YYYY-MM-DD');
            const { data } = await api.post('/deleteUnMapCus', { month });

            if (data?.success) {
                toast.success('Unmapped customers removed.');
                await fetchUnmappedData();
            } else {
                toast.error('Unable to delete unmapped customers.');
            }
        } catch (err) {
            console.log("ignore unmapped customers err", err);
            toast.error(err.response?.data?.message || 'Unable to delete unmapped customers.');
        } finally {
            setIgnoreLoading(false);
            closeConfirmationDialog();
        }
    };

    const showIgnoreProductsConfirmation = () => {
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Are you sure you want to  delete Unmapped Items?`,
            confirmText: 'Yes! Delete',
            cancelText: 'Cancel',
            confirmColor: 'error',
            onConfirm: () => handleIgnoreUnmappedProducts(),
        });
    };

    const showIgnoreCustomersConfirmation = () => {
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Are you sure want to Delete UnMapped Items?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmColor: 'error',
            onConfirm: () => handleIgnoreUnmappedCustomers(),
        });
    };

    const handleuploadStockistBilling = async () => {
        setStockistUploading(true);
        try {
            const startDay = uploadMonth.startOf('month').format('YYYY-MM-DD');
            const endDay = uploadMonth.endOf('month').format('YYYY-MM-DD');

            const { data } = await api.post('/uploadStockistBilling', { startDay, endDay });

            if (data?.success) {
                toast.success(data.message || 'Stockist billing uploaded successfully.');
                setUploadedBilling([]);
                await fetchSummary();
                await fetchBillingLogs(logDate);
                await fetchUnmappedData();
            } else {
                toast.error(data?.message || 'Unable to upload stockist billing.');
            }
        } catch (err) {
            console.log("uploadStockistBilling err", err);
            toast.error(err.response?.data?.message || 'Unable to upload stockist billing.');
        } finally {
            setStockistUploading(false);
            closeConfirmationDialog();
        }
    };

    const showUploadStockistBillingConfirmation = () => {
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Are you sure you want to upload?`,
            confirmText: 'Upload',
            cancelText: 'Cancel',
            confirmColor: 'primary',
            onConfirm: () => handleuploadStockistBilling(),
        });
    };

    useEffect(() => {
        fetchSummary();
        fetchUnmappedData();
    }, [fetchSummary, fetchUnmappedData]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: location.pathname },
            { label: "Upload Billing", path: location.pathname },
        ]}>

            <Box sx={{ p: 2, mt: 3,  }}>
               <Box sx={{backgroundColor: 'white', p: 2}}>
                <Grid container spacing={2}>
                    <Grid item size={{ lg: 3, md: 5, xs: 12 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: '1rem',
                                borderTop: '3px solid #F57C00',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 600 }}>EDI - Last Updated</Typography>
                                {tempval === 0 &&
                                <IconButton size="small" onClick={fetchRefreshBillingData} disabled={summaryLoading}>
                                    {summaryLoading ? <CircularProgress size={16}  /> : <FiRefreshCw fontSize="small" strokeWidth={4} color='#466F9B' />}
                                </IconButton>
                                }
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Typography sx={{ mb: 1, color: '#466F9B', fontSize: '1.2rem', fontWeight: 600, textAlign: 'center' }}>{lastUpdated || '—'}</Typography>
                            <Typography
                                variant="body1"
                                onClick={openMappingDialog}
                                sx={{
                                    cursor: Number(unmappedInfo) ? 'pointer' : 'default',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    mt: 2.5,
                                    color: '#466F9B',
                                    fontSize: '1.2rem',
                                }}
                            >
                                {unmappedInfo} <span style={{ color: '#a9c2e6' }}>Unmapped</span>
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item size={{ lg: 4, xs: 0 }} />

                    <Grid item size={{ lg: 4.5, md: 5, xs: 12 }}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: '1rem',
                                borderTop: '3px solid #1976D2',
                            }}
                        >
                            <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '1.2rem' }} variant="subtitle1" fontWeight={600}>Manual Upload</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'start' }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        value={uploadMonth}
                                        format='MMM YYYY'
                                        openTo="month"
                                        onChange={(val) => val && setUploadMonth(val)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                        sx={{ width: 110 }}
                                    />
                                </LocalizationProvider>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 3 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    sx={{
                                        width: '14.5rem',
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                    }}
                                    startIcon={<IoMdCloudUpload size={18} />}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            display: 'block',
                                            width: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    > 
                                        {selectedFile ? selectedFile.name : 'Upload Billing Data'}
                                    </Box>
                                    <input type="file" hidden accept=".csv" onChange={handleFileChange} />
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    sx={{ width: '2rem' }}
                                >
                                    Upload
                                </Button>
                                {uploadMessage.text && (
                                    <Typography
                                        variant="caption"
                                        color={uploadMessage.type === 'error' ? 'error' : 'success.main'}
                                        sx={{width:'16rem'}}
                                    >
                                        {uploadMessage.text}
                                    </Typography>
                                )}
                            </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
                </Box>
                {mappingLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, backgroundColor: 'white', mt: 2, borderRadius: '1rem' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    mappingOpen && (unmappedProducts.length > 0 || unmappedCustomers.length > 0) && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: '1rem', backgroundColor: 'white' }}>
                            <Tabs value={tabNumber} onChange={(e, val) => setTabNumber(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tab label="Products" value={0} />
                                <Tab label="Customers" value={1} />
                            </Tabs>

                            {tabNumber === 0 && unmappedProducts.length > 0 && (
                                <Box sx={{ pt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
                                            Update Product
                                        </Typography>
                                        <Button variant='contained' color='error' onClick={() => showIgnoreProductsConfirmation()}>Ignore Unmapped</Button>
                                    </Box>
                                    <MappingTable
                                        rows={unmappedProducts}
                                        rowKeyField="prod_name"
                                        sourceLabel="Not Mapped Product"
                                        targetLabel="Map Product"
                                        selectLabel="Select Product"
                                        options={products}
                                        optionValueField="prod_id"
                                        optionLabel={(product) => `${product.code} - ${product.prod_name}`}
                                        selections={productSelections}
                                        searchFields={["code", "prod_name"]}
                                        onSelectionChange={(key, value) =>
                                            setProductSelections((previous) => ({
                                                ...previous,
                                                [key]: value,
                                            }))
                                        }
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            disabled={mappingLoading || mappingSaving}
                                            onClick={showSaveProductsConfirmation}
                                            startIcon={<FaDownload size={14} />}
                                        >
                                            Update Products
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                            {tabNumber === 0 && unmappedProducts.length === 0 && (
                                <Box sx={{ pt: 4, pb: 2 }}>
                                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                        No UnMapped Product data available
                                    </Typography>
                                </Box>
                            )}

                            {tabNumber === 1 && unmappedCustomers.length > 0 && (
                                <Box sx={{ pt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>
                                            Update Customer
                                        </Typography>
                                        <Button variant='contained' color='error' onClick={() => showIgnoreCustomersConfirmation()}>Ignore Unmapped</Button>
                                    </Box>
                                    <MappingTable
                                        rows={unmappedCustomers}
                                        rowKeyField="cus_name"
                                        sourceLabel="Not Mapped Customer"
                                        targetLabel="Map Customer"
                                        selectLabel="Select Customer"
                                        options={customers}
                                        optionValueField="id"
                                        optionLabel={(customer) => `${customer.stk_code} - ${customer.stk_name}`}
                                        selections={customerSelections}
                                        searchFields={["stk_code", "stk_name"]}
                                        onSelectionChange={(key, value) =>
                                            setCustomerSelections((previous) => ({
                                                ...previous,
                                                [key]: value,
                                            }))
                                        }
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            disabled={mappingLoading || mappingSaving}
                                            onClick={showSaveCustomersConfirmation}
                                            startIcon={<FaDownload size={14} />}
                                        >
                                            Update Customers
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                            {tabNumber === 1 && unmappedCustomers.length === 0 && (
                                <Box sx={{ pt: 4, pb: 2 }}>
                                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                        No UnMapped Customer data available
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    )
                )}
            </Box>

            {!mappingOpen && uploadedBilling.length > 0 &&
                <Box sx={{ mt: 2, mx: 2, backgroundColor: 'white', borderRadius: '0.6rem' }}>
                    <Typography sx={{ p: 2, fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>Upload Summary</Typography>
                    {billingDateRange && <Typography sx={{backgroundColor:'#Dff0D8',color:'#689F38',mx:2,p:1.5,fontSize:'13px'}}>Date range for excel upload is <span style={{fontWeight:600}}>{ `${billingDateRange?.low_range ? dayjs(billingDateRange?.low_range).format('DD MMM YYYY'):null}` } </span> to <span style={{fontWeight:600}}>{`${billingDateRange?.high_range ? dayjs(billingDateRange?.high_range ).format('DD MMM YYYY'):null}` }</span></Typography>}
                    <DataTable columns={columns} data={uploadedBilling}/>
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'end' }}>
                        <Button
                            sx={{ textAlign: 'right', mb: 2, mr: 2 }}
                            color='primary'
                            variant='contained'
                            onClick={showUploadStockistBillingConfirmation}
                            disabled={stockistUploading}
                            startIcon={<GrUploadOption size={15}/>}
                        >
                            Upload
                        </Button>
                    </Box>
                </Box>
            }

            <Dialog open={billModalOpen} onClose={closeBillModal} maxWidth="sm" fullWidth>
                <DialogTitle>Billing Details</DialogTitle>
                <DialogContent dividers>
                    {billLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : billDetails ? (
                        <Box>
                            <Typography variant="body2">Date: {billDetails.date}</Typography>
                            <Typography variant="body2">Type: {billDetails.type}</Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>Billed To: {billDetails.billedTo}</Typography>
                            <Typography variant="caption" color="text.secondary">{billDetails.address}</Typography>
                            <TableContainer sx={{ mt: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Sl</TableCell>
                                            <TableCell align="center">Product</TableCell>
                                            <TableCell align="center">Qty Pcs</TableCell>
                                            <TableCell align="center">Qty Kgs</TableCell>
                                            <TableCell align="center">Value</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(billDetails.items || []).map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell align="center">{item.product}</TableCell>
                                                <TableCell align="center">{item.qtyPcs}</TableCell>
                                                <TableCell align="center">{item.qtyKgs}</TableCell>
                                                <TableCell align="center">{item.value}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Typography color="text.secondary">No details available.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeBillModal}>Close</Button>
                </DialogActions>
            </Dialog>

            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={ignoreLoading || stockistUploading || mappingSaving}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}

export default UploadBilling