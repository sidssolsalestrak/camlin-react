import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ImDownload3 } from "react-icons/im";
import fetchSubCat from "./fetchSubCat";
import ConfirmationDialog from "../../../utils/confirmDialog";
import useToast from "../../../utils/useToast";
import axios from "../../../services/api";

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
}

const style = {
    color: "#026CB6",
    fontSize: "21px",
    fontWeight: 500
}

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

const formFields = {
    productType: "0",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    sortingOrder: "",
    asp: "",
    cfa: "",
    pts: "",
    ptr: "",
    mrp: "",
    pcsPerPack: "",
    pcsPerCarton: "",
    uom: "",
    unitConvertion: "",
}

const validationFields = {
    productType: "",
    productName: "",
    subCatName: "",
    shortName: "",
    code: "",
    asp: "",
    pts: "",
    ptr: "",
    mrp: "",
}

const AddProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [subCat, setSubCat] = useState([]);
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    /*----------form fields ---------*/
    const [formData, setFormData] = useState(formFields)
    /*---------- original departmentName name for edit---------*/
    const [original, setoriginal] = useState({
        prod_name: "",
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState(validationFields)

    /*---------- re usable toast ---------*/
    const showAlert = useToast();
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
            title: `${decodedId ? "Edit" : "Add"} Product`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Product?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    /*----------form validations ---------*/
    const validations = () => {
        let isValid = true;
        let newValidations = {
            productType: "",
            productName: "",
            subCatName: "",
            shortName: "",
            code: "",
            asp: "",
            pts: "",
            ptr: "",
            mrp: "",
        }
        if (formData.productType < 0) {
            newValidations.productType = "The Product Type field is required";
            isValid = false;
        }
        if (!formData.productName) {
            newValidations.productName = "The Product Name field is required";
            isValid = false;
        }
        if (!formData.subCatName) {
            newValidations.subCatName = "The Sub-Category Name field is required";
            isValid = false;
        }
        if (!formData.shortName) {
            newValidations.shortName = "The Short Name field is required";
            isValid = false;
        }
        if (!formData.code) {
            newValidations.code = "The Code field is required";
            isValid = false;
        }
        if (!formData.asp) {
            newValidations.asp = "The Ex Factory Price field is required";
            isValid = false;
        }
        if (!formData.pts) {
            newValidations.pts = "The Stockist Price field is required";
            isValid = false;
        }
        if (!formData.ptr) {
            newValidations.ptr = "The Retail Price field is required";
            isValid = false;
        }
        if (!formData.mrp) {
            newValidations.mrp = "The MRP Price field is required";
            isValid = false;
        }
        setValidations(newValidations);
        return isValid;
    }

    /*----------handle change for form fields ---------*/
    const handleChange = (name, val) => {
        setFormData((prev) => ({
            ...prev, [name]: val
        }))
    }

    /*---------- reset form ---------*/
    const resetForm = () => {
        setFormData(formFields);
        setValidations(validationFields);
    }

    /*---------- set error ---------*/
    const setError = (fieldName, message) => {
        setValidations({
            ...validationFields,
            [fieldName]: message
        })
    }
    /*---------- payload from submit or edit ---------*/
    let payload = {
        prod_type: formData.productType,
        prod_name: formData.productName.trim(),
        subcat_id: formData.subCatName,
        prod_code: formData.shortName,
        code: formData.code,
        ord_id: Number(formData.sortingOrder) || 0,
        fac_price: Number(formData.asp) || 0,
        wd_price: Number(formData.cfa) || 0,
        stk_price: Number(formData.pts) || 0,
        retail_price: Number(formData.ptr) || 0,
        mrp_price: Number(formData.mrp) || 0,
        pack_pcs: Number(formData.pcsPerPack) || 0,
        cart_pcs: Number(formData.pcsPerCarton) || 0,
        prod_uom: formData.uom,
        unit_conv: Number(formData.unitConvertion) || 0,
    }
    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            const res = await axios.post("/prodmas_create", payload)
           // console.log("adding product:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Added Product")
                resetForm();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setError("productName", val?.message || "")
            } else {
                console.error(error);
                showAlert.error("Failed to ADD Product")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editProductData", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    productType: data[0]?.prod_type || "0",
                    productName: data[0]?.prod_name || "",
                    subCatName: data[0]?.subcat_id || "",
                    shortName: data[0]?.prod_code || "",
                    code: data[0]?.code || "",
                    sortingOrder: data[0]?.ord_id || "",
                    asp: data[0]?.fac_price || "",
                    cfa: data[0]?.wd_price || "",
                    pts: data[0]?.stk_price || "",
                    ptr: data[0]?.retail_price || "",
                    mrp: data[0]?.mrp_price || "",
                    pcsPerPack: data[0]?.pack_pcs || "",
                    pcsPerCarton: data[0]?.cart_pcs || "",
                    uom: data[0]?.prod_uom || "",
                    unitConvertion: data[0]?.unit_conv || "",
                });
                setoriginal({
                    prod_name: data[0]?.prod_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            if (decodedId) {
                payload.id = decodedId
                payload.prodNameNew = original.prod_name.trim()
            }
            const res = await axios.post("/prodmas_update", payload)
           // console.log("updating product:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully updated Product")
                resetForm();
                navigate(`/masters/prodview`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setError("productName", val?.message || "")
            } else {
                console.error(error);
                showAlert.error("Failed to Update Product")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /* ---------- view product ---------- */
    const viewClick = () => {
        navigate('/masters/prodview')
    }

    /* ---------- initial render ---------- */
    useEffect(() => {
        fetchSubCat(setSubCat);
    }, [])

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            resetForm();
            return;
        }
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: "Add Product" },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    {/* <Typography sx={style}>Product Details</Typography> */}
                    <Box>
                        <h1 className="mainTitle">Product Details</h1>
                    </Box>
                    <Button onClick={viewClick} sx={{ height: "30px" }} variant="contained" color="primary">View Product</Button>
                </Box>
                <Grid container spacing={2}>
                    {/* row 1 */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <FormControl fullWidth size="small" required>
                            <InputLabel id="ProductType">Product Type</InputLabel>
                            <Select id='ProductType' label="Product Type" error={!!validation.productType}
                                labelId="ProductType" variant="outlined"
                                value={formData.productType} onChange={(e) => handleChange("productType", e.target.value)}>
                                <MenuItem style={{ fontSize: "11px" }} value="0">Existing</MenuItem>
                                <MenuItem style={{ fontSize: "11px" }} value="1">New Launch</MenuItem>
                            </Select>
                            {validation.productType && <span style={{ color: "#d32f2f", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.productType}</span>}
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField fullWidth type='number' size='small' value={formData.sortingOrder}
                            onChange={(e) => handleChange("sortingOrder", e.target.value)}
                            variant='outlined' label="Sorting Order" placeholder='Enter Sorting Order' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField value={formData.mrp} onChange={(e) => handleChange("mrp", e.target.value)} error={!!validation.mrp} helperText={validation.mrp ? validation.mrp : null}
                            type='number' required fullWidth size='small' variant='outlined' label="MRP" placeholder='Enter MRP Price' />
                    </Grid>
                    {/* row 2 */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField required fullWidth size='small' value={formData.productName} error={!!validation.productName} helperText={validation.productName ? validation.productName : null}
                            onChange={(e) => handleChange("productName", e.target.value)} variant='outlined' label="Product Name" placeholder='Enter Product Name' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' required fullWidth size='small' value={formData.asp} error={!!validation.asp} helperText={validation.asp ? validation.asp : null}
                            onChange={(e) => handleChange("asp", e.target.value)} variant='outlined' label="Ex Factory (ASP)" placeholder='Enter Factory Price' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' fullWidth size='small' variant='outlined' value={formData.pcsPerPack}
                            onChange={(e) => handleChange("pcsPerPack", e.target.value)} label="Pcs Per Pack" placeholder='Enter Pack Value' />
                    </Grid>
                    {/* row 3 */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <FormControl fullWidth size="small" >
                            <InputLabel id="SubCategoryName">SubCategory Name</InputLabel>
                            <Select id='SubCategoryName' label="SubCategory Name" value={formData.subCatName} MenuProps={menuStyle}
                                onChange={(e) => handleChange("subCatName", e.target.value)} error={!!validation.subCatName}
                                labelId="SubCategoryName" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="">Select Sub Category</MenuItem>
                                {subCat?.map((item, index) => (
                                    <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                                ))}
                            </Select>
                            {validation.subCatName && <span style={{ color: "#d32f2f", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.subCatName}</span>}
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' fullWidth size='small' variant='outlined' value={formData.cfa}
                            onChange={(e) => handleChange("cfa", e.target.value)} label="CFA/ Superstockist" placeholder='Enter Super Stock-list' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' fullWidth size='small' variant='outlined' value={formData.pcsPerCarton}
                            onChange={(e) => handleChange("pcsPerCarton", e.target.value)} label="Pcs Per Carton" placeholder='Enter Carton Value' />
                    </Grid>
                    {/* row 4 */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField required fullWidth size='small' variant='outlined' value={formData.shortName} error={!!validation.shortName} helperText={validation.shortName ? validation.shortName : null}
                            onChange={(e) => handleChange("shortName", e.target.value)} label="Short Name" placeholder='Enter Short Name' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' required fullWidth size='small' variant='outlined' value={formData.pts} error={!!validation.pts} helperText={validation.pts ? validation.pts : null}
                            onChange={(e) => handleChange("pts", e.target.value)} label="Stockist Price (PTS)" placeholder='Enter Stock Price   ' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField fullWidth size='small' variant='outlined' label="UOM" value={formData.uom}
                            onChange={(e) => handleChange("uom", e.target.value)} placeholder='Enter UOM' />
                    </Grid>
                    {/* row 5 */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField required fullWidth size='small' variant='outlined' label="Code" error={!!validation.code} helperText={validation.code ? validation.code : null}
                            value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder='Enter Code' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' required fullWidth size='small' variant='outlined' value={formData.ptr} error={!!validation.ptr} helperText={validation.ptr ? validation.ptr : null}
                            onChange={(e) => handleChange("ptr", e.target.value)} label="Retail Price (PTR)" placeholder='Enter Retail Price   ' />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                        <TextField type='number' fullWidth size='small' variant='outlined' value={formData.unitConvertion}
                            onChange={(e) => handleChange("unitConvertion", e.target.value)} label="Unit Convertion" placeholder='Enter Unit' />
                    </Grid>
                </Grid>
                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end" } }}>
                    <Button onClick={() => showSubmitConfirmation()} startIcon={<ImDownload3 style={{ height: "15px" }} />} variant='contained' color="primary">{decodedId ? "Update" : "Create"}</Button>
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

export default AddProduct