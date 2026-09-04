import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import React from 'react'
import CommonAppSelect from '../../utils/CommonAppSelect'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const SecondaryInfo = ({ fieldConfig, form, setForm, isHcpField, marketingOptions, ageOptions }) => {
    return (
        <div>
            <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Competitor Preference"
                    fullWidth size="small"
                    value={form.competitorPref}
                    InputLabelProps={{ shrink: true }} 
                    onChange={(e) => {
                        const onlyText = e.target.value.replace(/^\s+/, "");
                        setForm({ ...form, competitorPref: onlyText });
                    }}
                />
                </Grid>

                {/* Marketing Tools */}
                {fieldConfig["Marketing Tools"]?.show && (
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <CommonAppSelect
                            label={
                                fieldConfig["Marketing Tools"]?.label || "Marketing Tools"
                            }
                            multiple
                            value={form.marketingTools}
                            onChange={(e) =>
                                setForm({ ...form, marketingTools: e.target.value })
                            }
                            options={marketingOptions}
                            valueKey="id"
                            labelKey="marketing_tool_type"
                        />
                    </Grid>
                )}

                {/* Hobbies & Interests */}
                <Grid size={{ xs: 12, md: 4 }}>
                   <TextField
                        label="Hobbies & Interests"
                        fullWidth size="small"
                        value={form.hobbies?.toString() || ""}
                        onChange={(e) => {
                            const onlyText = e.target.value.replace(/^\s+/, "");
                            setForm({ ...form, hobbies: onlyText });
                        }}
                    />
                </Grid>

                {/* Birth Date + NA */}
                {fieldConfig["Birthday"]?.show && (
                    <>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label={fieldConfig["Birthday"]?.label || "Birth Date"}
                                    value={form.dob ? dayjs(form.dob) : null}
                                    onChange={(newValue) =>
                                        setForm({
                                            ...form,
                                            dob: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                                        })
                                    }
                                    format="DD MMM YYYY"
                                    views={["day", "month", "year"]}
                                    disabled={form.dobNA}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", alignItems: "center" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.dobNA}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, dobNA: e.target.checked, dob: e.target.checked ? "" : f.dob }))
                                        }
                                        size="small"
                                    />
                                }
                                label="NA"
                            />
                        </Grid>
                    </>
                )}

                {/* Anniversary + NA */}
                {fieldConfig["Anniversary"]?.show && (
                    <>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label={fieldConfig["Anniversary"]?.label || "Anniversary"}
                                    value={form.anniversary ? dayjs(form.anniversary) : null}
                                    onChange={(newValue) =>
                                        setForm({
                                            ...form,
                                            anniversary: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
                                        })
                                    }
                                    format="DD MMM YYYY"
                                    views={["day", "month", "year"]}
                                    disabled={form.anniversaryNA}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", alignItems: "center" }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.anniversaryNA}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, anniversaryNA: e.target.checked, anniversary: e.target.checked ? "" : f.anniversary }))
                                        }
                                        size="small"
                                    />
                                }
                                label="NA"
                            />
                        </Grid>
                    </>
                )}

                {fieldConfig["Age Group"]?.show && isHcpField && (
                    <Grid size={{ xs: 12, md: 3, lg: 3 }}>
                        <CommonAppSelect
                            label={fieldConfig["Age Group"]?.label}
                            value={form.agegroup}
                            onChange={(e) =>
                                setForm({ ...form, agegroup: String(e.target.value) })
                            }
                            options={ageOptions}
                            valueKey="id"
                            labelKey="age_grp_name"
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    )
}

export default SecondaryInfo
