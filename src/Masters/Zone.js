import { useState, useEffect } from "react";
import Layout from "../layout";
import { TextField, Box, Typography, Button, Tabs, Tab, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DataTable from "../utils/dataTable";
import api from "../services/api";
import { useSnackbar } from "notistack";

export default function Zone() {
    const [zoneName, setZoneName] = useState("")
    const [zoneError, setZoneError] = useState(false)
    const [zoneErrorMsg, setZoneErrorMsg] = useState("Zone Name is Required")
    const [zoneList, setZoneList] = useState([])
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tabValue, setTabValue] = useState(1)
    const { enqueueSnackbar } = useSnackbar()

    useEffect(() => {
        fetchZones()
    }, [])

    const fetchZones = async () => {
        try {
            let response = await api.post("/read_zone", { zone_id: null })
            console.log(response, "table data")
            const dataWithSiNo = response.data.data.map((item, index) => ({
                ...item,
                si_no: index + 1
            }))
            setZoneList(dataWithSiNo)
        } catch (err) {
            console.log("fetchZones error", err)
        } finally {
            setLoading(false)
        }
    }

    const validateZone = () => {
        // Required check
        if (!zoneName || zoneName.trim() === "") {
            setZoneError(true)
            setZoneErrorMsg("Zone Name is Required")
            return false
        }

        // Min length check
        if (zoneName.trim().length < 3) {
            setZoneError(true)
            setZoneErrorMsg("Zone Name must be at least 3 characters")
            return false
        }

        // Special characters check
        const specialChar = /[^a-zA-Z0-9 ]/
        if (specialChar.test(zoneName)) {
            setZoneError(true)
            setZoneErrorMsg("Special Characters Not Allowed")
            return false
        }

        // Duplicate check (skip if editing same record)
        const isDuplicate = zoneList.some(
            (z) => z.zone_name.toLowerCase() === zoneName.trim().toLowerCase() && z.id !== editId
        )
        if (isDuplicate) {
            setZoneError(true)
            setZoneErrorMsg("Zone Name Should be Unique")
            return false
        }

        return true
    }

    const handleAddZone = async () => {
        try {
            setZoneError(false)

            if (!validateZone()) return

            if (editId) {
                let response = await api.post("/updateZone", { id: editId, newZone: zoneName.trim() })
                enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
                setEditId(null)
            } else {
                let response = await api.post("/addZone", { newZone: zoneName.trim() })
                enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            }
            setZoneName("")
            fetchZones()
        } catch (err) {
            console.log("addzone error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
    }

    const handleEdit = (zone) => {
        setEditId(zone.id)
        setZoneName(zone.zone_name)
        setZoneError(false)
        setTabValue(0)
    }

    const handleDelete = async (id) => {
        try {
            let response = await api.post("/deleteZone", { id })
            enqueueSnackbar(response.data.message, { variant: 'success', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
            fetchZones()
        } catch (err) {
            console.log("deleteZone error", err)
            enqueueSnackbar("Something went wrong Try again!!", { variant: 'error', anchorOrigin: { vertical: 'top', horizontal: 'center' } })
        }
    }

    const handleCancel = () => {
        setEditId(null)
        setZoneName("")
        setZoneError(false)
        setZoneErrorMsg("Zone Name is Required")
    }

    const columns = [
        {
            field: "si_no",
            headerName: "#",
            filterable: true,
        },
        {
            field: "zone_name",
            headerName: "Zone Name",
            filterable: true,
        },
        {
            field: "action",
            headerName: "Action",
            filterable: false,
            renderCell: (row) => (
                <>
                    <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </>
            )
        }
    ]

    return (
        <Layout>
            <Box sx={{ backgroundColor: 'white', m: 3, borderRadius: '6px', minHeight: '70vh' }}>
                <Typography sx={{ p: 3, fontWeight: 600, color: 'blue', fontSize: '1.2rem' }}>
                    {editId ? "Edit Zone" : "Add Zone"}
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                    <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
                        <Tab label="ADD NEW" />
                        <Tab label="VIEW LIST" />
                    </Tabs>
                </Box>

                {/* ADD NEW TAB */}
                {tabValue === 0 && (
                    <Box sx={{ p: 3 }}>
                        <TextField
                            label="Zone Name"
                            value={zoneName}
                            onChange={(e) => {
                                setZoneName(e.target.value)
                                if (zoneError) setZoneError(false)
                            }}
                            size="small"
                            error={!!zoneError}
                            helperText={zoneError ? zoneErrorMsg : ""}
                        />
                        <Button sx={{ ml: 3 }} variant="contained" onClick={handleAddZone}>
                            {editId ? "Update" : "Submit"}
                        </Button>
                        {editId && (
                            <Button
                                sx={{ ml: 1 }}
                                variant="outlined"
                                color="error"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </Box>
                )}

                {/* VIEW LIST TAB */}
                {tabValue === 1 && (
                    <Box sx={{ p: 3 }}>
                        <DataTable
                            columns={columns}
                            data={zoneList}
                            loading={loading}
                        />
                    </Box>
                )}

            </Box>
        </Layout>
    )
}