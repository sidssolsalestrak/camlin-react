import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import useToast from "../../../utils/useToast";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmationDialog from "../../../utils/confirmDialog";
import { useCallback } from 'react';
import { getMasterPanel } from "../../../services/masterPanelService";

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }
const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const ProductCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([]);
    const [brandData, setbrandData] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    /*---------- form fields ---------*/
    const [formData, setFormData] = useState({
        brand: "",
        categoryCode: "",
        categoryName: ""
    })
    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        catcode: "",
        catname: ""
    })
    /*---------- form validations ---------*/
    const [validation, setValidations] = useState({
        brand: "",
        categoryCode: "",
        categoryName: "",
    })
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();

    /*---------- reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            brand: "",
            categoryCode: "",
            categoryName: ""
        })
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
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
            loading: false,
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        const label = masterPanel["PCAT"] || "Product Category";
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${label}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*---------- check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            brand: "",
            categoryCode: "",
            categoryName: ""
        }
        if (!formData.brand) {
            newValidations.brand = "The Brand field is required";
            isValid = false;
        }

        const label = masterPanel["PCAT"] || "Product Category";

        if (!formData.categoryCode || formData.categoryCode.trim() === "") {
            newValidations.categoryCode = `The ${label} Code field is required`;
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryCode)) {
            newValidations.categoryCode = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }

        if (!formData.categoryName || formData.categoryName.trim() === "") {
            newValidations.categoryName = `The ${label} Name field is required`;
            isValid = false;
        } else if (formData.categoryName.trim().length < 3) {
            newValidations.categoryName = `${label} Name must be at least 3 characters`;
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ]/.test(formData.categoryName)) {
            newValidations.categoryName = "Only letters, numbers, underscore, hyphen, forward slash and spaces are allowed";
            isValid = false;
        }

        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                brand_id: formData.brand,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/addCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Added Successfully`)
                setFormData({ brand: "", categoryCode: "", categoryName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to ADD ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                id: decodedId,
                brand_id: formData.brand,
                hdnCatCode: original.catcode,
                hdnCatName: original.catname,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/editCat", payload)
            if (res?.data?.success) {
                showAlert.success(`${masterPanel["PCAT"] || "Product Category"} Updated Successfully`)
                setFormData({ brand: "", categoryCode: "", categoryName: "" });
                setValue('1')
                navigate(`/masters/cat`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${masterPanel["PCAT"] || "Product Category"}`)
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*---------- for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/cat/${btoa(encodeId)}`)
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/edit", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    brand: data[0]?.brand_id || "",
                    categoryCode: data[0]?.cat_code || "",
                    categoryName: data[0]?.cat_name || ""
                });
                setoriginal({
                    catcode: data[0]?.cat_code || "",
                    catname: data[0]?.cat_name || ""
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteCat/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${masterPanel["PCAT"] || "Product Category"}`)
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
            sortable: true
        },
        {
            field: "brand_name",
            headerName: "Brand",
            filterable: true,
            sortable: true
        },
        {
            field: "cat_code",
            headerName: `${masterPanel["PCAT"] || "Product Category"} Code`,
            filterable: true,
            sortable: true
        },
        {
            field: "cat_name",
            headerName: masterPanel["PCAT"] || "Product Category",
            filterable: true,
            sortable: true
        }, {
            field: "",
            headerName: "Action",
            filterable: true,
            sortable: true,
            renderCell: (row) => (
                <>
                    <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                        <MdOutlineEdit size={15} />
                    </IconButton>
                    <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                        <DeleteIcon size={15} />
                    </IconButton>
                </>
            )
        },
    ]

    /*---------- fetch brand ---------*/
    const fetchBrand = async () => {
        try {
            const res = await axios.post("/getBrand");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setbrandData(data);
        } catch (error) {
            console.error(error);
            setbrandData([]);
        }
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getCat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
        fetchBrand();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ brand: "", categoryCode: "", categoryName: "" });
            setoriginal({ catcode: "", catname: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: masterPanel["PCAT"] ? `${masterPanel["PCAT"]}` : "Product Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{masterPanel["PCAT"] || "Product Category"}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box> :
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {masterPanel["PCAT"]} Details</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="Brand">Brand</InputLabel>
                                    <Select id='Brand-select' label="Brand" labelId="Brand" variant="outlined"
                                        value={formData.brand} error={!!validation.brand} MenuProps={menuStyle}
                                        onChange={(e) => formDataChange("brand", e.target.value)}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="">Select Brand</MenuItem>
                                        {brandData?.map((item, index) => (
                                            <MenuItem key={index || item.id} style={{ fontSize: "11px" }} value={item.id}>{item?.brand_name}</MenuItem>
                                        ))}
                                    </Select>
                                    {validation.brand && <span style={{ color: "#d32f2f", fontSize: "9.1px", padding: "5px 0px 0px 12px" }}>{validation.brand}</span>}
                                </FormControl>
                                <TextField value={formData.categoryCode}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("categoryCode", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label={masterPanel["PCAT"] ? `${masterPanel["PCAT"]} Code` : "Product Category Code"}
                                    error={!!validation.categoryCode}
                                    helperText={validation.categoryCode && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryCode}</span>} />
                                <TextField
                                    value={formData.categoryName}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ]/g, "").replace(/^\s+/, "");
                                        formDataChange("categoryName", onlyText)
                                    }}
                                    required size='small'
                                    variant='outlined' label={masterPanel["PCAT"] ? `${masterPanel["PCAT"]} Name` : "Product Category Name"}
                                    error={!!validation.categoryName}
                                    helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.categoryName}</span>} />
                            </Box>
                            <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }} color="primary" variant='contained'>{decodedId ? "Update" : "Submit"}</Button>
                        </TabPanel>
                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />
                        </TabPanel>
                    </TabContext>
                </Box>
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
export default ProductCategory