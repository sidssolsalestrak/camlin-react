import { useState, useMemo, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import {
    Box, Typography, Button, FormControl, Select, MenuItem, InputLabel, Grid, Dialog, DialogContent, DialogActions, IconButton,
    DialogTitle
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DataTable from "../../utils/dataTable";
import CloseIcon from "@mui/icons-material/Close";
import { AiOutlineFileExcel } from "react-icons/ai";
import CircularProgress from "../../utils/CircularProgressLoading";
import { MdOutlineLoop } from "react-icons/md";
import DayWiseSalesChart from "./primarySalesGraph";
import useToast from "../../utils/useToast";
import ConfirmationDialog from "../../utils/confirmDialog";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Download } from "../../utils/downloadExcel/Download";
import { downloadPrimarySalesExcelWithChart } from './DownLoadPrimarySalesExcel'

function PrimarySalesAnalze() {
    const { enMonth, enCatType } = useParams()
    const decodeEnMonth = enMonth !== 'undefined' && enMonth ? dayjs(atob(enMonth)) : dayjs()
    const decodeCatType = enCatType !== 'undefined' && enCatType ? atob(enCatType) : 4
    const [selMonth, setSelMonth] = useState(decodeEnMonth);
    const [selType, setSelType] = useState(decodeCatType);
    const [selTypeName, setSelTypeName] = useState("Category Wise");
    const [progress, setProgress] = useState(null);
    const [allPrimaryData, setAllPrimaryData] = useState([]);
    const [graphdataDialog, setGraphDialog] = useState(false)
    const [allGraphData, setAllGraphData] = useState([])
    const [modifyLoading, setModifyLoading] = useState(false)
    const [showTable, setShowTable] = useState(false)
    var now=dayjs()
    var dateLabel=''
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false, title: "", message: "", onConfirm: null,
        loading: false, confirmText: "Confirm", cancelText: "Cancel", confirmColor: "primary"
    })

    const allTypeNames = [
        { value: 4, label: "Category Wise" },
        { value: 1, label: "Range Wise" },
        { value: 2, label: "Channel Wise" },
        { value: 3, label: "SKU Wise" },
    ];

    const zeroToNull = (val) =>
        val === 0 || val === null || val === undefined ? "-" : val;

    const redIfNegative = (val) => (
        <span style={{ color: val < 0 ? "red" : "inherit" }}>
            {zeroToNull(val)}
        </span>
    );

    const bold = (val) => <strong>{zeroToNull(val)}</strong>;

    // name field per type — stays in sync with selType via useMemo
    const nameField = useMemo(() => (
        decodeCatType == 1 ? "sub_name"
            : decodeCatType == 2 ? "channel_name"
                : decodeCatType == 3 ? "prod_name"
                    : "cat_name"
    ), [decodeCatType]);

    const showConfirmationDialog = (config) => {
        setConfirmationDialog(prev => ({ ...prev, ...config, open: true }))
    }

    const closeConfirmationDialog = () => {
        setConfirmationDialog(prev => ({ ...prev, open: false, loading: false }))
    }

    const showSubmitConfirmation = () => {
        showConfirmationDialog({
            title: `Confirm Render`,
            message: `Are you sure to Render Data for ${selMonth.format("MMM YYYY")} month?`,
            confirmText: 'Yes',
            confirmColor: "primary",
            onConfirm: () => renderPrimarySalesAnalyse()
        })
    }

    useEffect(() => {
        console.log("fetching Sales Analysis Data")
        if (enMonth) {
            setShowTable(true)
        }
        fetchSaleAnalysisData()
    }, [enMonth, enCatType, location.pathname])


    const fetchSaleAnalysisData = async () => {
        try {
            const payload = { month: selMonth, selType, groupName: selTypeName };
            const response = await api.post("/monthlySalesDashboard", payload);
            const primaryres = Array.isArray(response.data.primarydata)
                ? response.data.primarydata
                : [];
            const primaryGraphRes = Array.isArray(response.data.primaryGraph) ? response.data.primaryGraph : []
            setAllGraphData(primaryGraphRes)
            const mapped = primaryres.map(row => {
                const sale_qty = Number(row.sale_qty) || 0;
                const free_qty = Number(row.free_qty) || 0;
                const fy_sale_qty = Number(row.fy_sale_qty) || 0;
                const fy_free_qty = Number(row.fy_free_qty) || 0;
                const lym_sale_qty = Number(row.lym_sale_qty) || 0;
                const ly_sale_qty = Number(row.ly_sale_qty) || 0;

                const totalqty = sale_qty + free_qty;
                const growthqty = totalqty - lym_sale_qty;
                const percentage = lym_sale_qty > 0
                    ? +((totalqty / lym_sale_qty * 100) - 100).toFixed(2) : 0;

                const fytotalqty = fy_sale_qty + fy_free_qty;
                const fyGrowthqty = fytotalqty - ly_sale_qty;
                const fypercentage = ly_sale_qty > 0
                    ? +((fytotalqty / ly_sale_qty * 100) - 100).toFixed(2) : 0;

                return {
                    ...row,
                    sale_qty, free_qty, fy_sale_qty, fy_free_qty, lym_sale_qty, ly_sale_qty,
                    totalqty, growthqty, percentage,
                    fytotalqty, fyGrowthqty, fypercentage,
                };
            });

            const totals = mapped.reduce((acc, row) => ({
                sale_qty: acc.sale_qty + (Number(row.sale_qty) || 0),
                free_qty: acc.free_qty + (Number(row.free_qty) || 0),
                totalqty: acc.totalqty + (Number(row.totalqty) || 0),
                lym_sale_qty: acc.lym_sale_qty + (Number(row.lym_sale_qty) || 0),
                growthqty: acc.growthqty + (Number(row.growthqty) || 0),
                fy_sale_qty: acc.fy_sale_qty + (Number(row.fy_sale_qty) || 0),
                fy_free_qty: acc.fy_free_qty + (Number(row.fy_free_qty) || 0),
                fytotalqty: acc.fytotalqty + (Number(row.fytotalqty) || 0),
                ly_sale_qty: acc.ly_sale_qty + (Number(row.ly_sale_qty) || 0),
                fyGrowthqty: acc.fyGrowthqty + (Number(row.fyGrowthqty) || 0),
            }), {
                sale_qty: 0, free_qty: 0, totalqty: 0, lym_sale_qty: 0, growthqty: 0,
                fy_sale_qty: 0, fy_free_qty: 0, fytotalqty: 0, ly_sale_qty: 0, fyGrowthqty: 0,
            });

            console.log("totals in sales Analysis", totals);

            const grandRow = {
                ...totals,
                [nameField]: "TOTAL",
                percentage: totals.lym_sale_qty > 0
                    ? +((totals.totalqty / totals.lym_sale_qty * 100) - 100).toFixed(2) : 0,
                fypercentage: totals.ly_sale_qty > 0
                    ? +((totals.fytotalqty / totals.ly_sale_qty * 100) - 100).toFixed(2) : 0,
                isTotal: true,
            };

            setAllPrimaryData([...mapped, grandRow]);

        } catch (err) {
            console.log("sales Analysis Err", err);
        }
    };

    const selectedMonth = dayjs(decodeEnMonth);

    if (now.format('MM-YYYY') === selectedMonth.format('MM-YYYY')) {
           
         dateLabel = ' /  as of ' + selectedMonth.format('DD MMM YYYY hh:mm a');
    }
     else {
        dateLabel = ' /  as of ' + selectedMonth.endOf('month').format('DD MMM YYYY 00:00:a');
    }

    const renderPrimarySalesAnalyse = async () => {
        setModifyLoading(true)
        try {
            let payload = {
                month: selMonth ? dayjs(selMonth).format('YYYY-MM-DD') : null
            }
            let renderResponse = await api.post("/renderPrimarySales", payload)
            if (renderResponse.data.status === 200) {
                toast.success(renderResponse.data.message)
            }
            else {
                toast.error("Something went wrong try again!")
            }

        }
        catch (err) {
            console.log("render Analyse Error", err)
            toast.error("Something went wrong try again!")
        }
        finally {
            setModifyLoading(false)
            closeConfirmationDialog()
        }
    }

    const handleLoad = () => {
        setShowTable(true)
        try {
            const encMonth = btoa(selMonth ? selMonth.format("YYYY-MM") : dayjs().format("YYYY-MM"));
            const enType = btoa(selType)
            navigate(`/dashboard/primarysalesview/${encMonth}/${enType}`)

        }
        catch (err) {
            console.log("navigation Error", err)
        }
    }


    const column = useMemo(() => [
        {
            field: nameField,
            headerName: `${selTypeName} Sales`,
            renderHeader: () => (
                <Typography sx={{ textAlign: "left", fontWeight: 600 }}>
                    {selTypeName} Sales
                </Typography>
            ),
            renderCell: (params) => {
                const row = params?.row ?? params;
                return (
                    <span style={{ fontWeight: row.isTotal ? 600 : "normal" }}>
                        {row[nameField]}
                    </span>
                );
            },
            subColumns: [
                {
                    field: nameField,
                    headerName: `${selTypeName} Name`,
                    renderCell: (params) => {
                        const row = params?.row ?? params;
                        return (
                            <span style={{ fontWeight: row.isTotal ? 600 : "normal" }}>
                                {row[nameField]}
                            </span>
                        );
                    },
                }
            ]
        },
        {
            field: "",
            headerName: "MONTH TO DATE",
            subColumns: [
                {
                    field: "sale_qty",
                    headerName: "Sales",
                    renderCell: (params) => zeroToNull(params.row?.sale_qty ?? params.sale_qty),
                },
                {
                    field: "free_qty",
                    headerName: "Free",
                    renderCell: (params) => zeroToNull(params.row?.free_qty ?? params.free_qty),
                },
                {
                    field: "totalqty",
                    headerName: "Total",
                    renderCell: (params) => bold(params.row?.totalqty ?? params.totalqty),
                },
                {
                    field: "lym_sale_qty",
                    headerName: `${dayjs(selMonth).subtract(1, "year").format("MMM YYYY")}`,
                    renderCell: (params) => zeroToNull(params.row?.lym_sale_qty ?? params.lym_sale_qty),
                },
                {
                    field: "growthqty",
                    headerName: "Growth Qty",
                    renderCell: (params) => zeroToNull(params.row?.growthqty ?? params.growthqty),
                },
                {
                    field: "percentage",
                    headerName: "%age",
                    renderCell: (params) => redIfNegative(params.row?.percentage ?? params.percentage),
                },
            ]
        },
        {
            field: "",
            headerName: "YEAR TO DATE",
            subColumns: [
                {
                    field: "fy_sale_qty",
                    headerName: "Sales",
                    renderCell: (params) => zeroToNull(params.row?.fy_sale_qty ?? params.fy_sale_qty),
                },
                {
                    field: "fy_free_qty",
                    headerName: "Free",
                    renderCell: (params) => zeroToNull(params.row?.fy_free_qty ?? params.fy_free_qty),
                },
                {
                    field: "fytotalqty",
                    headerName: "Total",
                    renderCell: (params) => bold(params.row?.fytotalqty ?? params.fytotalqty),
                },
                {
                    field: "ly_sale_qty",
                    headerName: `FY ${dayjs(selMonth).subtract(1, "year").format("YYYY")}`,
                    renderCell: (params) => zeroToNull(params.row?.ly_sale_qty ?? params.ly_sale_qty),
                },
                {
                    field: "fyGrowthqty",
                    headerName: "Growth Qty",
                    renderCell: (params) => zeroToNull(params.row?.fyGrowthqty ?? params.fyGrowthqty),
                },
                {
                    field: "fypercentage",
                    headerName: "%age",
                    renderCell: (params) => redIfNegative(params.row?.fypercentage ?? params.fypercentage),
                },
            ]
        }
    ], [nameField, decodeCatType, selMonth]);


    const excelColumn = [
        {
            field: "sale_day",
            headerName: "Date"
        },
        {
            field: "cm_qty1",
            headerName: "CM"
        },
        {
            field: "lm_qty1",
            headerName: "LM"
        },
        {
            field: "lym_qty1",
            headerName: "LY"
        }
    ]

    const graphDataColumn = [
        {
            field: "sale_day",
            headerName: "Day"
        },
        {
            field: "cm_qty",
            headerName: `Current Month(${dayjs(selMonth).format('MMM YYYY')})`,
            renderCell: (params) => (
                <Typography>{zeroToNull(Math.round(params.value, 2))}</Typography>
            )
        },
        {
            field: "lm_qty",
            headerName: `Last Month(${dayjs(selMonth).subtract(1, "month").format('MMM YYYY')})`,
            renderCell: (params) => (
                <Typography>{zeroToNull(Math.round(params.value, 2))}</Typography>
            )
        },
        {
            field: "lym_qty",
            headerName: `Last Year(${dayjs(selMonth).subtract(1, "year").format('YYYY')})`,
            renderCell: (params) => (
                <Typography>{zeroToNull(Math.round(params.value, 2))}</Typography>
            )
        },
    ]

    const handleDownloadExcel = async () => {
        downloadPrimarySalesExcelWithChart({
            graphData: allGraphData,
            primaryData: allPrimaryData,
            nameField,                          // already computed via useMemo
            selTypeName,
            selMonth,
            selectedMonthStr: dayjs(selMonth).format("YYYY-MM"),
            dateLabel
        });

    }

    console.log("All primary Data", allPrimaryData);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "DashBoard", path: "/dashboard/primarysalesview" },
            { label: "Primary Analysis", path: "/dashboard/primarysalesview" },
            { label: `Primary Sales`, path: "/dashboard/primarysalesview" },
        ]}>
            <Box p={0.5}>
                <Box p={2} sx={{ borderRadius: 1 }} display="flex" flexDirection="column" gap={2}>
                    <Box>
                        <h1 className="mainTitle">Primary Sales Dashboard</h1>
                    </Box>

                    {/* ── Filter Bar ── */}
                    <Box sx={{
                        mb: 0.5,
                        backgroundColor: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px",
                    }}>
                        <Grid container spacing={0.95}>

                            {/* Month picker */}
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
                                                textField: { size: "small", className: "date-input" },
                                            }}
                                            maxDate={dayjs()}
                                        />
                                    </LocalizationProvider>
                                </FormControl>
                            </Grid>

                            {/* Type selector */}
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel id="type">Type</InputLabel>
                                    <Select
                                        labelId="type"
                                        label="Type"
                                        size="small"
                                        value={selType}
                                        onChange={(e) => {
                                            const selected = allTypeNames.find(t => t.value === e.target.value);
                                            setSelType(e.target.value);
                                            setSelTypeName(selected?.label ?? "Category Wise");
                                        }}
                                    >
                                        {allTypeNames.map((val) => (
                                            <MenuItem key={val.value} value={val.value}>
                                                {val.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Load button */}
                            <Grid size={{ md: 1.5, lg: 1, xs: 3.5, sm: 1.5 }}>
                                <Button onClick={() => handleLoad()} variant="contained">
                                    Load
                                </Button>
                            </Grid>

                            {/* Excel export */}
                            <Grid size={{ md: 1.5, lg: 1, xs: 2.5, sm: 1.2 }}>
                                {progress ? (
                                    <CircularProgress progress={progress} />
                                ) : (
                                    <span style={{ cursor: "pointer" }} onClick={() => handleDownloadExcel()}>
                                        <AiOutlineFileExcel
                                            style={{ color: "green", height: "30px", width: "30px" }}
                                        />
                                    </span>
                                )}
                            </Grid>

                            {/* Render button */}
                            <Grid size={{ md: 5, lg: 5, xs: 12, sm: 6 }}>
                                <Box sx={{ display: "flex", justifyContent: { lg: "end", md: "start", sm: "start", xs: "start" } }}>
                                    <Button variant="contained" color="warning" onClick={() => showSubmitConfirmation()}>
                                        <MdOutlineLoop size={15} /> Render
                                    </Button>
                                </Box>
                            </Grid>

                        </Grid>
                    </Box>
                    <Box>
                        {showTable && (
                            <Box  sx={{
                                        backgroundColor: "#fff",
                                        borderRadius: "10px",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                                    }}>
                                <Typography sx={{ fontStyle: 'italic', textAlign: 'center',pt:2 }}>{`* Qty in Pcs${dateLabel}`}</Typography>
                                <DataTable
                                    searchable={false}
                                    columns={column}
                                    data={allPrimaryData}
                                    showHeader={false}
                                    getRowClassName={(row) => row.isTotal ? "total-row" : ""}
                                />
                            </Box>
                        )}
                    </Box>
                    {showTable && (<Button sx={{ width: '2rem' }} onClick={() => setGraphDialog(true)} variant="contained">Data</Button>)}

                    {showTable && (<Box sx={{
                        width: '95%',
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        padding: 5,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    }}>
                        <DayWiseSalesChart data={allGraphData} selectedMonth={`${dayjs(selMonth).format('YYYY-MM-DD')}`} height={400} />
                    </Box>)}
                </Box>

            </Box>
            <Dialog open={graphdataDialog} aria-labelledby="filters-dialog" PaperProps={{
                sx: { width: { lg: "580px", md: "550px", sm: "450px" }, position: "absolute", top: 10, borderRadius: 1 },
            }}>
                <DialogTitle>
                    <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>Month: <span style={{ color: '#555', fontWeight: 500 }}>{`${dayjs(selMonth).format('MMM YYYY')}`}</span></Typography>
                        <IconButton aria-label="close" onClick={() => setGraphDialog(false)}
                            sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                            <CloseIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DataTable
                        showHeader={false}
                        columns={graphDataColumn}
                        data={allGraphData}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGraphDialog(false)} color="error" variant="contained">Close</Button>
                </DialogActions>

            </Dialog>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={modifyLoading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Layout>
    );
}

export default PrimarySalesAnalze;