import React, { useCallback, useEffect, useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import useToast from "../../../utils/useToast";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmationDialog from "../../../utils/confirmDialog";

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const Designation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
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
    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        abbreviation: "",
        designation: ""
    })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*----------reset validations ---------*/
    const resetValidations = () => {
        setValidations({
            abbreviation: "",
            designation: ""
        })
    }

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
            title: `${decodedId ? "Edit" : "Add"} Designation`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Designation?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Designation`,
            message: `Are you sure you want to delete this Designation?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

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

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                desig_name: formData.designation,
                desig_abbr_name: formData.abbreviation
            }
            const res = await axios.post("/addDesignation", payload)
            console.log("adding sub category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Added Designation")
                setFormData({ abbreviation: "", designation: "" });
                fetchTableData();
                resetValidations();
            }else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ designation: val?.message || "", abbreviation: "" });
                } else {
                    setValidations({ designation: "", abbreviation: val?.message || "" });
                }
            } else {
                console.error(error);
                showAlert.error("Failed to Add Designation")
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
                desig_name: formData.designation,
                desig_abbr_name: formData.abbreviation,
                hdndesignationName: original.designation,
                hdndesignationabb: original.abbreviation
            }
            const res = await axios.post("/UpdateDesignation", payload)
            console.log("updating category:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully updated Designation")
                setFormData({ abbreviation: "", designation: "" });
                setValue('1')
                navigate(`/masters/designation`)
            }else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ designation: val?.message || "", abbreviation: "" });
                } else {
                    setValidations({ designation: "", abbreviation: val?.message || "" });
                }
            } else {
                console.error(error);
                showAlert.error("Failed to Update Designation")
            }
        } finally {
            closeConfirmationDialog();
            fetchTableData();
        }
    }

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/deleteDesignation/${id}`);
            console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Designation")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
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
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "desig_name",
            headerName: "Designation",
            filterable: true,
        },
        {
            field: "desig_abbr_name",
            headerName: "Abbreviation",
            filterable: true,
        },
        {
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

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/designation");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            console.log("table data", data);
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editDesignation", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    abbreviation: data[0]?.desig_abbr_name || "",
                    designation: data[0]?.desig_name || "",
                });
                setoriginal({
                    abbreviation: data[0]?.desig_abbr_name || "",
                    designation: data[0]?.desig_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to edit")
        }
    }

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/designation/${btoa(encodeId)}`)
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ abbreviation: "", designation: "" });
            setoriginal({ abbreviation: "", designation: "" });
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout>
            <PageHeader title="Designation" />
            <Box sx={{ backgroundColor: 'white', m: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                <TabContext value={value}>
                    {!decodedId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                            </TabList>
                        </Box>
                        : <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Designation</Typography>
                    }
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField value={formData.designation}
                                onChange={(e) => formDataChange("designation", e.target.value)}
                                required size='small' placeholder="Enter Designation"
                                variant='outlined' label="Designation" error={!!validation.designation}
                                helperText={validation.designation && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.designation}</span>} />
                            <TextField
                                value={formData.abbreviation}
                                onChange={(e) => formDataChange("abbreviation", e.target.value)}
                                required size='small' placeholder="Enter Abbreviation"
                                variant='outlined' label="Abbreviation" error={!!validation.abbreviation}
                                helperText={validation.abbreviation && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.abbreviation}</span>} />
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

export default Designation
