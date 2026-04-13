import React, { useCallback, useState } from 'react'
import Layout from '../../../layout'
import DataTable from '../../../utils/dataTable'
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/api";
import { useEffect } from 'react';
import useToast from "../../../utils/useToast";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddStockist from './AddStockist';
import ConfirmationDialog from '../../../utils/confirmDialog';

const style = {
    color: "#1a1917",
    fontSize: "18.2px",
    fontWeight: 500,
    mb: 1
}

const tabStyle = { fontWeight: 600, fontSize: '1.1rem' }

const Stockist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tableData, settableData] = useState([])
    const [showTable, setshowTable] = useState(false)
    const [region, setregion] = useState([]);
    const [area, setarea] = useState([]);
    const [value, setValue] = React.useState('1');
    const [loading, setLoading] = useState(false)
    const [formData, setFormdata] = useState({
        region: "",
        area: "0"
    })

    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

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

    const showDeleteConfirmation = (row) => {
        showConfirmationDialog({
            title: `Delete Stockist`,
            message: `Are you sure you want to delete this Stockist Record?`,
            confirmText: "Yes",
            confirmColor: "primary",
            onConfirm: () => deleteCat(row),
        });
    };

    /*---------- delete cat ---------*/
    const deleteCat = async (row) => {
        let id = row?.row?.id
        try {
            const res = await axios.post(`/delete_stockist/${id}`);
            if (res?.data?.success) {
                showAlert.success("Successfully Deleted Stockist Record")
                fetchTableData();
            }
        } catch (error) {
            console.error(error);
            showAlert.error("failed to delete")
        } finally {
            closeConfirmationDialog();
        }
    }

    /*----------for tab change---------*/
    const handleChange = useCallback((event, newValue) => {
        setValue(newValue);
    }, []);

    /*------ handleChangeForm ---- */
    const handleChangeForm = (name, val) => {
        setFormdata((prev) => ({
            ...prev,
            [name]: val
        }))
    }
    const editdata = (row) => {
        let encodeId = row?.row?.id
        setValue('1');
        navigate(`/masters/stockist/${btoa(encodeId)}`)
    }

    /*----------table columns---------*/
    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "stk_name",
            headerName: "PSM",
            filterable: true,
        },
        {
            field: "zone_name",
            headerName: "ZONE",
            filterable: true,
        },
        {
            field: "",
            headerName: "ACTION",
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

    /*----------fetch regions---------*/
    const fetchRegions = async () => {
        try {
            const res = await axios.post("/get_region");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setregion(data)
        } catch (error) {
            console.error(error);
            setregion([])
        }
    }

    /*----------fetch area---------*/
    const fetchArea = async (region) => {
        try {
            let payload = {
                reg_id: region,
                zone_id: null
            }
            const res = await axios.post("/get_arealist", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
            setarea([])
        }
    }

    /*----------fetch table data---------*/
    const fetchTableData = async () => {
        try {
            if (!formData.region || formData.region <= "0") {
                showAlert.error("Please select Region!");
                return;
            }
            setLoading(true);
            setshowTable(true);
            let payload = {
                reg_id: formData.region,
                area_id: formData.area
            }
            const res = await axios.post("/getStockistList", payload);
            console.log("table res:", res?.data?.data);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data.map((row, index) => ({
                ...row,
                index: index + 1
            })) : []
            settableData(data)
        } catch (error) {
            console.error(error);
            settableData([])
        } finally {
            setLoading(false)
        }
    }

    /*----------initial render---------*/
    useEffect(() => {
        fetchRegions();
    }, [])

    /*----------fetch area based on region---------*/
    useEffect(() => {
        if (formData.region) {
            let region = formData.region;
            fetchArea(region);
        }
    }, [formData.region])

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Master", path: location.pathname },
            { label: "Main", path: location.pathname },
            { label: "Stockist" },
        ]}>
            <Box sx={{ backgroundColor: 'white', m: 2, borderRadius: '6px', minHeight: '30vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' } }}>
                <TabContext value={value}>
                    {!decodedId ?
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                <Tab sx={tabStyle} label="ADD NEW" value="1" />
                                <Tab sx={tabStyle} label="VIEW LIST" value="2" />
                            </TabList>
                        </Box> :
                        <Typography sx={{ px: 3, mt: 3, color: '#212121', fontSize: '18px' }}>Edit Stockist</Typography>
                    }
                    {/*---------------- Add section--------------- */}
                    <TabPanel value="1">
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <AddStockist />
                        </Box>
                    </TabPanel>
                    {/*---------------- View section--------------- */}
                    <TabPanel value="2">
                        <Typography sx={style}>Stockist Records</Typography>
                        <Box sx={{ display: "flex", alignContent: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
                            <FormControl sx={{ width: "200px" }} size="small" >
                                <InputLabel id="region">Region</InputLabel>
                                <Select value={formData.region} id='region' label="Region"
                                    labelId="region" variant="outlined" onChange={(e) => handleChangeForm("region", e.target.value)}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">Select</MenuItem>
                                    {region?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.reg_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ width: "200px" }} size="small" >
                                <InputLabel id="area">Area</InputLabel>
                                <Select value={formData.area} id='area' label="Area"
                                    labelId="area" variant="outlined" onChange={(e) => handleChangeForm("area", e.target.value)}>
                                    <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                    {area?.map((item, index) => (
                                        <MenuItem key={item.id || index} style={{ fontSize: "11px" }} value={item.id}>{item?.area_name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button onClick={() => fetchTableData()} variant='contained' color="primary">Search</Button>
                        </Box>
                        {showTable &&
                            <DataTable
                                columns={columns}
                                data={tableData}
                                loading={loading}
                            />}

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
                loading={loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout >
    )
}

export default Stockist
