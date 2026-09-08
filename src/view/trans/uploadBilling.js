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


const UploadBilling = () => {
    const location = useLocation();

    // ---- Top summary (EDI last updated / unmapped) ----
    const [lastUpdated, setLastUpdated] = useState('');
    const [unmappedInfo, setUnmappedInfo] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    // ---- Manual upload panel ----
    const [uploadMonth, setUploadMonth] = useState(dayjs());
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState({ text: '', type: 'info' });

    // ---- Billing log table ----
    const [logDate, setLogDate] = useState(dayjs());
    const [billingLogs, setBillingLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [totals, setTotals] = useState({ qty: 0, kg: 0, val: 0 });

    // ---- Bill details modal ----
    const [billModalOpen, setBillModalOpen] = useState(false);
    const [billDetails, setBillDetails] = useState(null);
    const [billLoading, setBillLoading] = useState(false);
    const [mappingOpen, setMappingOpen] = useState(false);
    const [mappingTabValue, setMappingTabValue] = useState(0);
    const [mappingLoading, setMappingLoading] = useState(false);
    const [mappingSaving, setMappingSaving] = useState(false);
    const [unmappedProducts, setUnmappedProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSelections, setProductSelections] = useState({});
    const [unmappedCustomers, setUnmappedCustomers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerSelections, setCustomerSelections] = useState({});
    const [uploadedBilling, setUploadedBilling] = useState([])
    const toast = useToast()
    const [ignoreLoading, setIgnoreLoading] = useState(false);
    const [stockistUploading, setStockistUploading] = useState(false);
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

        }
        catch (err) {
            console.log("load uploaded billing data err", err)
        }
    }

    const loadUnmappedProducts = async () => {
        setMappingLoading(true);
        try {
            const { data } = await api.get('/unmappedbillingproducts');
            setUnmappedProducts(data.unmappedProducts || []);
            setProducts(data.products || []);
            setProductSelections({});
        } catch (err) {
            toast.error('Unable to load unmapped products.')
        } finally {
            setMappingLoading(false);
        }
    };

    const loadUnmappedCustomers = async () => {
        setMappingLoading(true);
        try {
            const { data } = await api.get('/unmappedbillingcustomers');
            setUnmappedCustomers(data.unmappedCustomers || []);
            setCustomers(data.customers || []);
            setCustomerSelections({});
        } catch (err) {
            toast.error('Unable to load unmapped customers.')
        } finally {
            setMappingLoading(false);
        }
    };

    const openMappingDialog = async () => {
        if (!Number(unmappedInfo)) return;
        setMappingOpen(true);
        setMappingTabValue(0);
        await Promise.all([loadUnmappedProducts(), loadUnmappedCustomers()]);
    };

    // ---- Save Products (now the actual action, called on confirm) ----
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
            if (data.counts.products === 0 && data.counts.customers === 0) {
                await loadUploadedBilling();
            }
            await fetchUnmappedCount();
            await loadUnmappedProducts();
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
            message: `Are you sure want to Map Selected Product?`,
            confirmText: 'Save',
            cancelText: 'Cancel',
            confirmColor: 'primary',
            onConfirm: () => saveProductMappings(),
        });
    };

    // ---- Save Customers (now the actual action, called on confirm) ----
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
            await fetchUnmappedCount();
            await loadUnmappedCustomers();
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
        {
            field: 'invoice_no',
            headerName: 'Invoice No'
        },
        {
            field: 'cus_type_name',
            headerName: 'Distributor Type'
        },
        {
            field: 'cus_name',
            headerName: 'Distributor Code'
        },
        {
            field: 'stk_name',
            headerName: 'Distributor'
        },
        {
            field: 'prod_name',
            headerName: 'Product Code'
        },
        {
            field: 'sku_name',
            headerName: 'Product Name'
        },
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
            setUploadMessage({ text: data.message || 'File uploaded successfully.', type: 'success' });
            setSelectedFile(null);
            fetchSummary();
            fetchBillingLogs(logDate);
        } catch (err) {
            console.error('Upload failed', err);
            setUploadMessage({
                text: err.response?.data?.message || 'Upload failed. Please try again.',
                type: 'error',
            });
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

    const handleIgnoreunMapProduct = async () => {
        setIgnoreLoading(true);
        try {
            const month = uploadMonth.format('YYYY-MM-DD');

            const [prodRes, cusRes] = await Promise.all([
                api.post('/deleteUnMapProd', { month }),
                api.post('/deleteUnMapCus', { month }),
            ]);

            if (prodRes.data?.success && cusRes.data?.success) {
                toast.success('Unmapped product and customer records removed.');
                setMappingOpen(false);
                await fetchUnmappedData();
                await loadUploadedBilling();
            } else {
                toast.error('Unable to delete UnMapped Product and Customer');
            }
        } catch (err) {
            console.log("ignore unmapeed err", err);
            toast.error(err.response?.data?.message || "Unable to delete UnMapped Product and Customer");
        } finally {
            setIgnoreLoading(false);
            closeConfirmationDialog();
        }
    };

    const showIgnoreUnmappedConfirmation = () => {
        showConfirmationDialog({
            title: 'Confirmation',
            message: `Are you sure you want to permanently delete all unmapped Items?`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmColor: 'error',
            onConfirm: () => handleIgnoreunMapProduct(),
        });
    };

    const fetchUnmappedData = useCallback(async () => {
        try {
            const { data } = await api.post('/getUnMappedData');
            setUnmappedInfo(data.unmap_cout ?? 0);
            if (Number(data.unmap_cout) === 0) {
                await loadUploadedBilling()
            }
        } catch (err) {
            console.error('Failed to fetch unmapped count', err);
            setUnmappedInfo(0);
        }
    }, []);

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

    console.log("uploaded billing data", uploadedBilling)

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: location.pathname },
            { label: "Upload Billing", path: location.pathname },
        ]}>

            <Box sx={{ p: 2, backgroundColor: 'white', mt: 3, ml: 2, mr: 2, borderRadius: '0.2rem' }}>
                <Grid container spacing={2}>
                    {/* EDI Last Updated */}
                    <Grid item size={{ lg: 3, md: 5, xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: '1rem' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '1.2rem', fontWeight: 600 }}>EDI - Last Updated</Typography>
                                <IconButton size="small" onClick={fetchRefreshBillingData} disabled={summaryLoading}>
                                    {summaryLoading ? <CircularProgress size={16} /> : <FiRefreshCw fontSize="small" color='#466F9B' />}
                                </IconButton>
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
                    <Grid item size={{ lg: 4, xs: 0 }}>

                    </Grid>

                    {/* Manual Upload */}
                    <Grid item size={{ lg: 4.5, md: 5, xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: '1rem' }}>
                            <Typography sx={{ textAlign: 'center', fontWeight: 600, fontSize: '1.2rem' }} variant="subtitle1" fontWeight={600}>Manual Upload</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'start' }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        value={uploadMonth}
                                        format='MMM YYYY'
                                        onChange={(val) => val && setUploadMonth(val)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                        sx={{ width: 110 }}
                                    />
                                </LocalizationProvider>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 3 }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        fullWidth
                                    >
                                        {selectedFile ? selectedFile.name : 'Upload Billing Data'}
                                        <input
                                            type="file"
                                            hidden
                                            accept=".csv"
                                            onChange={handleFileChange}
                                        />
                                    </Button>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        sx={{ width: '2rem' }}
                                    >
                                        {uploading ? <CircularProgress size={18} color="inherit" /> : 'Upload'}
                                    </Button>
                                    {uploadMessage.text && (
                                        <Typography
                                            variant="caption"
                                            color={uploadMessage.type === 'error' ? 'error' : 'success.main'}
                                        >
                                            {uploadMessage.text}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Mapping Section */}
                {mappingOpen && (
                    <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: '1rem' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                Manage Unmapped Data
                            </Typography>
                            <Button variant='contained' color='error' onClick={() => showIgnoreUnmappedConfirmation()}>Ignore Unmapped</Button>
                        </Box>
                        <Divider sx={{ my: 1 }} />

                        <Tabs value={mappingTabValue} onChange={(e, val) => setMappingTabValue(val)}>
                            <Tab label={`Products (${unmappedProducts.length})`} />
                            <Tab label={`Customers (${unmappedCustomers.length})`} />
                        </Tabs>

                        {mappingLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : mappingTabValue === 0 ? (
                            <>
                                {unmappedProducts.length === 0 ? (
                                    <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        No unmapped products
                                    </Typography>
                                ) : (
                                    <MappingTable
                                        rows={unmappedProducts}
                                        rowKeyField="prod_name"
                                        sourceLabel="Uploaded Product"
                                        targetLabel="Map To Product"
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
                                )}
                            </>
                        ) : (
                            <>
                                {unmappedCustomers.length === 0 ? (
                                    <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                                        No unmapped customers
                                    </Typography>
                                ) : (
                                    <MappingTable
                                        rows={unmappedCustomers}
                                        rowKeyField="cus_name"
                                        sourceLabel="Uploaded Customer"
                                        targetLabel="Map To Customer"
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
                                )}
                            </>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button
                                disabled={mappingSaving}
                                onClick={() => setMappingOpen(false)}
                            >
                                Close
                            </Button>

                            {mappingTabValue === 0 && unmappedProducts.length > 0 && (
                                <Button
                                    variant="contained"
                                    disabled={mappingLoading || mappingSaving}
                                    onClick={showSaveProductsConfirmation}
                                >
                                    {mappingSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Products'}
                                </Button>
                            )}

                            {mappingTabValue === 1 && unmappedCustomers.length > 0 && (
                                <Button
                                    variant="contained"
                                    disabled={mappingLoading || mappingSaving}
                                    onClick={showSaveCustomersConfirmation}
                                >
                                    {mappingSaving ? <CircularProgress size={18} color="inherit" /> : 'Save Customers'}
                                </Button>
                            )}
                        </Box>
                    </Paper>
                )}
            </Box>

            {uploadedBilling.length > 0 &&
                <Box sx={{ mt: 2, mx: 2, backgroundColor: 'white' }}>
                    <Typography sx={{ p: 2, fontSize: "1.2rem", fontWeight: 500, color: "#000" }}>Upload Summary</Typography>
                    <DataTable
                        columns={columns}
                        data={uploadedBilling}
                    />
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'end' }}>
                        <Button
                            sx={{ textAlign: 'right', mb: 2, mr: 2 }}
                            color='primary'
                            variant='contained'
                            onClick={showUploadStockistBillingConfirmation}
                            disabled={stockistUploading}
                        >
                            {stockistUploading ? <CircularProgress size={18} color="inherit" /> : 'Upload'}
                        </Button>
                    </Box>
                </Box>
            }


            {/* Bill Details Modal */}
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