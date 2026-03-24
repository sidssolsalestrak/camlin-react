import React, { useEffect, useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import axios from "../../../services/api";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from 'notistack';

const ProductCategory = () => {
    const [tableData, settableData] = useState([]);
    const [brandData, setbrandData] = useState([]);
    const [value, setValue] = React.useState('1');
    /*---------- form fields ---------*/
    const [formData, setFormData] = useState({
        brand: "",
        categoryCode: "",
        categoryName: ""
    })
    /*---------- form validations ---------*/
    const [validation, setValidations] = useState({
        brand: "",
        categoryCode: "",
        categoryName: "",
    })
    /*---------- re usable toast ---------*/
    const { enqueueSnackbar } = useSnackbar();
    const showAlert = (message, variant = "success") => {
        enqueueSnackbar(message, { variant, anchorOrigin: { vertical: "top", horizontal: "center" }, });
    };

    /*---------- reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            brand: "",
            categoryCode: "",
            categoryName: ""
        })
    }
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
        if (!validations()) return;
        try {
            let payload = {
                brand_id: formData.brand,
                cat_code: formData.categoryCode,
                cat_name: formData.categoryName
            }
            const res = await axios.post("/addCat", payload)
            console.log("adding category:", res);
            if (res?.data?.success) {
                showAlert("Successfully Added Product Category")
                setFormData({ brand: "", categoryCode: "", categoryName: "" });
                fetchTableData();
                resetValidations();
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
                showAlert("Failed to ADD Product Category", "error")
            }
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
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

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
                    <IconButton size="small" color="primary">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
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
            const res = await axios.post("/getCat");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        }
    }

    /*---------- initial render ---------*/
    useEffect(() => {
        fetchBrand();
        fetchTableData();
    }, [])

    return (
        <Layout>
            <PageHeader title="Product Category" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: '60%' }}>
                <TabContext value={value}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleChange} aria-label="lab API tabs example">
                            <Tab label="ADD NEW" value="1" />
                            <Tab label="VIEW LIST" value="2" />
                        </TabList>
                    </Box>
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="Brand">Brand</InputLabel>
                                <Select id='Brand-select' label="Brand" labelId="Brand" variant="outlined"
                                    value={formData.brand} error={!!validation.brand}
                                    onChange={(e) => formDataChange("brand", e.target.value)}
                                >
                                    <MenuItem style={{ fontSize: "11px" }} value="">Select Brand</MenuItem>
                                    {brandData?.map((item, index) => (
                                        <MenuItem key={index || item.id} style={{ fontSize: "11px" }} value={item.id}>{item?.brand_name}</MenuItem>
                                    ))}
                                </Select>
                                {validation.brand && <span style={{ color: "red", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.brand}</span>}
                            </FormControl>
                            <TextField value={formData.categoryCode}
                                onChange={(e) => formDataChange("categoryCode", e.target.value)}
                                required size='small'
                                variant='outlined' label="Product Category Code"
                                error={!!validation.categoryCode}
                                helperText={validation.categoryCode && <span style={{ color: "red", fontSize: "12px" }}>{validation.categoryCode}</span>} />
                            <TextField
                                value={formData.categoryName}
                                onChange={(e) => formDataChange("categoryName", e.target.value)}
                                required size='small'
                                variant='outlined' label="Product Category Name"
                                error={!!validation.categoryName}
                                helperText={validation.categoryName && <span style={{ color: "red", fontSize: "12px" }}>{validation.categoryName}</span>} />
                        </Box>
                        <Button onClick={onSubmit} sx={{ mt: 2 }} color="primary" variant='contained'>Submit</Button>
                    </TabPanel>
                    {/*---------------- View section--------------- */}
                    <TabPanel value="2">
                        <DataTable
                            columns={columns}
                            data={tableData}
                        />
                    </TabPanel>
                </TabContext>
            </Box>
        </Layout>
    )
}

export default ProductCategory
