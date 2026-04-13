import { Box, ClickAwayListener, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from "../../../services/api";

const style = {
    color: "#026CB6",
    fontSize: "18.2px",
    fontWeight: 500,
}

const tooltipSx = {
    tooltip: {
        sx: {
            backgroundColor: "#1e293b",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 500,
            padding: "8px 12px",
            maxWidth: 320,
            lineHeight: 1.5,
        },
    },
    arrow: {
        sx: {
            color: "#1e293b",
        },
    },
};

const StockDetails = ({ formData, handleChangeForm, errors, setErrors }) => {
    const [type, setType] = useState([]);
    //tooltip
    const [open, setOpen] = React.useState(false);
    const handleTooltipClose = () => {
        setOpen(false);
    };
    const handleTooltipOpen = () => {
        setOpen(true);
    };

    /*------ fetch type -----*/
    useEffect(() => {
        const fetchType = async () => {
            try {
                const res = await axios.post("/stk_type");
                const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
                setType(data)
            } catch (error) {
                console.error(error);
            }
        }
        fetchType();
    }, [])

    const validateEmail = (value) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return emailRegex.test(value);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
            <Typography sx={style}>Stockist Details</Typography>
            <FormControl fullWidth size="small" required>
                <InputLabel id="type">Type</InputLabel>
                <Select value={formData.type} id='type' label="Type" error={!!errors.type}
                    labelId="type" variant="outlined" onChange={(e) => handleChangeForm("type", e.target.value)}>
                    <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                    {type?.map((item, index) => (
                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.stk_type_name}</MenuItem>
                    ))}
                </Select>
                {errors?.type && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{errors.type}</span>}
            </FormControl>
            <TextField value={formData.code}
                onChange={(e) => handleChangeForm("code", e.target.value)}
                size='small' placeholder='Enter Code'
                variant='outlined' label="Code" fullWidth
            />

            <ClickAwayListener onClickAway={handleTooltipClose}>
                <div>
                    <Tooltip
                        arrow
                        onClose={handleTooltipClose}
                        open={open}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                        title="Special Characters Not Allowed"
                        slotProps={tooltipSx}
                    >
                        <TextField value={formData.name} onClick={handleTooltipOpen}
                            onChange={(e) => handleChangeForm("name", e.target.value)}
                            required size='small' placeholder='Enter Name'
                            variant='outlined' label="Name" fullWidth
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                    </Tooltip>
                </div>
            </ClickAwayListener>

            <TextField value={formData.contactPerson}
                onChange={(e) => handleChangeForm("contactPerson", e.target.value)}
                size='small' placeholder='Enter Contact Person'
                variant='outlined' label="Contact Person" fullWidth
            />
            <TextField
                size="small"
                multiline
                value={formData.Address}
                onChange={(e) => handleChangeForm('Address', e.target.value)}
                rows={3}
                label="Address"
                InputProps={{
                    sx: {
                        '& textarea': {
                            resize: 'vertical',
                            overflowY: 'auto',
                            minHeight: '15px',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: '#f1f1f1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: '#c1c1c1',
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: '#a8a8a8',
                            }, color: '#343A40'
                        }
                    }
                }}
            />
            <TextField value={formData.pin}
                onChange={(e) => handleChangeForm("pin", e.target.value)}
                size='small' placeholder='Enter Pin'
                variant='outlined' label="Pin" fullWidth
            />
            <TextField value={formData.email}
                onChange={(e) => handleChangeForm("email", e.target.value)}
                onBlur={(e) => {
                    if (!validateEmail(e.target.value)) {
                        setErrors((prev) => ({
                            ...prev,
                            email: "Invalid email format"
                        }));
                    } else {
                        setErrors((prev) => ({
                            ...prev,
                            email: ""
                        }));
                    }
                }}
                error={!!errors?.email}
                helperText={errors.email ? errors.email : null}
                required size='small' placeholder='Enter Email'
                variant='outlined' label="Email" fullWidth
            />
            <TextField value={formData.phone}
                onChange={(e) => handleChangeForm("phone", e.target.value)}
                size='small' placeholder='Enter Phone'
                variant='outlined' label="Phone" fullWidth
            />
            <TextField value={formData.mobile}
                onChange={(e) => handleChangeForm("mobile", e.target.value)}
                required size='small' placeholder='Enter Mobile No'
                variant='outlined' label="Mobile" fullWidth
                error={!!errors.mobile}
                helperText={errors.mobile}
                onBlur={(e) => {
                    let val = e.target.value;
                    if (val.length !== 10) {
                        setErrors((prev) => ({
                            ...prev,
                            mobile: "Enter a valid 10-digit mobile number"
                        }));
                    } else {
                        setErrors((prev) => ({
                            ...prev,
                            mobile: ""
                        }));
                    }
                }}
            />
        </Box>
    )
}

export default StockDetails
