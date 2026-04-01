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
import ConfirmationDialog from "../../../utils/confirmDialog";

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const ProductCategory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tableData, settableData] = useState([])
    const [state, setState] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    /*----------form fields ---------*/
    const [formData, setFormData] = useState({
        stateName: "",
        cityName: "",
    })
    /*---------- original city name for edit---------*/
    const [original, setoriginal] = useState({
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
            title: `${decodedId ? "Edit" : "Add"} City`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this City?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete City`,
            message: `Are you sure you want to delete this City?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

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

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            let payload = {
                state_id: formData.stateName,
                city_name: formData.cityName,
            }
            const res = await axios.post("/addCity", payload)
            console.log("adding sub category:", res);
            if (res?.data?.success) {
                showAlert("Successfully Added City")
                setFormData({ stateName: "", cityName: "" });
                fetchTableData();
                resetValidations();
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ cityName: "", stateName: val?.message || "" });
                } else {
                    setValidations({ cityName: val?.message || "", stateName: "" });
                }
            } else {
                console.error(error);
                showAlert("Failed to ADD City", "error")
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
                state_id: formData.stateName,
                city_name: formData.cityName,
                city_new: original.cityName,
            }
            const res = await axios.post("/updateCity", payload)
            console.log("updating category:", res);
            if (res?.data?.success) {
                showAlert("Successfully updated City")
                setFormData({ stateName: "", cityName: "" });
                setValue('1')
                navigate(`/masters/city_mas`)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                if (val?.type === 1) {
                    setValidations({ cityName: "", stateName: val?.message || "" });
                } else {
                    setValidations({ cityName: val?.message || "", stateName: "" });
                }
            } else {
                console.error(error);
                showAlert("Failed to Update City", "error")
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
            const res = await axios.post(`/deleteCity/${id}`);
            console.log("delete res:", res);
            if (res?.data?.success) {
                showAlert("Successfully Deleted City")
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
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "state_name",
            headerName: "State Name",
            filterable: true,
        },
        {
            field: "city_name",
            headerName: "City Name",
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

    const editdata = (row) => {
        let encodeId = row?.row?.id
        resetValidations();
        navigate(`/masters/city_mas/${btoa(encodeId)}`)
    }

    /*---------- fetch table data ---------*/
    const fetchTableData = async () => {
        try {
            setLoading(true)
            const res = await axios.post("/cityData");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
            })) : [];
            settableData(data);
        } catch (error) {
            console.error(error);
            settableData([]);
        } finally {
            setLoading(false)
        }
    }

    /*---------- fetch state data ---------*/
    const fetchStateData = async () => {
        try {
            const res = await axios.post("/stateData");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setState(data);
        } catch (error) {
            console.error(error);
            setState([]);
        }
    }

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/editCity", { id: decodedId })
            const data = res?.data?.data || [];
            if (data && data.length > 0) {
                setFormData({
                    stateName: data[0]?.state_id || "",
                    cityName: data[0]?.city_name || "",
                });
                setoriginal({
                    stateName: data[0]?.state_id || "",
                    cityName: data[0]?.city_name || "",
                })
            }
        } catch (error) {
            console.error(error);
            showAlert("failed to edit", "error")
        }
    }

    /*---------- Fetch table data ---------*/
    useEffect(() => {
        fetchTableData();
        fetchStateData();
    }, []);

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData({ stateName: "", cityName: "" });
            setoriginal({ stateName: "", cityName: "" })
            resetValidations();
            return;
        }
        setValue('1');
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Layout>
            <PageHeader title="City" />
            <Box sx={{ backgroundColor: 'white', m: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                <TabContext value={value}>
                    {!decodedId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                            </TabList>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit City</Typography>
                    }
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="Brand">State Name</InputLabel>
                                <Select id='Brand-select' label="State Name" labelId="Brand" variant="outlined"
                                    value={formData.stateName} error={!!validation.stateName}
                                    onChange={(e) => formDataChange("stateName", e.target.value)}
                                >
                                    <MenuItem style={{ fontSize: "11px" }} value="">Select Brand</MenuItem>
                                    {state?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.state_name}</MenuItem>
                                    ))}
                                </Select>
                                {validation.stateName && <span style={{ color: "#d32f2f", fontSize: "12px", padding: "5px 0px 0px 12px" }}>{validation.stateName}</span>}
                            </FormControl>
                            <TextField value={formData.cityName}
                                onChange={(e) => formDataChange("cityName", e.target.value)}
                                required size='small'
                                variant='outlined' label="City Name" error={!!validation.cityName}
                                helperText={validation.cityName && <span style={{ color: "#d32f2f", fontSize: "12px" }}>{validation.cityName}</span>} />
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

export default ProductCategory
