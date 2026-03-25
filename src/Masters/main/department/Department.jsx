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
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useCallback } from 'react';
import ConfirmationDialog from "../../../utils/confirmDialog";

const Department = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        deptName: "",
    })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

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

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Department`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Department?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Category`,
            message: `Are you sure you want to delete this Department?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

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

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                dept_name: formData.departmentName
            }
            const res = await axios.post("/addDept", payload)
            console.log("adding sub category:", res);
            if (res?.data?.success) {
                showAlert("Successfully Added Department")
                setFormData({ departmentName: ""});
                fetchTableData();
                resetValidations();
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setValidations({ departmentName: val?.message || "" });
            } else {
                console.error(error);
                showAlert("Failed to ADD Department", "error")
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
                dept_name: formData.departmentName,
                hdndeptName: original.deptName,
            }
            const res = await axios.post("/updateDept", payload)
            console.log("updating category:", res);
            if (res?.data?.success) {
                showAlert("Successfully updated Department")
                setFormData({ departmentName: "" });
                setValue('1')
                navigate(`/masters/dept`)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                setValidations({ departmentName: val?.message || "" });
            } else {
                console.error(error);
                showAlert("Failed to Update Department", "error")
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/deleteDept/${id}`);
            console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert("Successfully Deleted Product Category")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert("failed to delete", "error")
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

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/dept/${btoa(encodeId)}`)
    }

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "dept_name",
            headerName: "Department Name",
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
            const res = await axios.post("/dept");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            console.log("table data", data);
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editDept", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    departmentName: data[0]?.dept_name || "",
                });
                setoriginal({
                    deptName: data[0]?.dept_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert("failed to edit", "error")
        }
    }

    useEffect(() => {
        const initializeData = async () => {
            await fetchTableData();
            // If there's an ID in URL, fetch edit data (similar to Zone component)
            if (decodedId) {
                setValue('1')
                await getEditData(decodedId);
            } else {
                // Reset form when no edit ID
                setFormData({
                    departmentName: "",
                });
            }
        }
        initializeData();
        resetValidations();
    }, [decodedId])

    return (
        <Layout>
            <PageHeader title="Department" />
            <Box sx={{ backgroundColor: 'white', mt: 3, ml: 2, borderRadius: '6px', minHeight: '30vh', width: '60%' }}>
                <TabContext value={value}>
                    {!decodedId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                <Tab label="ADD NEW" value="1" />
                                <Tab label="VIEW LIST" value="2" />
                            </TabList>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Department</Typography>
                    }
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <TextField value={formData.departmentName}
                                onChange={(e) => formDataChange("departmentName", e.target.value)}
                                required size='small'
                                variant='outlined' label="Department Name" error={!!validation.departmentName}
                                helperText={validation.departmentName && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.departmentName}</span>} />
                        </Box>
                        <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }} color="primary" variant='contained'>{decodedId ? "Update" : "Submit"}</Button>
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

export default Department
