import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, Typography, TextField, FormControl, InputLabel, MenuItem, Select, IconButton } from '@mui/material'
import DataTable from '../../../utils/dataTable';
import { useSnackbar } from 'notistack';
import axios from "../../../services/api";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import fetchSubCat from "./fetchSubCat";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { Download } from "../../../utils/downloadExcel/Download";
import CircularProgress from '../../../utils/CircularProgressLoading';

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '20vh', width: { lg: '97%', md: '97%', sm: '100%', xs: '100%' }
}

const style = {
    color: "#026CB6",
    fontSize: "21px",
    fontWeight: 500
}

const safeAtob = (str) => {
    if (!str) return "";
    try {
        return atob(str);
    } catch (error) {
        console.warn("Invalid Base64 string:", str);
        return "";
    }
};

const ViewProduct = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [tableData, settableData] = useState([]);
    const [subCat, setSubCat] = useState([]);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [formData, setFormdata] = useState({
        productName: "",
        subCatName: ""
    })

    /*---------- decode values  ---------*/
    const decodedProductName = safeAtob(searchParams.get('product'));
    const decodedSubCategory = safeAtob(searchParams.get('subcat'));

    /*---------- handleChange  ---------*/
    const handleChange = (name, val) => {
        setFormdata((prev) => ({
            ...prev, [name]: val
        }))
    }

    /*---------- re usable toast ---------*/
    const { enqueueSnackbar } = useSnackbar();
    const showAlert = (message, variant = "success") => {
        enqueueSnackbar(message, { variant, anchorOrigin: { vertical: "top", horizontal: "center" }, });
    };

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

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Product`,
            message: `Are you sure you want to delete this Product?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /* ---------- edit product ---------- */
    const editdata = (row) => {
        let encodeId = row?.row?.prodid
        navigate(`/masters/prod_mas/${btoa(encodeId)}`)
    }

    /* ---------- ADD product ---------- */
    const addClick = () => {
        navigate('/masters/prod_mas')
    }

    /* ---------- table columns ---------- */
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "prodid",
            headerName: "ID",
            filterable: true,
        },
        {
            field: "sub_name",
            headerName: "Subcategory Name",
            filterable: true,
        },
        {
            field: "code",
            headerName: "Code",
            filterable: true,
        },
        {
            field: "prod_type",
            headerName: "Product Type",
            filterable: true,
        },
        {
            field: "prod_name",
            headerName: "Product Name",
            filterable: true,
        },
        {
            field: "fac_price",
            headerName: "Ex Factory (ASP)",
            filterable: true,
        },
        {
            field: "wd_price",
            headerName: "Stockist Price (PTS)",
            filterable: true,
        },
        {
            field: "stk_price",
            headerName: "Retail Price (PTR)",
            filterable: true,
        },
        {
            field: "mrp_price",
            headerName: "MRP",
            filterable: true,
        },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            renderCell: (row) => (
                <>
                    <IconButton size="small" color="primary" onClick={() => editdata(row)} >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => showDeleteConfirmation(row)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </>
            )
        },
    ]

    /* ---------- table data & sub cat data---------- */
    const fetchData = async ({ name, cat }) => {
        try {
            setloading(true)
            //fetch sub data
            await fetchSubCat(setSubCat)

            //table data fetch
            try {
                let payload = {
                    pd_name: name ? name.trim() : "",
                    subcatname: cat || ""
                }
                const res = await axios.post("/prodview", payload);
                const data = Array.isArray(res?.data?.data) ? res?.data?.data.map((row, index) => ({
                    ...row,
                    index: index + 1,
                    prod_type: row.prod_type == 0 ? "Existing" : "New Launch"
                })) : []
                settableData(data)
            } catch (error) {
                if (error?.response?.status === 400) {
                    showAlert("No Records Found For Given Parameters", "error")
                    settableData([])
                }
                console.error("table data fetch error", error);
                settableData([])
            }
        } catch (error) {
            console.error(error);
            showAlert(error, "error")
        } finally {
            setloading(false)
        }
    }

    /* ---------------- SYNC STATE FROM URL ---------------- */
    useEffect(() => {
        setFormdata({
            productName: decodedProductName || "",
            subCatName: decodedSubCategory || ""
        })
    }, [decodedProductName, decodedSubCategory])

    /* ---------- initial render ---------- */
    useEffect(() => {
        fetchData({ name: decodedProductName, cat: decodedSubCategory });
    }, [decodedProductName, decodedSubCategory])

    /* ---------- on search ---------- */
    const onSearch = () => {
        const params = new URLSearchParams();
        if (formData.productName) params.append('product', btoa(formData.productName));
        if (formData.subCatName) params.append('subcat', btoa(formData.subCatName));
        navigate(`/masters/prodview?${params.toString()}`);
    }

    /*---------- delete Product ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.prodid
        try {
            const res = await axios.post(`/prod_delete/${id}`);
            console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert("Successfully Deleted Product")
                fetchData({ name: decodedProductName, cat: decodedSubCategory });
            }
        } catch (error) {
            console.error(error);
            showAlert("failed to delete", "error")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- handle excel download ---------*/
    const download = async () => {
        Download(
            tableData,
            columns,
            "ProductMaster",
            setProgress,
            enqueueSnackbar,
            "ProductMaster"
        )
    }

    return (
        <Layout>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Typography sx={style}>Product View</Typography>
                    <Button onClick={addClick} sx={{ height: "30px" }} variant="contained" color="primary">Add Product</Button>
                </Box>
                <Box sx={{ display: "flex", alignContent: "center", gap: 2, flexWrap: "wrap" }}>
                    <TextField value={formData.productName} sx={{ width: "200px" }} size='small' variant='outlined'
                        label="Product Name" placeholder='Enter Product Name' onChange={(e) => handleChange("productName", e.target.value)} />
                    <FormControl sx={{ width: "200px" }} size="small" >
                        <InputLabel id="SubCategoryName">SubCategory Name</InputLabel>
                        <Select value={formData.subCatName} id='SubCategoryName' label="SubCategory Name"
                            labelId="SubCategoryName" variant="outlined" onChange={(e) => handleChange("subCatName", e.target.value)}>
                            <MenuItem style={{ fontSize: "11px" }} value="">Select Sub Category</MenuItem>
                            {subCat?.map((item, index) => (
                                <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.sub_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button onClick={onSearch} variant='contained' color="primary">Search</Button>
                    {progress ? <CircularProgress progress={progress} /> : <Button onClick={download} variant='contained' color="warning">Excel</Button>}
                </Box>
            </Box>
            {/* table */}
            <Box sx={headContainer}>
                <DataTable data={tableData} columns={columns} loading={loading} />
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

export default ViewProduct
