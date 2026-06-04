import React, { useEffect, useState, useMemo } from "react";
import Layout from "../../layout";
import {
    Box, Grid, Typography, TextField, Button, FormControl
} from "@mui/material";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { useNavigate,useLocation } from "react-router-dom";
import ConfirmationDialog from "../../utils/confirmDialog";
import useToast from "../../utils/useToast";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaCheck } from "react-icons/fa";

function EmailProcessData() {

    const [selMonth, setSelMonth] = useState(dayjs())
    const [allUnprocessData, setAllUnprocessData] = useState([])
    const location=useLocation()

    const fetchEmailUnprocessData = async () => {
        try {
            let payload = {
                date1: selMonth,
                status: 0
            }
            let response = await api.post("/getProcess", payload)
            let unprocessData = Array.isArray(response.data.data) ? response.data.data : []
            console.log("Unproces Data ", unprocessData)
            setAllUnprocessData(unprocessData)
        }
        catch (err) {
            console.log("fetch EMail unprocess data", err)
        }
    }

    const columns = [
        {
            field: 'att_id',
            headerName: "Attachment Id"
        },
        {
            field: 'from_address',
            headerName: "From Adress"
        },
        {
            field: 'mail_subject',
            headerName: "Subject"
        },
        {
            field: 'mail_date',
            headerName: "DateTime"
        },
        {
            field: 'stat',
            headerName: "Status",
            renderCell: (params) => (
                params.row.stat == 0 ? <IoIosCloseCircleOutline color="red" /> : <FaCheck color="green" />
            )
        },
    ]


    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Transactions", path: "/reports/sec_sales_data" },
            { label: "Data Submission Status", path:"/reports/sec_sales_data" },
            { label: "Process List",path:location.pathname}
        ]}>
            <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                <Box>
                    <h2>Process List</h2>
                </Box>
                <Box sx={{
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    padding: "16px 18px",
                    borderRadius: "10px",
                }}>
                    <Grid container spacing={0.95} alignItems="center">
                        <Grid size={{ xs: 12, md: 3, lg: 2.7 }}>
                            <FormControl fullWidth>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        label="Date"
                                        format="DD MMM YYYY"
                                        value={selMonth}
                                        onChange={(v) => setSelMonth(v)}
                                        slotProps={{ textField: { size: "small", className: "date-input" } }}
                                        maxDate={dayjs()}
                                    />
                                </LocalizationProvider>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                            <Button sx={{ width: '2rem' }} onClick={() => fetchEmailUnprocessData()} variant="contained">Load</Button>
                        </Grid>

                    </Grid>

                </Box>
                <Box>
                    <DataTable
                        columns={columns}
                        data={allUnprocessData}
                    />
                </Box>

            </Box>

        </Layout>
    )

}

export default EmailProcessData