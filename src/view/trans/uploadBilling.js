import React, { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom';
import Layout from '../../layout';
import api from '../../services/api';
import {
    Box, Grid, Paper, Typography, Button, IconButton, TextField,
    Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
    Divider, Chip
} from '@mui/material';
import { FiRefreshCw } from "react-icons/fi";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs from 'dayjs';



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

    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const { data } = await api.post(`/lastUploadedData`);
            let lasupdtdt=data.lastUpdated?dayjs(data?.lastUpdated).format('DD MMM YYYY HH:mm A'):''
            setLastUpdated(lasupdtdt || '');
            setUnmappedInfo(data.unmappedInfo || '');
        } catch (err) {
            console.error('Failed to fetch EDI summary', err);
        } finally {
            setSummaryLoading(false);
        }
    }, []);

    const fetchRefreshBillingData=async()=>{
        try{
            let response=await api.get('/ftp_primary_sales')
            console.log("refreshed billingdata response",response)

        }
        catch(err){
            console.log("Refresh billing data Error",err)
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
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchBillingLogs(logDate);
    }, [logDate, fetchBillingLogs]);

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

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: location.pathname },
            { label: "Upload Billing", path: location.pathname },
        ]}>

            <Box sx={{ p: 2,backgroundColor:'white',mt:3,ml:2,mr:2,borderRadius:'0.2rem' }}>
                <Grid container spacing={2}>
                    {/* EDI Last Updated */}
                    <Grid item size={{ lg: 3, md: 5, xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%', borderRadius: '1rem' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{fontSize:'1.2rem',fontWeight:600}}>EDI - Last Updated</Typography>
                                <IconButton size="small" onClick={fetchRefreshBillingData} disabled={summaryLoading}>
                                    {summaryLoading ? <CircularProgress size={16} /> : <FiRefreshCw fontSize="small" color='#466F9B'  />}
                                </IconButton>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Typography  sx={{ mb: 1,color:'#466F9B',fontSize:'1.2rem',fontWeight:600,textAlign:'center'}}>{lastUpdated || '—'}</Typography>
                            <Typography
                                variant="body1"
                                color="primary"
                                sx={{ cursor: 'pointer', fontWeight: 600, textAlign:'center',mt:2.5,color:'#466F9B',fontSize:'1.2rem' }}
                            >
                             {unmappedInfo} <span style={{color:'#a9c2e6'}}>Unmapped</span>
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item size={{ lg: 4, xs: 0 }}>

                    </Grid>

                    {/* Manual Upload */}
                    <Grid item size={{ lg: 4.5, md: 5, xs: 12 }}>
                        <Paper variant="outlined" sx={{ p: 2, height: '100%',borderRadius: '1rem'}}>
                            <Typography sx={{textAlign:'center',fontWeight:600,fontSize:'1.2rem'}} variant="subtitle1" fontWeight={600}>Manual Upload</Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'start' }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        value={uploadMonth}
                                        format='MMM YYYY'
                                        onChange={(val) => val && setUploadMonth(val)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                        sx={{width:110}}
                                    />
                                </LocalizationProvider>
                                <Box sx={{display:'flex',flexDirection:'column',gap:2,ml:3}}>
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
                                    sx={{width:'2rem'}}
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

                {/* Billing Log */}
                {/* <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="h6" sx={{ mr: 2 }}>Billing Log</Typography>
                        <IconButton size="small" onClick={() => shiftDate(-1)}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <DatePicker
                            value={logDate}
                            onChange={(val) => val && setLogDate(val)}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <IconButton size="small" onClick={() => shiftDate(1)}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>

                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: 'grey.100' } }}>
                                    <TableCell align="center">Sl.</TableCell>
                                    <TableCell align="center">Invoice</TableCell>
                                    <TableCell align="center">Date</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Code</TableCell>
                                    <TableCell>Customer Name</TableCell>
                                    <TableCell align="center">Total Qty Pcs</TableCell>
                                    <TableCell align="center">Total Kgs</TableCell>
                                    <TableCell align="right">Total Value</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">
                                            <CircularProgress size={20} />
                                        </TableCell>
                                    </TableRow>
                                ) : billingLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} align="center">No Logs found</TableCell>
                                    </TableRow>
                                ) : (
                                    billingLogs.map((row, idx) => {
                                        const unmapped = row.cus_id === 0;
                                        const prodUnmapped = row.prod_stat === 1;
                                        const hasError = unmapped || prodUnmapped;
                                        return (
                                            <TableRow key={idx} hover>
                                                <TableCell align="center">{idx + 1}</TableCell>
                                                <TableCell align="center">
                                                    <DescriptionIcon
                                                        fontSize="small"
                                                        sx={{ cursor: 'pointer' }}
                                                        onClick={() => openBillModal(row)}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">{logDate.format('DD MMM YYYY')}</TableCell>
                                                <TableCell>
                                                    {unmapped ? (
                                                        <Chip size="small" color="error" icon={<ErrorIcon />} label="Unmapped" />
                                                    ) : row.cus_type}
                                                </TableCell>
                                                <TableCell>{row.cus_code}</TableCell>
                                                <TableCell>{row.cus_name}</TableCell>
                                                <TableCell align="center">{row.tot_qty}</TableCell>
                                                <TableCell align="center">
                                                    {prodUnmapped ? <ErrorIcon fontSize="small" color="error" /> : row.tot_kg}
                                                </TableCell>
                                                <TableCell align="right">{row.tot_val}</TableCell>
                                                <TableCell align="center">
                                                    {hasError ? (
                                                        <Chip size="small" color="error" icon={<ErrorIcon />} label="Unmapped" />
                                                    ) : (
                                                        <Chip size="small" color="success" icon={<CheckCircleIcon />} label="Mapped" />
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }}
                                                    onClick={() => openBillModal(row)}
                                                >
                                                    View
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                                {billingLogs.length > 0 && (
                                    <TableRow sx={{ '& td': { fontWeight: 600 } }}>
                                        <TableCell colSpan={6} align="right">Total</TableCell>
                                        <TableCell align="center">{totals.qty}</TableCell>
                                        <TableCell align="center">{totals.kg}</TableCell>
                                        <TableCell align="right">{totals.val}</TableCell>
                                        <TableCell />
                                        <TableCell />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper> */}
            </Box>

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
        </Layout>
    )
}

export default UploadBilling