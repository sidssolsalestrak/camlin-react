import { Autocomplete, Box, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material'
import React, { useEffect } from 'react'
import { useState } from 'react'
import axios from "../../../services/api";

const style = {
    color: "#1a1917",
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

const OtherDetails = ({ formData, handleChangeForm, errors, defaultUserId }) => {
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [area, setarea] = useState([])
    const [teritory, setteritory] = useState([])
    const [user, setUser] = useState([])
    const [supplied_type, setsupplied_type] = useState([])
    const [supplied_by, setsupplied_by] = useState([])
    const [state, setstate] = useState([])
    const [city, setcity] = useState([])
    const [stockCat, setstockCat] = useState([])
    const [matGroup, setmatGroup] = useState([])

    /*------------ get zone data ---------- */
    const fetchZone = async () => {
        try {
            const res = await axios.get("/zoneNames");
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
            let response = await axios.post("/getRegionList", { zone_id: formData.zone })
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
            const res = await axios.post("/get_arealist", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
            setarea([]);
        }
    }

    /*---------- fetch teritory---------*/
    const fetchTeritoy = async () => {
        try {
            const res = await axios.post("/getTerriTb", { area_id: formData.area });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setteritory(data);
        } catch (error) {
            console.error(error);
            setteritory([]);
        }
    }

    /*---------- fetch Supplied By---------*/
    const fetchSuppliedType = async () => {
        try {
            const res = await axios.post("/suplied_type");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setsupplied_type(data);
        } catch (error) {
            console.error(error);
            setsupplied_type([]);
        }
    }

    /*---------- fetch Supplied to---------*/
    const fetchSuppliedTo = async () => {
        try {
            const res = await axios.post("/suplied_by", { suplier: formData.supplied_Type });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setsupplied_by(data);
        } catch (error) {
            console.error(error);
            setsupplied_by([]);
        }
    }

    /*---------- fetch state ---------*/
    const fetchState = async () => {
        try {
            const res = await axios.post("/get_state_list", { zonedrp: formData.zone });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setstate(data);
        } catch (error) {
            console.error(error);
            setstate([]);
        }
    }

    /*---------- fetch city ---------*/
    const fetchCity = async () => {
        try {
            const res = await axios.post("/get_city_list", { stateid: formData.state });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setcity(data);
        } catch (error) {
            console.error(error);
            setcity([]);
        }
    }

    /*---------- fetch stock cat ---------*/
    const fetchStockCat = async () => {
        try {
            const res = await axios.post("/stk_cat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setstockCat(data);
        } catch (error) {
            console.error(error);
            setstockCat([]);
        }
    }

    /*---------- fetch mat group ---------*/
    const fetchMatGroup = async () => {
        try {
            const res = await axios.post("/matrix_grp");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setmatGroup(data);
        } catch (error) {
            console.error(error);
            setmatGroup([]);
        }
    }

    /*---------- fetch user list ---------*/
    const fetchUser = async () => {
        try {
            const res = await axios.post("/get_user_list", { zone_id: formData.zone });
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setUser(data);

            // ✅ if editing, auto-select matched users
            if (defaultUserId && defaultUserId.length > 0) {
                const matched = data.filter(u => defaultUserId.includes(u.id));
                if (matched.length > 0) {
                    handleChangeForm("user", matched);
                }
            }
        } catch (error) {
            console.error(error);
            setUser([]);
        }
    }

    //initial render
    useEffect(() => {
        fetchZone();
        fetchSuppliedType();
        fetchStockCat();
        fetchMatGroup();
    }, [])

    // Zone changes
    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
            fetchState();
            fetchUser();
        }
    }, [formData?.zone]);

    // Region changes
    useEffect(() => {
        if (formData?.region > 0 && formData?.zone > 0) {
            fetchArea();
        }
    }, [formData?.region]);

    // Area changes
    useEffect(() => {
        if (formData?.area > 0) {
            fetchTeritoy();
        }
    }, [formData?.area]);

    // Supplied Type changes
    useEffect(() => {
        if (formData?.supplied_Type > 0) {
            fetchSuppliedTo();
        }
    }, [formData?.supplied_Type]);

    // State changes
    useEffect(() => {
        if (formData?.state > 0) {
            fetchCity();
        }
    }, [formData?.state]);

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

            <FormControl fullWidth >
                <Autocomplete
                    multiple
                    options={user}
                    getOptionLabel={(option) => option.name || ""}
                    getOptionKey={(option) => option.id}
                    value={formData.user || []}
                    onChange={(event, value) => handleChangeForm("user", value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="User *"
                            size="small"
                            error={!!errors.user}
                            helperText={errors?.user}
                        />
                    )}
                />
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedType">Supplied Type</InputLabel>
                <Select value={formData.supplied_Type} id='SuppliedType' label="Supplied Type" error={!!errors.supplied_Type} MenuProps={menuStyle}
                    labelId="SuppliedType" variant="outlined" onChange={(e) => handleChangeForm("supplied_Type", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {supplied_type?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.stk_type_name}</MenuItem>
                    ))}
                </Select>
                {errors?.supplied_Type && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_Type}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedBy">Supplied By</InputLabel>
                <Select value={formData.supplied_By} id='SuppliedBy' label="Supplied By" error={!!errors.supplied_By} MenuProps={menuStyle}
                    labelId="SuppliedBy" variant="outlined" onChange={(e) => handleChangeForm("supplied_By", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {supplied_by?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.stk_code} - {val?.stk_name}</MenuItem>
                    ))}
                </Select>
                {errors?.supplied_By && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_By}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="State">State</InputLabel>
                <Select value={formData.state} id='State' label="State" error={!!errors.state} MenuProps={menuStyle}
                    labelId="State" variant="outlined" onChange={(e) => handleChangeForm("state", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {state?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.state_name}</MenuItem>
                    ))}
                </Select>
                {errors?.state && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.state}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="City">City</InputLabel>
                <Select value={formData.city} id='City' label="City" error={!!errors.city} MenuProps={menuStyle}
                    labelId="City" variant="outlined" onChange={(e) => handleChangeForm("city", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {city?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.city_name}</MenuItem>
                    ))}
                </Select>
                {errors?.city && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.city}</span>}
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="category">Stockist Category</InputLabel>
                <Select value={formData.category} id='category' label="Stockist Category" MenuProps={menuStyle}
                    labelId="category" variant="outlined" onChange={(e) => handleChangeForm("category", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {stockCat?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.cat_type}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="matrixGroup">Stockist Matrix Group</InputLabel>
                <Select value={formData.matrixGroup} id='matrixGroup' label="Stockist Matrix Group" MenuProps={menuStyle}
                    labelId="matrixGroup" variant="outlined" onChange={(e) => handleChangeForm("matrixGroup", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                    {matGroup?.map((val) => (
                        <MenuItem key={val.id} value={val.id}>{val?.matrix_grp}</MenuItem>
                    ))}
                </Select>
            </FormControl>

        </Box>
    )
}

export default OtherDetails