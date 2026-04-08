import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab, 
} from "@mui/material";

import DataTable from "../../utils/dataTable";
import './AdminPanel.css'
import dayjs from "dayjs";

export default function ApiProcessing() {
    const [tabValue, setTabValue] = useState(0)
    const [ReportprocessData, setProcessData] = useState([])
    const [primaryOrderData, setprimaryOrderData] = useState([])
    const toast = useToast()

    useEffect(() => {
        fetchReportUnprocessData()
        fetchPrimaryOrderData()
    }, [])

    const fetchReportUnprocessData = async () => {
        try {
            let response = await api.post("/getApiProcessingData")
            let unprocessResData = Array.isArray(response.data.data) ? response.data.data : []
            setProcessData(unprocessResData.map((item, index) => ({ ...item, si_no: index + 1 })))
        }
        catch (err) {
            console.log(err)
        }
    }

    const fetchPrimaryOrderData = async () => {
        try {
            let response = await api.post("/getPrimaryOrderData")
            let primaryResData = Array.isArray(response.data.data) ? response.data.data : []
            setprimaryOrderData(primaryResData.map((item, index) => ({ ...item, si_no: index + 1 })))
        }
        catch (err) {
            console.log(err)
        }
    }

    // ✅ Report - Process Single
    const reportProcessSingle = async (process_id) => {
        try {
            let response = await api.post("/callProcessSingle", { process_id: process_id })
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log("reportProcessSingle err", err)
            toast.error("Unable to Process")
        }
    }

    // ✅ Report - Process All
    const reportProcessAll = async () => {
        try {
            let processIdArray = ReportprocessData.map((item) => item.process_id)
            let payload = { call_pro_id: processIdArray.join(",") }

            let response = await api.post("/callProcessAll", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log("reportProcessAll err", err)
            toast.error("Unable to Process")
        }
    }

    // ✅ Order - Process Single
    const orderProcessSingle = async (process_id) => {
        try {
            let response = await api.post("/ordProcessSingle", { processId: process_id })
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log("orderProcessSingle err", err)
            toast.error("Unable to Process")
        }
    }

    // ✅ Order - Process All
    const orderProcessAll = async () => {
        try {
            let processIdArray = primaryOrderData.map((item) => item.process_id)
            let payload = { ordpro_id: processIdArray.join(",") }

            let response = await api.post("/ordProcessAll", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log("orderProcessAll err", err)
            toast.error("Unable to Process")
        }
    }

    const column1 = [
        { field: "si_no", headerName: "SL_NO", filterable: true, sortable: true },
        { field: "first_name", headerName: "USER NAME", filterable: true, sortable: true },
        { field: "sync_date", headerName: "SYNC DATE TIME", filterable: true, sortable: true,renderCell:(params)=>(
            <Typography>{dayjs(params.value).format("DD MMM YYYY HH:mm:ss")}</Typography>
        ) },
        { field: "call_dt", headerName: "CALL DATE", filterable: true, sortable: true,renderCell:(params)=>(
            <Typography>{dayjs(params.value).format('DD MMM YYYY')}</Typography>
        ) },
        { field: "typ", headerName: "TYPE", filterable: true, sortable: true },
        { field: "typ", headerName: "DATA KEY", filterable: true, sortable: true },
        {
            field: "", headerName: "ACTION", renderCell: (row) => (
                <Button variant="contained" onClick={() => reportProcessSingle(row.row.process_id)} sx={{ width: '1rem',textTransform:'none',px:0 }}>Process</Button>
            )
        }
    ]

    const column2 = [
        { field: "si_no", headerName: "SL_NO", filterable: true, sortable: true },
        { field: "first_name", headerName: "USER NAME", filterable: true, sortable: true },
        { field: "sync_date", headerName: "SYNC DATE TIME", filterable: true, sortable: true,renderCell:(params)=>(
           <Typography>{dayjs(params.value).format("DD MMM YYYY HH:mm:ss")}</Typography>
        ) },
        { field: "ord_date", headerName: "ORD DATE", filterable: true, sortable: true,renderCell:(params)=>(
             <Typography>{dayjs(params.value).format('DD MMM YYYY')}</Typography>
        ) },
        { field: "stk_name", headerName: "DISTRIBUTOR", filterable: true, sortable: true },
        { field: "key_id", headerName: "DATA KEY", filterable: true, sortable: true },
        {
            field: "", headerName: "ACTION", renderCell: (row) => (
                <Button variant="contained" onClick={() => orderProcessSingle(row.row.process_id)} sx={{ width: '1rem',textTransform:'none',px:0 }}>Process</Button>
            )
        }
    ]

    return (
        <Layout>
            <Box sx={{ backgroundColor: 'white', pt: 2, minHeight: '30vh', pl: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 500, color: '#026cb6', fontSize: '1.4rem' }}>
                        {`Api Processing (Unprocessed Data)`}
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1, minWidth: '90%', mr: 3 }}>
                    <Tabs value={tabValue} sx={{ width: '100%' }} onChange={(e, val) => setTabValue(val)}>
                        <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label={`Report (${ReportprocessData.length})`} />
                        <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label="Primary Order" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontWeight: 500, color: '#026cb6', fontSize: '1.3rem' }}>
                                Report Unprocessed
                            </Typography>
                            <Button variant="contained" sx={{ width: '6rem',textTransform:'none',px:0 }} onClick={reportProcessAll}>
                                Process All
                            </Button>
                        </Box>
                        <Box>
                            <DataTable columns={column1} data={ReportprocessData} />
                        </Box>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontWeight: 500, color: '#026cb6', fontSize: '1.3rem' }}>
                                Primary Order Unprocessed
                            </Typography>
                            <Button variant="contained" sx={{ width: '6rem',textTransform:'none',px:0 }} onClick={orderProcessAll}>
                                Process All
                            </Button>
                        </Box>
                        <Box>
                            <DataTable columns={column2} data={primaryOrderData} />
                        </Box>
                    </Box>
                )}

            </Box>
        </Layout>
    )
}