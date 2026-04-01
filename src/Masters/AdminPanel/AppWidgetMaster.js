import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../../utils/PageHeader";
import {
    Box, Typography, Button, Tabs, Tab, IconButton, Checkbox,
    ListItemText, FormControlLabel, TextField, Autocomplete,MenuItem
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";
import './AdminPanel.css'

export default function AppWidgetMaster() {

    const { editwidgetId } = useParams()
    const decodedWidgetId = editwidgetId !== undefined && editwidgetId !== null ? Number(atob(editwidgetId)) : null
    const [tabValue, setTabValue] = useState(1)
    const [loading, setLoading] = useState(true)
    const [allWidgetData, setAllWidgetData] = useState([])
    const [allUserInputData, setAllUserInputData] = useState([])
    const [allWidgetMenu, setAllWidgetMenu] = useState([])
    const [selUserInput, setSelUserInput] = useState(null)           // ← null instead of "0"
    const [userMasName, setSelUserMasName] = useState("")
    const [selWidgetMenu, setSelWidgetMenu] = useState([])
    const [modifyLoading, setModifyLoading] = useState(false)
    const [userTypeErr, setUserTypeErr] = useState(false)
    const [menuCheckErr, setMenuCheckErr] = useState(false)
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    useEffect(() => {
        fetchAppWidgetData()
        fetchFieldWidgetData()
    }, [])

    useEffect(() => {
        if (!decodedWidgetId) {
            resetFields()
            setTabValue(1)
            return
        }
        if (allUserInputData.length > 0) {
            collectEditData(decodedWidgetId)
        }
    }, [decodedWidgetId, allUserInputData])


    const fetchAppWidgetData = async () => {
        setLoading(true)
        try {
            let response = await api.post("/readappWidgetData")
            let widgetRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllWidgetData(widgetRes.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchFieldWidgetData = async () => {
        try {
            let response = await api.post("/widgetInputData")
            let userInputData = Array.isArray(response.data.userResData) ? response.data.userResData : []
            let widgetResData = Array.isArray(response.data.widgetMenuRes) ? response.data.widgetMenuRes : []
            setAllUserInputData(userInputData)
            setAllWidgetMenu(widgetResData)
        } catch (err) {
            console.log(err)
        }
    }

    const validateFields = () => {
        let isValid = true
        setMenuCheckErr(false)
        setUserTypeErr(false)
        if (!selUserInput || Number(selUserInput)===0) {                                         // ← check null
            setUserTypeErr(true)
            isValid = false
        }
        if(!isValid){
           enqueueSnackbar("Please fix all mandatory fields",{variant:'error',anchorOrigin:{vertical:'top',horizontal:'center'}})
           return isValid
        }
        if (selWidgetMenu.length === 0) {
            enqueueSnackbar("Please Select atleast one Menu option !", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            setMenuCheckErr(true)
            isValid = false
        }
        return isValid
    }

    const handleSubmit = async () => {
        setModifyLoading(true)
        try {
            let menuStr = selWidgetMenu.join(',')
            let addPayload = {
                userInputType: selUserInput?.id,                     // ← use object's id
                widget_menu: menuStr
            }
            let response = await api.post("/appWidgetCreate", addPayload)
            if (response.data.success) {
                enqueueSnackbar(decodedWidgetId ? "App Widget Menu Updated successfully" : response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                if (decodedWidgetId) {
                    fetchAppWidgetData()
                    navigate("/masters/dashboardmaster")
                } else {
                    fetchAppWidgetData()
                    resetFields()
                    setTabValue(1)
                }
            }
            else{
                enqueueSnackbar(response.data.message,{variant:'error',anchorOrigin:{vertical:'top',horizontal:'center'}})
            }
        } catch (err) {
            console.log(err)
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    const handleEdit = (userId) => {
        navigate(`/masters/dashboardmaster/${btoa(userId)}`)
    }

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "user_name", headerName: "USER TYPE", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                    <IconButton size="small"
                        onClick={() => handleEdit(row.row.user_type)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small"
                        onClick={() => showDeleteConfirmation(row.row.user_type)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedWidgetId ? "Edit" : "Add"} App Widget Master`,
            message: !decodedWidgetId
                ? `Are you sure ? If Data for ${userMasName} exist, it will be overridden..!`
                : `Are you sure want to edit this Menu`,
            confirmText: decodedWidgetId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const showDeleteConfirmation = (userId) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: "Are you sure you want to delete this record?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleDelete(userId)
        })
    }

    const resetFields = () => {
        setSelWidgetMenu([])
        setSelUserInput(null)                                        // ← reset to null
    }

    const collectEditData = async (userId) => {
        try {
            let response = await api.post("/getEditappWidgetData", { uid: userId })
            let data = Array.isArray(response.data.data) ? response.data.data : []
            // Find the matching user object from allUserInputData for Autocomplete
            const matchedUser = allUserInputData.find(u => u.id === data[0].user_type) || null
            setSelUserInput(matchedUser)                             // ← set full object
            setSelUserMasName(matchedUser?.client_alias || "")
            let menuArrData = data[0].menu_id.split(',').map(Number)
            setSelWidgetMenu(menuArrData)
            setTabValue(0)
        } catch (err) {
            console.log(err)
        }
    }

    const handleDelete = async (userId) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteWidgetmenu", { uid: userId })
            if (response.data.success) {
                enqueueSnackbar("Deleted Successfully", { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                fetchAppWidgetData()
            } else {
                enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
        } catch (err) {
            console.log("Delete menu Error")
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    return (
        <Layout>
            <PageHeader title="App Widget Master" url="/masters/dashboardmaster" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedWidgetId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit App Widget</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                        {/* ✅ Autocomplete replaces Select */}
                        <Autocomplete
                            options={[{ id: "0", client_alias: "Select User Type" }, ...allUserInputData]}
                            getOptionLabel={(option) => option.client_alias || ""}
                            value={selUserInput}
                            readOnly={!!decodedWidgetId}
                            onChange={(e, newValue) => {
                                setSelUserInput(newValue)
                                setSelUserMasName(newValue?.client_alias || "")
                                setUserTypeErr(false)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="User Type*"
                                    size="small"
                                    error={userTypeErr}
                                    helperText={userTypeErr ? "User Type not Selected !" : ""}
                                    sx={{ backgroundColor: decodedWidgetId ? '#EEEEEE' : undefined }}
                                />
                            )}
                        />

                        <Box>
                            <Typography sx={{ mb: 1 }}>Menu's*</Typography>
                            {allWidgetMenu.map((val) => (
                                <MenuItem key={val.id} value={val.id}
                                    sx={{ p: 0, mt: '-0.9rem' }}
                                    onClick={() => {
                                        setSelWidgetMenu((prev) =>
                                            prev.includes(val.id)
                                                ? prev.filter((id) => id !== val.id)
                                                : [...prev, val.id]
                                        )
                                    }}
                                >
                                    <Checkbox checked={selWidgetMenu.includes(val.id)} />
                                    <ListItemText primary={val.dash_name} />
                                </MenuItem>
                            ))}
                        </Box>

                        <Button variant="contained" sx={{ width: '2rem' }} onClick={() => {
                            if (validateFields()) showSubmitConfirmation()
                        }}>
                            {decodedWidgetId ? "Update" : "Submit"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allWidgetData} loading={loading} />
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