import { useState, useEffect } from "react";
import Layout from "../../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton, Autocomplete } from "@mui/material";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";

export default function Area() {

    const { editAreaId } = useParams()
    const decodedAreaId = editAreaId !== undefined && editAreaId !== null ? Number(atob(editAreaId)) : null
    const toast=useToast()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selRegion, setSelRegion] = useState(null)        // ← null for Autocomplete
    const [selState, setSelState] = useState(null)          // ← null for Autocomplete
    const [areaName, setAreaName] = useState("")
    const [hdnAreaName, setHdnAreaName] = useState("")
    const [allRegion, setAllRegion] = useState([])
    const [allState, setAllState] = useState([])
    const [allArea, setAllArea] = useState([])
    const [userType, setUserType] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [regionError, setRegionError] = useState(false)
    const [stateError, setStateError] = useState(false)
    const [areaError, setAreaError] = useState(false)
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchArea()
        fetchRegion()
        fetchState()
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
        if (!decodedAreaId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedAreaId)
        // eslint-disable-next-line
    }, [decodedAreaId])

    const resetFields = () => {
        setSelRegion(null)          // ← null
        setSelState(null)           // ← null
        setAreaName("")
        setHdnAreaName("")
        setRegionError(false)
        setStateError(false)
        setAreaError(false)
    }

    const fetchArea = async () => {
        try {
            let response = await api.post("/read_area", { areaId: null, regId: null })
            let areaData = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(areaData.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("fetchArea error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchRegion = async () => {
        try {
            let response = await api.post("/getRegionList", { zone_id: null })
            setAllRegion(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
        }
    }

    const fetchState = async () => {
        try {
            let response = await api.post("/getState")
            setAllState(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchState error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/read_area", { areaId: id })
            let data = response.data.data[0]

            // ← find matching objects for Autocomplete
            const matchedRegion = allRegion.find(r => r.id === data.reg_id) || null
            const matchedState = allState.find(s => s.id === data.state_id) || null
            setSelRegion(matchedRegion)
            setSelState(matchedState)

            setAreaName(data.area_name)
            setHdnAreaName(data.area_name)
            setRegionError(false)
            setStateError(false)
            setAreaError(false)
            setTabValue(0)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateAreaFields = () => {
        let isValid = true
        setRegionError(false)
        setStateError(false)
        setAreaError(false)

        if (!selRegion || Number(selRegion.id)===0) { setRegionError(true); isValid = false }        // ← null check
        if (!selState || Number(selState.id)===0) { setStateError(true); isValid = false }          // ← null check
        if (!areaName || areaName.trim() === "") { setAreaError(true); isValid = false }

        if (!isValid) {
            toast.error("Please fix all mandatory fields")
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedAreaId) {
                let check = 1
                if (hdnAreaName.toLowerCase() === areaName.toLowerCase()) check = 0
                let response = await api.post("/areaUpdate", {
                    updId: decodedAreaId,
                    reg_name: selRegion?.id,        // ← extract id
                    state_name: selState?.id,       // ← extract id
                    area_name: areaName,
                    check: check
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    fetchArea()
                    navigate('/masters/area_mas')
                } else {
                    toast.error(response.data.message || "Update Failed")
                }
            } else {
                let response = await api.post("/areaCreate", {
                    reg_name: selRegion?.id,        // ← extract id
                    state_name: selState?.id,       // ← extract id
                    area_name: areaName
                })
                if (response.data.success) {
                    toast.success(response.data.message)
                    resetFields()
                    fetchArea()
                    setTabValue(1)
                } else {
                    toast.error(response.data.message)
                }
            }
        } catch (err) {
            console.log(err)
            toast.error("Something went wrong Try again!!")
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (editAreaId) => {
        navigate(`/masters/area_mas/${btoa(editAreaId)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteArea", { id })
            if (response.data.code === 1) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchArea()
        } catch (err) {
            console.log("deleteArea error", err)
            toast.error("Something went wrong Try again!!")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedAreaId ? "Edit" : "Add"} Area`,
            message: `Are you sure you want to ${decodedAreaId ? "Edit" : "Add"} this Area?`,
            confirmText: decodedAreaId ? "Update" : "Add",
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
        { field: "reg_name", headerName: "REGION", filterable: true, sortable: true },
        { field: "state_name", headerName: "STATE", filterable: true, sortable: true },
        { field: "area_name", headerName: "AREA", filterable: true, sortable: true },
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
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    return (
        <Layout>
            <PageHeader title="Area" url="/masters/area_mas" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedAreaId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Area Details</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                        {/* ✅ Region — Autocomplete */}
                        <Autocomplete
                            options={[{ id: "0",reg_name: "Select Region" }, ...allRegion]}
                            getOptionLabel={(option) => option.reg_name || ""}
                            value={selRegion}
                            onChange={(e, newValue) => {
                                setSelRegion(newValue)
                                if (regionError) setRegionError(false)
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Region Name"
                                    size="small"
                                    error={regionError}
                                    helperText={regionError ? "Region Name is required." : ""}
                                />
                            )}
                        />

                        {/* ✅ State — Autocomplete */}
                        <Autocomplete
                            options={[{ id: "0", state_name: "Select State" }, ...allState]}
                            getOptionLabel={(option) => option.state_name || ""}
                            value={selState}
                            onChange={(e, newValue) => {
                                setSelState(newValue)
                                if (stateError) setStateError(false)
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="State Name"
                                    size="small"
                                    error={stateError}
                                    helperText={stateError ? "State Name is required." : ""}
                                />
                            )}
                        />

                        <TextField label="Area Name" size="small" value={areaName}
                            onChange={(e) => {
                                setAreaName(e.target.value)
                                if (areaError) setAreaError(false)
                            }}
                            error={!!areaError}
                            helperText={areaError ? "Area Name is required." : ""}
                        />
                        <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateAreaFields()) showSubmitConfirmation() }}>
                            {decodedAreaId ? "Update" : "Create"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allArea} loading={loading} />
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