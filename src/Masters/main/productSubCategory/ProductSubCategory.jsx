import React, { useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';

const ProductSubCategory = () => {
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
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

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            category: "",
            categoryCode: "",
            categoryName: ""
        })
    }
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
            newValidations.categoryCode = "The Category Code field is required.";
            isValid = false;
        }
        if (!formData.categoryName) {
            newValidations.categoryName = "The Category Name field is required.";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*----------form submit ---------*/
    const onSubmit = () => {
        try {
            if (!validations()) return;
            let payload = {
                category: formData.category || "",
                categoryCode: formData.categoryCode || "",
                categoryName: formData.categoryName || ""
            }
            console.log("form data:", payload);
            resetValidations();
        } catch (error) {
            console.error(error);
        } finally {
            setFormData({ category: "", categoryCode: "", categoryName: "" })
        }
    }

    /*----------for formdata onchange---------*/
    const formDataChange = (field, val) => {
        setFormData((prev) => ({
            ...prev,
            [field]: val
        }))
    }

    /*----------for tab change---------*/
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    /*----------table columns---------*/
    const columns = [
        {
            field: "",
            headerName: "#",
            filterable: true,
        },
        {
            field: "",
            headerName: "Category Name",
            filterable: true,
        },
        {
            field: "",
            headerName: "Sub Category Code",
            filterable: true,
        },
        {
            field: "",
            headerName: "Sub Category Name",
            filterable: true,
        }, {
            field: "",
            headerName: "Action",
            filterable: true,
        },
    ]
    return (
        <Layout>
            <PageHeader title="Product Sub Category" />
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
                                <InputLabel id="Category">Category</InputLabel>
                                <Select id='Category-select' label="Category" labelId="Category" variant="outlined"
                                    value={formData.category}
                                    onChange={(e) => formDataChange("Category", e.target.value)}
                                >
                                    <MenuItem style={{ fontSize: "11px" }} value="">Select Category</MenuItem>
                                    <MenuItem style={{ fontSize: "11px" }} value="1"></MenuItem>
                                </Select>
                                {validation.category && <span style={{ color: "red", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.category}</span>}
                            </FormControl>
                            <TextField value={formData.categoryCode}
                                onChange={(e) => formDataChange("categoryCode", e.target.value)}
                                required size='small'
                                variant='outlined' label="Product Sub Category Code"
                                helperText={validation.categoryCode && <span style={{ color: "red", fontSize: "12px" }}>{validation.categoryCode}</span>} />
                            <TextField
                                value={formData.categoryName}
                                onChange={(e) => formDataChange("categoryName", e.target.value)}
                                required size='small'
                                variant='outlined' label="Product Sub Category Name"
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

export default ProductSubCategory
