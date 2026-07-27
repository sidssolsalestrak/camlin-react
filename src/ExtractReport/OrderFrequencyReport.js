import { useEffect, useState } from "react";
import Layout from "../layout";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import {
    Box, Button, FormControl, InputLabel, Select, MenuItem, Typography, TextField, Autocomplete, Dialog, DialogContent, DialogActions, Grid
} from "@mui/material";
import useToast from "../utils/useToast";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CircularProgress from "../utils/CircularProgressLoading";
import { AiOutlineFileExcel } from "react-icons/ai";
import dayjs from "dayjs";
import { DownloadCSV } from "../utils/Download CSV/DownloadCSV";
import { PiWarningCircleLight } from "react-icons/pi";
import { useParams, useNavigate } from "react-router-dom";
import { getMasterPanel } from "../services/masterPanelService";

// ─── Helper: inject zone subtotal rows ───────────────────────────────────────
const getDataWithZoneTotals = (data) => {
    if (!data || !data.length) return [];

    // Group rows by zone_name
    const grouped = {};
    const zoneOrder = [];

    data.forEach((row) => {
        const key = row.zone_name || "Unknown";
        if (!grouped[key]) {
            grouped[key] = [];
            zoneOrder.push(key);
        }
        grouped[key].push(row);
    });

    const result = [];
    let grandTotalOrders = 0;
    let grandTotalSku = 0;
    let grandTotalQty = 0;
    let grandTotalVal = 0;

    zoneOrder.forEach((zoneName) => {
        const rows = grouped[zoneName];
        result.push(...rows);

        // Calculate zone subtotals
        const totalOrders = rows.reduce((sum, r) => sum + (Number(r.mtd_tot_pc) || 0), 0);
        const totalSku = rows.reduce((sum, r) => sum + (Number(r.tot_prod) || 0), 0);
        const totalQty = rows.reduce((sum, r) => sum + (Number(r.ord_qty) || 0), 0);
        const totalVal = rows.reduce((sum, r) => sum + (Number(r.ord_val) || 0), 0);

        grandTotalOrders += totalOrders;
        grandTotalSku += totalSku;
        grandTotalQty += totalQty;
        grandTotalVal += totalVal;

        // Inject a zone subtotal row
        result.push({
            id: `zone_total_${zoneName}`,
            call_date: "",
            full_name: "",
            hq_name: "",
            area_name: "",
            cus_code: "",
            cus_name: "",
            freq_name: "",
            beat_name: `Total ${zoneName}`,
            mtd_tot_pc: totalOrders,
            tot_prod: totalSku,
            ord_qty: totalQty,
            ord_val: totalVal,
            _isSubtotal: true,
        });

        result.push({
            id: `grand_total_${zoneName}`,
            call_date: "",
            full_name: "",
            hq_name: "",
            area_name: "",
            cus_code: "",
            cus_name: "",
            freq_name: "",
            beat_name: `Grand Total`,
            mtd_tot_pc: grandTotalOrders,
            tot_prod: grandTotalSku,
            ord_qty: grandTotalQty,
            ord_val: grandTotalVal,
            _isSubtotal: true,
            _isGrandTotal: true
        })
    });

    return result;
};

function OrderFrequencyReport() {
    const { type, enmonth, zoneId, regId, userId } = useParams();
    const navigate = useNavigate();

    const decodeType = type !== 'undefined' && type != null ? atob(type) : null;
    const decodeMonth = enmonth !== 'undefined' && enmonth != null ? atob(enmonth) : null;
    const decodeZoneId = zoneId !== 'undefined' && zoneId != null ? atob(zoneId) : 0;
    const decodeRegId = regId !== 'undefined' && regId != null ? atob(regId) : 0;
    const decodeUserId = userId !== 'undefined' && userId != null ? atob(userId) : 0;

    const [selType, setSelType] = useState(decodeType || 1);
    const [selMonth, setSelMonth] = useState(decodeMonth ? dayjs(decodeMonth) : dayjs());
    const [selZone, setSelZone] = useState(Number(decodeZoneId));
    const [selRegion, setSelRegion] = useState(Number(decodeRegId));
    const [allZone, setAllZone] = useState([]);
    const [allRegion, setAllRegion] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [selUsers, setSelUsers] = useState({ id: Number(decodeUserId) || 0, u_name: "All" });
    const [AllDayWiseRepData, setAllDayWiseRepData] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loadedType, setLoadedType] = useState(false);
    const [warningDialog, setWarningDialog] = useState(false);
    const [zoneNullErr, setZoneNullErr] = useState(false);
    const toast = useToast();
    const [loading, setloading] = useState(false)

    const [masterPanel, setMasterPanel] = useState({});

    // labels derived from masterPanel with fallbacks
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const userLabel = masterPanel["USER"] || "Users";
    const beatLabel = masterPanel["BEAT"] || "Beat";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    // Initial zone load 
    useEffect(() => {
        fetchReportZone();
    }, []);

    console.log("decoded params", decodeType, decodeMonth, decodeZoneId, decodeRegId, decodeUserId);

    //Auto-fetch when navigated with encoded params
    useEffect(() => {
        if (decodeType !== 'undefined' && decodeType) {
            fetchDayWiseReport();
        }
    }, [decodeMonth, decodeRegId, decodeType, decodeUserId, decodeZoneId]);

    useEffect(() => {
        if (!selZone) {
            setSelRegion(0);
            setAllRegion([]);
            return
        }
        if (selZone) fetchRegionList(selZone);
    }, [selZone]);

    useEffect(() => {
        if (!selZone) {
            setSelUsers({ id: 0, u_name: "All" });
        }
        fetchSSUserList();
    }, [selZone, selRegion]);

    useEffect(() => {
        if (!decodeUserId && allUsers) return;
        let UserData = allUsers.find((val) => val.id === Number(decodeUserId)) ?? { id: 0, u_name: "All" };
        console.log("selc user data", UserData);
        setSelUsers(UserData);
    }, [allUsers, decodeUserId]);

    const fetchReportZone = async () => {
        try {
            let response = await api.post('/getReportsZone');
            let zoneRes = Array.isArray(response.data.data) ? response.data.data : [];
            setAllZone(zoneRes);
        } catch (err) {
            console.log("fetching zone err", err);
        }
    };

    const fetchRegionList = async (zoneId) => {
        try {
            const r = await api.post("/extractRegionList", { zone_id: zoneId });
            setAllRegion(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) {
            console.log(e);
        }
    };

    const fetchSSUserList = async () => {
        try {
            let payload = { zone_id: selZone, reg_id: selRegion, user_type: 8 };
            let response = await api.post("/getExtractSSUserList", payload);
            let userListRes = Array.isArray(response.data.data) ? response.data.data : [];
            setAllUsers(userListRes);
        } catch (err) {
            console.log("fetching ssuserlist err", err);
        }
    };

    const fetchDayWiseReport = async () => {
        try {
            setloading(true)
            if (Number(selZone) === 0) {
                setZoneNullErr(true);
                setWarningDialog(true);
                return;
            } else {
                setZoneNullErr(false);
            }

            let payload = {
                type: selType,
                zone_id: selZone,
                reg_id: selRegion,
                user_id: selUsers.id,
                month: selMonth,
            };

            if (Number(selType) === 2) {
                setLoadedType(true);
            } else {
                setLoadedType(false);
            }

            let response = await api.post("/view_day_wise_report", payload);
            let DaywiserepRes = Array.isArray(response.data.data) ? response.data.data : [];
            setAllDayWiseRepData(DaywiserepRes);
        } catch (err) {
            console.log("fetching Daywise Report Error", err);
        }finally{
            setloading(false)
        }
    };

    const fetchDayWiseReportExcel = async () => {
        try {
            let payload = {
                type: selType,
                zone_id: selZone,
                reg_id: selRegion,
                user_id: selUsers.id,
                month: selMonth,
            };

            if (Number(selType) === 2) {
                setLoadedType(true);
            } else {
                setLoadedType(false);
            }

            let response = await api.post("/view_day_wise_report", payload);
            let DaywiserepRes = Array.isArray(response.data.data) ? response.data.data : [];
            return DaywiserepRes;
        } catch (err) {
            console.log("fetching Daywise Report Excel Error", err);
            return [];
        }
    };


    const encodeAndNavigate = () => {
        if (Number(selZone) === 0) {
            setZoneNullErr(true);
            setWarningDialog(true);
            return;
        } else {
            setZoneNullErr(false);
        }

        const encType = btoa(selType);
        const encMonth = btoa(selMonth ? selMonth.format("YYYY-MM") : dayjs().format("YYYY-MM"));
        const encZone = btoa(selZone);
        const encReg = btoa(selRegion);
        const encUser = btoa(selUsers?.id ?? 0);

        navigate(`/reports/day_wise_report/${encType}/${encMonth}/${encZone}/${encReg}/${encUser}`);
    };


    const subtotalSx = (isSubtotal) => ({
        fontWeight: isSubtotal ? 700 : 400,
        textAlign: 'right',
    });


    const columns = [
        loadedType && {
            field: 'call_date',
            headerName: 'Order Month',
            renderCell: (row) => (
                <Typography>{row.value ? dayjs(row.value).format("DD MMM YYYY") : ''}</Typography>
            )
        },
        {
            field: 'full_name',
            headerName: "Sales Person",
            renderCell: (params) =>
                params.row._isSubtotal ? null : (
                    <Box>
                        <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
                        <Typography sx={{ fontSize: '9px' }}>HQ:{params.row.hq_name}</Typography>
                    </Box>
                ),
        },
        {
            field: 'area_name',
            headerName: areaLabel,
            renderCell: (params) =>
                params.row._isSubtotal ? null : (
                    <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
                ),
        },
        {
            field: 'cus_code',
            headerName: "Customer Code",
            renderCell: (params) => params.row._isSubtotal ? null : params.value,
        },
        {
            field: 'cus_name',
            headerName: "Customer Name",
            renderCell: (params) => params.row._isSubtotal ? null : params.value,
        },
        {
            field: 'freq_name',
            headerName: "Visit Frequency",
            renderCell: (params) => params.row._isSubtotal ? null : params.value,
        },
        {
            field: 'beat_name',
            headerName: beatLabel,
            width: 40,
            renderCell: (params) => (
                <Typography sx={{
                    textWrap: 'nowrap',
                    fontWeight: params.row._isSubtotal ? 700 : 400,
                    textAlign: params.row._isSubtotal ? 'right' : 'left',
                    width: '100%',
                    color: '#555'
                }}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'mtd_tot_pc',
            headerName: "No. Of Orders",
            renderCell: (params) => (
                <Typography sx={subtotalSx(params.row._isSubtotal)}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'tot_prod',
            headerName: "Distinct Sku",
            renderCell: (params) => (
                <Typography sx={subtotalSx(params.row._isSubtotal)}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'ord_qty',
            headerName: "Ord. Qty",
            renderCell: (params) => (
                <Typography sx={subtotalSx(params.row._isSubtotal)}>
                    {params.value}
                </Typography>
            ),
        },
        {
            field: 'ord_val',
            headerName: "Ord. Value",
            type: 'number',
            renderCell: (params) => (
                <Typography sx={subtotalSx(params.row._isSubtotal)}>
                    {params.row._isSubtotal
                        ? Number(params.value).toFixed(2)
                        : params.value}
                </Typography>
            ),
        },
    ].filter(Boolean);


    const ExcelColumns = [
        ...(loadedType ? [{ field: 'call_date', headerName: 'Order Month', type: 'date' }] : []),
        { field: 'zone_name', headerName: zoneLabel },
        { field: 'full_name', headerName: "Sales Person" },
        { field: 'hq_name', headerName: "HQ Name" },
        { field: 'area_name', headerName: areaLabel },
        { field: 'cus_code', headerName: "Customer Code" },
        { field: 'cus_name', headerName: "Customer Name" },
        { field: 'freq_name', headerName: "Visit Frequency" },
        { field: 'beat_name', headerName: beatLabel },
        { field: 'mtd_tot_pc', headerName: "No. Of Orders" },
        { field: 'tot_prod', headerName: "Distinct Sku" },
        { field: 'ord_qty', headerName: "Ord. Qty" },
        { field: 'ord_val', headerName: "Ord. Value" },
    ];

    const handleDownloadExcel = async () => {
        try {
            const excelData = await fetchDayWiseReportExcel();
            const safeColumns = ExcelColumns.map(({ renderCell, renderHeader, ...rest }) => rest);
            DownloadCSV(excelData, safeColumns, "Order_Frequency_Report", setProgress, toast);
        } catch (err) {
            console.log("Download excel Error", err);
        }
    };

    const tableData = getDataWithZoneTotals(AllDayWiseRepData);


    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: "/reports/day_wise_report" },
            { label: "Order Frequency Report", path: "/reports/day_wise_report" },
        ]}>
            <Box p={0.5}>
                <Box p={2} display="flex" flexDirection="column" gap={2}>
                    <h1 className="mainTitle">Order Frequency Report</h1>
                </Box>
            </Box>


            <Box sx={{
                mx: 1.5,
                backgroundColor: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                padding: "16px 18px",
                borderRadius: "10px",
            }}>
                <Grid container spacing={0.95}>
                    <Grid size={{ md: 3, lg: 2.3, xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id='type'>Type</InputLabel>
                            <Select
                                value={selType}
                                labelId="type"
                                label='Type'
                                size="small"
                                onChange={(e) => setSelType(e.target.value)}
                            >
                                <MenuItem value={1}>Month Wise</MenuItem>
                                <MenuItem value={2}>Day Wise</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Month"
                                    views={["month", "year"]}
                                    format="MMM YYYY"
                                    value={selMonth}
                                    onChange={(v) => setSelMonth(v)}
                                    slotProps={{
                                        textField: {
                                            size: "small",
                                            className: "date-input",
                                        },
                                    }}
                                    maxDate={dayjs()}
                                />
                            </LocalizationProvider>
                        </FormControl>
                    </Grid>
                    <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id="zone">{zoneLabel}</InputLabel>
                            <Select
                                value={selZone}
                                onChange={(e) => setSelZone(e.target.value)}
                                labelId="zone"
                                label={zoneLabel}
                                size="small"
                                error={zoneNullErr}
                                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                            >
                                <MenuItem value={0}>All</MenuItem>
                                {allZone.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.zone_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id='region'>{regionLabel}</InputLabel>
                            <Select
                                labelId="region"
                                onChange={(e) => setSelRegion(e.target.value)}
                                label={regionLabel}
                                size="small"
                                value={selRegion}
                                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                            >
                                <MenuItem value={0}>All</MenuItem>
                                {allRegion.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                        <FormControl fullWidth sx={{ height: '3rem' }}>
                            <Autocomplete
                                options={[{ id: 0, u_name: "All" }, ...allUsers]}
                                getOptionLabel={(option) => option.u_name}
                                value={selUsers}
                                onChange={(event, newValue) => setSelUsers(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={userLabel}
                                        size="small"
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />
                        </FormControl>
                    </Grid>
                    <Grid size={{ md: 1.3, lg: 1, xs: 3, sm: 2 }}>
                        <Button onClick={encodeAndNavigate} variant="contained" sx={{ width: '2rem' }}>
                            Load
                        </Button>
                    </Grid>
                    <Grid size={{ md: 1, lg: 0.5, xs: 2, sm: 1 }}>
                        {progress ? (
                            <CircularProgress progress={progress} />
                        ) : (
                            <span onClick={handleDownloadExcel} style={{ cursor: 'pointer' }}>
                                <AiOutlineFileExcel style={{ color: "green", height: "30px", width: "30px" }} />
                            </span>
                        )}
                    </Grid>
                </Grid>
            </Box>


            <Box sx={{ p: 1.5 }}>
                <DataTable
                    data={tableData}
                    columns={columns}
                    hideSubHeader
                    grandTotal={true}
                    loading={loading}
                    getRowClassName={(params) =>
                        params.row._isSubtotal ? 'zone-subtotal-row' : ''
                    }
                    rowStyle={(row) => {
                        if (row._isGrandTotal) return { "& td": { backgroundColor: "#bdbdbd !important", fontWeight: 600, color: '#555 !important' } };
                        if (row._zoneTotal) return { "& td": { backgroundColor: "#e0e0e0 !important", fontWeight: 600, color: '#555 !important' } };
                        if (row._isSubtotal) return { "& td": { backgroundColor: "#eeeeee !important", fontWeight: 600, color: '#555 !important' } };
                        return {};
                    }}
                    sx={{
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",

                    }}
                />
            </Box>


            <Dialog open={warningDialog} maxWidth="xs" PaperProps={{ sx: { width: '320px' } }}>
                <DialogContent>
                    <Box sx={{ textAlign: 'center' }}>
                        <PiWarningCircleLight size={80} color="#F8BB86" />
                    </Box>
                    <Typography sx={{ color: '#797979', fontWeight: 500, fontSize: '1.2rem', textAlign: 'center' }}>
                        You can View Report only {zoneLabel}wise!. Please Select {zoneLabel}. For All Consolidated Report Please Use Excel Export Option.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Button sx={{ width: '4rem' }} onClick={() => setWarningDialog(false)} variant="contained">
                            OK
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}

export default OrderFrequencyReport;