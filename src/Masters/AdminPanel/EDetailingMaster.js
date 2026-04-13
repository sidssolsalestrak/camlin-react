import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import PageHeader from "../../utils/PageHeader";
import {
    Box, Typography, Button, Tabs, Tab, IconButton, FormControl, TextField, Select, MenuItem, InputLabel, Dialog, DialogTitle, DialogContent,
    Divider, Checkbox,
    Autocomplete, Grid
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
    const toast = useToast()
    const navigate = useNavigate()
    const [tabValue, setTabValue] = useState(1)
    const [allEdetailData, setEdetailData] = useState([])
    const [seldetData, setSelDetData] = useState(0)
    const [selBusinessunit, setSelBuisnessUnit] = useState([])
    const [selBrand, setSelBrand] = useState(null)
    const [allSubData, setAllSubData] = useState([])
    const [allDetData, setAllDetData] = useState([])
    const [allBuisnessunit, setAllBuisnessUnit] = useState([])
    const [allBrand, setAllBrand] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogsubDetopen, setDialogSubDetOpen] = useState(false)
    const [selProduct, setSelProduct] = useState([])
    const [selPageId, setSelPageId] = useState([])
    const [subId, setSubId] = useState(null)
    const [editId,setEditId]=useState(null)

    // NEW: separate state for dialog edit row
    const [editSubRow, setEditSubRow] = useState(null)

    const [edetailinputData, setEdetailInputData] = useState({
        title: '',
        desc: '',
        fileName: '',
        order: '',
        medStat: false,
        kamStat: false,
        merStat: false,
        filePathName: '',
        folderName: '',
        filePathId: 1
    })
    const [errors, setErrors] = useState({})
    const [subErrors, setSubErrors] = useState({})
    const [allPrdData, setAllPrdData] = useState([])
    const [subCatData, setSubCatData] = useState({
        subCatName: '',
        subFoldername: '',
        subFileName: '',
        subOrderNumber: '',
        subFile: null
    })
    const [modifyLoading, setmodifyLoading] = useState(false)
    const decodedEDetailId = editEdetailing !== undefined && editEdetailing !== null ? Number(atob(editEdetailing)) : null
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
            title: `${decodedEDetailId ? "Edit" : "Add"} E Detailing Master`,
            message: !decodedEDetailId ? `Are you sure you want to Save New E Detailing?` : `Are you sure you want to Update E Detailing??`,
            confirmText: decodedEDetailId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubmit()
        })
    }

    const showSubmitSubDetConfirm = () => {
        showConfirmationDialog({
            title: `${subId ? "Edit" : "Add"} E Detailing Sub`,
            message: !subId ? `Are you sure you want to Save New Sub E Detailing?` : `Are you sure you want to Update Sub E Detailing??`,
            confirmText: subId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => handleSubEdetailSubmit()
        })
    }

    const resetFields = () => {
        setSelDetData(0)
        setSelBuisnessUnit([])
        setSelBrand(null)
        setSelProduct([])
        setSelPageId([])
        setEdetailInputData({
            title: '',
            desc: '',
            fileName: '',
            order: '',
            medStat: false,
            kamStat: false,
            merStat: false,
            filePathName: '',
            folderName: '',
            filePathId: 1
        })
        setErrors({})
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

    const showDeleteSubConfirm = (subid) => {
        showConfirmationDialog({
            title: "Confirmation",
            message: "Are you sure you want to delete this record?",
            confirmText: "OK",
            cancelText: "Close",
            confirmColor: "primary",
            onConfirm: () => handleDeleteSub(subid)
        })
    }

    useEffect(() => {
        fetchEdetailerData()
        fetchEdetailerInputData()
    }, [])

    useEffect(() => {
        if (!decodedEDetailId) {
            setTabValue(1)
            resetFields()
            return
        }
        fetchDataSubDialog(decodedEDetailId)
        setTabValue(0)
        // eslint-disable-next-line
    }, [decodedEDetailId])

    useEffect(() => {
        if (
            !decodedEDetailId ||
            allBuisnessunit.length === 0 ||
            allBrand.length === 0 ||
            allPrdData.length === 0
        ) return

        collectEditData(decodedEDetailId)
        // eslint-disable-next-line
    }, [decodedEDetailId, allBuisnessunit, allBrand, allPrdData])

    const fetchEdetailerData = async () => {
        try {
            let response = await api.post("/getEdetailData")
            let eDetailData = Array.isArray(response.data.data) ? response.data.data : []
            setEdetailData(eDetailData.map((val, index) => ({ ...val, sno: index + 1 })))
        }
        catch (err) {
            console.log("fetch initial Data error", err)
        }
    }

    const fetchDataSubDialog = async (id) => {
        try {
            let payload = { id: id }
            let response = await api.post('/getDetedetailSub', payload)
            let subdataRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllSubData(subdataRes.map((val, index) => ({ ...val, sno: index + 1 })))
            if (!decodedEDetailId) {
                setDialogOpen(true)
            }
            console.log("fetch subData Dialog is running", id)
        }
        catch (err) {
            console.log("fetch sub Data Dialog", err)
        }
    }

    const fetchEdetailerInputData = async () => {
        try {
            let response = await api.post("/getEdetailerInputData")
            let detailDataRes = Array.isArray(response.data.DetailData) ? response.data.DetailData : []
            setAllDetData(detailDataRes)
            let brandDataRes = Array.isArray(response.data.brandData) ? response.data.brandData : []
            setAllBrand([{ id: 0, sub_name: 'Select brand' }, ...brandDataRes])
            let buisnessUnitres = Array.isArray(response.data.buisnessUnitData) ? response.data.buisnessUnitData : []
            setAllBuisnessUnit([{ id: 0, bu_name: 'Select Unit' }, ...buisnessUnitres])
            let prdDataRes = Array.isArray(response.data.prdData) ? response.data.prdData : []
            setAllPrdData([{ id: 0, prod_name: 'Select' }, ...prdDataRes])
        }
        catch (err) {
            console.log("fetch Input field Data Error", err)
        }
    }

    const onClose = () => {
        setDialogOpen(false)
    }

    const onCloseSubDet = () => {
        setDialogSubDetOpen(false)
        setEditSubRow(null)
        setSubId(null)
    }

    const validateFields = () => {
        let newErrors = {}
        if (!seldetData || seldetData === 0) newErrors.detailingType = true
        if (!selBusinessunit || selBusinessunit.length === 0) newErrors.businessUnit = true
        if (!edetailinputData.title || edetailinputData.title.trim() === '') newErrors.title = true
        if (!edetailinputData.desc || edetailinputData.desc.trim() === '') newErrors.desc = true
        if (!edetailinputData.fileName || edetailinputData.fileName.trim() === '') newErrors.fileName = true
        if (!edetailinputData.filePathName || edetailinputData.filePathName.trim() === '') newErrors.filePathName = true
        if (!edetailinputData.folderName || edetailinputData.folderName.trim() === '') newErrors.folderName = true
        if (!edetailinputData.order || Number(edetailinputData.order) === 0) newErrors.order = true
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateSubfields = () => {
        let newSubErrors = {}
        if (!subCatData.subCatName || subCatData.subCatName.trim() === '') newSubErrors.subCatName = true
        if (!subCatData.subFoldername || subCatData.subFoldername.trim() === '') newSubErrors.subFoldername = true
        if (!subCatData.subFileName || subCatData.subFileName.trim() === '') newSubErrors.subFileName = true
        if (!subCatData.subOrderNumber || subCatData.subOrderNumber === 0) newSubErrors.subOrderNumber = true
        setSubErrors(newSubErrors)
        return Object.keys(newSubErrors).length === 0
    }

    const validateDialogSubfields = () => {
        if (!editSubRow) return false
        let newSubErrors = {}
        if (!editSubRow.subCatName || editSubRow.subCatName.trim() === '') newSubErrors.subCatName = true
        if (!editSubRow.subFoldername || editSubRow.subFoldername.trim() === '') newSubErrors.subFoldername = true
        if (!editSubRow.subFileName || editSubRow.subFileName.trim() === '') newSubErrors.subFileName = true
        if (!editSubRow.subOrderNumber || editSubRow.subOrderNumber === 0) newSubErrors.subOrderNumber = true
        setSubErrors(newSubErrors)
        return Object.keys(newSubErrors).length === 0
    }

    const handleSubmit = async () => {
        setmodifyLoading(true)
        try {
            let mappedProduct = selProduct?.map((val) => val.id)
            let prodId = mappedProduct.join(',')
            let pageId = selPageId.join(',')

            let payload1 = {
                detid: seldetData,
                id: decodedEDetailId ? decodedEDetailId : 0,
                catid: selBusinessunit[0]?.id,
                subcatid: selBrand?.id || 0,
                title: edetailinputData.title,
                desc: edetailinputData.desc,
                prodid: prodId || '',
                filePath: edetailinputData.filePathName,
                folderName: edetailinputData.folderName,
                fileName: edetailinputData.fileName,
                ord_id: edetailinputData.order,
                medStat: edetailinputData.medStat ? 1 : 0,
                kamStat: edetailinputData.kamStat ? 1 : 0,
                merStat: edetailinputData.merStat ? 1 : 0,
                page_id: pageId || ''
            }

            let response = await api.post("/addEdetailer", payload1)
            if (response.data.success) {
                toast.success(response.data.message)
                if (decodedEDetailId) {
                    navigate(`/masters/edetailing/`)
                }
                fetchEdetailerData()
                setTabValue(1)
                resetFields()
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log("submission err", err)
        }
        finally {
            setmodifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleEdit = async (id) => {
        navigate(`/masters/edetailing/${btoa(id)}`)
    }

    const handleDelete = async (id) => {
        setmodifyLoading(true)
        try {
            let payload = { id: id, checkTable: "", checkData: "" }
            let response = await api.post("/deleteEdet", payload)
            if (response.data.success) {
                toast.success(response.data.message)
                fetchEdetailerData()
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log(err)
            toast.error("Something went wrong Try again!!")
        }
        finally {
            closeConfirmationDialog()
            setmodifyLoading(false)
        }
    }

    const handleDeleteSub = async (id) => {
        try {
            let payload = { detSubId: id }
            let response = await api.post("/deleteDetSub", payload)
            if (response.data.success) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
            fetchDataSubDialog(decodedEDetailId || id)
        }
        catch (err) {
            console.log(err)
            toast.error("Something went wrong Try again!!")
        }
        finally {
            closeConfirmationDialog()
        }
    }

    const handleSubEdetailSubmit = async () => {
        try {
            // Use editSubRow data if coming from dialog, else subCatData for inline form
            const dataToSubmit = dialogsubDetopen ? editSubRow : subCatData

            let payload = {
                subCatName: dataToSubmit.subCatName,
                subFoldername: dataToSubmit.subFoldername?.replace('Detailings/', '') || '',
                subFileName: dataToSubmit.subFileName,
                subOrderNumber: dataToSubmit.subOrderNumber,
                id: decodedEDetailId ? decodedEDetailId :editId?editId:0,
                sub_id: subId || 0
            }
            let response = await api.post("/addEdetSub", payload)
            if (response.data.success) {
                toast.success(response.data.message)
                // Refresh sub data after submit
                if (decodedEDetailId || editId) fetchDataSubDialog(decodedEDetailId || editId)
            } else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log(err)
            toast.error('Something went wrong try again!!')
        }
        finally {
            closeConfirmationDialog()
            // Close dialog and reset if submitted from dialog
            if (dialogsubDetopen) {
                setDialogSubDetOpen(false)
                setEditSubRow(null)
            }
            // Reset inline form
            setSubId(null)
            setSubCatData({
                subCatName: '',
                subFoldername: '',
                subFileName: '',
                subOrderNumber: '',
                subFile: null
            })
            setSubErrors({})
        }
    }

    // KEY FIX: Smart edit handler — decides behavior based on decodedEDetailId
    const handleSubEdit = (row) => {
        const subData = {
            subCatName: row.sub_name || '',
            subFoldername: row.folder_name || '',
            subFileName: row.file_name || '',
            subOrderNumber: row.ord_id || '',
            subFile: null
        }
        setSubId(row.id)

        if (decodedEDetailId) {
            // Inline edit: populate the inline form fields (subCatData)
            setSubCatData((val)=>({...subData, subFoldername:subData.subFoldername.replace('Detailings/', '') || ''}))
        } else {
            // Dialog view: open the edit dialog and populate editSubRow
            setEditSubRow((val)=>({...subData, subFoldername:subData.subFoldername.replace('Detailings/', '') || ''}))
            setDialogSubDetOpen(true)
        }
    }

    const collectEditData = async (id) => {
        try {
            let payload = { id: id }
            let response = await api.post("/getEditEdetailData", payload)
            const data = response.data.data[0]
            console.log("Edit data", data)

            setSelDetData(data.doc_type_id)

            const catIds = data.cat_id?.split(',').map(Number) || []
            const matchedBU = allBuisnessunit.filter(bu => catIds.includes(bu.id))
            setSelBuisnessUnit(matchedBU)

            const matchedBrand = allBrand.find(b => b.id === data.subcat_id) || null
            setSelBrand(matchedBrand)

            setEdetailInputData(prev => ({
                ...prev,
                title: data.doc_title || '',
                desc: data.doc_des || '',
                fileName: data.file_name || '',
                order: data.ord_id || '',
                medStat: Number(data.med_stat) === 1,
                kamStat: Number(data.kam_stat) === 1,
                merStat: Number(data.mer_stat) === 1,
                folderName: data.folder_name?.replace('Detailings/', '') || '',
                filePathId: 1,
                filePathName: data.file_name || '',
            }))

            if (data.prod_map) {
                const prodIds = data.prod_map.split(',').map(Number)
                const matchedProds = allPrdData.filter(p => prodIds.includes(p.id))
                setSelProduct(matchedProds)
            } else {
                setSelProduct([])
            }

            setTabValue(0)
        }
        catch (err) {
            console.log("collect Edit Data err", err)
        }
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
            field: "med_stat", headerName: "Med Stat", filterable: true, sortable: true,
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
                        onClick={() => handleEdit(row.row.id)}
                        sx={{ backgroundColor: '#3c8dbc', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#2a6f99' } }}>
                        <FaPencilAlt style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                    <IconButton size="small"
                        onClick={() => showDeleteConfirmation(row.row.id)}
                        sx={{ backgroundColor: '#dd4b39', borderRadius: '4px', padding: '6px', marginRight: '6px', '&:hover': { backgroundColor: '#c0392b' } }}>
                        <LiaTrashAltSolid style={{ color: 'white', fontSize: '13px' }} />
                    </IconButton>
                </Box>
            )
        }
    ]

    // column1 now uses handleSubEdit — smart routing handled inside the function
    const column1 = [
        { field: "sno", headerName: "SI", filterable: true, sortable: true },
        { field: "sub_name", headerName: "Sub Name", filterable: true, sortable: true },
        { field: "sub_img", headerName: "Preview Image", filterable: true, sortable: true },
        { field: "folder_name", headerName: "Folder Name", filterable: true, sortable: true },
        { field: "file_name", headerName: "File Name", filterable: true, sortable: true },
        { field: "ord_id", headerName: "Ordering", filterable: true, sortable: true },
        {
            field: "edit", headerName: "Edit", filterable: false, sortable: false,
            renderCell: (params) => (
                <IconButton onClick={() => {
                    setEditId(params.row.id)
                    handleSubEdit(params.row)
                    }}>
                    <FaPencilAlt style={{ color: 'green', fontSize: '13px' }} />
                </IconButton>
            )
        },
        {
            field: "delete", headerName: "Delete", filterable: false, sortable: false,
            renderCell: (params) => (
                <IconButton onClick={() => showDeleteSubConfirm(params.row.id)}>
                    <LiaTrashAltSolid style={{ color: 'red', fontSize: '13px' }} />
                </IconButton>
            )
        },
    ]

    console.log("subCat Data", subCatData)
    console.log("sub id ",subId)

    return (
        <Layout>
            <PageHeader title="E Detailing Master" url="/masters/edetailing" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                {!decodedEDetailId ? (
                    <Box sx={{ backgroundColor: 'white', borderBottom: 1, borderColor: 'divider', px: 3, mt: 1, minWidth: '90%', mr: 3 }}>
                        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label="ADD NEW" />
                            <Tab sx={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center', minWidth: '50%' }} label="VIEW LIST" />
                        </Tabs>
                    </Box>
                ) : null}

                {tabValue === 0 && (
                    <Box sx={{ ml: 5, display: 'flex', flexDirection: 'column', gap: 2, width: { lg: '40%', md: '60%', sm: '80%', xs: '85%' } }}>
                        <FormControl fullWidth sx={{ mt: 4 }} error={!!errors.detailingType}>
                            <InputLabel id='det_type'>Detailing Type *</InputLabel>
                            <Select
                                size="small"
                                labelId="det_type"
                                label="Detailing Type *"
                                onChange={(e) => {
                                    setSelDetData(e.target.value)
                                    setErrors(prev => ({ ...prev, detailingType: false }))
                                }}
                                value={seldetData}
                            >
                                <MenuItem value={0}>Select Type</MenuItem>
                                {allDetData.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.doc_name}</MenuItem>
                                ))}
                            </Select>
                            {errors.detailingType && (
                                <Typography sx={{ color: 'error.main', fontSize: '9px', mt: 0.5, ml: 2 }}>Detailing type is required</Typography>
                            )}
                        </FormControl>

                        <FormControl fullWidth error={!!errors.businessUnit}>
                            <Autocomplete
                                multiple
                                options={allBuisnessunit}
                                getOptionLabel={(option) => option.bu_name || ""}
                                getOptionKey={(option) => option.id}
                                value={selBusinessunit}
                                onChange={(e, newValue) => {
                                    setSelBuisnessUnit(newValue)
                                    setErrors(prev => ({ ...prev, businessUnit: false }))
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Business Unit *"
                                        size="small"
                                        error={!!errors.businessUnit}
                                        helperText={errors.businessUnit ? 'Select Atleast 1 Business Unit' : ''}
                                    />
                                )}
                            />
                        </FormControl>

                        <FormControl fullWidth>
                            <Autocomplete
                                options={allBrand}
                                getOptionLabel={(option) => option.sub_name || ""}
                                value={selBrand}
                                onChange={(e, newValue) => setSelBrand(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Brand" size="small" />
                                )}
                            />
                        </FormControl>

                        <TextField
                            label="Title *"
                            size="small"
                            error={!!errors.title}
                            value={edetailinputData.title}
                            helperText={errors.title ? 'Title is required' : ''}
                            onChange={(e) => {
                                setEdetailInputData(val => ({ ...val, title: e.target.value }))
                                setErrors(prev => ({ ...prev, title: false }))
                            }}
                        />

                        <TextField
                            label="Description *"
                            size="small"
                            error={!!errors.desc}
                            helperText={errors.desc ? 'Description is required' : ''}
                            value={edetailinputData.desc}
                            onChange={(e) => {
                                setEdetailInputData(val => ({ ...val, desc: e.target.value }))
                                setErrors(prev => ({ ...prev, desc: false }))
                            }}
                        />

                        {Number(seldetData) === 2 && (
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                                <FormControl sx={{ width: '60%' }} error={!!errors.mappedProduct}>
                                    <Autocomplete
                                        multiple
                                        options={allPrdData}
                                        getOptionLabel={(option) => option.prod_name || ""}
                                        getOptionKey={(option) => option.id}
                                        value={selProduct}
                                        onChange={(e, newValue) => {
                                            setSelProduct(newValue)
                                            setErrors(prev => ({ ...prev, mappedProduct: false }))
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Mapped Product *"
                                                size="small"
                                                error={!!errors.mappedProduct}
                                                helperText={errors.mappedProduct ? 'Mapped product is required' : ''}
                                            />
                                        )}
                                    />
                                </FormControl>
                                <FormControl sx={{ width: '35%' }} error={!!errors.pageId}>
                                    <InputLabel>Page ID *</InputLabel>
                                    <Select
                                        size="small"
                                        value={selPageId}
                                        label="Page ID *"
                                        multiple
                                        onChange={(e) => {
                                            setSelPageId(e.target.value)
                                            setErrors(prev => ({ ...prev, pageId: false }))
                                        }}
                                        MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                                    >
                                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                            <MenuItem key={num} value={num}>{num}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.pageId && (
                                        <Typography sx={{ color: 'error.main', fontSize: '9px', mt: 0.5, ml: 2 }}>Page ID is required</Typography>
                                    )}
                                </FormControl>
                            </Box>
                        )}

                        <Box sx={{ width: '100%' }}>
                            <FormControl sx={{ width: '50%' }}>
                                <InputLabel id='file_path'>File Path</InputLabel>
                                <Select
                                    size="small"
                                    labelId="file_path"
                                    label="File Path"
                                    value={edetailinputData.filePathId}
                                    onChange={(e) => setEdetailInputData(val => ({ ...val, filePathId: e.target.value }))}
                                >
                                    <MenuItem value={1}>https://biov3.s3.ap-south-1.amazonaws.com/assets/download/Edetailers/</MenuItem>
                                    <MenuItem value={2}>https://biov3.s3.ap-south-1.amazonaws.com/assets/download/Edetailers/</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ width: '50%' }}>
                                <TextField
                                    value={edetailinputData.filePathName}
                                    onChange={(e) => setEdetailInputData((val) => ({ ...val, filePathName: e.target.value }))}
                                    size="small"
                                    sx={{ ml: 1 }}
                                    error={!!errors.filePathName}
                                    helperText={errors.filePathName ? 'File Path is Required' : ''}
                                />
                            </FormControl>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '13px', alignSelf: 'center' }}>Detailings/</Typography>
                            <TextField
                                size="small"
                                fullWidth
                                label="Folder Name *"
                                value={edetailinputData.folderName}
                                error={!!errors.folderName}
                                helperText={errors.folderName ? 'Folder name is required' : ''}
                                onChange={(e) => {
                                    setEdetailInputData((val) => ({ ...val, folderName: e.target.value }))
                                    setErrors(prev => ({ ...prev, folderName: false }))
                                }}
                            />
                        </Box>

                        <TextField
                            label="File Name *"
                            value={edetailinputData.fileName}
                            size="small"
                            error={!!errors.fileName}
                            helperText={errors.fileName ? 'File name is required' : ''}
                            onChange={(e) => {
                                setEdetailInputData(val => ({ ...val, fileName: e.target.value }))
                                setErrors(prev => ({ ...prev, fileName: false }))
                            }}
                        />

                        <TextField
                            label="Order *"
                            value={edetailinputData.order}
                            size="small"
                            error={!!errors.order}
                            helperText={errors.order ? 'Order is required' : ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setEdetailInputData(val => ({ ...val, order: value }))
                                    setErrors(prev => ({ ...prev, order: false }))
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                            <Box className="checkboxRow">
                                <MenuItem>Med Stat</MenuItem>
                                <Checkbox
                                    checked={edetailinputData.medStat}
                                    onChange={() => setEdetailInputData(val => ({ ...val, medStat: !val.medStat }))}
                                />
                            </Box>
                            <Box className="checkboxRow">
                                <MenuItem>KAM Stat</MenuItem>
                                <Checkbox
                                    checked={edetailinputData.kamStat}
                                    onChange={() => setEdetailInputData(val => ({ ...val, kamStat: !val.kamStat }))}
                                />
                            </Box>
                            <Box className="checkboxRow">
                                <MenuItem>MER Stat</MenuItem>
                                <Checkbox
                                    checked={edetailinputData.merStat}
                                    onChange={() => setEdetailInputData(val => ({ ...val, merStat: !val.merStat }))}
                                />
                            </Box>
                        </Box>

                        <Button
                            variant="contained"
                            onClick={() => {
                                if (validateFields()) {
                                    showSubmitConfirmation()
                                }
                            }}
                            sx={{ textTransform: 'none', width: '2rem', mb: 2 }}
                        >
                            {!decodedEDetailId ? 'Save' : 'Update'}
                        </Button>
                    </Box>
                )}

                {tabValue === 1 && (
                    <Box>
                        <DataTable columns={columns} data={allEdetailData} />
                    </Box>
                )}
            </Box>

            {/* Inline Sub Detailing Form — only shown when editing (decodedEDetailId exists) */}
            {tabValue === 0 && decodedEDetailId && (
                <Box sx={{ m: 2, backgroundColor: 'white' }}>
                    <Box sx={{ width: '100%', textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 500, color: '#026cb6', fontSize: '1.3rem', pt: 2 }}>
                            Preview Detail Mapping
                        </Typography>
                        <Box>
                            <Grid container spacing={2} ml={3} padding={2}>
                                <Grid size={{ xs: 12, sm: 11, md: 5.8, lg: 5.5 }}>
                                    <TextField
                                        fullWidth
                                        value={subCatData.subCatName}
                                        onChange={(e) => setSubCatData((val) => ({ ...val, subCatName: e.target.value }))}
                                        label="Sub Cat Name"
                                        size="small"
                                        error={!!subErrors.subCatName}
                                        helperText={subErrors.subCatName ? `Sub Category Name is Required` : ''}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 11, md: 6, lg: 6 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, ml: { lg: 5, xs: 0, md: 5 } }}>
                                        <Typography sx={{ fontSize: '13px' }}>Preview Image</Typography>
                                        <input type="file" />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 11, md: 5.8, lg: 5.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Typography sx={{ fontSize: '13px' }}>Detailers/</Typography>
                                        <TextField
                                            value={subCatData.subFoldername}
                                            onChange={(e) => setSubCatData((val) => ({ ...val, subFoldername: e.target.value }))}
                                            fullWidth
                                            label="Folder Name"
                                            error={!!subErrors.subFoldername}
                                            helperText={subErrors.subFoldername ? 'Sub Folder Name is Required' : ''}
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 11, md: 5.8, lg: 5.5 }}>
                                    <Box sx={{ ml: { xs: 0, md: 5 } }}>
                                        <TextField
                                            value={subCatData.subFileName}
                                            onChange={(e) => setSubCatData((val) => ({ ...val, subFileName: e.target.value }))}
                                            fullWidth
                                            label="File Name"
                                            size="small"
                                            error={!!subErrors.subFileName}
                                            helperText={subErrors.subFileName ? 'Sub File Name is Required' : ''}
                                        />
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 11, md: 5.8, lg: 5.5 }}>
                                    <TextField
                                        value={subCatData.subOrderNumber}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                setSubCatData((val) => ({ ...val, subOrderNumber: value }))
                                            }
                                        }}
                                        fullWidth
                                        label="Order"
                                        error={!!subErrors.subOrderNumber}
                                        helperText={subErrors.subOrderNumber ? 'Sub Order is Required' : ''}
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (validateSubfields()) {
                                        showSubmitSubDetConfirm()
                                    }
                                }}
                                sx={{ width: '2rem', textTransform: 'none', mb: 2 }}
                            >
                                {subId ? 'Update' : 'Save'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Inline Sub Data Table — only when decodedEDetailId exists */}
            {tabValue === 0 && decodedEDetailId && (
                <Box sx={{ m: 2, backgroundColor: 'white' }}>
                    <Box sx={{ py: 2, px: 2 }}>
                        <DataTable
                            columns={column1}
                            data={allSubData}
                            showHeader={false}
                            pagination={false}
                        />
                    </Box>
                </Box>
            )}

            {/* Dialog: View sub details (no decodedEDetailId) */}
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
                    <Typography sx={{ fontSize: '15px' }}>Preview Detailing</Typography>
                    <IconButton onClick={onClose}>
                        <IoClose size={18} />
                    </IconButton>
                </DialogTitle>
                <Divider sx={{ mb: 2, mt: -1 }} />
                <Box sx={{ mx: 2 }}>
                    <DataTable
                        columns={column1}
                        data={allSubData}
                        showHeader={false}
                        pagination={false}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'end', mr: 2 }}>
                    <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{ backgroundColor: '#F39C12', width: '2rem', mt: 1, mb: 2, textTransform: 'none' }}
                    >
                        Close
                    </Button>
                </Box>
            </Dialog>

            {/* Dialog: Edit sub detailing (opened from view dialog when no decodedEDetailId) */}
            <Dialog
                open={dialogsubDetopen}
                onClose={onCloseSubDet}
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
                    <Typography sx={{ fontSize: '15px' }}>Edit Sub Detailing</Typography>
                    <IconButton onClick={onCloseSubDet}>
                        <IoClose size={18} />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Box sx={{ width: { lg: '60%', md: '70%', sm: '70%', xs: '90%' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Sub Cat Name"
                            size="small"
                            value={editSubRow?.subCatName || ''}
                            error={!!subErrors.subCatName}
                            helperText={subErrors.subCatName ? 'Sub Category Name is Required' : ''}
                            onChange={(e) => setEditSubRow(v => ({ ...v, subCatName: e.target.value }))}
                        />
                        <Box>
                            <Typography sx={{ mb: 1 }}>Preview Image</Typography>
                            <input type="file" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ whiteSpace: 'nowrap' }}>Detailings/</Typography>
                            <TextField
                                fullWidth
                                label="Folder Name"
                                size="small"
                                value={editSubRow?.subFoldername || ''}
                                error={!!subErrors.subFoldername}
                                helperText={subErrors.subFoldername ? 'Sub Folder Name is Required' : ''}
                                onChange={(e) => setEditSubRow(v => ({ ...v, subFoldername: e.target.value }))}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="File Name"
                            size="small"
                            value={editSubRow?.subFileName || ''}
                            error={!!subErrors.subFileName}
                            helperText={subErrors.subFileName ? 'Sub File Name is Required' : ''}
                            onChange={(e) => setEditSubRow(v => ({ ...v, subFileName: e.target.value }))}
                        />
                        <TextField
                            fullWidth
                            label="Order"
                            size="small"
                            value={editSubRow?.subOrderNumber || ''}
                            error={!!subErrors.subOrderNumber}
                            helperText={subErrors.subOrderNumber ? 'Sub Order is Required' : ''}
                            onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setEditSubRow(v => ({ ...v, subOrderNumber: value }))
                                }
                            }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={onCloseSubDet}
                                sx={{ textTransform: 'none' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    if (validateDialogSubfields()) {
                                        // Sync editSubRow into subCatData so handleSubEdetailSubmit reads it correctly
                                        setSubCatData(editSubRow)
                                        showSubmitSubDetConfirm()
                                    }
                                }}
                                sx={{ textTransform: 'none' }}
                            >
                                Update
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                loading={modifyLoading}
                cancelText={confirmationDialog.cancelText}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    )
}