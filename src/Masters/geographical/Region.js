import { useState, useEffect } from "react";
import Layout from "../../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton, Select, InputLabel, MenuItem, FormControl } from "@mui/material";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import { useParams, useNavigate } from "react-router-dom";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import DataTable from "../../utils/dataTable";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";

export default function Region() {

    const navigate = useNavigate()
    const toast =useToast()
    const { editRegionId } = useParams()
    const decodedEditRegionId = editRegionId !== undefined && editRegionId !== null ? Number(atob(editRegionId)) : null

    const [tabValue, setTabValue] = useState(1)
    const [zoneName, setZoneName] = useState([])
    const [selectedZone, setSelectedZone] = useState("0")
    const [regData, setRegData] = useState([])
    const [regionName, setRegionName] = useState("")
    const [hdnRegionName, setHdnRegionName] = useState("")
    const [editId, setEditId] = useState(null)
    const [zoneError, setZoneError] = useState(false)
    const [zoneErrMsg, setZoneErrMsg] = useState("")
    const [regionError, setRegionError] = useState(false)
    const [regionErrMsg, setRegionErrMsg] = useState("")
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [userType, setUserType] = useState(null)

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchZoneNames()
        fetchRegData()
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("session-token");
        if (token) {
            try {
                let decoded = jwtDecode(token)
                setUserType(decoded.user_type)
            } catch (err) {
                console.log(err)
            }
        }
    }, [])

    useEffect(() => {
        if (!decodedEditRegionId) {
            setRegionName("")
            setSelectedZone("0")
            setHdnRegionName("")
            setZoneError(false)
            setRegionError(false)
            setTabValue(1)
            return
        }
        collectEditData(decodedEditRegionId)
    }, [decodedEditRegionId])

    const fetchZoneNames = async () => {
        try {
            let response = await api.get("/zoneNames")
            setZoneName(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("Zone name Error", err)
        }
    }

    const fetchRegData = async () => {
        try {
            let response = await api.post("/regionData", { reg_id: 0 })
            let regsdata = Array.isArray(response.data.regTabResData) ? response.data.regTabResData : []
            setRegData(regsdata.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("fetch Data Error", err)
        } finally {
            setLoading(false)
        }
    }

    const collectEditData = async (regId) => {
        try {
            let response = await api.post("/regionData", { reg_id: regId })
            let data = response.data.regIdres[0]
            setEditId(regId)
            setSelectedZone(data.zone_id)
            setRegionName(data.reg_name)
            setHdnRegionName(data.reg_name)
            setZoneError(false)
            setRegionError(false)
            setTabValue(0)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateRegion = () => {
        let isValid = true
        setZoneError(false); setZoneErrMsg("")
        setRegionError(false); setRegionErrMsg("")

        if (Number(selectedZone) === 0) {
            setZoneError(true)
            setZoneErrMsg("Zone name is required")
            isValid = false
        }
        if (!regionName || regionName.trim().length < 3) {
            setRegionError(true)
            setRegionErrMsg(!regionName || regionName.trim() === ""
                ? "Region Name is required"
                : "Region Name must be at least 3 characters")
            if (!isValid) {
                toast.error("Please fix all mandatory fields")
                
            }
            isValid = false
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedEditRegionId) {
                let check = hdnRegionName.toLowerCase() === regionName.toLowerCase() ? 0 : 1
                let response = await api.post("/regionUpdate", { id: editId, zone_id: selectedZone, regName: regionName, check: check })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchRegData()
                    navigate('/masters/region')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/regionCreate", { zone_id: selectedZone, regName: regionName })
                if (response.data.success) {
                    toast.success("Region added successfully")
                    setSelectedZone("0")
                    setRegionName("")
                    fetchRegData()
                    setTabValue(1)
                } else {
                    toast.error(response.data.message || "Insert Failed")
                }
            }
        } catch (err) {
            toast.error("Something went wrong !!")
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (regId) => {
        navigate(`/masters/region/${btoa(regId)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/regionDelete", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchRegData()
        } catch (err) {
            toast.error("Something went wrong try again!!")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedEditRegionId ? "Edit" : "Add"} Region`,
            message: `Are you sure you want to ${decodedEditRegionId ? "Edit" : "Add"} this Region?`,
            confirmText: decodedEditRegionId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const showDeleteConfirmation = (id) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: "Are you sure you want to delete this record?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleDelete(id)
        })
    }

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "zone_name", headerName: "ZONE", filterable: true, sortable: true },
        { field: "reg_name", headerName: "REGION NAME", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                    <IconButton size="small" onClick={() => handleEdit(row.row.id)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => showDeleteConfirmation(row.row.id)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '14px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    return (
        <Layout>
            <PageHeader title="Region" url="/masters/region" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedEditRegionId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Region Details</Typography>
                }

                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                        <FormControl sx={{ width: '100%' }}>
                            <InputLabel id="zone_name">Zone Name</InputLabel>
                            <Select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                labelId="zone_name"
                                label="Zone Name"
                                size="small"
                                error={zoneError}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 200
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="0">Select Zone</MenuItem>
                                {zoneName.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.zone_name}</MenuItem>
                                ))}
                            </Select>
                            {zoneError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>{zoneErrMsg}</Typography>}
                        </FormControl>

                        <TextField
                            label="Region Name"
                            placeholder="Enter Region Name"
                            size="small"
                            value={regionName}
                            error={!!regionError}
                            helperText={regionErrMsg || ""}
                            onChange={(e) => {
                                setRegionName(e.target.value)
                                if (regionError) setRegionError(false)
                            }}
                        />

                        <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateRegion()) showSubmitConfirmation() }}>
                            {decodedEditRegionId ? "Update" : "Create"}
                        </Button>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={regData} loading={loading} />
                    </Box>
                )}
            </Box>

            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={modifyLoading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}