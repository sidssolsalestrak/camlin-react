import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab,
} from "@mui/material";
import ConfirmationDialog from "../../utils/confirmDialog";
import DataTable from "../../utils/dataTable";
import './AdminPanel.css'
import dayjs from "dayjs";

export default function ApiProcessing() {
    const [tabValue, setTabValue] = useState(0)
    const [ReportprocessData, setProcessData] = useState([])
    const [primaryOrderData, setprimaryOrderData] = useState([])
    const [modifyLoading, setModifyLoading] = useState(false)
    const [loading,setLoading]=useState(false)
    const [orderDataLoading,setOrderDataLoading]=useState(false)
    const toast = useToast()
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    useEffect(() => {
        fetchReportUnprocessData()
        fetchPrimaryOrderData()
    }, [])

    const fetchReportUnprocessData = async () => {
        setLoading(true)
        try {
            let response = await api.post("/getApiProcessingData")
            let unprocessResData = Array.isArray(response.data.data) ? response.data.data : []
            setProcessData(unprocessResData.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log(err)
        }
        finally{
            setLoading(false)
        }
    }

    const fetchPrimaryOrderData = async () => {
        setOrderDataLoading(true)
        try {
            let response = await api.post("/getPrimaryOrderData")
            let primaryResData = Array.isArray(response.data.data) ? response.data.data : []
            setprimaryOrderData(primaryResData.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log(err)
        }
        finally{
            setOrderDataLoading(false) 
        }
    }

    // ✅ Report - Process Single
    const reportProcessSingle = async (process_id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/callProcessSingle", { process_id: process_id })
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("reportProcessSingle err", err)
            toast.error("Unable to Process")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    // ✅ Report - Process All
    const reportProcessAll = async () => {
        setModifyLoading(true)
        try {
            let processIdArray = ReportprocessData.map((item) => item.process_id)
            let payload = { call_pro_id: processIdArray.join(",") }
            let response = await api.post("/callProcessAll", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("reportProcessAll err", err)
            toast.error("Unable to Process")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    // ✅ Order - Process Single
    const orderProcessSingle = async (process_id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/ordProcessSingle", { processId: process_id })
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("orderProcessSingle err", err)
            toast.error("Unable to Process")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    // ✅ Order - Process All
    const orderProcessAll = async () => {
        setModifyLoading(true)
        try {
            let processIdArray = primaryOrderData.map((item) => item.process_id)
            let payload = { ordpro_id: processIdArray.join(",") }
            let response = await api.post("/ordProcessAll", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("orderProcessAll err", err)
            toast.error("Unable to Process")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    // ✅ Confirmation triggers
    const showReportSingleConfirmation = (process_id) => {
        showConfirmationDialog({
            title: "Process Report",
            message: "Are you sure you want to process this report entry?",
            confirmText: "Process",
            cancelText: "Cancel",
            confirmColor: "primary",
            onConfirm: () => reportProcessSingle(process_id)
        })
    }

    const showReportAllConfirmation = () => {
        showConfirmationDialog({
            title: "Process All Reports",
            message: `Are you sure you want to process all ${ReportprocessData.length} report entries?`,
            confirmText: "Process All",
            cancelText: "Cancel",
            confirmColor: "primary",
            onConfirm: () => reportProcessAll()
        })
    }

    const showOrderSingleConfirmation = (process_id) => {
        showConfirmationDialog({
            title: "Process Order",
            message: "Are you sure you want to process this order entry?",
            confirmText: "Process",
            cancelText: "Cancel",
            confirmColor: "primary",
            onConfirm: () => orderProcessSingle(process_id)
        })
    }

    const showOrderAllConfirmation = () => {
        showConfirmationDialog({
            title: "Process All Orders",
            message: `Are you sure you want to process all ${primaryOrderData.length} order entries?`,
            confirmText: "Process All",
            cancelText: "Cancel",
            confirmColor: "primary",
            onConfirm: () => orderProcessAll()
        })
    }

    const column1 = [
        { field: "si_no", headerName: "SL_NO", filterable: true, sortable: true },
        { field: "first_name", headerName: "USER NAME", filterable: true, sortable: true },
        {
            field: "sync_date", headerName: "SYNC DATE TIME", filterable: true, sortable: true, renderCell: (params) => (
                <Typography>{dayjs(params.value).format("DD MMM YYYY HH:mm:ss")}</Typography>
            )
        },
        {
            field: "call_dt", headerName: "CALL DATE", filterable: true, sortable: true, renderCell: (params) => (
                <Typography>{dayjs(params.value).format('DD MMM YYYY')}</Typography>
            )
        },
        { field: "typ", headerName: "TYPE", filterable: true, sortable: true },
        { field: "typ", headerName: "DATA KEY", filterable: true, sortable: true },
        {
            field: "", headerName: "ACTION", renderCell: (row) => (
                // ✅ Now calls confirmation instead of directly processing
                <Button variant="contained" onClick={() => showReportSingleConfirmation(row.row.process_id)} sx={{ width: '1rem', textTransform: 'none', px: 0,height:'2.2rem' }}>
                    Process
                </Button>
            )
        }
    ]

    const column2 = [
        { field: "si_no", headerName: "SL_NO", filterable: true, sortable: true },
        { field: "first_name", headerName: "USER NAME", filterable: true, sortable: true },
        {
            field: "sync_date", headerName: "SYNC DATE TIME", filterable: true, sortable: true, renderCell: (params) => (
                <Typography>{dayjs(params.value).format("DD MMM YYYY HH:mm:ss")}</Typography>
            )
        },
        {
            field: "ord_date", headerName: "ORD DATE", filterable: true, sortable: true, renderCell: (params) => (
                <Typography>{dayjs(params.value).format('DD MMM YYYY')}</Typography>
            )
        },
        { field: "stk_name", headerName: "DISTRIBUTOR", filterable: true, sortable: true },
        { field: "key_id", headerName: "DATA KEY", filterable: true, sortable: true },
        {
            field: "", headerName: "ACTION", renderCell: (row) => (
                // ✅ Now calls confirmation instead of directly processing
                <Button variant="contained" onClick={() => showOrderSingleConfirmation(row.row.process_id)} sx={{ width: '1rem', textTransform: 'none', px: 0, height:'2.2rem' }}>
                    Process
                </Button>
            )
        }
    ]

    return (
        <Layout>
            <Box sx={{ backgroundColor: 'white', pt: 2, minHeight: '30vh', pl: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 600, color: '#000000', fontSize: '1.5rem' }}>
                        {`Api Processing (Unprocessed Data)`}
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1, minWidth: '90%', mr: 3 }}>
                    <Tabs value={tabValue} sx={{ width: '100%' }} onChange={(e, val) => setTabValue(val)}>
                        <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label={`Report (${ReportprocessData.length})`} />
                        <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label={`Primary Order (${primaryOrderData.length})`} />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontWeight: 600, color: '#000000', fontSize: '1.3rem' }}>
                                Report Unprocessed
                            </Typography>
                            {/* ✅ Now calls confirmation */}
                            <Button variant="contained" sx={{ width: '6rem', textTransform: 'none', px: 0 }} onClick={showReportAllConfirmation}>
                                Process All
                            </Button>
                        </Box>
                        <Box>
                            <DataTable columns={column1} data={ReportprocessData} loading={loading} />
                        </Box>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontWeight: 600, color: '#000000', fontSize: '1.3rem' }}>
                                Primary Order Unprocessed
                            </Typography>
                            {/* ✅ Now calls confirmation */}
                            <Button variant="contained" sx={{ width: '6rem', textTransform: 'none', px: 0 }} onClick={showOrderAllConfirmation}>
                                Process All
                            </Button>
                        </Box>
                        <Box>
                            <DataTable columns={column2} data={primaryOrderData} loading={orderDataLoading} />
                        </Box>
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
    )
}