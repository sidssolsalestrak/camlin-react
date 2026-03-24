import React, { useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';

const Designation = () => {
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        abbreviation: "",
        designation: ""
    })
    /*----------form validations ---------*/
    const [validation, setValidations] = useState({
        abbreviation: "",
        designation: ""
    })

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            abbreviation: "",
            designation: ""
        })
    }
    /*----------check validations ---------*/
    const validations = () => {
        let isValid = true;
        const newValidations = {
            abbreviation: "",
            designation: ""
        }
        if (!formData.abbreviation) {
            newValidations.abbreviation = "The Abbreviation field is required";
            isValid = false;
        }
        if (!formData.designation) {
            newValidations.designation = "The Designation field is required.";
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
                abbreviation: formData.abbreviation || "",
                designation: formData.designation || "",
            }
            console.log("form data:", payload);
            resetValidations();
        } catch (error) {
            console.error(error);
        } finally {
            setFormData({ brand: "", categoryCode: "", categoryName: "" })
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
            headerName: "Designation",
            filterable: true,
        },
        {
            field: "",
            headerName: "Abbreviation",
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
            <PageHeader title="Designation" />
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
                            <TextField value={formData.designation}
                                onChange={(e) => formDataChange("designation", e.target.value)}
                                required size='small'
                                variant='outlined' label="Designation"
                                helperText={validation.designation && <span style={{ color: "red", fontSize: "12px" }}>{validation.designation}</span>} />
                            <TextField
                                value={formData.abbreviation}
                                onChange={(e) => formDataChange("abbreviation", e.target.value)}
                                required size='small'
                                variant='outlined' label="Abbreviation"
                                helperText={validation.abbreviation && <span style={{ color: "red", fontSize: "12px" }}>{validation.abbreviation}</span>} />
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

export default Designation
