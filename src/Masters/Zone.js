import { useState, useEffect, useCallback } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton } from "@mui/material";
import DataTable from "../utils/dataTable";
import api from "../services/api";
import { useSnackbar } from "notistack";
import { FaPencilAlt} from "react-icons/fa";
import { LiaTrashAltSolid } from "react-icons/lia";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../utils/PageHeader";
import ConfirmationDialog from "../utils/confirmDialog";

export default function Zone() {
    const [zoneName, setZoneName] = useState("")
    const [hdnZoneName,setHdnZoneName]=useState("")
    const [zoneError, setZoneError] = useState(false)
    const [zoneErrorMsg, setZoneErrorMsg] = useState("Zone Name is Required")
    const [zoneList, setZoneList] = useState([])
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [addLoading,setAddLoading]=useState(false)
    const [tabValue, setTabValue] = useState(1)
    const { editZoneid } = useParams()
    const decodedEditZoneid = editZoneid !== undefined && editZoneid !== null ? Number(atob(editZoneid)) : null
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    useEffect(() => {
        fetchZones()
    }, [])

    useEffect(() => {
        if (!decodedEditZoneid){
            setZoneName("")
            setTabValue(1)
            setHdnZoneName("")
            return
        } 
        collectEditData(decodedEditZoneid)
    }, [decodedEditZoneid])

    const fetchZones = async () => {
        try {
            let response = await api.post("/read_zone", { zone_id: null })
            const dataWithSiNo = response.data.data.map((item, index) => ({
                ...item,
                si_no: index + 1
            }))
            console.log("all zonedata", dataWithSiNo)
            setZoneList(dataWithSiNo)
        } catch (err) {
            console.log("fetchZones error", err)
        } finally {
            setLoading(false)
        }
    }

    const validateZone = () => {
        if (!zoneName || zoneName.trim() === "") {
            setZoneError(true)
            setZoneErrorMsg("Zone Name is Required")
            return false
        }
        if (zoneName.trim().length < 3) {
            setZoneError(true)
            setZoneErrorMsg("Zone Name must be at least 3 characters")
            return false
        }
        const specialChar = /[^a-zA-Z0-9 ]/
        if (specialChar.test(zoneName)) {
            setZoneError(true)
            setZoneErrorMsg("Special Characters Not Allowed")
            return false
        }
        return true
    }

    const handleAddZone = async () => {
        try {
            setAddLoading(true)
            setZoneError(false)
            if (!validateZone()) return

            if (decodedEditZoneid) {
                let check=1;
                if(hdnZoneName.toLowerCase()===zoneName.toLowerCase()){
                    check=0
                }
                let response = await api.post("/updateZone", { id: editId, newZone: zoneName.trim(),check:check })
                if(response.data.success){
                enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                navigate('/masters/zone_mas')
                setTabValue(1)
                setZoneName("")
           
                 }
                else{
                enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                 }
                setEditId(null)
            } else {
                let response = await api.post("/addZone", { newZone: zoneName.trim() })
                if(response.data.success){
                enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                navigate('/masters/zone_mas')
                setTabValue(1)
                setZoneName("")
           
                }
                else{
                enqueueSnackbar(response.data.message, { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
               }
            }
          
            fetchZones()
           
        } catch (err) {
            console.log("addzone error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
        finally{
            setAddLoading(false)
            closeConfirmationDialog()
        }
    }

    const collectEditData = async (zoneid) => {
        try {
            let response = await api.post("/read_zone", { zone_id: zoneid })
            let data = response.data.data[0]
            setEditId(zoneid)           // ✅ added
            setZoneName(data.zone_name)
            setHdnZoneName(data.zone_name)
            setZoneError(false)
            setTabValue(0)
        } catch (err) {
            console.log(err)
        }
    }

    const handleEdit = async (zoneId) => {
        try {
            navigate(`/masters/zone_mas/${btoa(zoneId)}`)
        }
        catch (err) {
            console.log("Editzone error", err)
        }
    }

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true,
            loading:addLoading
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
            loading: false
        });
    };

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedEditZoneid?"Edit":"Add"} Zone`,
            message:`Are you sure you want to ${decodedEditZoneid?"Edit":"Add"} this Zone?`,
            confirmText: decodedEditZoneid?"Update":"Add",
            confirmColor: "primary",
            onConfirm: () => handleAddZone()
        });
    };

    const showDeleteConfirmation=(id)=>{
          showConfirmationDialog({
            title: `Confirmation`,
            message:`Are you sure you want to delete this record?`,
            confirmText: "OK",
            cancelText:"Close",
            confirmColor: "primary",
            onConfirm: () => handleDelete(id)
        });
    }

    const handleDelete = async (id) => {
        try {
            let response = await api.post("/deleteZone", { id })
            enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            fetchZones()
        } catch (err) {
            console.log("deleteZone error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
        finally{
            closeConfirmationDialog()
        }
    }


    const columns = [
        {
            field: "si_no",
            headerName: "#",
            filterable: true,
            sortable: true,
        },
        {
            field: "zone_name",
            headerName: "Zone Name",
            filterable: true,
            sortable: true,
        },
        {
            field: "action",
            headerName: "Action",
            filterable: false,
            renderCell: (row) => (
                 <Box sx={{display:'flex',flexDirection:{xs:'column',md:'row'},gap:1}}>
                    {/* Edit Button */}
                    <IconButton
                        size="small"
                        onClick={() => handleEdit(row.row.id)}
                    >
                        <FaPencilAlt style={{color:'green',fontSize: '14.5px' }} />
                    </IconButton>

                    {/* Delete Button */}
                    <IconButton
                        size="small"
                        onClick={() => showDeleteConfirmation(row.row.id)}
                    >
                        <LiaTrashAltSolid style={{color:'red', fontSize: '17.5px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    return (
        <Layout>
            <PageHeader
                title="Zone"
            />
            <Box sx={{ backgroundColor: 'white', mt: 2, ml: 2, borderRadius: '6px', minHeight: '30vh', width: {lg:'60%',md:'80%',sm:'90%',xs:'90%'} }}>
                {/* Tabs */}
                {!decodedEditZoneid ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt:3, color: '#212121', fontSize: '18px' }}>Edit Zone Details</Typography>
                }

                {/* ADD NEW TAB */}
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Zone Name"
                            value={zoneName}
                            required
                            onChange={(e) => {
                                setZoneName(e.target.value)
                                if (zoneError) setZoneError(false)
                            }}
                            size="small"
                            error={!!zoneError}
                            helperText={zoneError ? zoneErrorMsg : ""}
                        />
                        <Button
                            sx={{ ml: 1, width: '2rem' }}
                            variant="contained"
                            onClick={()=>{
                                if(validateZone()){
                                 showSubmitConfirmation()
                                }
                                else{
                                    return
                                }
                                }}
                        >
                            {editId ? "Update" : "Submit"}
                        </Button>
                    </Box>
                )}

                {/* VIEW LIST TAB */}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable
                            columns={columns}
                            data={zoneList}
                            loading={loading}
                        />
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