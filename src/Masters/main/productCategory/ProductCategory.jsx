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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import useToast from "../../../utils/useToast";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmationDialog from "../../../utils/confirmDialog";
import { useCallback } from 'react';

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
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Category`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Product Category?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this Product Category?`,
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
        if (!formData.categoryCode) {
            newValidations.categoryCode = "The Category Code field is required";
            isValid = false;
        }
        if (!formData.categoryName) {
            newValidations.categoryName = "The Category Name field is required";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                brand_id: formData.brand,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/addCat", payload)
            //console.log("adding category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Added Product Category")
                setFormData({ brand: "", categoryCode: "", categoryName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ brand: "", categoryCode: val?.message || "", categoryName: "" });
                } else {
                    setValidations({ brand: "", categoryCode: "", categoryName: val?.message || "" });
                }
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Product Category")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            let payload = {
                id: decodedId,
                brand_id: formData.brand,
                hdnCatCode: original.catcode,
                hdnCatName: original.catname,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/editCat", payload)
            //console.log("updating category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully updated Product Category")
                setFormData({ brand: "", categoryCode: "", categoryName: "" });
                setValue('1')
                navigate(`/masters/cat`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ brand: "", categoryCode: val?.message || "", categoryName: "" });
                } else {
                    setValidations({ brand: "", categoryCode: "", categoryName: val?.message || "" });
                }
            } else {
                console.error(error);
                showAlert.error("Failed to Update Product Category")
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
            const res = await axios.post(`/deleteCat/${id}`);
            //console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Product Category")
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
        },
        {
            field: "brand_name",
            headerName: "Brand",
            filterable: true,
        },
        {
            field: "cat_code",
            headerName: "Category Code",
            filterable: true,
        },
        {
            field: "cat_name",
            headerName: "Category",
            filterable: true,
        }, {
            field: "",
            headerName: "Action",
            filterable: true,
            renderCell: (row) => (
                <>
                    <IconButton size="small" color="primary" onClick={() => editdata(row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => showDeleteConfirmation(row)}>
                        <DeleteIcon fontSize="small" />
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
            { label: "Product Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Product Category</h1>
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
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Product Category Details</Typography>
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
                                    {validation.brand && <span style={{ color: "#d32f2f", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.brand}</span>}
                                </FormControl>
                                <TextField value={formData.categoryCode}
                                    onChange={(e) => formDataChange("categoryCode", e.target.value)}
                                    required size='small'
                                    variant='outlined' label="Product Category Code"
                                    error={!!validation.categoryCode}
                                    helperText={validation.categoryCode && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.categoryCode}</span>} />
                                <TextField
                                    value={formData.categoryName}
                                    onChange={(e) => formDataChange("categoryName", e.target.value)}
                                    required size='small'
                                    variant='outlined' label="Product Category Name"
                                    error={!!validation.categoryName}
                                    helperText={validation.categoryName && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.categoryName}</span>} />
                            </Box>
                            <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }} color="primary" variant='contained'>{decodedId ? "Update" : "Submit"}</Button>
                        </TabPanel>
                        {/*---------------- View section--------------- */}
                        <TabPanel value="2">
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