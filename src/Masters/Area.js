import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton, Select, InputLabel, MenuItem, FormControl } from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../utils/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../utils/confirmDialog";

export default function Area() {

    const { editAreaId } = useParams()
    const decodedAreaId = editAreaId !== undefined && editAreaId !== null ? Number(atob(editAreaId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selRegion, setSelRegion] = useState("0")
    const [selState, setSelState] = useState("0")
    const [areaName, setAreaName] = useState("")
    const [allRegion, setAllRegion] = useState([])
    const [allState, setAllState] = useState([])
    const [allArea, setAllArea] = useState([])
    const [loading, setLoading] = useState(true)
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
        if (!decodedAreaId) {
            setSelRegion("0")
            setSelState("0")
            setAreaName("")
            setTabValue(1)
            return
        }
        collectEditData(decodedAreaId)
    }, [decodedAreaId])

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
            let data = response.data.regIdres[0]
            setSelRegion(data.reg_id)
            setSelState(data.state_id)
            setAreaName(data.area_name)
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

        if (selRegion == 0) { setRegionError(true); isValid = false }
        if (selState == 0) { setStateError(true); isValid = false }
        if (!areaName || areaName.trim() === "") { setAreaError(true); isValid = false }

        return isValid
    }

    const handleSubmit = async () => {
        try {
            if (decodedAreaId) {
                let response = await api.post("/areaUpdate", {
                    id: decodedAreaId,
                    reg_name: selRegion,
                    state_name: selState,
                    area_name: areaName
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    navigate('/masters/area_mas')
                    setTabValue(1)
                    setAreaName("")
                    setSelRegion("0")
                    setSelState("0")
                } else {
                    enqueueSnackbar(response.data.message || "Update Failed", { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            } else {
                let response = await api.post("/areaCreate", {
                    reg_name: selRegion,
                    state_name: selState,
                    area_name: areaName
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    setSelRegion("0")
                    setSelState("0")
                    setAreaName("")
                    fetchArea()
                    setTabValue(1)
                } else {
                    enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            }
        } catch (err) {
            console.log(err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        } finally {
            closeConfirmationDialog()
        }
    }

    const handleDelete = async (id) => {
        try {
            let response = await api.post("/areaDelete", { id })
            enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            fetchArea()
        } catch (err) {
            console.log("deleteArea error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        } finally {
            closeConfirmationDialog()
        }
    }

    const handleEdit = (editAreaId) => {
        navigate(`/masters/area_mas/${btoa(editAreaId)}`)
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
                <>
                    <IconButton size="small" onClick={() => handleEdit(row.row.id)}
                        sx={{ ml: 0.5, backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => showDeleteConfirmation(row.row.id)}
                        sx={{ ml: 2, backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '14px' }} />
                    </IconButton>
                </>
            )
        }
    ]

    return (
        <Layout>
            <PageHeader title="Area" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: '60%' }}>
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
                        <FormControl>
                            <InputLabel id="reg_name">Region Name</InputLabel>
                            <Select value={selRegion} labelId="reg_name" label="Region Name"
                                onChange={(e) => setSelRegion(e.target.value)} size="small" error={regionError}>
                                <MenuItem value="0">Select Region</MenuItem>
                                {allRegion.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.reg_name}</MenuItem>
                                ))}
                            </Select>
                            {regionError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>Region Name is required.</Typography>}
                        </FormControl>
                        <FormControl>
                            <InputLabel id="state_name">State Name</InputLabel>
                            <Select value={selState} onChange={(e) => setSelState(e.target.value)}
                                labelId="state_name" label="State Name" size="small" error={stateError}>
                                <MenuItem value="0">Select State</MenuItem>
                                {allState.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.state_name}</MenuItem>
                                ))}
                            </Select>
                            {stateError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>State Name is required.</Typography>}
                        </FormControl>
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
                loading={confirmationDialog.loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}