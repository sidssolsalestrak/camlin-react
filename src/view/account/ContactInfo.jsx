import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Checkbox, Divider, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Select, TextField,  } from '@mui/material';
import CommonAppSelect from '../../utils/CommonAppSelect';

const headContainer = {
    display: "flex", flexDirection: 'column', gap: 2, m: 1.5,
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc" }

const MEETING_DAYS = [
    { label: "Mon", value: "2" },
    { label: "Tue", value: "3" },
    { label: "Wed", value: "4" },
    { label: "Thu", value: "5" },
    { label: "Fri", value: "6" },
    { label: "Sat", value: "7" },
    { label: "Sun", value: "1" },
];

const ContactInfo = ({ fieldConfig, isHcp, isRetailer, clinics, handleRepChange, updateClinic, toggleMeetingDay
    , repInchargeOptions, repPOSOptions, hospitalOptions, distributorOptions, pharmacyOptions,
    fieldErrors = {},
    handleClinicContactNoChange,
    handleClinicContactNoBlur,
}) => {
    const id = React.useId();
    console.log("field config of meeting time",fieldConfig["Meeting Time"])
    return (
        <div style={{ marginBottom: "10%" }}>
            <Box sx={headContainer}>
                {clinics.map((clinic, idx) => (
                    <Box key={idx} sx={{ p: 0, overflow: "hidden" }}>
                        <Accordion sx={{ boxShadow: "none" }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderTop: "4px solid #2196f3" }}>
                                <Typography variant="h6" color="initial" sx={subHeaderStyle}>
                                    Contact Info {idx + 1}
                                </Typography>
                            </AccordionSummary>
                            <Divider />
                            <AccordionDetails sx={{ pt: 2 }}>
                                <Grid container spacing={2}  sx={{ mb: 2 }}>

                                 {isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label="Rep Incharge"
                                                value={clinic.repIncharge}
                                                onChange={(e) => handleRepChange(idx, String(e.target.value), false)}
                                                options={repInchargeOptions}
                                                valueKey="id"
                                                labelKey="first_name"
                                                required={true}
                                                error={!!fieldErrors.repIncharge}
                                                helperText={fieldErrors.repIncharge}
                                            />
                                            {fieldErrors.repIncharge && (
                                                <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>
                                                    {fieldErrors.repIncharge}
                                                </Typography>
                                            )}
                                        </Grid>
                                    )}

                                    {isRetailer && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={idx === 0 ? "Account Owner (SO)" : "Account Owner (KAM)"}
                                                value={clinic.repInchargePOS}
                                                onChange={(e) => handleRepChange(idx, String(e.target.value), true)}
                                                options={repPOSOptions}
                                                valueKey="id"
                                                labelKey="full_name"
                                                required={true}
                                                error={!!fieldErrors.repIncharge}
                                                helperText={fieldErrors.repIncharge}
                                            />
                                            {fieldErrors.repIncharge && (
                                                <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>
                                                    {fieldErrors.repIncharge}
                                                </Typography>
                                            )}
                                        </Grid>
                                    )}
                                    {/* Beat – loaded after rep selection */}
                                    {fieldConfig["Beat"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Beat"]?.label || "Beat"}
                                                value={clinic.beat}
                                                onChange={(e) => updateClinic(idx, "beat", String(e.target.value))}
                                                options={clinic.beatOptions}
                                                valueKey="id"
                                                labelKey="beat_name"
                                                required={true}
                                                error={!!fieldErrors.beat}
                                                helperText={fieldErrors.beat}
                                            />
                                            {fieldErrors.beat && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{fieldErrors.beat}</Typography>}
                                        </Grid>
                                    )}

                                    {/* Chain Name – retailerDiv (Retailer + rep type 1) */}
                                    {fieldConfig["Chain Name"]?.show && isRetailer && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Chain Name"]?.label || "Pharmacy Chain Name"}
                                                value={clinic.phChain}
                                                onChange={(e) => updateClinic(idx, "phChain", String(e.target.value))}
                                                options={[]}
                                                valueKey="id"
                                                labelKey="chain_name"
                                            />
                                        </Grid>
                                    )}

                                    {/* Branch / Clinic Name */}
                                    {fieldConfig["Branch Name"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={isRetailer ? fieldConfig["Branch Name"]?.label : "Clinic Name"}
                                                fullWidth size="small" placeholder='Enter Clinic Name'
                                                value={clinic.clinicName}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "clinicName", onlyText)
                                                }}
                                                required={true}
                                                error={!!fieldErrors.clinicName}
                                                helperText={fieldErrors.clinicName}
                                            />
                                        </Grid>
                                    )}
                                     {/* Clinic Name */}
                                    {fieldConfig["Clinic Name"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={isRetailer ? fieldConfig["Clinic Name"]?.label : "Clinic Name"}
                                                fullWidth size="small" placeholder='Enter Clinic Name'
                                                value={clinic.clinicName}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "clinicName", onlyText)
                                                }}
                                                required={true}
                                                error={!!fieldErrors.clinicName}
                                                helperText={fieldErrors.clinicName}
                                            />
                                        </Grid>
                                    )}

                                  </Grid>
                                   <Grid container spacing={2} sx={{ mb: 2 }}>

                                    {/* Contact Person */}
                                    {fieldConfig["Contact Person"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Contact Person"]?.label || "Contact Name"}
                                                fullWidth size="small" placeholder='Enter Contact Name'
                                                value={clinic.contactName}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "contactName", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}

                                    {/* Contact No */}
                                    {fieldConfig["Contact No"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Contact No"]?.label || "Contact No"}
                                                fullWidth
                                                size="small"
                                                placeholder="Enter Contact No"
                                                value={clinic.contactNo}
                                                inputProps={{ maxLength: 10 }}
                                                onChange={(e) => handleClinicContactNoChange(idx, e.target.value)}
                                                onBlur={(e) => handleClinicContactNoBlur(idx, e.target.value)}
                                                error={!!fieldErrors.contactNum?.[idx]}
                                                helperText={fieldErrors.contactNum?.[idx]}
                                            />
                                        </Grid>
                                    )}

                                    {/* Address */}
                                    {fieldConfig["Address"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Address"]?.label || "Address"}
                                                fullWidth size="small" multiline rows={2}
                                                value={clinic.address}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "address", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}

                                     </Grid>
                                     <Grid container spacing={2}  sx={{ mb: 2 }}>
                                    {/* City */}
                                    {fieldConfig["City"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["City"]?.label || "City Name"}
                                                fullWidth size="small" placeholder='Enter City Name'
                                                value={clinic.city}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "city", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}

                                    {/* Zip Code */}
                                    {fieldConfig["Zip Code"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Zip Code"]?.label || "Zip Code"}
                                                fullWidth size="small" placeholder='Enter Zip Code'
                                                value={clinic.zipCode}
                                                onChange={(e) => {
                                                    const onlyDigits = e.target.value.replace(/\D/g, "")
                                                    updateClinic(idx, "zipCode", onlyDigits)
                                                }}
                                            />
                                        </Grid>
                                    )}

                                    {/* Hospital Attached – hcpDiv2 */}
                                    {fieldConfig["Hospital Attached"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Hospital Attached"]?.label || "Hospital Attached To"}
                                                value={clinic.hospitalAttached}
                                                onChange={(e) => updateClinic(idx, "hospitalAttached", String(e.target.value))}
                                                options={hospitalOptions}
                                                valueKey="id"
                                                labelKey="hosp_name"
                                            />
                                        </Grid>
                                    )}

                                    {fieldConfig["Distributor"]?.show && !isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControl fullWidth size="small" required error={!!fieldErrors.stkId}>
                                                <InputLabel id="Distributor">Distributor</InputLabel>
                                                <Select value={clinic.stkId} id='Distributor' label="Distributor" 
                                                    labelId="Distributor" variant="outlined"
                                                      MenuProps={{
                                                            PaperProps: {
                                                                style: {
                                                                    maxHeight: 200
                                                                }
                                                            }
                                                        }}
                                                    onChange={(e) => updateClinic(idx, "stkId", String(e.target.value))}>
                                                    {distributorOptions?.map((item, index) => (
                                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                            {item?.stk_code} - {item?.stk_name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldErrors.stkId && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{fieldErrors.stkId}</Typography>}
                                            </FormControl>
                                        </Grid>
                                    )}

                                    </Grid>
                                     <Grid container spacing={2}  sx={{ mb: 2 }}>
                                    
                                      {/* Distributor */}
                                    {fieldConfig["Distributor"]?.show && isHcp && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <FormControl fullWidth size="small" required error={!!fieldErrors.stkId}>
                                                <InputLabel id="Distributor">Distributor</InputLabel>
                                                <Select value={clinic.stkId} id='Distributor' label="Distributor" 
                                                    labelId="Distributor" variant="outlined"
                                                      MenuProps={{
                                                            PaperProps: {
                                                                style: {
                                                                    maxHeight: 200
                                                                }
                                                            }
                                                        }}
                                                    onChange={(e) => updateClinic(idx, "stkId", String(e.target.value))}>
                                                    {distributorOptions?.map((item, index) => (
                                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                            {item?.stk_code} - {item?.stk_name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                {fieldErrors.stkId && <Typography sx={{ color: "#D32F2F", fontSize: "9px", ml: 1 }}>{fieldErrors.stkId}</Typography>}
                                            </FormControl>
                                        </Grid>
                                    )}
                                    {/* Pharmacy Attached */}
                                    {fieldConfig["Pharmacy Attached"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <CommonAppSelect
                                                label={fieldConfig["Pharmacy Attached"]?.label || "Pharmacy Attached"}
                                                value={clinic.pharmacyAttached}
                                                onChange={(e) => updateClinic(idx, "pharmacyAttached", String(e.target.value))}
                                                options={pharmacyOptions}
                                                valueKey="id"
                                                labelKey="first_name"
                                            />
                                        </Grid>
                                    )}

                                     {/* Meeting Timings */}
                                    {fieldConfig["Meeting Time"]?.show && (
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <TextField
                                                label={fieldConfig["Meeting Time"]?.label || "Meeting Timings"}
                                                fullWidth size="small"
                                                value={clinic.meetingTime}
                                                onChange={(e) => {
                                                    const onlyText = e.target.value.replace(/^\s+/, "")
                                                    updateClinic(idx, "meetingTime", onlyText)
                                                }}
                                            />
                                        </Grid>
                                    )}
                                    </Grid>
                                    {/* Meeting Days */}
                                    {fieldConfig["Meeting Days"]?.show && (
                                        <Grid size={{ xs: 12, md: 8 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 400, mb: 0.5 }}>
                                                {fieldConfig["Meeting Days"]?.label || "Meeting Days"}
                                            </Typography>
                                            <FormGroup row>
                                                {MEETING_DAYS.map((day) => (
                                                    <FormControlLabel
                                                        key={day.value}
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={clinic.meetingDays.includes(day.value)}
                                                                onChange={() => toggleMeetingDay(idx, day.value)}
                                                            />
                                                        }
                                                        label={day.label}
                                                    />
                                                ))}
                                            </FormGroup>
                                        </Grid>
                                    )}

                            </AccordionDetails>
                        </Accordion>
                    </Box>
                ))}
            </Box>
        </div>
    )
}

export default ContactInfo;