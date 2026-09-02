import { Box, FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material'
import React from 'react'
import { useState } from 'react'

const style = {
    color: "#1a1917",
    fontSize: "18.2px",
    fontWeight: 500,
}

const SalestrakCredential = ({ formData, handleChangeForm, errors, setErrors, original ,userLabel}) => {
    // const validateUser = (value) => {
    //     const regex = /^[a-zA-Z0-9_]*$/;
    //     return regex.test(value);
    // };

    const validatePassword = (value) => {
        const regex = /^(?=(?:.*[a-z]){2,})(?=(?:.*[A-Z]){2,})(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
        return regex.test(value);
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, margin: 1, p: 1 }}>
            <Typography sx={style}>Salestrak Login Credentials</Typography>
            <TextField value={formData.userID}
                onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    handleChangeForm("userID", onlyText)
                }}
                size='small' placeholder={`Enter ${userLabel} ID`} required
                variant='outlined' label={`${userLabel} ID`} fullWidth
                error={!!errors.userID}
                helperText={errors.userID}
            // onBlur={(e) => {
            //     if (!validateUser(e.target.value)) {
            //         setErrors((prev) => ({
            //             ...prev,
            //             userID: "Invalid User Name"
            //         }));
            //     } else {
            //         setErrors((prev) => ({
            //             ...prev,
            //             userID: ""
            //         }));
            //     }
            // }}
            />
            <TextField value={formData.password} type='password' required
                onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    handleChangeForm("password", onlyText)
                }}
                size='small' placeholder='Enter Password'
                variant='outlined' label="Password" fullWidth
                error={!!errors.password}
                helperText={errors.password}
                onBlur={(e) => {
                    if (original.password !== e.target.value) {
                        if (!validatePassword(e.target.value)) {
                            setErrors((prev) => ({
                                ...prev,
                                password: "Min 8 chars, 2 lowercase, 2 uppercase, 1 digit, 1 special char required"
                            }));
                        } else {
                            setErrors((prev) => ({
                                ...prev,
                                password: ""
                            }));
                        }
                    }
                }}
            />
            <TextField value={formData.confirmPassword} type='password' required
                onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    handleChangeForm("confirmPassword", onlyText)
                }}
                size='small' placeholder='Confirm Password'
                variant='outlined' label="Confirm Password" fullWidth
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                onBlur={(e) => {
                    if (formData.password !== e.target.value) {
                        setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "Password didn't Match"
                        }));
                    } else {
                        setErrors((prev) => ({
                            ...prev,
                            confirmPassword: ""
                        }));
                    }
                }}
            />
            <FormControl>
                <FormLabel id="demo-radio-buttons-group-label" color='black'>Block Status</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    defaultValue="0"
                    value={formData.blockStatus}
                    onChange={(e) => handleChangeForm("blockStatus", e.target.value)}
                >
                    <FormControlLabel value="0" control={<Radio />} label="Allow" />
                    <FormControlLabel value="1" control={<Radio />} label="Block" />
                </RadioGroup>
            </FormControl>
        </Box>
    )
}

export default SalestrakCredential
