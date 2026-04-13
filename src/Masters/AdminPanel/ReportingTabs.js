import { useState, useEffect } from "react";
import Layout from "../../layout";
import {
    TextField, Box, Typography, Button, Tabs, Tab, IconButton, Select, InputLabel, MenuItem, FormControl, Checkbox,
    ListItemText, Autocomplete
} from "@mui/material";
import api from "../../services/api";
import PageHeader from "../../utils/PageHeader";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";
import useToast from "../../utils/useToast";
import './AdminPanel.css'

export default function ReportingTabs() {

    const { userId, cusId } = useParams()
    const decodedUserId = userId !== undefined && userId !== null ? Number(atob(userId)) : null
    const decodedCusId = cusId !== undefined && cusId !== null ? Number(atob(cusId)) : null
    const toast = useToast()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(1)
    const [userType, setUserType] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState([])
    const [allAccType, setAllAccType] = useState([])
    const [allUsermasType, setAllUsermasType] = useState([])
    const [selUserMasType, setSelUserMasType] = useState(null)       // ← null for Autocomplete
    const [allRepInputData, setAllRepInputData] = useState([])
    const [selAccType, setSelAccType] = useState("0")
    const [selRepInputData, setSelRepInputData] = useState([])
    const [selUserMasName, setSelUserMasName] = useState("")
    const [userMasError, setUserMasError] = useState(false)
    const [accError, setAccError] = useState(false)
    // eslint-disable-next-line
    const [repInputError, setRepInputError] = useState(false)
    const location = useLocation()

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

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
        fetchReportData()
        fetchInputsReportData()
    }, [])

    useEffect(() => {
        if (!decodedUserId || !decodedCusId) {
            resetFields()
            setTabValue(1)
            return
        }
        if(allUsermasType.length===0) return
        collectEditData(decodedUserId, decodedCusId)
        // eslint-disable-next-line
    }, [decodedUserId, decodedCusId, allUsermasType])



    const resetFields = () => {
        setSelAccType("0")
        setSelRepInputData([])
        setSelUserMasType(null)        // ← reset to null
        setSelUserMasName("")
        setAccError(false)
        setUserMasError(false)
        setRepInputError(false)
    }

    const fetchReportData = async () => {
        setLoading(true)
        try {
            let response = await api.post("/getReportTabData")
            let reportData = Array.isArray(response.data.data) ? response.data.data : []
            setReportData(reportData.map((item, index) => ({ ...item, si_no: index + 1 })))
        } catch (err) {
            console.log("Fetching reports Data Error", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchInputsReportData = async () => {
        try {
            let response = await api.post("/getReportInputData")
            let userResData = Array.isArray(response.data.userRes) ? response.data.userRes : []
            let cusResData = Array.isArray(response.data.cusRes) ? response.data.cusRes : []
            let repResInputData = Array.isArray(response.data.repRes) ? response.data.repRes : []
            setAllUsermasType(userResData)
            setAllAccType(cusResData)
            setAllRepInputData(repResInputData)
        } catch (err) {
            console.log("fetch Input Data Error", err)
        }
    }

    const validateReportingFields = () => {
        let isValid = true
        setAccError(false)
        setUserMasError(false)
        setRepInputError(false)

        if (!selUserMasType || Number(selUserMasType.id) === 0) { setUserMasError(true); isValid = false }   // ← null check
        if (selAccType === "0") { setAccError(true); isValid = false }
        if (!isValid) {
            toast.error("Please fix all mandatory fields")
            return isValid
        }
        let replength = selRepInputData.length
        if (replength === 0 || replength < 0) {
            toast.success("Please Select atleast one Reporting Module !")
            setRepInputError(true)
            isValid = false
        }
        return isValid
    }

    const handleSubmit = async () => {
        try {
            let repStr = selRepInputData.join(",")
            let addPayload = {
                acc_type: selAccType,
                user_type: selUserMasType?.id,    // ← extract id from object
                rep_mode: repStr
            }
            let response = await api.post("/reportTabCreate", addPayload)
            if (response.data.success) {
                toast.success(decodedUserId ? "Reporting Tabs Updated successfully" : response.data.message)
                if (decodedUserId) {
                    fetchReportData()
                    navigate("/masters/repTabs")
                } else {
                    fetchReportData()
                    resetFields()
                    setTabValue(1)
                }
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log(err)
        } finally {
            closeConfirmationDialog()
        }
    }

    const handleEdit = (userId, cusId) => {
        setAccError(false)
        setUserMasError(false)
        navigate(`/masters/repTabs/${btoa(userId)}/${btoa(cusId)}`)
    }

    const collectEditData = async (userId, cusId) => {
        try {
            let payload = { uid: userId, cid: cusId }
            let response = await api.post("/getReportTabEditData", payload)
            let data = response.data.data

            // ← find matching object for Autocomplete
            const matchedUser = allUsermasType.find(u => u.id === data[0].user_type) || null
            setSelUserMasType(matchedUser)

            setSelAccType(data[0].cus_type || "0")
            let repeditdata = data[0].rep_form_id.split(',')
            let repnumberdata = repeditdata.map((val) => Number(val))
            setSelRepInputData(repnumberdata || [])
            setTabValue(0)
        } catch (err) {
            console.log(err)
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
            title: `${decodedUserId ? "Edit" : "Add"} Reporting tabs`,
            message: !decodedUserId ? `Are you sure ? If Data for ${selUserMasName} exist, it will be overridden..!` : `Are you sure want to edit this Reporting tabs`,
            confirmText: decodedUserId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const showDeleteConfirmation = (userId, cusId) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: "Are you sure you want to delete this record?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleDelete(userId, cusId)
        })
    }

    const handleDelete = async (userId, cusId) => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }))
            let payload = { user_id: userId, cus_type: cusId }
            let response = await api.post("/deleteReportTabs", payload)
            if (response.data.success) {
                toast.success("Deleted Successfully")
                fetchReportData()
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            console.log("Delete Error", err)
            toast.error("Something went wrong!")
        } finally {
            closeConfirmationDialog()
        }
    }

    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        { field: "user_name", headerName: "USER TYPE", filterable: true, sortable: true },
        { field: "cus_type_name", headerName: "CUSTOMER TYPE", filterable: true, sortable: true },
        {
            field: "action", headerName: "Action", filterable: false,
            renderCell: (row) => (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                    <IconButton size="small"
                        onClick={() => handleEdit(row.row.user_type, row.row.cus_type)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small"
                        onClick={() => showDeleteConfirmation(row.row.user_type, row.row.cus_type)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Master", path: location.pathname },
                { label: "Admin Panel", path:location.pathname },
                { label: "Reporting Tabs", path: location.pathname },
            ]}
        >
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Reporting Tabs</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    {!decodedUserId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                                <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                            </Tabs>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Reporting Tab</Typography>
                    }
                    {tabValue === 0 && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>

                            {/* ✅ User Type — Autocomplete */}
                            <Autocomplete
                                options={[{ id: "0", client_alias: "Select User Type" }, ...allUsermasType]}
                                getOptionLabel={(option) => option.client_alias || ""}
                                value={selUserMasType}
                                onChange={(e, newValue) => {
                                    setSelUserMasType(newValue)
                                    setSelUserMasName(newValue?.client_alias || "")
                                    setUserMasError(false)
                                }}
                                readOnly={!!decodedUserId}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="User Type"
                                        size="small"
                                        required
                                        error={userMasError}
                                        helperText={userMasError ? "User Type not Selected !" : ""}
                                        sx={{ backgroundColor: decodedUserId ? '#EEEEEE' : undefined }}
                                    />
                                )}
                            />

                            {/* ✅ Account Type — Select unchanged, fixed height added */}
                            <FormControl>
                                <InputLabel id="cus_label">Account Type*</InputLabel>
                                <Select
                                    labelId="cus_label"
                                    label="Account Type*"
                                    size="small"
                                    onChange={(e) => setSelAccType(e.target.value)}
                                    inputProps={{ readOnly: decodedUserId ? true : false }}
                                    sx={{ backgroundColor: decodedUserId ? '#EEEEEE' : null }}
                                    value={selAccType}
                                    error={accError}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: '200px',   // ← fixes the dropdown popup height
                                                overflowY: 'auto'
                                            }
                                        }
                                    }}
                                >
                                    <MenuItem value="0">Select Account Type</MenuItem>
                                    {allAccType.map((val) => (
                                        <MenuItem key={val.id} value={val.id}>{val.cus_type_name}</MenuItem>
                                    ))}
                                </Select>
                                {accError ? <Typography className="selError">Account Type not Selected !</Typography> : null}
                            </FormControl>

                            <FormControl size="small">
                                <Typography sx={{ mb: 1 }}>Reporting Module*</Typography>
                                {allRepInputData.map((val) => (
                                    <MenuItem
                                        key={val.id}
                                        value={val.id}
                                        sx={{ p: 0, mt: '-0.8rem' }}
                                        onClick={() => {
                                            setSelRepInputData((prev) =>
                                                prev.includes(val.Id)
                                                    ? prev.filter((Id) => Id !== val.Id)
                                                    : [...prev, val.Id]
                                            )
                                        }}
                                    >
                                        <Checkbox checked={selRepInputData.includes(val.Id)} />
                                        <ListItemText primary={val.d_name} />
                                    </MenuItem>
                                ))}
                            </FormControl>

                            <Button onClick={() => {
                                if (validateReportingFields()) showSubmitConfirmation()
                            }} variant="contained" sx={{ width: '2rem', textTransform: 'none', mb: 3 }}>
                                {decodedUserId ? "Update" : "Submit"}
                            </Button>
                        </Box>
                    )}

                    {tabValue === 1 && (
                        <Box sx={{ p: 3 }}>
                            <DataTable columns={columns} data={reportData} loading={loading} />
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
            </Box>
        </Layout>
    )
}