import React, { useEffect, useState } from 'react'
import Layout from '../../layout'
import { useLocation } from 'react-router-dom'
import { Box, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import axios from "../../services/api";
import SalesAnalysisBody from './SalesAnalysisBody';
import { getMasterPanel } from "../../services/masterPanelService";

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

const SalesAnalysis = () => {
    const location = useLocation();
    const [month, setMonth] = useState(dayjs().startOf("month"));
    const [formData, setFormData] = useState({
        zone: "0",
        region: "0",
        area: "0",
        State: "0"
    })
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [area, setarea] = useState([]);
    const [state, setstate] = useState([]);
    const [masterPanel, setMasterPanel] = useState({});

    const handleChange = (name, val) => {
        setFormData((prev) => ({
            ...prev,
            [name]: val
        }))
    }
    /*------------ get zone data ---------- */
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

    /*------------ get region data ---------- */
    const fetchRegion = async () => {
        try {
            let response = await axios.post("/extractRegionList", { zone_id: formData.zone })
            setregionData(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
            setregionData([])
        }
    }

    /*----------fetch area---------*/
    const fetchArea = async () => {
        try {
            let payload = {
                reg_id: formData.region,
                zone_id: null
            }
            const res = await axios.post("/extractAreaList", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
            setarea([]);
        }
    }

    /*------------ get state data ---------- */
    const fetchStateData = async () => {
        try {
            const res = await axios.post("/stateData");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setstate(data);
        } catch (error) {
            console.error(error);
            setstate([]);
        }
    }

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    // Initial render
    useEffect(() => {
        fetchZone();
        fetchStateData();
    }, [])

    // Zone changes → fetch regions
    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
        } else {
            setregionData([])
            handleChange("region", "0")
        }
    }, [formData?.zone]);

    // Region changes
    useEffect(() => {
        if (formData?.region > 0) {
            fetchArea();
        } else {
            setarea([])
            handleChange("area", "0")
        }
    }, [formData?.region]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Dashboard", path: location.pathname },
            { label: "Sales Analysis" },
        ]}>
            <Box sx={headContainer}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Month *"
                                format="MMM YYYY"
                                views={["year", "month"]}
                                openTo="month"
                                value={month}
                                onChange={(newValue) => setMonth(newValue)}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="zone">{masterPanel["ZONE"] || "Zone"}</InputLabel>
                            <Select value={formData.zone} onChange={(e) => handleChange("zone", e.target.value)}
                                id='zone' label={masterPanel["ZONE"] || "Zone"} MenuProps={menuStyle} labelId="zone" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">Select {masterPanel["ZONE"] || "Zone"}</MenuItem>
                                {zoneData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Region">{masterPanel["REGN"] || "Region"}</InputLabel>
                            <Select id='Region' label={masterPanel["REGN"] || "Region"} MenuProps={menuStyle}
                                value={formData.region} onChange={(e) => handleChange("region", e.target.value)}
                                labelId="Region" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="0">Select {masterPanel["REGN"] || "Region"}</MenuItem>
                                {regionData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Area">{masterPanel["AREA"] || "Area"}</InputLabel>
                            <Select id='Area' label={masterPanel["AREA"] || "Area"} MenuProps={menuStyle}
                                value={formData.area} onChange={(e) => handleChange("area", e.target.value)}
                                labelId="Area" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">Select {masterPanel["AREA"] || "Area"}</MenuItem>
                                {area?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="State">State</InputLabel>
                            <Select id='State' label="State" MenuProps={menuStyle}
                                value={formData.State} onChange={(e) => handleChange("State", e.target.value)}
                                labelId="State" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">Select State</MenuItem>
                                {state?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.state_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }} sx={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                        <span>*All Values - Lakhs</span>
                    </Grid>
                </Grid>
            </Box>
            <Box>
                <SalesAnalysisBody formData={formData} month={month} />
            </Box>
        </Layout>
    )
}

export default SalesAnalysis