import React, { useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';

const Department = () => {
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        departmentName: ""
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        departmentName: "",
    })

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            departmentName: "",
        })
    }
    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            departmentName: "",
        }
        if (!formData.departmentName) {
            newValidations.departmentName = "The Department Name field is required";
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
                departmentName: formData.departmentName || "",
            }
            console.log("form data:", payload);
            resetValidations();
        } catch (error) {
            console.error(error);
        } finally {
            setFormData({ departmentName: ""})
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
            headerName: "Department Name",
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
            <PageHeader title="Department" />
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
                            <TextField value={formData.departmentName}
                                onChange={(e) => formDataChange("departmentName", e.target.value)}
                                required size='small'
                                variant='outlined' label="Department Name"
                                helperText={validation.departmentName && <span style={{ color: "red", fontSize: "12px" }}>{validation.departmentName}</span>} />
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

export default Department
