import { useState, useEffect } from "react";
import Layout from "../layout";
import api from "../services/api";
import useToast from "../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab, TextField, FormControl, Select, MenuItem, InputLabel, IconButton, Autocomplete, CircularProgress, Checkbox, Tooltip
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
import { FaAndroid } from "react-icons/fa";
import { FaApple } from "react-icons/fa";
import { BeatMapExpansion } from "./BeatMapExpansion";
import { AllLocationsMap } from "./BeatMapExpansion";
import { FaMinus } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";



export default function DailyActivityReport() {
    const { frmdt, todt, status, type } = useParams();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
    const [toDate, setToDate] = useState(dayjs());
    const [reportStat, setReportStat] = useState("1");
    const [typeStat, setTypeStat] = useState("0");
    const [allReportData, setAllReportData] = useState([]);
    const [focusRangeData, setFocusRangeData] = useState([]);
    const [userId, setUserId] = useState("");
    const [progress, setProgress] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [mapOpen, setMapOpen] = useState(false);
    const [userType, setUserType] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);

    const toast = useToast();
    const { enqueueSnackbar } = useSnackbar();
    const location = useLocation();
    const URL = location.pathname.split('/')[2];

    const numericProgress =
        typeof progress === "string" && progress.endsWith("%")
            ? parseInt(progress)
            : null;

    // Map typeStat value to a readable label for the CSV meta header
    const typeLabel = typeStat === "0" ? "Approved" : "Pending";

    // All pending rows (ord_stat !== 0)
    const pendingRows = allReportData.filter(r => r.ord_stat !== 0);

    useEffect(() => {
        fetchReportData();
    }, [fromDate, toDate, reportStat, typeStat]);

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

    // Reset selected rows when data changes
    useEffect(() => {
        setSelectedRows([]);
    }, [allReportData]);

    const fetchReportData = async () => {
        try {
            let payload = {
                from_call_date: fromDate.format('YYYY-MM-DD'),
                to_call_date: toDate.format('YYYY-MM-DD'),
                report_type: reportStat,
                order_stat: typeStat
            };
            let response = await api.post("/getFieldVisit", payload);
            let activityRes = Array.isArray(response.data.data) ? response.data.data : [];
            let finalactivityRes = activityRes.map((val, index) => ({
                ...val,
                app_type: val.app_type === 1 ? 'Android' : 'IOS',
                sl_no: index + 1
            }));
            setAllReportData(finalactivityRes);
            const coords = activityRes
                .filter(val => val.latitude && val.longitude)
                .map(val => ({
                    latitude: val.latitude,
                    longitude: val.longitude,
                    location_name: val.location_name ?? val.beat_work ?? val.u_name,
                }));
            setCoordinates(coords);
            console.log("activity response", finalactivityRes);
            return finalactivityRes;
        } catch (err) {
            console.log("fetchreport data error", err);
            return [];
        }
    };

    const fetchFocusRangeData = async (id) => {
        try {
            let payload = { masId: id };
            let response = await api.post("/getFocusRange", payload);
            let focusRangeRes = Array.isArray(response.data.data) ? response.data.data : [];
            let focusrangeResData = focusRangeRes.map((val, index) => ({
                ...val,
                sl_no: index + 1,
                tgt_val_num: val.tgt_val && val.tgt_val > 0
                    ? Number(val.tgt_val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-',
                ach_val_num: val.ach_val && val.ach_val > 0
                    ? Number(val.ach_val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-',
                prod_call_new: val.prod_call && val.prod_call > 0
                    ? Number(val.prod_call).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-',
            }));
            console.log("focus range res data", focusrangeResData);
            setFocusRangeData(focusrangeResData);
            return focusrangeResData;
        } catch (err) {
            console.log("focus range Data err", err);
            return [];
        }
    };

    // ─── Checkbox handlers ───────────────────────────────────────────────────
    const handleSelectAll = (e) => {
        const pendingIds = pendingRows.map(row => row.mas_id);
        if (e.target.checked) {
            setSelectedRows(prev => [...new Set([...prev, ...pendingIds])]);
        } else {
            setSelectedRows(prev => prev.filter(id => !pendingIds.includes(id)));
        }
    };

    const handleRowCheck = (masId) => {
        setSelectedRows(prev =>
            prev.includes(masId)
                ? prev.filter(id => id !== masId)
                : [...prev, masId]
        );
    };

    const handleSubmit = async () => {
        try {
            let payload = {
                selectedvalues: selectedRows
            }
            if (selectedRows.length > 0) {
                let response = await api.post("/appPendingRep", payload)
                console.log("response for pending rep", response)
                if (response.data.status === 200) {
                    toast.success(response.data.message)
                }
            }
            else {
                toast.error("Please select at least one report.")
            }
            console.log("payload in daily activity", payload)
            console.log("Submitting IDs:", selectedRows);
        } catch (err) {
            console.log("submit error", err);
            enqueueSnackbar("Submission failed", { variant: "error" });
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    console.log("All report Data", allReportData);

    const columns = [
        { field: "u_name", headerName: "Name" },
        { field: "desig_name", headerName: "Designation" },
        { field: "area_name", headerName: "Area" },
        { field: "u_hq_name", headerName: "HQ" },
        { field: "app_version", headerName: "App Version" },
        { field: "app_type", headerName: "App Type" },
        { field: "call_date", headerName: "Call Date" },
        { field: "create_dt", headerName: "Received Date", type: "date" },
        { field: "report_type", headerName: "Report Type" },
        { field: "beat_work", headerName: "Beat Name" },
        { field: "tot_cus", headerName: "Total Outlets" },
        { field: "tot_call", headerName: "Total Calls" },
        { field: "prod_call", headerName: "Productive Calls" },
        { field: "sec_tgt_val", headerName: "Sec. Target Rs." },
        { field: "sec_ach_val", headerName: "Sec. Achieved Rs." },
    ];

    const tableColumns = [
        {
            field: "sl_no",
            headerName: "SL",
        },
        {
            field: "u_name",
            headerName: "Name",
            width:130,
            renderCell: (params) => {
                const currentIndex = allReportData.findIndex(r => r === params.row);
                const prevUserId = currentIndex > 0 ? allReportData[currentIndex - 1].user_id : null;

                if (prevUserId === params.row.user_id) return null;

                return (
                    <Box sx={{ overflow: 'hidden' }}>
                        <Tooltip title={params.value} placement="top">
                            <Typography sx={{
                                color: '#133BDE',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              
                            }}>
                                {params.value}
                            </Typography>
                        </Tooltip>

                        <Tooltip title={`${params.row.desig_name} | ${params.row.area_name} HQ: ${params.row.u_hq_name}`} placement="top">
                            <Box sx={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
                                <Typography sx={{
                                    fontSize: '9px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width:'11rem'
                                    
                                }}>
                                    {params.row.desig_name}|{params.row.area_name} (HQ:{params.row.u_hq_name})
                                </Typography>
                            </Box>
                        </Tooltip>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '10px', color: '#00AF00' }}>
                                {params.row.app_version}
                            </Typography>
                            {params.row.app_stat === 1
                                ? params.row.app_type === 1
                                    ? <FaAndroid color="#00AF00" />
                                    : <FaApple color="#00AF00" />
                                : null
                            }
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: "create_dt",
            headerName: "Date",
            renderCell: (params) => (
                <Box>
                    <Typography>
                        {params.row.create_dt ? dayjs(params.row.call_date).format("DD MMM YYYY") : null}
                    </Typography>
                    {params.row.call_date !== '' && params.row.call_date !== '1970-01-01' && params.row.call_date &&
                        <Typography sx={{
                            fontSize: '8px',
                             textWrap:'nowrap',
                            color: dayjs(params.row.call_date).format('DD-MM-YYYY') !== dayjs(params.row.create_dt).format('DD-MM-YYYY') ? 'red' : null
                        }}>
                            Recieved Date:{params.row.call_date ? dayjs(params.row.create_dt).format("DD MMM YYYY hh:mm A") : null}
                        </Typography>
                    }
                </Box>
            )
        },
        {
            field: "report_type",
            headerName: "Type",
            width: 50
        },
        {
            field: "__expand_beat__",
            headerName: "Beat Name",
            width: 105,
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
            width:40,
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
                <Typography sx={{ textAlign: 'right' }}>
                    {params.value && params.value > 0
                        ? params.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '-'}
                </Typography>
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
            headerName: "  ",
            renderCell: (params) => (
                <Typography sx={{ textAlign: 'right' }}><FaPlus size={10} color="blue" /></Typography>
            )
        },
        // ─── Checkbox column ────────────────────────────────────────────────
        {
            field: "ord_stat",
            headerName: "Status",
            renderHeader: () => {
                const pendingIds = pendingRows.map(r => r.mas_id);
                const selectedAndVisible = selectedRows.filter(id => pendingIds.includes(id));

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'row',gap:0.5 }}>
                        <Typography sx={{ fontSize: '12px' }}>STATUS</Typography>
                        <Checkbox
                            sx={{p:0}}
                            size="small"
                            checked={
                                pendingIds.length > 0 &&
                                selectedAndVisible.length === pendingIds.length
                            }
                            indeterminate={
                                selectedAndVisible.length > 0 &&
                                selectedAndVisible.length < pendingIds.length
                            }
                            onChange={handleSelectAll}
                        />
                    </Box>
                );
            },
            renderCell: (params) =>
                params.row.ord_stat === 0 || !params.row.ord_stat ? null : (
                    <Checkbox
                        size="small"
                        checked={selectedRows.includes(params.row.mas_id)}
                        onChange={() => handleRowCheck(params.row.mas_id)}
                    />
                ),
        },
        // ────────────────────────────────────────────────────────────────────
    ];

    const secondTableCol = [
        { field: "sl_no", headerName: "SI" },
        { field: "brand_name", headerName: "Focus Range" },
        { field: "tgt_val_num", headerName: "Tgt. Rs.", type: 'number', showTotal: true },
        { field: "ach_val_num", headerName: "Ach. Rs.", type: 'number', showTotal: true },
        { field: "prod_call_new", headerName: "Prod.Calls", type: 'number', showTotal: true },
    ];

    const handleDownloadExcel = async () => {
        try {
            const freshData = await fetchReportData();
            const safeColumns = columns.map(
                ({ renderCell, renderHeader, ...rest }) => rest,
            );
            const meta = {
                fromDate: fromDate ? fromDate.format("DD MMM YYYY") : "",
                toDate: toDate ? toDate.format("DD MMM YYYY") : "",
                type: typeLabel,
            };
            DownloadCSV(freshData, safeColumns, "Daily Activity Report", setProgress, enqueueSnackbar, meta);
        } catch (err) {
            console.log("excelDownload error", err);
        }
    };
    console.log("selected rows", selectedRows)

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Extract", path:URL !== 'getfieldActivity_new'?"/reports/getfieldActivity":"/reports/getfieldActivity_new" },
                { label: "Daily Activity", path: "/reports/getfieldActivity_new" }
            ]}
        >
            <Box p={0.5}>
                <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <h1 className="mainTitle">Daily Report</h1>
                    </Box>


                    {/* ── Filters & Actions ── */}
                    <Box sx={{
                        mb: 0.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', backgroundColor: "#fff", boxShadow:
                            "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px"
                    }}>
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
                                    onChange={(newVal) => setToDate(newVal)}
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
                            <Select
                                value={reportStat}
                                onChange={(e) => setReportStat(e.target.value)}
                                size="small"
                                sx={{ width: 180 }}
                            >
                                <MenuItem value="0">All</MenuItem>
                                <MenuItem value="1">Reported</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <InputLabel id='type'>Type</InputLabel>
                            <Select
                                value={typeStat}
                                onChange={(e) => setTypeStat(e.target.value)}
                                labelId="type"
                                label="Type"
                                size="small"
                                sx={{ width: 180 }}
                            >
                                <MenuItem value="0">Approved</MenuItem>
                                <MenuItem value="1">Pending</MenuItem>
                            </Select>
                        </FormControl>

                        <IconButton onClick={handleDownloadExcel}>
                            {progress ? (
                                <Box position="relative" display="inline-flex" alignItems="center">
                                    <CircularProgress
                                        variant={numericProgress !== null ? "determinate" : "indeterminate"}
                                        value={numericProgress || 0}
                                        size={30}
                                        thickness={3}
                                    />
                                    <Box
                                        top={0} left={0} bottom={0} right={0}
                                        position="absolute"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Typography variant="caption" component="div" color="textSecondary">
                                            {progress}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <AiOutlineFileExcel size={25} color="green" />
                            )}
                        </IconButton>

                        {URL !== 'getfieldActivity_new' && (
                            <Button variant="contained" onClick={() => setMapOpen(true)}>
                                View all Location
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* ── Data Table ── */}
                {URL !== 'getfieldActivity_new' &&
                    <Box sx={{ px: 1.5 }}>
                        <DataTable
                            columns={tableColumns}
                            data={allReportData}
                            sx={{
                                background: "#fff",
                                borderRadius: "10px",
                                boxShadow:
                                    "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                            }}
                            expandableRow={async (row) => {
                                const responsefocusData = await fetchFocusRangeData(row.mas_id);
                                if (responsefocusData.length > 0) {
                                    return (
                                        <DataTable
                                            data={responsefocusData}
                                            columns={secondTableCol}
                                            pagination={false}
                                            showHeader={false}
                                            sx={{ border: "none", boxShadow: "none" }}
                                        />
                                    );
                                }
                                return <Box sx={{ textAlign: 'center', p: 1 }}>No Data available</Box>;
                            }}
                            expandableRowBeat={(row) => (
                                <BeatMapExpansion row={row} />
                            )}
                        />
                    </Box>
                }

                {/* ── Map Modal ── */}
                <AllLocationsMap
                    coordinates={coordinates}
                    open={mapOpen}
                    onClose={() => setMapOpen(false)}
                />

                {/* ── Submit Button (visible only for allowed user types on Pending tab) ── */}
                {([1, 2, 3, 12, 13, 14].includes(Number(userType)) && Number(typeStat) === 1) && (
                    <Button
                        variant="contained"
                        sx={{ ml: 3, mt: 1 }}
                        disabled={selectedRows.length === 0}
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                )}
            </Box>
        </Layout>
    );
}