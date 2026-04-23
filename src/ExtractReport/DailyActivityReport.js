import { useState, useEffect } from "react";
import Layout from "../layout";
import api from "../services/api";
import useToast from "../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab, TextField, FormControl, Select, MenuItem, InputLabel, IconButton, Autocomplete, CircularProgress
} from "@mui/material";
import { AiOutlineFileExcel } from "react-icons/ai";
import { DownloadCSV } from "../utils/Download CSV/DownloadCSV";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";
import { useLocation } from "react-router-dom";
import DataTable from "../utils/dataTable";


export default function DailyActivityReport() {

    const [fromDate, setFromDate] = useState(dayjs().startOf('month'))
    const [toDate, setToDate] = useState(dayjs())
    const [reportStat, setReportStat] = useState("1")
    const [typeStat, setTypeStat] = useState("0")
    const [allReportData, setAllReportData] = useState([])
    const [progress, setProgress] = useState(null);
    const toast = useToast()
    const { enqueueSnackbar } = useSnackbar()
    const location = useLocation()
    const URL = location.pathname.split('/')[2]
    const numericProgress =
        typeof progress === "string" && progress.endsWith("%")
            ? parseInt(progress)
            : null;

    // Map typeStat value to a readable label for the CSV meta header
    const typeLabel = typeStat === "0" ? "Approved" : "Pending";

    const fetchReportData = async () => {
        try {
            let payload = {
                from_call_date: fromDate,
                to_call_date: toDate,
                report_type: reportStat,
                order_stat: typeStat
            }
            let response = await api.post("/getFieldVisit", payload)
            let activityRes = Array.isArray(response.data.data) ? response.data.data : []
            let finalactivityRes = activityRes.map((val) => ({ ...val, app_type: val.app_type === 1 ? 'Android' : 'IOS' }))
            setAllReportData(finalactivityRes)
            console.log("activity response", finalactivityRes)
            return finalactivityRes // return so handleDownloadExcel can use fresh data

        }
        catch (err) {
            console.log("fetchreport data error", err)
            return []
        }
    }

    const columns = [
        {
            field: "u_name",
            headerName: "Name",
        },
        {
            field: "desig_name",
            headerName: "Designation",
        },
        {
            field: "area_name",
            headerName: "Area",
        },
        {
            field: "u_hq_name",
            headerName: "HQ",
        },
        {
            field: "app_version",
            headerName: "App Version",
        },
        {
            field: "app_type",
            headerName: "App Type",
        },
        {
            field: "call_date",
            headerName: "Call Date",
        },
        {
            field: "",
            headerName: "Received Date",
        },
        {
            field: "report_type",
            headerName: "Report Type",
        },
        {
            field: "beat_work",
            headerName: "Beat Name",
        },
        {
            field: "tot_cus",
            headerName: "Total Outlets",
        },
        {
            field: "tot_call",
            headerName: "Total Calls",
        },
        {
            field: "prod_call",
            headerName: "Productive Calls",
        },
        {
            field: "sec_tgt_val",
            headerName: "Sec. Target Rs.",
        },
        {
            field: "sec_ach_val",
            headerName: "Sec. Achieved Rs.",
        },
    ]

    const tableColumns = [
        {
            field: "",
            headerName: "SL",
        },
        {
            field: "",
            headerName: "Name",
        },
        {
            field: "",
            headerName: "Date",
        },
         {
            field: "",
            headerName: "",
        }


    ]

    const handleDownloadExcel = async () => {
        try {
            // Fetch fresh data and wait for it
            const freshData = await fetchReportData()

            const safeColumns = columns.map(
                ({ renderCell, renderHeader, ...rest }) => rest,
            );

            // Build meta object from current filter state
            const meta = {
                fromDate: fromDate ? fromDate.format("DD MMM YYYY") : "",
                toDate: toDate ? toDate.format("DD MMM YYYY") : "",
                type: typeLabel,
            };

            DownloadCSV(
                freshData,
                safeColumns,
                "Daily Activity Report",
                setProgress,
                enqueueSnackbar,
                meta,
            );
        }
        catch (err) {
            console.log("excelDownload error", err)
        }
    }

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Extract", path: "/reports/getfieldActivity_new" },
                { label: "Daily Activity", path: "/reports/getfieldActivity_new" }
            ]}>
            <Box sx={{ backgroundColor: "#fff" }} p={0.5}>
                <Box
                    p={2}
                    sx={{ borderRadius: 1 }}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                >
                    <Box>
                        <h1 className="mainTitle">Daily Report</h1>
                    </Box>
                </Box>
                <Box sx={{ mt: 1, pl: 2.5, mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="From Date"
                                format="DD MMM YYYY"
                                value={fromDate}
                                onChange={(newVal) => setFromDate(newVal)}
                                slotProps={{
                                    textField: {
                                        sx: { minWidth: 90, maxWidth: 190 },
                                        size: "small",
                                        className: "date-input",
                                    },
                                }}
                                maxDate={dayjs()}
                            />
                        </LocalizationProvider>
                    </FormControl>
                    <FormControl>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="To Date"
                                format="DD MMM YYYY"
                                value={toDate}
                                onChange={(newVal) => setToDate(newVal)} // ✅ fixed: was setFromDate
                                slotProps={{
                                    textField: {
                                        sx: { minWidth: 90, maxWidth: 190 },
                                        size: "small",
                                        className: "date-input",
                                    },
                                }}
                                maxDate={dayjs()}
                            />
                        </LocalizationProvider>
                    </FormControl>
                    <FormControl>
                        <Select value={reportStat} onChange={(e) => setReportStat(e.target.value)} size="small" sx={{ width: 180 }} >
                            <MenuItem value="0">All</MenuItem>
                            <MenuItem value="1">Reported</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <InputLabel id='type'>Type</InputLabel>
                        <Select value={typeStat} onChange={(e) => setTypeStat(e.target.value)} labelId="type" label="Type" size="small" sx={{ width: 180 }} >
                            <MenuItem value="0">Approved</MenuItem>
                            <MenuItem value="1">Pending</MenuItem>
                        </Select>
                    </FormControl>
                    <IconButton onClick={() => handleDownloadExcel()} >
                        {progress ? (
                            <Box
                                position="relative"
                                display="inline-flex"
                                alignItems="center"
                            >
                                <CircularProgress
                                    variant={
                                        numericProgress !== null ? "determinate" : "indeterminate"
                                    }
                                    value={numericProgress || 0}
                                    size={30}
                                    thickness={3}
                                />
                                <Box
                                    top={0}
                                    left={0}
                                    bottom={0}
                                    right={0}
                                    position="absolute"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Typography
                                        variant="caption"
                                        component="div"
                                        color="textSecondary"
                                    >
                                        {progress}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <AiOutlineFileExcel size={25} color="green" />
                        )}
                    </IconButton>

                    {URL != 'getfieldActivity_new' && <Button variant="contained">View all Location</Button>}
                </Box>
                {URL !== 'getfieldActivity_new' &&
                    <DataTable
                    // columns={columns}
                    // data={allHierachyData}
                    />}
            </Box>
        </Layout>
    )
}