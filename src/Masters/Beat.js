import { useState, useEffect } from "react";
import Layout from "../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Select, InputLabel, MenuItem, FormControl
} from "@mui/material";
import api from "../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../utils/PageHeader";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";

export default function Beat() {

    const { editBeatId } = useParams()
    const decodedEditBeatId = editBeatId !== undefined && editBeatId !== null ? Number(atob(editBeatId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selTerritory, setSelTerritory] = useState("0")
    const [beatName, setBeatName] = useState("")
    const [hdnBeatName, setHdnBeatName] = useState("")
    const [allTerritory, setAllTerritory] = useState([])
    const [allBeatData, setAllBeatData] = useState([])
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [territoryError, setTerritoryError] = useState(false)
    const [beatError, setBeatError] = useState(false)
    const [userType, setUserType] = useState(null)
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchAllBeat()
        fetchAllTerritory()
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("session-token");
        if (token) {
            try {
                let decoded = jwtDecode(token)
                setUserType(decoded.user_type)
                console.log(decoded.user_type)
            }
            catch (err) {
                console.log(err)
            }
        }
    }, [])

    useEffect(() => {
        if (!decodedEditBeatId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditBeatId)
    }, [decodedEditBeatId])

    const resetFields = () => {
        setSelTerritory("0")
        setBeatName("")
        setHdnBeatName("")
        setTerritoryError(false)
        setBeatError(false)
    }

    const fetchAllBeat = async () => {
        try {
            let response = await api.post("/readBeat", { beat_id: null, ter_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllBeatData(data.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("fetchAllBeat error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllTerritory = async () => {
        try {
            let response = await api.post("/readTerritory", { ter_id: null, area_id: null })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerritory(data)
        } catch (err) {
            console.log("fetchAllTerritory error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readBeat", { beat_id: id, ter_id: null })
            let data = response.data.data[0]
            setSelTerritory(data.ter_id)
            setBeatName(data.beat_name)
            setHdnBeatName(data.beat_name)
            setTerritoryError(false)
            setBeatError(false)
            setTabValue(0)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateBeatFields = () => {
        let isValid = true
        setTerritoryError(false)
        setBeatError(false)

        if (selTerritory == 0) { setTerritoryError(true); isValid = false }
        if (!beatName || beatName.trim() === "") { setBeatError(true); isValid = false }

        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedEditBeatId) {
                let check = 1
                if (hdnBeatName.toLowerCase() === beatName.toLowerCase()) {
                    check = 0
                }
                let response = await api.post("/beatMasUpdate", {
                    id: decodedEditBeatId,
                    beat_name: beatName,
                    ter_id: selTerritory,
                    check: check
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    fetchAllBeat()
                    navigate('/masters/beat_mas')
                } else {
                    enqueueSnackbar(response.data.message || "Update Failed", { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                }
            } else {
                let response = await api.post("/beatMasCreate", {
                    beat_name: beatName,
                    ter_id: selTerritory
                })
                if (response.data.success) {
                    enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                    resetFields()
                    fetchAllBeat()
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
        navigate(`/masters/beat_mas/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        try {
            let response = await api.post("/deleteBeat", { id })
            enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            fetchAllBeat()
        } catch (err) {
            console.log("deleteBeat error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        } finally {
            closeConfirmationDialog()
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
            title: `${decodedEditBeatId ? "Edit" : "Add"} Beat`,
            message: `Are you sure you want to ${decodedEditBeatId ? "Edit" : "Add"} this Beat?`,
            confirmText: decodedEditBeatId ? "Update" : "Add",
            confirmColor: "primary",
            loading: modifyLoading,
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
        { field: "ter_name", headerName: "Territory Name", filterable: true, sortable: true },
        { field: "beat_name", headerName: "Beat Name", filterable: true, sortable: true },
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
            <PageHeader title="Beat" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedEditBeatId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Beat Details</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                        <FormControl>
                            <InputLabel id="area_name">Area Name</InputLabel>
                            <Select>
                                <MenuItem>Select Area</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl>
                            <InputLabel id="territory">Territory Name</InputLabel>
                            <Select value={selTerritory} labelId="territory" label="Territory Name"
                                onChange={(e) => setSelTerritory(e.target.value)} size="small" error={territoryError}>
                                <MenuItem value="0">Select Territory</MenuItem>
                                {allTerritory.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.ter_name}</MenuItem>
                                ))}
                            </Select>
                            {territoryError && <Typography sx={{ fontSize: '9px', color: '#D32F2F', ml: 1.7 }}>Territory Name is required.</Typography>}
                        </FormControl>
                        <TextField label="Beat Name" size="small" value={beatName}
                            onChange={(e) => {
                                setBeatName(e.target.value)
                                if (beatError) setBeatError(false)
                            }}
                            error={!!beatError}
                            helperText={beatError ? "Beat Name is required." : ""}
                        />
                        <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateBeatFields()) showSubmitConfirmation() }}>
                            {decodedEditBeatId ? "Update" : "Create"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allBeatData} loading={loading} showHeader={false} />
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