import React, { useCallback, useEffect, useState } from 'react'
import Layout from '../../../layout'
import PageHeader from '../../../utils/PageHeader'
import { Box, TextField, Button, IconButton, Typography } from '@mui/material'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import DataTable from '../../../utils/dataTable';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import useToast from "../../../utils/useToast";
import { MdOutlineEdit } from 'react-icons/md';
import DeleteIcon from "@mui/icons-material/Delete";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { getMasterPanel } from "../../../services/masterPanelService";

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const Designation = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(true)
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    // label derived from masterPanel with fallback
    const desigLabel = masterPanel["DESI"] || "Designation";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        try {
            const accStat = localStorage.getItem("acc_stat");
            setAccStat(accStat);
            console.log("Acc Stat", accStat)
        } catch (err) {
            console.log(err);
        }
    }, []);

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
            loading: false
        });
    };

    const showSubmitConfirmation = () => {
        if (!validations()) return;
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} ${desigLabel}`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? onSubmit() : onEdit(),
        });
    };

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete ${desigLabel}`,
            message: `Are you sure you want to delete this record?`,
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
        if (!formData.designation || formData.designation.trim() === "") {
            newValidations.designation = `The ${desigLabel} field is required.`;
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ()]/.test(formData.designation)) {
            newValidations.designation = "Only letters, numbers, underscore, hyphen, forward slash, brackets and spaces are allowed";
            isValid = false;
        }

        if (!formData.abbreviation || formData.abbreviation.trim() === "") {
            newValidations.abbreviation = "The Abbreviation field is required";
            isValid = false;
        } else if (/[^a-zA-Z0-9_\-\/ ()]/.test(formData.abbreviation)) {
            newValidations.abbreviation = "Only letters, numbers, underscore, hyphen, forward slash, brackets and spaces are allowed";
            isValid = false;
        }
        setValidations(newValidations)
        return isValid;
    }

    /*---------- form submit ---------*/
    const onSubmit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                desig_name: formData.designation,
                desig_abbr_name: formData.abbreviation
            }
            const res = await axios.post("/addDesignation", payload)
            if (res?.data?.success) {
                showAlert.success(`${desigLabel} Added Successfully`)
                setFormData({ abbreviation: "", designation: "" });
                fetchTableData();
                resetValidations();
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Add ${desigLabel}`)
            }
        } finally {
            closeConfirmationDialog();
        }
    }

    /*---------- form edit submit ---------*/
    const onEdit = async () => {
        try {
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            let payload = {
                id: decodedId,
                desig_name: formData.designation,
                desig_abbr_name: formData.abbreviation,
                hdndesignationName: original.designation,
                hdndesignationabb: original.abbreviation
            }
            const res = await axios.post("/UpdateDesignation", payload)
            if (res?.data?.success) {
                showAlert.success(`${desigLabel} Updated Successfully`)
                setFormData({ abbreviation: "", designation: "" });
                setValue('1')
                navigate(`/masters/designation`)
            } else {
                showAlert.error(res?.data?.message)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "Validation failed")
            } else {
                console.error(error);
                showAlert.error(`Failed to Update ${desigLabel}`)
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
            setConfirmationDialog(prev => ({ ...prev, loading: true }));
            const res = await axios.post(`/deleteDesignation/${id}`);
            if (res?.data?.success) {
                showAlert.success(`Successfully Deleted ${desigLabel}`)
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
            sortable: true,
        },
        {
            field: "desig_name",
            headerName: desigLabel,
            filterable: true,
            sortable: true,
        },
        {
            field: "desig_abbr_name",
            headerName: "Abbreviation",
            filterable: true,
            sortable: true,
        },
        {
            field: "",
            headerName: "Action",
            filterable: true,
            sortable: true,
            renderCell: (row) => (
                <>
                    {[0, 2].includes(Number(accStat)) && (
                        <IconButton className='updateBtn' size="small" onClick={() => editdata(row)}>
                            <MdOutlineEdit size={15} />
                        </IconButton>
                    )}
                    {[0, 2].includes(Number(accStat)) && (
                        <IconButton className='deleteBtn' size="small" onClick={() => showDeleteConfirmation(row)}>
                            <DeleteIcon size={15} />
                        </IconButton>
                    )}
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
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: desigLabel },
        ]}>
            <Box
                p={2}
                sx={{ borderRadius: 1 }}
                display="flex"
                flexDirection="column"
                gap={2}
            >
                <Box>
                    <h1 className="mainTitle">{desigLabel}</h1>
                </Box>
                <Box sx={{ backgroundColor: 'white', borderRadius: '6px', minHeight: '30vh', width: { lg: '60%', md: '80%', sm: '90%', xs: '90%' } }}>
                    <TabContext value={value}>
                        {!decodedId ?
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={handleChange} aria-label="lab API tabs example">
                                    <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                    <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                                </TabList>
                            </Box>
                            : <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit {desigLabel}</Typography>
                        }
                        {/*---------------- Add section--------------- */}
                        <TabPanel value="1">
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <TextField value={formData.designation}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ()]/g, "").replace(/^\s+/, "");
                                        formDataChange("designation", onlyText)
                                    }}
                                    required size='small' placeholder={`Enter ${desigLabel}`}
                                    variant='outlined' label={desigLabel} error={!!validation.designation}
                                    helperText={validation.designation && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.designation}</span>} />
                                <TextField
                                    value={formData.abbreviation}
                                    onChange={(e) => {
                                        const onlyText = e.target.value.replace(/[^a-zA-Z0-9_\-\/ ()]/g, "").replace(/^\s+/, "");
                                        formDataChange("abbreviation", onlyText)
                                    }}
                                    required size='small' placeholder="Enter Abbreviation"
                                    variant='outlined' label="Abbreviation" error={!!validation.abbreviation}
                                    helperText={validation.abbreviation && <span style={{ color: "#d32f2f", fontSize: "9px" }}>{validation.abbreviation}</span>} />
                            </Box>
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2,textTransform:'none' }} color="primary" variant='contained'>Create</Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button onClick={() => showSubmitConfirmation()} sx={{ mt: 2,textTransform:'none' }} color="primary" variant='contained'>Update</Button>
                            )}
                        </TabPanel>
                        {/*---------------- View section--------------- */}
                        <TabPanel value="2" sx={{ padding: 0 }}>
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />
                        </TabPanel>
                    </TabContext>
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

export default Designation