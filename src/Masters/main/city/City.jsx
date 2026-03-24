import React, { useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';

const ProductCategory = () => {
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        stateName: "",
        cityName: "",
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        stateName: "",
        cityName: "",
    })

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            stateName: "",
            cityName: "",
        })
    }
    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            stateName: "",
            cityName: "",
        }
        if (!formData.stateName) {
            newValidations.stateName = "The State Name field is required";
            isValid = false;
        }
        if (!formData.cityName) {
            newValidations.cityName = "The  City Name field is required.";
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
                brand: formData.brand || "",
                categoryCode: formData.categoryCode || "",
                categoryName: formData.categoryName || ""
            }
            console.log("form data:", payload);
            resetValidations();
        } catch (error) {
            console.error(error);
        } finally {
            setFormData({ stateName: "", cityName: "" })
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
            headerName: "State Name",
            filterable: true,
        },
        {
            field: "",
            headerName: "City Name",
            filterable: true,
        },
        {
            field: "",
            headerName: "Action",
            filterable: true,
        },
    ]
    return (
        <Layout>
            <PageHeader title="City" />
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
                                <InputLabel id="Brand">State Name</InputLabel>
                                <Select id='Brand-select' label="State Name" labelId="Brand" variant="outlined"
                                    value={formData.stateName}
                                    onChange={(e) => formDataChange("stateName", e.target.value)}
                                >
                                    <MenuItem style={{ fontSize: "11px" }} value="">Select Brand</MenuItem>
                                    <MenuItem style={{ fontSize: "11px" }} value="1"></MenuItem>
                                </Select>
                                {validation.stateName && <span style={{ color: "red", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.stateName}</span>}
                            </FormControl>
                            <TextField value={formData.cityName}
                                onChange={(e) => formDataChange("cityName", e.target.value)}
                                required size='small'
                                variant='outlined' label="City Name"
                                helperText={validation.cityName && <span style={{ color: "red", fontSize: "12px" }}>{validation.cityName}</span>} />
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
