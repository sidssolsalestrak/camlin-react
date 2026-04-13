import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab,
    IconButton, Autocomplete
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

const DEFAULT_AREA = { id: "0", area_name: "Select Area" }
const DEFAULT_TERRITORY = { id: "0", ter_name: "Select Territory" }

export default function Beat() {

    const { editBeatId } = useParams()
    const decodedEditBeatId = editBeatId !== undefined && editBeatId !== null ? Number(atob(editBeatId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    const [tabValue, setTabValue] = useState(1)
    const [selTerritory, setSelTerritory] = useState("0")
    const [selArea, setSelArea] = useState("0")
    const [beatName, setBeatName] = useState("")
    const [hdnBeatName, setHdnBeatName] = useState("")
    const [allTerritory, setAllTerritory] = useState([])
    const [allBeatData, setAllBeatData] = useState([])
    const [allArea, setAllArea] = useState([])
    const [regId, setRegId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [modifyLoading, setModifyLoading] = useState(false)
    const [territoryError, setTerritoryError] = useState(false)
    const [beatError, setBeatError] = useState(false)
    const [userType, setUserType] = useState(null)
    const [isAreaChanged, setIsAreaChanged] = useState(false)
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    useEffect(() => {
        fetchAllBeat()
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
        fetchAllArea()
        // eslint-disable-next-line
    }, [regId])

    useEffect(() => {
        if (!isAreaChanged) return
        fetchAllTerritory(Number(selArea) !== 0 ? selArea : null)
        // eslint-disable-next-line
    }, [selArea])

    useEffect(() => {
        if (!decodedEditBeatId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedEditBeatId)
        // eslint-disable-next-line
    }, [decodedEditBeatId])

    const resetFields = () => {
        setSelTerritory("0")
        setBeatName("")
        setRegId(null)
        setSelArea("0")
        setHdnBeatName("")
        setAllTerritory([])
        setIsAreaChanged(false)
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

    const fetchAllTerritory = async (area_id) => {
        try {
            let response = await api.post("/getTerriTb", { ter_id: null, area_id: area_id })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerritory(data)
            setSelTerritory(data.length > 0 ? data[0].id : "0")
        } catch (err) {
            console.log("fetchAllTerritory error", err)
        }
    }

    const fetchAllArea = async () => {
        try {
            let response = await api.post("/getAreatb", { area_id: null, reg_id: regId })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllArea(data)
        } catch (err) {
            console.log("fetchAllArea error", err)
        }
    }

    const fetchTerritoriesForEdit = async (area_id) => {
        try {
            let response = await api.post("/getTerriTb", { ter_id: null, area_id: area_id })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            setAllTerritory(data)
        } catch (err) {
            console.log("fetchTerritoriesForEdit error", err)
        }
    }

    const collectEditData = async (id) => {
        try {
            let response = await api.post("/readBeat", { beat_id: id })
            let data = response.data.data[0]
            setRegId(data.reg_id)
            setSelArea(data.area_id)
            setBeatName(data.beat_name)
            setHdnBeatName(data.beat_name)
            setTerritoryError(false)
            setBeatError(false)
            setTabValue(0)
            await fetchTerritoriesForEdit(data.area_id)
            setSelTerritory(data.ter_id)
            setIsAreaChanged(false)
        } catch (err) {
            console.log("collectEditData error", err)
        }
    }

    const validateBeatFields = () => {
        let isValid = true
        setTerritoryError(false)
        setBeatError(false)
        if (Number(selTerritory)===0) { setTerritoryError(true); isValid = false }
        if (!beatName || beatName.trim() === "") { setBeatError(true); isValid = false }
        if (!isValid) {
            enqueueSnackbar("Please fix all mandatory fields", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            setModifyLoading(true)
            if (decodedEditBeatId) {
                let check = hdnBeatName.toLowerCase() === beatName.toLowerCase() ? 0 : 1
                let response = await api.post("/beatUpdate", {
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
                let response = await api.post("/beatCreate", {
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
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteBeat", { id })
            if (response.data.code === 1) {
                enqueueSnackbar(response.data.message, { variant: "success", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            } else {
                enqueueSnackbar(response.data.message, { variant: "error", anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
            fetchAllBeat()
        } catch (err) {
            console.log("deleteBeat error", err)
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
            title: `${decodedEditBeatId ? "Edit" : "Add"} Beat`,
            message: `Are you sure you want to ${decodedEditBeatId ? "Edit" : "Add"} this Beat?`,
            confirmText: decodedEditBeatId ? "Update" : "Add",
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

    // Area options: prepend "Select Area" only when not in edit mode (same as original MenuItem logic)
    const areaOptions = decodedEditBeatId
        ? allArea
        : [DEFAULT_AREA, ...allArea]

    // Territory options: always prepend "Select Territory" (same as original)
    const territoryOptions = [DEFAULT_TERRITORY, ...allTerritory]

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "ter_name", headerName: "Territory Name", filterable: true, sortable: true },
        { field: "beat_name", headerName: "Beat Name", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                    <IconButton size="small" onClick={() => handleEdit(row.row.beatID)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => showDeleteConfirmation(row.row.beatID)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    return (
        <Layout>
            <PageHeader title="Beat" url="/masters/beat_mas" />
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
                        <Autocomplete
                            options={areaOptions}
                            getOptionLabel={(option) => option.area_name || ""}
                            value={areaOptions.find((a) => a.id === selArea) }
                            onChange={(e, newVal) => {
                                const id = newVal ? newVal.id : ""
                                setSelArea(id)
                                setIsAreaChanged(true)
                            }}
                            disableClearable={!!decodedEditBeatId} 
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={(params) => (
                                <TextField {...params} label="Area Name" size="small" />
                            )}
                        />
                        <Autocomplete
                            options={territoryOptions}
                            getOptionLabel={(option) => option.ter_name || ""}
                            value={territoryOptions.find((t) => t.id === selTerritory)}
                            onChange={(e, newVal) => {
                                setSelTerritory(newVal ? newVal.id : "")
                                if (territoryError) setTerritoryError(false)
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Territory Name"
                                    size="small"
                                    error={territoryError}
                                    helperText={territoryError ? "Territory Name is required." : ""}
                                />
                            )}
                        />
                        <TextField
                            label="Beat Name"
                            size="small"
                            value={beatName}
                            onChange={(e) => {
                                setBeatName(e.target.value)
                                if (beatError) setBeatError(false)
                            }}
                            error={!!beatError}
                            helperText={beatError ? "Beat Name is required." : ""}
                        />
                        <Button
                            variant="contained"
                            sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateBeatFields()) showSubmitConfirmation() }}
                        >
                            {decodedEditBeatId ? "Update" : "Create"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allBeatData} loading={loading} />
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