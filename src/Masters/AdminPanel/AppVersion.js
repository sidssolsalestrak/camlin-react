import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import {
    Box, Typography, Button, Tabs, Tab, IconButton, FormControl,TextField, Select, MenuItem, InputLabel
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import './AdminPanel.css'

export default function AppVersion() {
    const { editappvid } = useParams()
    const decodedAppEditId = editappvid !== undefined && editappvid !== null ? Number(atob(editappvid)) : null
    const [tabValue, setTabValue] = useState(1)
    const [loading, setLoading] = useState(true)
    const [allAppData, setAllAppData] = useState([])
    const [selOs, setSelOs] = useState(1)
    const [appVersion,setAppVersion]=useState("")
    const [appBuild,setAppBuild]=useState("")
    const [apptypeErr,setAppTypeErr]=useState(false)
    const [buildTypeErr,setBuildTypeErr]=useState(false)
    const [versionTypeErr,setVersionTypeErr]=useState(false)
    const navigate=useNavigate()
    const toast=useToast()

    useEffect(() => {
        fetchAppversionData()
    }, [])

    useEffect(()=>{
        if(!decodedAppEditId){
            resetFields()
            setTabValue(1)
            return
        }
        collectEditData(decodedAppEditId)
    },[decodedAppEditId])


    const fetchAppversionData = async () => {
        setLoading(true)
        try {
            let response = await api.post("/readAppVersion")
            let appVersData = Array.isArray(response.data.data) ? response.data.data : []
            console.log("app version Data", appVersData)
            setAllAppData(appVersData.map((item, index) => ({ ...item, si_no: index + 1 })))

        }
        catch (err) {
            console.log(err)
        }
        finally {
            setLoading(false)
        }
    }

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

    const validateFields=()=>{
         let isValid = true
         setAppTypeErr(false)
         setBuildTypeErr(false)
         setVersionTypeErr(false)
         if(!selOs || selOs===0){
            setAppTypeErr(true)
            isValid=false
         }
         if(!appBuild || appBuild.trim()===""){
            setBuildTypeErr(true)
            isValid=false
         }
         if(!appVersion || appVersion.trim()===""){
            setVersionTypeErr(true)
            isValid=false
         }
         return isValid
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `${decodedAppEditId ? "Edit" : "Add"} App Version`,
            message:`Are you sure you want to ${decodedAppEditId ? "Edit" : "Add"} this App Version?` ,
            confirmText: decodedAppEditId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const  resetFields=()=>{
        setAppBuild("")
        setAppVersion("")
        setSelOs(1)
    }

    const  handleSubmit=async()=>{
            try{
                let Payload={
                    os_type:selOs,
                    appVersion:appVersion,
                    appBuild:appBuild
                }
                console.log("App version submit",Payload)
                let response=await api.post("/appVersionCreate",Payload)
                if(response.data.success){
                    toast.success(response.data.message)
                    if(decodedAppEditId){
                        fetchAppversionData() 
                        navigate('/masters/appversion')
                    }
                    else{
                       fetchAppversionData() 
                       resetFields()
                       setTabValue(1)
                    }
                }
                else{
                    toast.error(response.data.message)
                }


            }
            catch(err){
                console.log(err)
            }
            finally{
                closeConfirmationDialog()
            }
    }

    const handleEdit=(id)=>{
        navigate(`/masters/appversion/${btoa(id)}`)
    }

    const collectEditData=async(id)=>{
           try{
            let response=await api.post("/editAppVersionData",{id:id})
            console.log("Edit data",response)
            let versiondata=response.data.data[0].ver_code.split(' ')
            console.log("version Data in edit",versiondata[1],versiondata[4])
            setAppVersion(versiondata[1])
            setAppBuild(versiondata[4])
            setTabValue(0)
            setSelOs(response.data.data[0].app_type)
           }
           catch(err){
            console.log(err)
           }
    }


    const columns = [
        { field: "si_no", headerName: "#", filterable: true, sortable: true },
        {
            field: "si_no", headerName: "OS TYPE", filterable: true, sortable: true,
            renderCell: (row) => (
                <Typography>{row.row.app_type === 1 ? "Andriod" : row.row.app_type === 2 ? "IOS" : null}</Typography>
            )
        },
        { field: "ver_code", headerName: "APP VERSION", filterable: true, sortable: true },
        { field: "ver_name", headerName: "APP BUILD", filterable: true, sortable: true },
        {
            field: "ACTION", headerName: "ACTION", filterable: false,
            renderCell: (row) => (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1 }}>
                    <IconButton size="small"
                        onClick={() => handleEdit(row.row.id)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }




    ]
    console.log("App version",appVersion)

    return (
        <Layout>
            <PageHeader title="App Version" url="/masters/appversion" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedAppEditId ?
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem' }} label="VIEW LIST" />
                        </Tabs>
                    </Box> :
                    <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit App Version</Typography>
                }
                {tabValue === 0 && (
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, width: '90%' }}>
                        <FormControl>
                            <InputLabel id="os_label">OS*</InputLabel>
                            <Select labelId="os_label" label="OS*" size="small" value={selOs} onChange={(e) => setSelOs(e.target.value)}
                                  MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 200
                                        }
                                    }
                                }}>
                                <MenuItem value={1}>Android</MenuItem>
                                <MenuItem value={2}>IOS</MenuItem>
                            </Select>
                        {apptypeErr ? <Typography className="selError">OS not Selected !</Typography> : null}
                        
                        </FormControl>
                        <FormControl>
                            <TextField label="Version" value={appVersion} placeholder="App Version" size="small" required onChange={(e)=>setAppVersion(e.target.value)} error={!!versionTypeErr}
                             helperText={versionTypeErr?"The App version field is required":''} />
                        </FormControl>
                        <FormControl>
                            <TextField label="Build" value={appBuild} placeholder="Build" size="small" required onChange={(e)=>setAppBuild(e.target.value)} error={!!buildTypeErr}
                            helperText={buildTypeErr?"The App Build field is required.":''} />
                        </FormControl>
                        <Button onClick={()=>{
                            if(validateFields()){
                                showSubmitConfirmation()
                            }
                            else{
                               toast.error("Please Fix all mandotory fields")
                            }
                        }} variant="contained" sx={{ width: '2rem', textTransform: 'none',mb:3 }}>{decodedAppEditId ? "Update" : "Create"}</Button>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allAppData} loading={loading} />
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
                            // loading={modifyLoading}
                            confirmColor={confirmationDialog.confirmColor}
             />
        </Layout>
    )
}