import { Box, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material'
import React from 'react'
import { useState } from 'react'

const style = {
    color: "#026CB6",
    fontSize: "18.2px",
    fontWeight: 500,
}

const OtherDetails = ({ formData, handleChangeForm, errors }) => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
            <Typography sx={style}>Other Details</Typography>
            <FormControl fullWidth size="small" required>
                <InputLabel id="zone">Zone</InputLabel>
                <Select value={formData.zone} id='zone' label="Zone" error={!!errors.zone}
                    labelId="zone" variant="outlined" onChange={(e) => handleChangeForm("zone", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.zone && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.zone}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Region">Region</InputLabel>
                <Select value={formData.region} id='Region' label="Region" error={!!errors.region}
                    labelId="Region" variant="outlined" onChange={(e) => handleChangeForm("region", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.region && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.region}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Area">Area</InputLabel>
                <Select value={formData.area} id='Area' label="Area" error={!!errors.area}
                    labelId="Area" variant="outlined" onChange={(e) => handleChangeForm("area", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.area && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.area}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="Territory">Territory</InputLabel>
                <Select value={formData.teritory} id='Territory' label="Territory" error={!!errors.teritory}
                    labelId="Territory" variant="outlined" onChange={(e) => handleChangeForm("teritory", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.teritory && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.teritory}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="User">User</InputLabel>
                <Select value={formData.user} id='Area' label="User" error={!!errors.user}
                    labelId="User" variant="outlined" onChange={(e) => handleChangeForm("user", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.user && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.user}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedType">Supplied Type</InputLabel>
                <Select value={formData.supplied_Type} id='SuppliedType' label="Supplied Type" error={!!errors.supplied_Type}
                    labelId="SuppliedType" variant="outlined" onChange={(e) => handleChangeForm("supplied_Type", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.supplied_Type && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_Type}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="SuppliedBy">Supplied By</InputLabel>
                <Select value={formData.supplied_By} id='SuppliedBy' label="Supplied By" error={!!errors.supplied_By}
                    labelId="SuppliedBy" variant="outlined" onChange={(e) => handleChangeForm("supplied_By", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.supplied_By && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.supplied_By}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="State">State</InputLabel>
                <Select value={formData.state} id='State' label="State" error={!!errors.state}
                    labelId="State" variant="outlined" onChange={(e) => handleChangeForm("state", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.state && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.state}</span>}
            </FormControl>

            <FormControl fullWidth size="small" required>
                <InputLabel id="City">City</InputLabel>
                <Select value={formData.city} id='City' label="City" error={!!errors.city}
                    labelId="City" variant="outlined" onChange={(e) => handleChangeForm("city", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
                {errors?.city && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.city}</span>}
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="category">Stockist Category</InputLabel>
                <Select value={formData.category} id='category' label="Stockist Category"
                    labelId="category" variant="outlined" onChange={(e) => handleChangeForm("category", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth size="small" >
                <InputLabel id="matrixGroup">Stockist Matrix Group</InputLabel>
                <Select value={formData.matrixGroup} id='matrixGroup' label="Stockist Matrix Group"
                    labelId="matrixGroup" variant="outlined" onChange={(e) => handleChangeForm("matrixGroup", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="">Select</MenuItem>
                </Select>
            </FormControl>
        </Box>
    )
}

export default OtherDetails
