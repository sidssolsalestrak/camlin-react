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
import { useLocation, useParams } from "react-router-dom";
import DataTable from "../utils/dataTable";
import { IoLocationSharp } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import { render } from "@testing-library/react";
import { FaAndroid } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
import { BeatMapExpansion } from "./BeatMapExpansion";
import { AllLocationsMap } from "./BeatMapExpansion";
import { FaMinus } from "react-icons/fa";


export default function DailyActivityReport() {
    const { frmdt, todt, status, type } = useParams()
    // const decodedFrmDate=frmdt !== undefined && frmdt !== null ? dayjs(atob(frmdt)):dayjs().startOf('month')
    // const decodedToDate=todt !== undefined && todt !== null ? dayjs(atob(todt)):dayjs()
    // const decodedStatus=status!==undefined && status !==null ?atob(status):"1"
    // const decodedType=type!==undefined  && type!==null ?atob(type):"0"
    const [fromDate, setFromDate] = useState(dayjs().startOf('month'))
    const [toDate, setToDate] = useState(dayjs())
    const [reportStat, setReportStat] = useState("1")
    const [typeStat, setTypeStat] = useState("0")
    const [allReportData, setAllReportData] = useState([])
    const [focusRangeData, setFocusRangeData] = useState([])
    const [userId, setUserId] = useState("")
    const [progress, setProgress] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [mapOpen, setMapOpen] = useState(false);
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

    useEffect(() => {
        fetchReportData()
    }, [fromDate, toDate, reportStat, typeStat])

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
            let finalactivityRes = activityRes.map((val, index) => ({ ...val, app_type: val.app_type === 1 ? 'Android' : 'IOS', sl_no: index + 1 }))
            setAllReportData(finalactivityRes)
            const coords = activityRes
                .filter(val => val.latitude && val.longitude)
                .map(val => ({
                    latitude: val.latitude,
                    longitude: val.longitude,
                    location_name: val.location_name ?? val.beat_work ?? val.u_name,
                }));
            setCoordinates(coords);
            console.log("activity response", finalactivityRes)
            return finalactivityRes // return so handleDownloadExcel can use fresh data

        }
        catch (err) {
            console.log("fetchreport data error", err)
            return []
        }
    }

    const fetchFocusRangeData = async (id) => {
        try {
            let payload = {
                masId: id
            }
            let response = await api.post("/getFocusRange", payload)
            let focusRangeRes = Array.isArray(response.data.data) ? response.data.data : []

            let focusrangeResData = focusRangeRes.map((val, index) => ({
                ...val, sl_no: index + 1,
                tgt_val_num: val.tgt_val && val.tgt_val > 0 ? Number(val.tgt_val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
                ach_val_num: val.ach_val && val.ach_val > 0 ? Number(val.ach_val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
                prod_call_new: val.prod_call && val.prod_call > 0 ? Number(val.prod_call).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',

            }))
            console.log("focus range res data", focusrangeResData)
            setFocusRangeData(focusrangeResData)
            return focusrangeResData
        }
        catch (err) {
            console.log("focus range Data err", err)
            return []
        }
    }

    console.log("All report Data",allReportData)

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
            field: "create_dt",
            headerName: "Received Date",
            type: "date"
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
            field: "sl_no",
            headerName: "SL",
        },
        {
            field: "u_name",
            headerName: "Name",
            width: 140,
            renderCell: (params) => {
                // Find previous row's user_id using the current row's index
                const currentIndex = allReportData.findIndex(r => r === params.row);
                const prevUserId = currentIndex > 0 ? allReportData[currentIndex - 1].user_id : null;

                return prevUserId !== params.row.user_id ? (
                    <Box>
                        <Typography sx={{ color: '#133BDE' }}>{params.value}</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                            <Typography sx={{ fontSize: '9px' }}>{params.row.desig_name}|</Typography>
                            <Typography sx={{ fontSize: '9px', textWrap: 'nowrap' }}>
                                {params.row.area_name} HQ:{params.row.u_hq_name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '10px', color: '#00AF00' }}>{params.row.app_version}</Typography>
                            {params.row.app_stat === 1
                                ? params.row.app_type === 1
                                    ? <FaAndroid color="#00AF00" />
                                    : <FaApple color="#00AF00" />
                                : null
                            }
                        </Box>
                    </Box>
                ) : null;
            }
        },
        {
            field: "create_dt",
            headerName: "Date",
            width: 160,
            renderCell: (params) => (
                <Box>
                    <Typography>{params.row.create_dt ? dayjs(params.row.call_date).format("DD MMM YYYY") : null}</Typography>
                    {params.row.call_date != '' && params.row.call_date !== '1970-01-01' && params.row.call_date &&
                        <Typography sx={{ fontSize: '8px', color: dayjs(params.row.call_date).format('DD-MM-YYYY') !== dayjs(params.row.create_dt).format('DD-MM-YYYY') ? 'red' : null }}>
                            Recieved Date:{params.row.call_date ? dayjs(params.row.create_dt).format("DD MMM YYYY hh:mm A") : null}
                        </Typography>}
                </Box>
            )
        },
        {
            field: "report_type",
            headerName: "Type",
            width: 60
        },
        {
            field: "__expand_beat__",
            headerName: "Beat Name",
            width: 140,
            renderCell: (params) => (
                (params.row.beat_work !== " " && params.row.beat_work) ?
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography><IoLocationSharp size={11} color="green" /></Typography>
                        <Typography>{params.row.beat_work}</Typography>
                    </Box> : "-"
            )
        },
        {
            field: "tot_cus",
            headerName: "Total Outlets",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value ? params.value : '-'}</Typography>
            )
        },
        {
            field: "tot_call",
            headerName: "Total Calls",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value ? params.value : '-'}</Typography>
            )
        },
        {
            field: "prod_call",
            headerName: "Productive Calls",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value ? params.value : '-'}</Typography>
            )
        },
        {
            field: "sec_tgt_val",
            headerName: "Sec. Target Rs.",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value && params.value > 0 ? params.value.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }) : '-'}</Typography>
            )
        },
        {
            field: "sec_ach_val",
            headerName: "Sec.Achieved Rs.",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value && params.value > 0 ? params.value : '-'}</Typography>
            )
        },
        {
            field: "",
            headerName: "%age",
            showTotal: true,
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}>{params.value ? params.value : '-'}</Typography>
            )
        },
        {
            field: "__expand__",
            headerName: "Status",
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}><FaPlus size={10} color="blue" /></Typography>
            )
        }
    ]

    const secondTableCol = [
        {
            field: "sl_no",
            headerName: "SI",
        },
        {
            field: "brand_name",
            headerName: "Focus Range",
        },
        {
            field: "tgt_val_num",
            headerName: "Tgt. Rs.",
            type: 'number',
            showTotal: true
        },
        {
            field: "ach_val_num",
            headerName: "Ach. Rs.",
            type: 'number',
            showTotal: true
        },
        {
            field: "prod_call_new",
            headerName: "Prod.Calls",
            showTotal: true,
            type: 'number',
        },
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

                    {URL != 'getfieldActivity_new' && <Button variant="contained" onClick={() => setMapOpen(true)}  >View all Location</Button>}
                </Box>
                {URL !== 'getfieldActivity_new' &&
                    <DataTable
                        columns={tableColumns}
                        data={allReportData}
                        expandableRow={async (row) => {
                            let responsefocusData = await fetchFocusRangeData(row.mas_id);  // fetch when expanded
                            return (
                                <DataTable
                                    data={responsefocusData}
                                    columns={secondTableCol}
                                    pagination={false}
                                    showHeader={false}
                                    sx={{ border: "none", boxShadow: "none" }}
                                />
                            );
                        }}
                        expandableRowBeat={(row) => (
                            <BeatMapExpansion row={row} />
                        )}
                    />}


                <AllLocationsMap
                    coordinates={coordinates}
                    open={mapOpen}
                    onClose={() => setMapOpen(false)}
                />

            </Box>
        </Layout>
    )
}