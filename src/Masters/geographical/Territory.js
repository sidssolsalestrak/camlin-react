import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Select, InputLabel, MenuItem, FormControl
} from "@mui/material";
import api from "../../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../../utils/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";

export default function Territory() {

    const { editTeritoryId } = useParams()
    const decodedEditTerritoryId = editTeritoryId !== undefined && editTeritoryId !== null ? Number(atob(editTeritoryId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()
    const [userType, setUserType] = useState(null)
    const [tabValue, setTabValue] = useState(1)
    const [selArea, setSelArea] = useState("0")
    const [terName, setTerName] = useState("")
    const [hdnTerName, setHdnTerName] = useState("")
    const [allArea, setAllArea] = useState([])
    const [allTerData, setAllTerData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [areaError, setAreaError] = useState(false)
    const [terError, setTerError] = useState(false)
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchAllTerritory()
        fetchAllArea()
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
        if (!decodedEditTerritoryId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditTerritoryId)
    }, [decodedEditTerritoryId])

    const resetFields = () => {
        setSelArea("0")
        setTerName("")
        setHdnTerName("")
        setAreaError(false)
        setTerError(false)
    }

    const fetchAllTerritory = async () => {
        try {
            let response = await api.post("/readTerritory", { ter_id: null, area_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("fetchAllTerritory error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllArea = async () => {
        try {
            let response = await api.post("/read_area", { areaId: null, regId: null })
            let areaData = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(areaData)
        } catch (err) {
            console.log("fetchAllArea error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readTerritory", { ter_id: id, area_id: null })
            let data = response.data.data[0]
            setSelArea(data.area_id)
            setTerName(data.ter_name)
            setHdnTerName(data.ter_name)
            setAreaError(false)
            setTerError(false)
            setTabValue(0)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateTerritoryFields = () => {
        let isValid = true
        setAreaError(false)
        setTerError(false)

        if (selArea == 0) { setAreaError(true); isValid = false }
        if (!terName || terName.trim() === "") { setTerError(true); isValid = false }

        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedEditTerritoryId) {
                let check = hdnTerName.toLowerCase() === terName.toLowerCase() ? 0 : 1
                let response = await api.post("/terMasUpdate", {
                    id: decodedEditTerritoryId,
                    ter_name: terName,
                    area_id: selArea,
                    check: check
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    fetchAllTerritory()
                    navigate('/masters/ter_mas')
                } else {
                    enqueueSnackbar(response.data.message || "Update Failed", { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            } else {
                let response = await api.post("/terMasCreate", {
                    ter_name: terName,
                    areaId: selArea
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    resetFields()
                    fetchAllTerritory()
                    setTabValue(1)
                } else {
                    enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            }
        } catch (err) {
            console.log(err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        } finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = (id) => {
        navigate(`/masters/ter_mas/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteTerritory", { id })
            if (response.data.code === 1) {
                enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            } else {
                enqueueSnackbar(response.data.message, { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
            fetchAllTerritory()
        } catch (err) {
            console.log("deleteTerritory error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
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
            title: `${decodedEditTerritoryId ? "Edit" : "Add"} Territory`,
            message: `Are you sure you want to ${decodedEditTerritoryId ? "Edit" : "Add"} this Territory?`,
            confirmText: decodedEditTerritoryId ? "Update" : "Add",
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
        { field: "area", headerName: "AREA", filterable: true, sortable: true },
        { field: "ter_name", headerName: "TERRITORY", filterable: true, sortable: true },
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
            <PageHeader title="Territory" url="/masters/ter_mas" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedEditTerritoryId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Territory Details</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                        <FormControl>
                            <InputLabel id="area">Area Name</InputLabel>
                            <Select value={selArea} labelId="area" label="Area Name"
                                onChange={(e) => setSelArea(e.target.value)} size="small" error={areaError}>
                                <MenuItem value="0">Select Area</MenuItem>
                                {allArea.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.area_name}</MenuItem>
                                ))}
                            </Select>
                            {areaError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>Area Name is required.</Typography>}
                        </FormControl>
                        <TextField label="Territory Name" size="small" value={terName}
                            onChange={(e) => {
                                setTerName(e.target.value)
                                if (terError) setTerError(false)
                            }}
                            error={!!terError}
                            helperText={terError ? "Territory Name is required." : ""}
                        />
                        <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateTerritoryFields()) showSubmitConfirmation() }}>
                            {decodedEditTerritoryId ? "Update" : "Create"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allTerData} loading={loading} />
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