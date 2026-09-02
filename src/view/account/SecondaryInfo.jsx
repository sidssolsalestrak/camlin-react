import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import React from 'react'
import CommonAppSelect from '../../utils/CommonAppSelect'

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
                            <TextField
                                label={fieldConfig["Birthday"]?.label || "Birth Date"}
                                fullWidth size="small" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.dob}
                                disabled={form.dobNA}
                                onChange={(e) =>
                                    setForm({ ...form, dob: e.target.value })
                                }
                            />
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
                            <TextField
                                label={fieldConfig["Anniversary"]?.label || "Anniversary"}
                                fullWidth size="small" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.anniversary}
                                disabled={form.anniversaryNA}
                                onChange={(e) =>
                                    setForm({ ...form, anniversary: e.target.value })
                                }
                            />
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
