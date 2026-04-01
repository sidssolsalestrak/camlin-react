import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../../utils/PageHeader";
import {
    TextField, Box, Typography, Button, Tabs, Tab, IconButton, FormControl, Checkbox,
    ListItemText, FormControlLabel, Autocomplete,MenuItem
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import './AdminPanel.css'

export default function MenuMaster() {

    const { menuId } = useParams()
    const decodedmenuId = menuId !== undefined && menuId !== null ? Number(atob(menuId)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(1)
    const [loading, setLoading] = useState(true)
    const [allMenuData, setAllMenuData] = useState([])
    const [allUserInputData, setAllUserInputData] = useState([])
    const [repData, setRepData] = useState([])
    const [selUserInputData, setSelUserInputData] = useState(null)   // ← null instead of "0"
    const [selRepData, setSelRepData] = useState([])
    const [selUserMasName, setSelUserMasName] = useState("")
    const [userTypeErr, setUserTypeErr] = useState(false)
    const [menuCheckErr, setMenuCheckErr] = useState(false)
    const [modifyLoading, setModifyLoading] = useState(false)

    useEffect(() => {
        fetchMenuData()
        fetchMenuInputFieldData()
    }, [])

    useEffect(() => {
        if (!decodedmenuId) {
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedmenuId)
    }, [decodedmenuId])


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
            title: `${decodedmenuId ? "Edit" : "Add"} Menu Master`,
            message: !decodedmenuId
                ? `Are you sure ? If Data for ${selUserMasName} exist, it will be overridden..!`
                : `Are you sure want to edit this Menu`,
            confirmText: decodedmenuId ? "Update" : "Add",
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
        setSelRepData([])
        setSelUserInputData(null)   // ← reset to null
    }

    const validateFields = () => {
        let isValid = true
        setMenuCheckErr(false)
        setUserTypeErr(false)
        if (!selUserInputData || Number(selUserInputData.id)===0) {       // ← check null/falsy
            setUserTypeErr(true)
            isValid = false
        }
        if(!isValid){
           enqueueSnackbar("Please fix all mandatory fields",{variant:'error',anchorOrigin:{vertical:'top',horizontal:'center'}})
           return isValid
        }
        if (selRepData.length === 0) {
            enqueueSnackbar("Please Select atleast one Menu option !", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            setMenuCheckErr(true)
            isValid = false
        }
        return isValid
    }

    const fetchMenuData = async () => {
        setLoading(true)
        try {
            let response = await api.post("/readMenuData")
            let menudata = Array.isArray(response.data.data) ? response.data.data : []
            setAllMenuData(menudata.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("fetch menu Data Error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchMenuInputFieldData = async () => {
        try {
            let response = await api.post("/menuInputfieldData")
            let userinputdata = Array.isArray(response.data.userresdata) ? response.data.userresdata : []
            let repdatares = Array.isArray(response.data.repData) ? response.data.repData : []
            setAllUserInputData(userinputdata)
            setRepData(repdatares)
        } catch (err) {
            console.log("Fetch Input field error", err)
        }
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

    const handleEdit = (userId) => {
        navigate(`/masters/menuMaster/${btoa(userId)}`)
    }

    const handleSubmit = async () => {
        setModifyLoading(true)
        try {
            let repStr = selRepData.join(",")
            let addPayLoad = {
                userInputType: selUserInputData?.id,   // ← use .id from the object
                menu_mode: repStr
            }
            let response = await api.post("/menuMasterCreate", addPayLoad)
            if (response.data.success) {
                enqueueSnackbar(decodedmenuId ? "Menu Updated successfully" : response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                if (decodedmenuId) {
                    fetchMenuData()
                    navigate("/masters/menuMaster")
                } else {
                    fetchMenuData()
                    resetFields()
                    setTabValue(1)
                }
            } else {
                enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
        } catch (err) {
            console.log(err)
        } finally {
            closeConfirmationDialog()
            setModifyLoading(false)
        }
    }

    const collectEditData = async (userid) => {
        try {
            let response = await api.post("/getMenuMasEditData", { uid: userid })
            let data = response.data.data

            // ← find the matching object for Autocomplete value
            const matchedUser = allUserInputData.find(u => u.id === data[0].user_type) || null
            setSelUserInputData(matchedUser)

            let repeditdata = data[0].menu_id.split(',')
            let repnumberdata = repeditdata.map((val) => Number(val))
            setSelRepData(repnumberdata || [])
            setTabValue(0)
        } catch (err) {
            console.log("collect Edit Data err", err)
        }
    }

    const handleDelete = async (userId) => {
        setModifyLoading(true)
        try {
            let response = await api.post("/deleteMenu", { uid: userId })
            if (response.data.success) {
                enqueueSnackbar("Deleted Successfully", { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                fetchMenuData()
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
            <PageHeader title="Menu Master" url="/masters/menuMaster" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedmenuId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Menu Master</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                        {/* ✅ Autocomplete replacing Select */}
                        <Autocomplete
                            options={[{ id: "0", client_alias: "Select User Type" }, ...allUserInputData]}
                            getOptionLabel={(option) => option.client_alias || ""}
                            value={selUserInputData}
                            onChange={(e, newValue) => {
                                setSelUserInputData(newValue)
                                setSelUserMasName(newValue?.client_alias || "")
                                setUserTypeErr(false)
                            }}
                            readOnly={!!decodedmenuId}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="User Type"
                                    size="small"
                                    error={userTypeErr}
                                    required
                                    helperText={userTypeErr ? "User Type not Selected !" : ""}
                                    sx={{ backgroundColor: decodedmenuId ? '#EEEEEE' : undefined }}
                                />
                            )}
                        />

                        <FormControl size="small">
                            <Typography sx={{ mb: 1 }}>Menu's*</Typography>
                            {repData.map((val) => (
                                <MenuItem key={val.id} value={val.id}
                                    sx={{ p: 0, mt: '-0.8rem' }}
                                    onClick={() => {
                                        setSelRepData((prev) =>
                                            prev.includes(val.id)
                                                ? prev.filter((id) => id !== val.id)
                                                : [...prev, val.id]
                                        )
                                    }}
                                >
                                    <Checkbox checked={selRepData.includes(val.id)} />
                                    <ListItemText primary={val.title} />
                                </MenuItem>
                            ))}
                        </FormControl>

                        <Button variant="contained" sx={{ width: '2rem', textTransform: 'none' }}
                            onClick={() => { if (validateFields()) showSubmitConfirmation() }}>
                            {decodedmenuId ? "Update" : "Submit"}
                        </Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allMenuData} loading={loading} />
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