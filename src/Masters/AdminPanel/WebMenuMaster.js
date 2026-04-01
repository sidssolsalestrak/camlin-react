import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import { useSnackbar } from "notistack";
import PageHeader from "../../utils/PageHeader";
import {
    Box, Typography, Button, Tabs, Tab, IconButton, FormControl,
    ListItemText, FormControlLabel, TextField, Select, MenuItem, InputLabel, Autocomplete
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { LiaTrashAltSolid } from "react-icons/lia";
import { FaPencilAlt } from "react-icons/fa";
import ConfirmationDialog from "../../utils/confirmDialog";
import { jwtDecode } from "jwt-decode";
import './AdminPanel.css'
import { CheckBox } from "@mui/icons-material";

export default function WebMenuMaster() {
    const { editwebmenuId } = useParams()
    const decodedWebMenuId = editwebmenuId !== undefined && editwebmenuId !== null ? Number(atob(editwebmenuId)) : null
    const [tabValue, setTabValue] = useState(1)
    const [allWebMenuData, setAllWebMenuData] = useState([])
    const [userInputData, setUserInputData] = useState([])
    const [allMenus, setAllMenus] = useState([])
    const [seluserInput,setSelUserInput]=useState(null)
    const [setUserName,setSelUserName]=useState("")
    const [userTypeErr,setUserTypeErr]=useState(false)
    const [selMenuItems,setSelMenuItem]=useState([])


    const [loading, setLoading] = useState(true)
    const { enqueueSnackbar } = useSnackbar()
    const navigate = useNavigate()

    useEffect(() => {
        fetchWebmenuData()
        fetchInputData()
    }, [])

    const fetchWebmenuData = async () => {
        try {
            let response = await api.post("/readWebMenuData")
            let webmenuresData = Array.isArray(response.data.data) ? response.data.data : []
            console.log("webMenuRes", webmenuresData)
            setAllWebMenuData(webmenuresData.map((item, index) => ({ ...item, si_no: index + 1 })))

        }
        catch (err) {
            console.log("web menu data error", err)
        }
    }

    const fetchInputData = async () => {
        try {
            let response = await api.post("/getWebMenuInputData")
            console.log("web menu input data", response)
            let userInputRes = Array.isArray(response.data.usrData) ? response.data.usrData : []
            let menuDatares = Array.isArray(response.data.repData) ? response.data.repData : []
            setAllMenus(menuDatares)
            setUserInputData(userInputRes)
        }
        catch (err) {
           console.log("webInput data res",err)
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
                        // onClick={() => handleEdit(row.row.user_type)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small"
                        // onClick={() => showDeleteConfirmation(row.row.user_type)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]
    console.log("all menus",allMenus)

    return (
        <Layout>
            <PageHeader title="Web Menu Master" url="/masters/webMenuMaster" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                {!decodedWebMenuId ?
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
                        <Autocomplete
                            options={[{ id: "0", client_alias: "Select User Type" }, ...userInputData]}
                            getOptionLabel={(option) => option.client_alias || ""}
                            value={seluserInput}
                            readOnly={!!decodedWebMenuId}
                            onChange={(e, newValue) => {
                                setSelUserInput(newValue)
                                setSelUserName(newValue?.client_alias || "")
                                setUserTypeErr(false)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="User Type*"
                                    size="small"
                                    error={userTypeErr}
                                    helperText={userTypeErr ? "User Type not Selected !" : ""}
                                    sx={{ backgroundColor: decodedWebMenuId ? '#EEEEEE' : undefined }}
                                />
                            )}
                        />
                         <Box>
                          <Typography sx={{ mb: 1 }}>Menu's*</Typography>
                          {allMenus.map((val)=>{
                            if((val.menu_url!=="#" && val.mas_id===0) || val.menu_url==="#"){
                                return (
                                    <MenuItem key={val.id} value={val.id}
                                      sx={{ p: 0,  }}
                                        onClick={() => {
                                            setSelMenuItem((prev) =>
                                                prev.includes(val.id)
                                                    ? prev.filter((id) => id !== val.id)
                                                    : [...prev, val.id]
                                            )
                                        }}>
                                    <CheckBox  checked={selMenuItems.includes(val.id)} />
                                    <ListItemText primary={val.menu_alias} />
                                    </MenuItem>
                                )
                            }
                            else{
                                return (
                                     <MenuItem key={val.id} value={val.id}
                                      sx={{ p: 0,ml:1,mt:0.1 }}
                                        onClick={() => {
                                            setSelMenuItem((prev) =>
                                                prev.includes(val.id)
                                                    ? prev.filter((id) => id !== val.id)
                                                    : [...prev, val.id]
                                            )
                                        }}>
                                    <CheckBox  checked={selMenuItems.includes(val.id)} />
                                    <ListItemText primary={val.menu_alias} />
                                    </MenuItem>
                                )
                            }
                          }
                          )}
                         </Box>
                    </Box>

                )}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable columns={columns} data={allWebMenuData} />
                    </Box>
                )}

            </Box>

        </Layout>
    )
}