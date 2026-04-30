import { useState, useEffect } from "react";
import Layout from "../layout";
import api from "../services/api";
import useToast from "../utils/useToast";
import DataTable from "../utils/dataTable";
import {
    Box, Typography, Button, Tabs, Tab, TextField, FormControl, Select, MenuItem, InputLabel, IconButton, Autocomplete,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CircularProgress from "../utils/CircularProgressLoading";
import { AiOutlineFileExcel } from "react-icons/ai";
import { useParams, useNavigate } from "react-router-dom";
import { Download } from "../utils/downloadExcel/Download";
import { useSnackbar } from "notistack";

function DataSubmissionLog() {
    const { encodeyear, encodezone, encoderegion } = useParams()
    const [selYear, setSelYear] = useState(dayjs())
    const [selZone, setSelZone] = useState(0)
    const [allZone, setAllZone] = useState([])
    const [allRegion, setAllRegion] = useState([])
    const [selRegion, setSelRegion] = useState(0)
    const [progress, setProgress] = useState(null);
    const [allSubmissionLog, setAllSubmissionLog] = useState([])

    const decodedYear = encodeyear ? dayjs(atob(encodeyear), "YYYY") : dayjs()
    const decodedZone = encodezone ? Number(atob(encodezone)) : 0
    const decodedRegion = encoderegion ? Number(atob(encoderegion)) : 0
    const decodedYearStr = decodedYear.format("YYYY")
    const {enqueueSnackbar}=useSnackbar()

    const navigate = useNavigate()
    console.log("encoded values", encodeyear, encodezone, encoderegion)
    useEffect(() => {
        fetchReportZoneData()
    }, [])

    useEffect(() => {
        fetchRegionList(selZone)
    }, [selZone])

    useEffect(() => {
        if (encodezone === undefined) return
        setSelRegion(decodedRegion)
        setSelYear(decodedYear)
        setSelZone(decodedZone)
        fetchSubmitlog()
    }, [encodeyear, encodezone, encoderegion])

    const fetchReportZoneData = async () => {
        try {
            let response = await api.post('/getReportsZone')
            let zoneres = Array.isArray(response.data.data) ? response.data.data : []
            setAllZone(zoneres)
        }
        catch (err) {
            console.log("zonefetching Error", err)
        }
    }

    const fetchRegionList = async (zoneId) => {
        try {
            let payload = {
                zone_id: zoneId
            }
            let response = await api.post("/extractRegionList", payload)
            let regionRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllRegion(regionRes)
        }
        catch (err) {
            console.log("region fetching err", err)
        }
    }

    const getPivotedData = (data) => {
        const map = {};
        data.forEach((row) => {
            const key = row.stk_id;
            if (!map[key]) {
                map[key] = {
                    zone_name: row.zone_name,
                    reg_name: row.reg_name,
                    state_name: row.state_name,
                    stk_code: row.stk_code,
                    stk_name: row.stk_name,
                };
            }
            map[key][`month_${row.mth_no}`] = row.log_dt || "-";
        });

        return Object.values(map).map((row) => {
            for (let m = 1; m <= 12; m++) {
                if (!row[`month_${m}`]) row[`month_${m}`] = "-";
            }
            return row;
        });
    };

    const handleSubmit = () => {
        let formatedYear = selYear.format("YYYY")
        navigate(`/reports/data_submission_log/${btoa(formatedYear)}/${btoa(selZone || 0)}/${btoa(selRegion || 0)}`)
    }

    const fetchSubmitlog = async () => {
        try {
            let payload = {
                year: decodedYearStr,
                zone_id: decodedZone,
                region_id: decodedRegion
            }
            let response = await api.post("/getSubmissionLog", payload)
            console.log("submission response", response)
            let datasubmissRes = Array.isArray(response.data.data) ? response.data.data : []
            let pivotedData = getPivotedData(datasubmissRes)
            let sortedData = pivotedData.sort((a, b) => {
                if (a.zone_name < b.zone_name) return -1;
                if (a.zone_name > b.zone_name) return 1;
                if (a.reg_name < b.reg_name) return -1;
                if (a.reg_name > b.reg_name) return 1;
                if (a.state_name < b.state_name) return -1;
                if (a.state_name > b.state_name) return 1;
                if (a.stk_code < b.stk_code) return -1;
                if (a.stk_code > b.stk_code) return 1;
                return 0;
            });
            setAllSubmissionLog(sortedData)
        }
        catch (err) {
            console.log(err)
        }
    }

    const year = selYear.format("YYYY");

    const monthColumns = Array.from({ length: 12 }, (_, i) => {
        const monthName = dayjs(`${year}-${String(i + 1).padStart(2, "0")}-01`).format("MMM YYYY");
        return {
            field: `month_${i + 1}`,
            headerName: monthName,
        };
    });

    const columns = [
        {
            field: "zone_name", headerName: "Zone",
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>
            )
        },
        { field: "reg_name", headerName: "Region" },
        { field: "state_name", headerName: "State" },
        { field: "stk_code", headerName: "Distributor Code" },
        { field: "stk_name", headerName: "Distributor Name" },
        ...monthColumns,
    ];

    const handleDownloadExcel=()=>{
          const safeColumns = columns.map(
                ({ renderCell, renderHeader, ...rest }) => rest,
            );
           let fileName=`Region_Wise_Distributor_Wise_Data_Submission-${decodedYear?decodedYear.format('YYYY'):null}`
          Download(allSubmissionLog,safeColumns,fileName, setProgress,enqueueSnackbar,'Region_Wise_Distributor_Wise_Data_Submission')
    }

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Report", path: "/reports/data_submission_log/" },
                { label: "Data Submission Log", path: "/reports/data_submission_log/" }
            ]}
        >
            <Box p={0.5}>
                <Box
                    p={2}
                    sx={{ borderRadius: 1 }}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                >
                    <Box>
                        <h1 className="mainTitle">Data Submission Log</h1>
                    </Box>
                    <Box sx={{
                        mb: 0.5, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', backgroundColor: "#fff", boxShadow:
                            "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px",
                    }}>
                        <FormControl>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Year"
                                    views={["year"]}
                                    format="YYYY"
                                    value={selYear}
                                    onChange={(newVal) => setSelYear(newVal)}
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
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel id="zone">Zone</InputLabel>
                            <Select labelId="zone" label="Zone" size="small" onChange={(e) => setSelZone(e.target.value)} value={selZone}>
                                <MenuItem value={0}>All</MenuItem>
                                {allZone.map((val) => (
                                    <MenuItem value={val.id}>{val.zone_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel id='region'>Region</InputLabel>
                            <Select labelId="region" label="Region" size="small" value={selRegion} onChange={(e) => setSelRegion(e.target.value)}>
                                <MenuItem value={0}>All</MenuItem>
                                {allRegion.map((val) => (
                                    <MenuItem value={val.id}>{val.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button onClick={() => handleSubmit()} variant="contained">Load</Button>
                        {progress ? <CircularProgress progress={progress} /> :
                            <span onClick={()=>handleDownloadExcel()}>
                                <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                            </span>}
                    </Box>
                </Box>
                <Box sx={{ px: 1.5 }}>
                    <DataTable
                        columns={columns}
                        data={allSubmissionLog}
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow:
                                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                    />
                </Box>
            </Box>
        </Layout>
    )
}

export default DataSubmissionLog 