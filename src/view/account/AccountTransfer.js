import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../layout";
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Autocomplete,
    Typography,
    Checkbox, ListItemText,
    Button
} from "@mui/material";
import { useNavigate, useParams,useLocation } from "react-router-dom";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import "../../assets/css/accountMas.css";
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { enqueueSnackbar } from "notistack";
import { getMasterPanel } from "../../services/masterPanelService";

function AccountTransfer() {
    const [allRegion, setAllRegion] = useState([])
    const [allFromTransferList, setAllFromTransferList] = useState([])
    const [allBeat, setAllBeat] = useState([])
    const [allToTransferList, setAllToTransferList] = useState([])
    const [selRegion, setSelRegion] = useState({ id: 0, reg_name: "Select" })
    const [selFromUser, setSelFromUser] = useState(null)
    const [selToUser, setSelToUser] = useState(null)
    const [selBeat, setSelBeat] = useState([])
    const [allCustomerList, setAllCustomerList] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [errors, setErrors] = useState({})
    const [modifyLoading, setModifyLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const location=useLocation()

    const [masterPanel, setMasterPanel] = useState({});

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    // ── Role-based access control (same pattern as AccountMas.jsx) ──
    // ROLES: 0 = All, 1 = Maker, 2 = Checker, 3 = View Only
    // Transfer is a data-modifying action, so it is gated the same way
    // Edit/Delete are gated in AccountMas.jsx: Checker / All only.
    const [accStat, setAccStat] = useState(null);

    useEffect(() => {
        try {
            const accStat = localStorage.getItem("acc_stat");
            setAccStat(accStat);
            console.log("Acc Stat", accStat);
        } catch (err) {
            console.log(err);
        }
    }, []);

    const canTransfer = [0, 2].includes(Number(accStat));

    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitTransferConfirmation = () => {
        showConfirmationDialog({
            title: `${masterPanel["ACCM"] || "Account"} Transfer`,
            message: `Are you sure want to Transfer ${selectedRows.length} ${masterPanel["ACCM"] || "Account"}s from ${selFromUser.user_name} 
            to ${selToUser.user_name} for Selected ${masterPanel["ACCM"] || "Account"}s??`,
            confirmText: `Yes`,
            confirmColor: "primary",
            onConfirm: () => handleTransferCustomer()
        })
    }

    useEffect(() => {
        fetchRegion()
    }, [])

    useEffect(() => {
        if (!selRegion) {
            resetFields()
            return
        }
        resetFields()
        fetchFromListTransfer(selRegion?.id)
    }, [selRegion])

    useEffect(() => {
        if (!selFromUser) {
            resetField2()
            return
        }
        resetField2()
        fetchToListTransfer(selRegion?.id, selFromUser?.id)
        fetchBeatData(selFromUser?.id)
    }, [selFromUser])

    useEffect(() => {
        if (!selBeat || selBeat.length === 0) {
            setAllCustomerList([])
            return
        }
        fetchCustomerListTransfer(selBeat)
    }, [selBeat])

    // Auto-select all rows when customer list loads
    useEffect(() => {
        if (allCustomerList.length > 0) {
            setSelectedRows(allCustomerList.map((row) => row.id))
        } else {
            setSelectedRows([])
        }
    }, [allCustomerList])

    const resetFields = () => {
        setAllBeat([])
        setAllFromTransferList([])
        setAllToTransferList([])
        setSelToUser(null)
        setSelFromUser(null)
        setSelectedRows([])
        setAllCustomerList([])
        setErrors({})
    }

    const resetField2 = () => {
        setAllBeat([])
        setAllToTransferList([])
        setSelToUser(null)
        setSelBeat([])
        setSelectedRows([])
        setAllCustomerList([])
        setErrors({})
    }

    const handleSelectAll = (e) => {
        setSelectedRows(
            e.target.checked ? allCustomerList.map((row) => row.id) : []
        )
    }

    const handleSelectRow = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        )
    }

    const fetchRegion = async () => {
        try {
            let payload = { zone_id: null }
            let response = await api.post("/getRegionList", payload)
            let regionRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllRegion([{ id: 0, reg_name: "Select" }, ...regionRes])
        }
        catch (err) {
            console.log(err)
        }
    }

    const fetchFromListTransfer = async (regid) => {
        try {
            let payload = { from_user_id: '', regId: regid }
            let response = await api.post('/getUserListTransfer', payload)
            let fromListRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllFromTransferList(fromListRes)
        }
        catch (err) {
            console.log("fetch fromList transfer err", err)
        }
    }

    const fetchToListTransfer = async (reg_id, from_id) => {
        try {
            let payload = { from_user_id: from_id, regId: reg_id }
            let response = await api.post('/getUserListTransfer', payload)
            let toTransferRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllToTransferList(toTransferRes)
        }
        catch (err) {
            console.log("Fetch to list transfer err", err)
        }
    }

    // FIX 2: Reset selBeat before setting to avoid accumulation on re-call
    const fetchBeatData = async (fromUsrId) => {
        try {
            let payload = { from_user_id: fromUsrId }
            let response = await api.post("/getUserTransferbeat", payload)
            let BeatDataRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllBeat(BeatDataRes)
            // FIX 2: Directly map to IDs instead of accumulating via spread
            setSelBeat(BeatDataRes.map((val) => val.beat_id))
        }
        catch (err) {
            console.log("fetch beat Data Err", err)
        }
    }

    // FIX 3 & 6: Accept beatIds as parameter to avoid stale closure
    const fetchCustomerListTransfer = async (beatIds) => {
        try {
            setLoading(true)
            let beatids = beatIds.join(',')
            let payload = {
                from_user_id: selFromUser.id,
                beat_id: beatids
            }
            let response = await api.post('/getCustomerListTransfer', payload)
            let customerTransferListArr = Array.isArray(response.data.data) ? response.data.data : []
            setAllCustomerList(customerTransferListArr)
        }
        catch (err) {
            console.log(err)
        }
        finally {
            setLoading(false)
        }
    }

    // FIX 4: Clean validation without ghost sentinel keys
    const validateFields = () => {
        let newErrors = {};

        if (!selRegion || selRegion.id === 0) {
            newErrors.region = true;
        }

        if (!selFromUser) {
            newErrors.fromUser = true;
        }

        if (!selToUser) {
            newErrors.toUser = true;
            toast.error(`Please Select Transfer To ${masterPanel["USER"] || "User"}`);
        }

        if (selToUser && selectedRows.length === 0) {
            newErrors.transCustomer = true;
            toast.error("Please Select Atleast 1 Customer to transfer");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleTransferCustomer = async () => {
        setModifyLoading(true)
        try {
            let payload = {
                reg_id: selRegion.id || null,
                frm_user_id: selFromUser.id,
                to_user_id: selToUser.id,
                beat_id: selBeat.join(','),
                cus_id: selectedRows.join(',')
            }
            let response = await api.post("/transferCustomerAccount", payload)
            if (response.data.success) {
                toast.success(response.data.message)
                // FIX 3: fetchBeatData sets selBeat, which triggers useEffect
                // that calls fetchCustomerListTransfer with fresh selBeat — no stale closure
                await fetchBeatData(selFromUser?.id)
            }
            else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log(err)
            toast.error("Unable to Transfer Accounts. Please refresh & Try again!!")
        }
        finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const columns = [
        {
            field: "si_no",
            headerName: "All",
            width: 50,
            renderHeader: () => (
                <Box>
                    <Typography sx={{ textAlign: 'center' }}>All</Typography>
                    <Checkbox
                        size="small"
                        checked={selectedRows.length === allCustomerList.length && allCustomerList.length > 0}
                        indeterminate={
                            selectedRows.length > 0 && selectedRows.length < allCustomerList.length
                        }
                        onChange={handleSelectAll}
                    />
                </Box>
            ),
            renderCell: (params) => (
                <Checkbox
                    size="small"
                    checked={selectedRows.includes(params.row.id)}
                    onChange={() => handleSelectRow(params.row.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
        },
        {
            field: "beat_name",
            headerName: masterPanel["BEAT"] || "Beat",
            filterable: true,
        },
        {
            field: "req_first_name",
            headerName: masterPanel["USER"] || "User",
            filterable: true,
            renderCell: (params) => (
                <Box>
                    <Typography sx={{ color: '#666666', fontSize: '12px',textWrap:'nowrap' }}>
                        {params.row.req_first_name}
                    </Typography>
                    <Box sx={{ display: 'flex',textWrap:'nowrap' }}>
                        <Typography>{params.row.usertype} |</Typography>
                        <Typography>{params.row.reg_name}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: "first_name",
            headerName: `${masterPanel["ACCM"] || "Account"} Details`,
            filterable: true,
            renderCell: (params) => (
                <Box>
                    <Box
                        sx={{
                            display: 'flex',
                            color: params.row.cus_type_id === 1
                                ? 'orange'
                                : params.row.cus_type_id === 2
                                    ? 'blue'
                                    : null,
                            fontSize: '12px'
                        }}
                    >
                        <Typography>
                            {params.row.cus_type_id === 1
                                ? "HCP|"
                                : params.row.cus_type_id === 2
                                    ? "Retailer|"
                                    : null}
                        </Typography>
                        <Typography sx={{textWrap:'nowrap'}}>{params.row.first_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography sx={{textWrap:'nowrap'}}>{params.row.cat_type}-</Typography>
                        <Typography sx={{textWrap:'nowrap'}}>{params.row.cus_freq}|</Typography>
                        <Typography sx={{textWrap:'nowrap'}}>{params.row.clinic_name}|</Typography>
                        <Typography sx={{textWrap:'nowrap'}}>{params.row.ter_name}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: "del_flag",
            headerName: "Status",
            filterable: true,
            renderCell: (params) => (
                <Box>
                    <Typography
                        sx={{
                            backgroundColor: params.row.del_flag === 0
                                ? "#4bdb5c"
                                : params.row.del_flag === 1
                                    ? "#e84e40"
                                    : null,
                            color: 'white',
                            textAlign: 'center',
                            borderRadius: '10px',
                            width: '4.6rem'
                        }}
                    >
                        {params.row.del_flag === 0
                            ? "Active"
                            : params.row.del_flag === 1
                                ? "Inactive"
                                : null}
                    </Typography>
                </Box>
            )
        },
    ]

    return (
        <Layout     
            breadcrumb={ [
          { label: "Home", path: "/" },
          { label: masterPanel["ACCM"] || "Account", path: location.pathname },
          { label: `${masterPanel["ACCM"] || "Account"} Transfer` },
        ]}
        >
            <Box p={0.5}>
                <Box
                    p={2}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                >
                    <Box>
                        <h2 className="mainTitle">{masterPanel["ACCM"] || "Account"} Transfer</h2>
                    </Box>
                    <Box sx={{
                        mb: 0.5,
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px",
                    }}>
                        <Grid container spacing={0.95}>
                        <Grid size={{ md: 3.3, lg:2.3, xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <Autocomplete
                                options={allRegion}
                                getOptionLabel={(option) => option.reg_name || ""}
                                getOptionKey={(option) => option.id}
                                onChange={(e, newValue) => setSelRegion(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`${masterPanel["REGN"] || "Region"} *`}
                                        size="small"
                                        error={!!errors.region}
                                        helperText={errors.region ? `Please Select ${masterPanel["ZONE"] || "Zone"}` : ""}
                                    />
                                )}
                            />
                        </FormControl>
                        </Grid>
                        <Grid size={{ md: 3.3, lg: 2.3, xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <Autocomplete
                                options={allFromTransferList}
                                getOptionLabel={(option) => option.user_name || ""}
                                getOptionKey={(option) => option.id}
                                onChange={(e, newValue) => setSelFromUser(newValue)}
                                value={selFromUser}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`From ${masterPanel["USER"] || "User"} *`}
                                        size="small"
                                        error={!!errors.fromUser}
                                        helperText={errors.fromUser ? `Please Select Transfer From ${masterPanel["USER"] || "User"}` : ""}
                                    />
                                )}
                            />
                            <Box>
                                {allBeat.length > 0 && <Typography sx={{ mb: 1, mt: 0.5 }}>{masterPanel["BEAT"] || "Beat"} Mapped*</Typography>}
                            </Box>
                            {allBeat.map((val) => (
                                <MenuItem
                                    key={val.beat_id}
                                    value={val.beat_id}
                                    sx={{ p: 0, mt: '-0.9rem' }}
                                    onClick={() => {
                                        const isSelected = selBeat.includes(val.beat_id);

                                        // FIX 1: return early to prevent removing last beat
                                        if (isSelected && selBeat.length === 1) {
                                            toast.error(`Please Select At Least 1 ${masterPanel["BEAT"] || "Beat"} to Load`);
                                            return;
                                        }

                                        setSelBeat((prev) =>
                                            isSelected
                                                ? prev.filter((beat_id) => beat_id !== val.beat_id)
                                                : [...prev, val.beat_id]
                                        );
                                    }}
                                >
                                    <Checkbox checked={selBeat.includes(val.beat_id)} />
                                    <ListItemText primary={val.beat_name} />
                                </MenuItem>
                            ))}
                        </FormControl>
                        </Grid>
                        <Grid size={{ md: 3.3, lg: 2.3, xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <Autocomplete
                                options={allToTransferList}
                                getOptionLabel={(option) => option.user_name || ""}
                                getOptionKey={(option) => option.id}
                                onChange={(e, newValue) => setSelToUser(newValue)}
                                value={selToUser}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`To ${masterPanel["USER"] || "User"} *`}
                                        size="small"
                                        error={!!errors.toUser}
                                        helperText={errors.toUser ? `Please Select Transfer To ${masterPanel["USER"] || "User"}` : ""}
                                    />
                                )}
                            />
                        </FormControl>
                        </Grid>
                        </Grid>
                    </Box>

                    <Box>
                        {allCustomerList.length > 0 && (
                            <Box>
                                <DataTable
                                    columns={columns}
                                    data={allCustomerList}
                                    defaultPageSize={10}
                                    loading={loading}
                                    sx={{
                                        backgroundColor: "#fff",
                                        borderRadius: "10px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                                    }}
                                />
                                {canTransfer && (
                                    <Button
                                        onClick={() => {
                                            if (validateFields()) {
                                                showSubmitTransferConfirmation()
                                            }
                                        }}
                                        variant="contained"
                                        sx={{ mt: 3, ml: 2, mb: 2, textTransform: 'none' }}
                                    >
                                        Transfer
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
                <ConfirmationDialog
                    open={confirmationDialog.open}
                    onClose={closeConfirmationDialog}
                    onConfirm={confirmationDialog.onConfirm}
                    title={confirmationDialog.title}
                    message={confirmationDialog.message}
                    confirmText={confirmationDialog.confirmText}
                    loading={modifyLoading}
                    cancelText={confirmationDialog.cancelText}
                    confirmColor={confirmationDialog.confirmColor}
                />
            </Box>
        </Layout>
    )
}

export default AccountTransfer;