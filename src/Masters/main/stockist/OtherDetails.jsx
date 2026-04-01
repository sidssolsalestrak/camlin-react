import { Box, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { useState } from 'react'
import axios from "../../../services/api";

const style = {
    color: "#026CB6",
    fontSize: "18.2px",
    fontWeight: 500,
}

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const OtherDetails = ({ formData, handleChangeForm, errors }) => {
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [area, setarea] = useState([])
    const [teritory, setteritory] = useState([])
    /*------------ get zone data ---------- */
    const fetchZone = async () => {
        try {
            const res = await axios.get("/zoneNames");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setzoneData(data);
        } catch (error) {
            console.error(error);
        }
    }

    /*------------ get region data ---------- */
    const fetchRegion = async () => {
        try {
            let response = await axios.post("/getRegionList", { zone_id: formData.zone })
            setregionData(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
        }
    }

    /*----------fetch area---------*/
    const fetchArea = async () => {
        try {
            let payload = {
                reg_id: formData.region,
                zone_id: null
            }
            const res = await axios.post("/get_arealist", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
        }
    }

    /*----------fetch teritory---------*/
    const fetchTeritoy = async () => {
        try {
            const res = await axios.post("/getTerriTb", { area_id: formData.area });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setteritory(data);
        } catch (error) {
            console.error(error);
        }
    }

    //initial render
    useEffect(() => {
        fetchZone();
    }, [])

    //render based on dependency
    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
        }
        if (formData?.region > 0) {
            fetchArea();
        }
        if (formData?.area > 0) {
            fetchTeritoy();
        }
    }, [formData])

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
            <Typography sx={style}>Other Details</Typography>
            <FormControl fullWidth size="small" required>
                <InputLabel id="zone">Zone</InputLabel>
                <Select value={formData.zone} id='zone' label="Zone" error={!!errors.zone} MenuProps={menuStyle}
                    labelId="zone" variant="outlined" onChange={(e) => handleChangeForm("zone", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {zoneData?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                    ))}
                </Select>
                {errors?.zone && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.zone}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Region">Region</InputLabel>
                <Select value={formData.region} id='Region' label="Region" error={!!errors.region} MenuProps={menuStyle}
                    labelId="Region" variant="outlined" onChange={(e) => handleChangeForm("region", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {regionData?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                    ))}
                </Select>
                {errors?.region && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.region}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Area">Area</InputLabel>
                <Select value={formData.area} id='Area' label="Area" error={!!errors.area} MenuProps={menuStyle}
                    labelId="Area" variant="outlined" onChange={(e) => handleChangeForm("area", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {area?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                    ))}
                </Select>
                {errors?.area && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.area}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Territory">Territory</InputLabel>
                <Select value={formData.teritory} id='Territory' label="Territory" error={!!errors.teritory} MenuProps={menuStyle}
                    labelId="Territory" variant="outlined" onChange={(e) => handleChangeForm("teritory", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {teritory?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.ter_name}</MenuItem>
                    ))}
                </Select>
                {errors?.teritory && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.teritory}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="User">User</InputLabel>
                <Select value={formData.user} id='Area' label="User" error={!!errors.user} MenuProps={menuStyle}
                    labelId="User" variant="outlined" onChange={(e) => handleChangeForm("user", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.user && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.user}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedType">Supplied Type</InputLabel>
                <Select value={formData.supplied_Type} id='SuppliedType' label="Supplied Type" error={!!errors.supplied_Type} MenuProps={menuStyle}
                    labelId="SuppliedType" variant="outlined" onChange={(e) => handleChangeForm("supplied_Type", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.supplied_Type && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_Type}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedBy">Supplied By</InputLabel>
                <Select value={formData.supplied_By} id='SuppliedBy' label="Supplied By" error={!!errors.supplied_By} MenuProps={menuStyle}
                    labelId="SuppliedBy" variant="outlined" onChange={(e) => handleChangeForm("supplied_By", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.supplied_By && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_By}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="State">State</InputLabel>
                <Select value={formData.state} id='State' label="State" error={!!errors.state} MenuProps={menuStyle}
                    labelId="State" variant="outlined" onChange={(e) => handleChangeForm("state", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.state && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.state}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="City">City</InputLabel>
                <Select value={formData.city} id='City' label="City" error={!!errors.city} MenuProps={menuStyle}
                    labelId="City" variant="outlined" onChange={(e) => handleChangeForm("city", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.city && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.city}</span>}
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="category">Stockist Category</InputLabel>
                <Select value={formData.category} id='category' label="Stockist Category" MenuProps={menuStyle}
                    labelId="category" variant="outlined" onChange={(e) => handleChangeForm("category", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="matrixGroup">Stockist Matrix Group</InputLabel>
                <Select value={formData.matrixGroup} id='matrixGroup' label="Stockist Matrix Group" MenuProps={menuStyle}
                    labelId="matrixGroup" variant="outlined" onChange={(e) => handleChangeForm("matrixGroup", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
            </FormControl>
        </Box>
    )
}

export default OtherDetails
