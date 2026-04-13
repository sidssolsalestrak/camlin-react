import React, { useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import { useEffect } from 'react';
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

const ProductSubCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [catData, setCatData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        category: "",
        categoryCode: "",
        categoryName: ""
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        category: "",
        categoryCode: "",
        categoryName: ""
    })
    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        catcode: "",
        catname: ""
    })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*---------- re usable toast ---------*/
    const showAlert = useToast();

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            category: "",
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
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Sub Product Category?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this Sub Product Category?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };
    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            category: "",
            categoryCode: "",
            categoryName: ""
        }
        if (!formData.category) {
            newValidations.category = "The Category field is required";
            isValid = false;
        }
        if (!formData.categoryCode) {
            newValidations.categoryCode = "The Sub Category Code field is required.";
            isValid = false;
        }
        if (!formData.categoryName) {
            newValidations.categoryName = "The Sub Category Name field is required.";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*----------for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/catSub/${btoa(encodeId)}`)
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                cat_id: formData.category,
                sub_code: formData.categoryCode,
                sub_name: formData.categoryName
            }
            const res = await axios.post("/addCatSub", payload)
            //console.log("adding sub category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Added Sub Product Category")
                setFormData({ category: "", categoryCode: "", categoryName: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ category: "", categoryCode: val?.message || "", categoryName: "" });
                } else {
                    setValidations({ category: "", categoryCode: "", categoryName: val?.message || "" });
                }
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Sub Product Category")
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
                cat_id: formData.category,
                hdnSubCode: original.catcode,
                hdnSubName: original.catname,
                sub_code: formData.categoryCode,
                sub_name: formData.categoryName
            }
            const res = await axios.post("/subCatEdit", payload)
            //console.log("updating category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully updated Sub Product Category")
                setFormData({ category: "", categoryCode: "", categoryName: "" });
                setValue('1')
                navigate(`/masters/catSub`)
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
                showAlert.error("Failed to Update Sub Product Category")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editCatSub", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    category: data[0]?.cat_id || "",
                    categoryCode: data[0]?.sub_code || "",
                    categoryName: data[0]?.sub_name || ""
                });
                setoriginal({
                    catcode: data[0]?.sub_code || "",
                    catname: data[0]?.sub_name || ""
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
            const res = await axios.post(`/deleteCatSub/${id}`);
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

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "cat_name",
            headerName: "Category Name",
            filterable: true,
        },
        {
            field: "sub_code",
            headerName: "Sub Category Code",
            filterable: true,
        },
        {
            field: "sub_name",
            headerName: "Sub Category Name",
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

    /*---------- fetch category ---------*/
    const fetchBrand = async () => {
        try {
            const res = await axios.post("/getCategory");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
           // console.log("cat data", data);
            setCatData(data);
        } catch (error) {
            console.error(error);
            setCatData([]);
        }
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/getSubCat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
           // console.log("table data", data);
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
            setFormData({ category: "", categoryCode: "", categoryName: "" });
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
            { label: "Product Sub Category" },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">Product Sub Category</h1>
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
                            <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Product Sub Category</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <FormControl fullWidth size="small" required>
                                    <InputLabel id="Category">Category</InputLabel>
                                    <Select id='Category-select' label="Category" labelId="Category" variant="outlined"
                                        value={formData.category} error={!!validation.category} MenuProps={menuStyle}
                                        onChange={(e) => formDataChange("category", e.target.value)}
                                    >
                                        <MenuItem style={{ fontSize: "11px" }} value="">Select Category</MenuItem>
                                        {catData?.map((item, index) => (
                                            <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>
                                                {item?.cat_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {validation.category && <span style={{ color: "#d32f2f", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.category}</span>}
                                </FormControl>
                                <TextField value={formData.categoryCode}
                                    onChange={(e) => formDataChange("categoryCode", e.target.value)}
                                    required size='small'
                                    variant='outlined' label="Product Sub Category Code"
                                    error={!!validation.categoryCode}
                                    helperText={validation.categoryCode && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.categoryCode}</span>} />
                                <TextField
                                    value={formData.categoryName}
                                    onChange={(e) => formDataChange("categoryName", e.target.value)}
                                    required size='small'
                                    variant='outlined' label="Product Sub Category Name"
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
export default ProductSubCategory