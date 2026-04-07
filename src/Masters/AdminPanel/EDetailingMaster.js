import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import {
    Box, Typography, Button, Tabs, Tab, IconButton, FormControl, TextField, Select, MenuItem, InputLabel, Dialog, DialogTitle, DialogContent,
    Divider
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { FaPencilAlt } from "react-icons/fa";
import { LiaTrashAltSolid } from "react-icons/lia";
import { IoClose } from "react-icons/io5";
import ConfirmationDialog from "../../utils/confirmDialog";
import './AdminPanel.css'

export default function EDetailingMaster() {
    const { editEdetailing } = useParams()
    const [tabValue, setTabValue] = useState(1)
    const [allEdetailData, setEdetailData] = useState([])
    const [seldetData,setSelDetData]=useState(0)
    const [allSubData, setAllSubData] = useState([])
    const [allDetData,setAllDetData]=useState([])
    const [allBuisnessunit,setAllBuisnessUnit]=useState([])
    const [allBrand,setAllBrand]=useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const decodedEDetailId = editEdetailing !== undefined && editEdetailing !== null ? Number(atob(editEdetailing)) : null

    useEffect(() => {
        fetchEdetailerData()
         fetchEdetailerInputData()
    }, [])

    const fetchEdetailerData = async () => {
        try {
            let response = await api.post("/getEdetailData")
            let eDetailData = Array.isArray(response.data.data) ? response.data.data : []
            console.log("E detail Data", eDetailData)
            setEdetailData(eDetailData.map((val, index) => ({ ...val, sno: index + 1 })))
        }
        catch (err) {
            console.log(" fetch intial Data error", err)
        }
    }

    const fetchDataSubDialog = async (id) => {
        try {
            let payload = {
                id: id
            }
            let response = await api.post('/getDetedetailSub', payload)
            let subdataRes = Array.isArray(response.data.data) ? response.data.data : []
            console.log("all sub Data res", subdataRes)
            setAllSubData(subdataRes)
            setDialogOpen(true)
        }
        catch (err) {
            console.log("fetch sub Data Dailog", err)
        }
    }

    const fetchEdetailerInputData=async()=>{
        try{
            let response=await api.post("/getEdetailerInputData")
            console.log("Input field Data",response)
            let detailDataRes=Array.isArray(response.data.DetailData)?response.data.DetailData:[]
            setAllDetData(detailDataRes)
            let brandDataRes=Array.isArray(response.data.brandData)?response.data.brandData:[]
            setAllBrand(brandDataRes)
            let buisnessUnitres=Array.isArray(response.data.buisnessUnitData)?response.data.buisnessUnitData:[]
            setAllBuisnessUnit(buisnessUnitres)

        }
        catch(err){
            console.log("fetch Input field Data Error",err)
        }
    }

    const onClose = () => {
        setDialogOpen(false)
    }

    const columns = [
        { field: "sno", headerName: "SL_NO", filterable: true, sortable: true },
        {
            field: "doc_name", headerName: "Detailing type", filterable: true, sortable: true,
            renderCell: (params) => (
                <Typography className="extra-field" onClick={() => fetchDataSubDialog(params.row.id)}>{params.value}</Typography>
            )
        },
        { field: "bu_name", headerName: "Business Unit", filterable: true, sortable: true },
        { field: "su_name", headerName: "Brand", filterable: true, sortable: true },
        { field: "doc_title", headerName: "Title", filterable: true, sortable: true },
        { field: "doc_des", headerName: "Description", filterable: true, sortable: true },
        { field: "prod_map", headerName: "Mapped Product", filterable: true, sortable: true },
        { field: "file_path", headerName: "File Path", filterable: true, sortable: true },
        { field: "folder_name", headerName: "Folder Name", filterable: true, sortable: true },
        { field: "file_name", headerName: "File Name", filterable: true, sortable: true },
        {
            field: "med_stat", headerName: "Mer Stat", filterable: true, sortable: true,
            renderCell: (params) => <Typography>{Number(params.value) === 1 ? 'Yes' : 'No'}</Typography>
        },
        {
            field: "kam_stat", headerName: "Kam Stat", filterable: true, sortable: true,
            renderCell: (params) => <Typography>{Number(params.value) === 1 ? 'Yes' : 'No'}</Typography>
        },
        {
            field: "mer_stat", headerName: "Mer Stat", filterable: true, sortable: true,
            renderCell: (params) => <Typography>{Number(params.value) === 1 ? 'Yes' : 'No'}</Typography>
        },
        { field: "ord_id", headerName: "Order", filterable: true, sortable: true },
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

    const column1 = [
        { field: "sno", headerName: "SL_NO", filterable: true, sortable: true },
        { field: "det_id", headerName: "Sub Name", filterable: true, sortable: true },
        { field: "sub_img", headerName: "Preview Image", filterable: true, sortable: true },
        { field: "sub_img", headerName: "Preview Image", filterable: true, sortable: true },
        {
            field: "folder_name", headerName: "Folder Name", filterable: true, sortable: true,
            renderCell: (params) => (
                <Typography>
                    {params?.split('Detailings/')?.[1] ?? ''}
                </Typography>
            )
        },
        { field: "file_name", headerName: "File Name", filterable: true, sortable: true },
        { field: "ord_id", headerName: "Ordering", filterable: true, sortable: true },
        { field: "edit", headerName: "Edit", filterable: true, sortable: true, renderCell:(params)=>(
         <IconButton>
         <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
         </IconButton>   
        ) },
        { field: "delete", headerName: "Delete", filterable: true, sortable: true, renderCell:(params)=>(
            <IconButton>
            <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />   
            </IconButton>
        ) },
        
        

        





    ]

    return (
        <Layout>
            <PageHeader title="E Detailing Master" url="/masters/edetailing" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                {!decodedEDetailId ? (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1, minWidth: '90%', mr: 3 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label="VIEW LIST" />
                        </Tabs>
                    </Box>

                ) : null
                }
                {tabValue === 0 && (
                    <Box sx={{ml:5}}>
                    <FormControl sx={{mt:4,width:'30%'}}>
                    <InputLabel id='det_type'>Detailing Type</InputLabel>
                    <Select size="small" labelId="det_type" label="Detailing Type" >
                    <MenuItem value={0}>Select Type</MenuItem>
                    {allDetData.map((val)=>(
                        <MenuItem key={val.id}>{val.doc_name}</MenuItem>
                    ))}
                    </Select>
                    </FormControl>
                    </Box>
                )}
                {tabValue === 1 && (
                    <Box>
                        <DataTable
                            columns={columns}
                            data={allEdetailData}
                        />
                    </Box>
                )}
            </Box>
            <Dialog
                open={dialogOpen}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: { lg: '52%', xs: '350px', md: '70%', sm: '500px' },
                        maxWidth: '90vw',
                        margin: '0 auto',
                        position: 'absolute',
                        top: 30,

                    }
                }}
            >
                <DialogTitle className="eDetailDialogtitle">
                  <Typography sx={{fontSize:'13px'}}>Preview Detailing</Typography>
                  <IconButton onClick={()=>onClose()}> 
                    <IoClose size={18}  />
                  </IconButton>
                

                </DialogTitle>
                <Divider sx={{ mt: 0.8, mb: 2 }} />
                <Box>
                    <DataTable
                     columns={column1}
                     data={allSubData}
                     showHeader={false} pagination={false} />
                </Box>
                <Box sx={{display:'flex',justifyContent:'end',mr:2}}>
                <Button variant="contained" onClick={()=>onClose()} sx={{backgroundColor:'#F39C12',width:'2rem',mt:1,mb:2,textTransform:'none'}}>Close</Button>
                </Box>
            </Dialog>

        </Layout>

    )
}