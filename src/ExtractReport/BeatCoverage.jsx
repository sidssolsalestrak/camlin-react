import React, { useEffect, useRef, useState } from 'react'
import Layout from '../layout'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useToast from '../utils/useToast';
import dayjs from 'dayjs';
import axios from "../services/api";
import CircularProgressLoading from '../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import { DownloadCSV } from '../utils/Download CSV/DownloadCSV';
import BeatCoverageTable from '../components/BeatCoverageTable';
import { useSnackbar } from 'notistack';
import { buildExportRows, buildMonthNames, buildGrandTotalRow } from '../utils/beatCoverageHelpers';
import { getMasterPanel } from "../services/masterPanelService";

const headContainer = {
    background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
    m: 1.5, p: 1.5, borderRadius: '10px', boxShadow:
        "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "16px 18px",
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const encode = (val) => btoa(String(val || ""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const decode = (str) => {
    if (!str) return "";
    const restored = str
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = restored + "==".slice((restored.length % 4) || 4);
    try { return atob(padded); } catch { return ""; }
};

const BeatCoverage = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
    const { enqueueSnackbar } = useSnackbar();

    let decodedYr = decode(searchParams.get('yr'));
    let decodedZone = decode(searchParams.get('zone'));
    let decodedRegion = decode(searchParams.get('region'));
    let decodedUser = decode(searchParams.get('user'));

    const [month, setMonth] = useState(dayjs().startOf("year"));
    const [formData, setFormData] = useState({
        zone: "0",
        region: "0",
        User: { id: 0, u_name: "All" },
    })
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [user, setuser] = useState([]);
    const [tableData, settableData] = useState([]);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [progress1, setProgress1] = useState(null);

    const [masterPanel, setMasterPanel] = useState({});

    const isInteractiveChange = useRef(false);

    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const userLabel = masterPanel["USER"] || "Users";
    const beatLabel = masterPanel["BEAT"] || "Beat";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    const handleChange = (name, val) => {
        setFormData((prev) => ({
            ...prev,
            [name]: val
        }))
    }

    const fetchZone = async () => {
        try {
            const res = await axios.post("/getReportsZone");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setzoneData(data);
        } catch (error) {
            console.error(error);
            setzoneData([])
        }
    }

    const fetchRegion = async () => {
        try {
            let response = await axios.post("/extractRegionList", { zone_id: formData.zone })
            setregionData(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
            setregionData([])
        }
    }

    const fetchSSUserList = async () => {
        try {
            let payload = {
                zone_id: formData.zone,
                reg_id: formData.region,
                user_type: 8,
            }
            let response = await axios.post("/getExtractSSUserList", payload)
            let userListRes = Array.isArray(response.data.data) ? response.data.data : []
            setuser(userListRes)
        }
        catch (err) {
            console.log("fetch user list err", err)
            setuser([])
        }
    }

    const fetchBeatCoverageReport = async ({ yr, zone, reg, usr }) => {
        try {
            setloading(true);
            const payload = {
                yr,
                zone_id: zone,
                reg_id: reg,
                user_id: usr ?? 0,
            }
            let response = await axios.post("/view_beat_coverage_report", payload);
            let res = Array.isArray(response.data.data) ? response.data.data : [];
            settableData(res);
        } catch (err) {
            if (err?.response?.status === 404) {
                toast.warning("No Data Available")
            } else {
                console.log("fetching Beat Coverage Report Error", err);
                toast.error("Failed to Load Data")
            }
            settableData([]);
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        fetchZone();
    }, [])

    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
        } else {
            setregionData([])
            handleChange("region", "0")
        }
    }, [formData?.zone]);

    useEffect(() => {
        setuser([]);
        handleChange("User", { id: 0, u_name: "All" });
        if (formData.region > 0 && (formData.zone > 0)) {
            handleChange("User", { id: 0, u_name: "All" })
            fetchSSUserList();
        } else {
            setuser([])
            handleChange("User", { id: 0, u_name: "All" })
        }
    }, [formData.zone, formData.region]);

    useEffect(() => {
        isInteractiveChange.current = false;
        setMonth(decodedYr ? dayjs(decodedYr, "YYYY") : dayjs().startOf("year"));
        setFormData((prev) => ({
            zone: decodedZone || "0",
            region: decodedRegion || "0",
            User:
                decodedUser && String(prev.User?.id) === String(decodedUser)
                    ? prev.User
                    : { id: 0, u_name: "All" },
        }));
        if (!decodedYr && !decodedZone && !decodedRegion && !decodedUser) return;
        fetchBeatCoverageReport({
            yr: decodedYr ? decodedYr : dayjs().format("YYYY"),
            zone: decodedZone,
            reg: decodedRegion,
            usr: decodedUser,
        })
    }, [decodedYr, decodedZone, decodedRegion, decodedUser])

    useEffect(() => {
        if (decodedUser && user.length > 0 && !isInteractiveChange.current) {
            const found = user.find((u) => String(u.id) === String(decodedUser));
            if (found) handleChange("User", found);
        }
    }, [user, decodedUser]);

    const handleLoad = () => {
        let params = new URLSearchParams();
        if (month) params.append('yr', encode(month.format("YYYY")));
        if (formData.zone > 0) params.append('zone', encode(formData.zone));
        if (formData.region > 0) params.append('region', encode(formData.region));
        if (formData.User?.id > 0) params.append('user', encode(formData.User.id));
        navigate(`/reports/beat_coverage?${params.toString()}`)
    }

    const buildPayload = () => ({
        yr: month ? month.format("YYYY") : dayjs().format("YYYY"),
        zone_id: formData.zone === "0" ? "" : formData.zone,
        reg_id: formData.region === "0" ? "" : formData.region,
        user_id: formData.User?.id ? formData.User.id : "",
    });

    const exportColumns = [
        { field: 'sr_name', headerName: 'Sales Person' },
        { field: 'hq_name', headerName: 'HQ' },
        { field: 'area_name', headerName: areaLabel },
        { field: 'beat_name', headerName: beatLabel },
        ...Object.values(buildMonthNames(month ? month.format('YYYY') : dayjs().format('YYYY')))
            .map((label) => ({ field: label, headerName: label })),
    ];

    const handleDownloadExcel = async () => {
        try {
            setProgress1("0%")
            const payload = buildPayload();
            const response = await axios.post("/view_beat_coverage_report", payload);
            const rawData = Array.isArray(response.data.data) ? response.data.data : [];

            await new Promise((r) => setTimeout(r, 100));
            setProgress1("50%");

            const yr = month ? month.format('YYYY') : dayjs().format('YYYY');
            const excelRows = buildExportRows(rawData, yr);
            const grandTotalRow = buildGrandTotalRow(rawData, yr);

            DownloadCSV(
                [...excelRows, grandTotalRow],
                exportColumns,
                `Beat_Coverage_Report_${yr}`,
                setProgress,
                enqueueSnackbar,
                {},
                false
            );
            await new Promise((r) => setTimeout(r, 100));
            setProgress1("100%");
        } catch (err) {
            if (err?.response?.status === 404) {
                toast.warning("No Data Available To Export")
            } else {
                console.log("Download excel Error", err);
                toast.error("Failed to Export Excel")
            }
        } finally {
            setProgress1(null)
        }
    };

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: location.pathname },
            { label: `${beatLabel} Coverage` },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">{beatLabel} Coverage</h1>
                </Box>
            </Box>
            <Box sx={headContainer}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 1.5, lg: 1.5 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Year"
                                format="YYYY"
                                views={["year"]}
                                value={month}
                                onChange={(newValue) => setMonth(newValue)}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="zone">{zoneLabel}</InputLabel>
                            <Select value={formData.zone} onChange={(e) => {
                                isInteractiveChange.current = true;
                                handleChange("region", "0")
                                handleChange("User", { id: 0, u_name: "All" })
                                handleChange("zone", e.target.value)
                            }}
                                id='zone' label={zoneLabel} MenuProps={menuStyle} labelId="zone" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {zoneData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Region">{regionLabel}</InputLabel>
                            <Select id='Region' label={regionLabel} MenuProps={menuStyle}
                                value={formData.region} onChange={(e) => {
                                    isInteractiveChange.current = true;
                                    handleChange("User", { id: 0, u_name: "All" })
                                    handleChange("region", e.target.value)
                                }}
                                labelId="Region" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {regionData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <Autocomplete
                            options={[{ id: 0, u_name: "All" }, ...user]}
                            getOptionLabel={(option) => option?.u_name ?? ""}
                            value={formData.User || null}  // ← Allow null
                            onChange={(event, newValue) => {
                                isInteractiveChange.current = true;
                                handleChange("User", newValue)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={userLabel}
                                    size="small"
                                />
                            )}
                            isOptionEqualToValue={(option, value) => option?.id === value?.id}
                            clearOnBlur={false}  // ← Don't auto-reset on blur
                            disableClearable={false}  // ← Allow X button
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 0.8, lg: 0.8 }}>
                        <Button variant='contained' color="primary" onClick={handleLoad}>Load</Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 0.6, lg: 0.6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        {progress1 ? (
                            <CircularProgressLoading progress={progress1} />
                        ) : (
                            <span onClick={handleDownloadExcel} style={{ cursor: 'pointer' }}>
                                <AiOutlineFileExcel style={{ color: "green", height: "30px", width: "30px" }} />
                            </span>
                        )}
                    </Grid>
                </Grid>
            </Box>
            {(decodedYr || decodedZone || decodedRegion || decodedUser) && (
                <Box p={1.5} sx={headContainer}>
                    <BeatCoverageTable
                        rawData={tableData}
                        yr={month ? month.format('YYYY') : dayjs().format('YYYY')}
                        loading={loading}
                        areaLabel={areaLabel}
                        beatLabel={beatLabel}
                    />
                </Box>
            )}

        </Layout>
    )
}

export default BeatCoverage