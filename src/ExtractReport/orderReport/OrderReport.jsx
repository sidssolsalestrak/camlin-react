import React, { useEffect, useState } from 'react'
import Layout from '../../layout'
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import CircularProgressLoading from '../../utils/CircularProgressLoading'
import { AiOutlineFileExcel } from 'react-icons/ai'
import { useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom'
import axios from "../../services/api";
import DataTable from '../../utils/dataTable'
import useToast from '../../utils/useToast'
import FormatCurrency from '../../utils/formatCurrency';

const headContainer = {
    background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
    m: 1.5, p: 1.5, borderRadius: '10px', boxShadow:
        "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
    padding: "16px 18px",
    width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const menuStyle = {
    PaperProps: {
        style: {
            maxHeight: 200
        }
    }
}

// URL-safe encode - replaces + / = with cleaner characters
const encode = (val) => btoa(String(val || ""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");   // ← removes = entirely, no more %3D

// URL-safe decode - restore before atob
const decode = (str) => {
    if (!str) return "";
    const restored = str
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padded = restored + "==".slice((restored.length % 4) || 4);
    try { return atob(padded); } catch { return ""; }
};

const OrderReport = () => {
    const extractPath = useMatch("/reports/pcm_kam_new");
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    /*------- decode from url -------------- */
    let decodedFromDt = decode(searchParams.get('frm'))
    let decodedToDt = decode(searchParams.get('to'))
    let decodedZone = decode(searchParams.get('zone'))
    let decodedReg = decode(searchParams.get('reg'))
    let decodedArea = decode(searchParams.get('area'))
    let decodedType = decode(searchParams.get('type'))
    let decodedGrpBy = decode(searchParams.get('grpBy'))
    let decodedPSM = decode(searchParams.get('psm'))
    let decodedStk = decode(searchParams.get('stk'))
    let decodedStatus = decode(searchParams.get('status'))

    /*----------------- states --------*/
    const showAlert = useToast();
    const [tableData, settableData] = useState([]);
    const [showTable, setshowTable] = useState(false);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [fromDate, setFromDate] = useState(dayjs());
    const [toDate, settoDate] = useState(dayjs());
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [area, setarea] = useState([])
    const [stkData, setstkData] = useState([])
    const [formData, setformData] = useState({
        type: "1",
        groupBy: "1",
        zone: "0",
        region: "0",
        area: "0",
        PSM: "0",
        Stockist: "0",
        Status: "1"
    })

    /*------------ get zone data ---------- */
    const fetchZone = async () => {
        try {
            const res = await axios.get("/zoneNames");
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setzoneData(data);
        } catch (error) {
            console.error(error);
            setzoneData([])
        }
    }

    /*------------ get region data ---------- */
    const fetchRegion = async () => {
        try {
            let response = await axios.post("/getRegionList", { zone_id: formData.zone })
            setregionData(Array.isArray(response.data.data) ? response.data.data : [])
        } catch (err) {
            console.log("fetchRegion error", err)
            setregionData([])
        }
    }

    /*----------fetch area---------*/
    const fetchArea = async () => {
        try {
            let payload = {
                reg_id: formData.region,
                zone_id: null
            }
            const res = await axios.post("/get_arealist", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setarea(data);
        } catch (error) {
            console.error(error);
            setarea([]);
        }
    }

    /*----------fetch stockist---------*/
    const fetchStk = async () => {
        try {
            let payload = {
                reg_id: formData.region,
            }
            const res = await axios.post("/get_stk", payload);
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : []
            setstkData(data);
        } catch (error) {
            console.error(error);
            setstkData([]);
        }
    }

    const handleLoad = () => {
        if (dayjs(fromDate).format("YYYY-MMM-DD") !== dayjs(toDate).format("YYYY-MMM-DD")) {
            showAlert.warning("More than one day report can be generated using Excel");
            return;
        }
        let params = new URLSearchParams();
        if (fromDate) params.append('frm', encode(dayjs(fromDate).format("YYYY-MMM-DD")));
        if (toDate) params.append('to', encode(dayjs(toDate).format("YYYY-MMM-DD")));
        if (formData.zone > "0") params.append('zone', encode(formData.zone));
        if (formData.region > "0") params.append('reg', encode(formData.region));
        if (formData.area > "0") params.append('area', encode(formData.area));
        if (formData.type > "0") params.append('type', encode(formData.type));
        if (formData.groupBy > "0") params.append('grpBy', encode(formData.groupBy));
        if (formData.PSM > "0") params.append('psm', encode(formData.PSM));
        if (formData.Stockist > "0") params.append('stk', encode(formData.Stockist));
        if (formData.Status > "0") params.append('status', encode(formData.Status));
        navigate(`/reports/pcm_kam?${params.toString()}`)
    }

    const handleDownloadExcel = () => {

    }

    //handle change
    const handleChange = (name, value) => {
        setformData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    //initial render
    useEffect(() => {
        fetchZone();
    }, [])

    // Zone changes
    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
        } else {
            setarea([])
            setregionData([])
            setformData((prev) => ({
                ...prev,
                region: "0",
                area: "0",
            }))
        }
    }, [formData?.zone]);

    // Region changes
    useEffect(() => {
        if (formData?.region > 0) {
            fetchArea();
            fetchStk();
        } else {
            setarea([])
            setstkData([])
            setformData((prev) => ({
                ...prev,
                area: "0",
                Stockist: "0"
            }))
        }
    }, [formData?.region]);

    const columns = [
        {
            field: "index",
            headerName: "SI",
            filterable: true,
        },
        ...(formData.groupBy === "1"
            ? [
                {
                    field: "reg_name",
                    headerName: "Region",
                    filterable: true,
                },
                {
                    field: "psm_kam",
                    headerName: "PSM/KAM",
                    filterable: true,
                },
                {
                    field: "stk_name",
                    headerName: "STOCKIEST",
                    filterable: true,
                },
                {
                    field: "ctype",
                    headerName: "TYPE",
                    filterable: true,
                },
                {
                    field: "cusCode",
                    headerName: "CUSTOMER CODE",
                    filterable: true,
                },
                {
                    field: "cus_class",
                    headerName: "CUSTOMER CLASS",
                    filterable: true,
                },
                {
                    field: "cus_name",
                    headerName: "CUSTOMER",
                    filterable: true,
                },
                {
                    field: "beat_name",
                    headerName: "BEAT",
                    filterable: true,
                },
                {
                    field: "city",
                    headerName: "CITY",
                    filterable: true,
                },
                {
                    field: "create_dt",
                    headerName: "Ord. Date",
                    filterable: true,
                    type: "date"
                },
                {
                    field: "ord_no",
                    headerName: "Ord. No",
                    filterable: true,
                },
                {
                    field: "index",
                    headerName: "Ord. Time",
                    filterable: true,
                },
                {
                    field: "index",
                    headerName: "Ord. Mode",
                    filterable: true,
                },
                {
                    field: "prod_code",
                    headerName: "SKU CODE",
                    filterable: true,
                },
                {
                    field: "prod_name",
                    headerName: "SKU",
                    filterable: true,
                },
            ]
            : []),
        ...(formData.groupBy === "2" ? [
            {
                field: "reg_name",
                headerName: "Region",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "3" ? [
            {
                field: "reg_name",
                headerName: "Region",
                filterable: true,
            },
            {
                field: "index",
                headerName: "Area",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "4" ? [
            {
                field: "reg_name",
                headerName: "Region",
                filterable: true,
            },
            {
                field: "stk_name",
                headerName: "STOCKIEST",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "5" ? [
            {
                field: "reg_name",
                headerName: "Region",
                filterable: true,
            },
            {
                field: "psm_kam",
                headerName: "PSM/KAM",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "6" ? [
            {
                field: "reg_name",
                headerName: "Region",
                filterable: true,
            },
            {
                field: "psm_kam",
                headerName: "PSM/KAM",
                filterable: true,
            },
            {
                field: "ctype",
                headerName: "TYPE",
                filterable: true,
            },
            {
                field: "cusCode",
                headerName: "CODE",
                filterable: true,
            },
            {
                field: "cus_class",
                headerName: "CLASS",
                filterable: true,
            },
            {
                field: "cus_name",
                headerName: "CUSTOMER",
                filterable: true,
            },
            {
                field: "beat_name",
                headerName: "BEAT",
                filterable: true,
            },
            {
                field: "city",
                headerName: "CITY",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "7" ? [
            {
                field: "index",
                headerName: "Range",
                filterable: true,
            },
        ] : []),
        ...(formData.groupBy === "8" ? [
            {
                field: "prod_code",
                headerName: "SKU CODE",
                filterable: true,
            },
            {
                field: "prod_name",
                headerName: "SKU",
                filterable: true,
            },
        ] : []),
        {
            field: "prod_qty",
            headerName: "Ord. Qty",
            filterable: true,
            showTotal: true,
        },
        {
            field: "prod_free",
            headerName: "Free Qty",
            filterable: true,
            showTotal: true,
        },
        {
            field: "disc_per",
            headerName: "Disc. %",
            filterable: true,
            showTotal: true,
            type: "alignCenter",
            renderCell: (params) => (
                <span>{FormatCurrency(params?.row?.disc_per)}</span>
            )
        },
        {
            field: "retail_price",
            headerName: "Rate",
            filterable: true,
            showTotal: true,
            type: "alignCenter",
            renderCell: (params) => (
                <span>{FormatCurrency(params?.row?.retail_price)}</span>
            )
        },
        {
            field: "ord_value",
            headerName: "Ord. Value",
            filterable: true,
            showTotal: true,
            type: "alignCenter",
            renderCell: (params) => (
                <span>{FormatCurrency(params?.row?.ord_value)}</span>
            )
        },
        {
            field: "disc_value",
            headerName: "Offer Value",
            filterable: true,
            showTotal: true,
            type: "alignCenter",
            renderCell: (params) => (
                <span>{FormatCurrency(params?.row?.disc_value)}</span>
            )
        },
        ...(formData.groupBy === "1" ? [
            {
                field: "order_stat",
                headerName: "Status",
                filterable: true,
                type: "alignCenter"
            },
        ] : []),
    ]

    const fetchTableData = async ({ frm, to, zone, region, area, type, grp, psm, stk, stat }) => {
        if (!extractPath) {
            setshowTable(true)
        }
        try {
            setloading(true)
            let payload = {
                frm: frm ? dayjs(frm).format("YYYY-MM-DD") : "",
                to: to ? dayjs(to).format("YYYY-MM-DD") : "",
                zoneId: zone || "0",
                regId: region || "0",
                areaId: area || "0",
                psmId: psm || "0",
                status: stat || "0",
                stk: stk || "0",
                GroupId: grp || "0",
                type: type || "0",
            }
            const res = await axios.post("/getPcmKam", payload);
            let data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1,
                psm_kam: `${row?.emp_code} - ${row?.sr_name}`,
                cusCode: `${row?.cusid}_${row?.cus_sub_id}`
            })) : [];
            settableData(data)
            return data
        } catch (error) {
            console.error(error);
            settableData([])
            return []
        } finally {
            setloading(false)
        }
    }

    /*------------ initialize state data and fetch table data ---------- */
    useEffect(() => {
        setFromDate(dayjs(decodedFromDt).isValid() ? dayjs(decodedFromDt) : dayjs())
        settoDate(dayjs(decodedToDt).isValid() ? dayjs(decodedToDt) : dayjs())
        setformData({
            type: decodedType || "1",
            groupBy: decodedGrpBy || "1",
            zone: decodedZone || "0",
            region: decodedReg || "0",
            area: decodedArea || "0",
            PSM: decodedPSM || "0",
            Stockist: decodedStk || "0",
            Status: decodedStatus || "1"
        })
        if (!decodedFromDt && !decodedToDt && !decodedZone && !decodedReg && !decodedArea && !decodedType && !decodedGrpBy && !decodedPSM && !decodedStatus && !decodedStk) {
            settableData([])
            setshowTable(false)
            return;
        }
        fetchTableData({
            frm: decodedFromDt,
            to: decodedToDt,
            zone: decodedZone,
            region: decodedReg,
            area: decodedArea,
            type: decodedType,
            grp: decodedGrpBy,
            psm: decodedPSM,
            stk: decodedStk,
            stat: decodedStatus
        })
    }, [decodedFromDt, decodedToDt, decodedZone, decodedReg, decodedArea, decodedType
        , decodedGrpBy, decodedPSM, decodedStatus, decodedStk
    ])

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: extractPath ? "Extract" : "Report", path: location.pathname },
            { label: "Order Report" },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">Order Report</h1>
                </Box>
            </Box>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="From Date"
                            format="DD MMM YYYY"
                            value={fromDate}
                            onChange={(newValue) => setFromDate(newValue)}
                            maxDate={toDate ? toDate : null}
                            slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
                        />
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="To Date"
                            format="DD MMM YYYY"
                            value={toDate}
                            onChange={(newValue) => settoDate(newValue)}
                            slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
                            minDate={fromDate ? fromDate : null}
                        />
                    </LocalizationProvider>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Type">Type</InputLabel>
                        <Select value={formData.type} onChange={(e) => handleChange("type", e.target.value)} id='Type' label="Type" MenuProps={menuStyle}
                            labelId="Type" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="1">Orders</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="groupBy">Group By</InputLabel>
                        <Select value={formData.groupBy} onChange={(e) => handleChange("groupBy", e.target.value)} id='groupBy' label="Group By" MenuProps={menuStyle}
                            labelId="groupBy" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="1">Order wise</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="2">Region</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="3">Area</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="4">Stockist</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="5">PSM/KAM</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="6">Customer</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="7">Range</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="8">SKU</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="zone">Zone</InputLabel>
                        <Select value={formData.zone} onChange={(e) => handleChange("zone", e.target.value)} id='zone' label="Zone" MenuProps={menuStyle}
                            labelId="zone" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                            {zoneData?.map((val) => (
                                <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Region">Region</InputLabel>
                        <Select id='Region' label="Region" MenuProps={menuStyle}
                            value={formData.region} onChange={(e) => handleChange("region", e.target.value)}
                            labelId="Region" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                            {regionData?.map((val) => (
                                <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Area">Area</InputLabel>
                        <Select id='Area' label="Area" MenuProps={menuStyle}
                            value={formData.area} onChange={(e) => handleChange("area", e.target.value)}
                            labelId="Area" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                            {area?.map((val) => (
                                <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="PSM">PSM</InputLabel>
                        <Select value={formData.PSM} onChange={(e) => handleChange("PSM", e.target.value)} id='PSM' label="PSM" MenuProps={menuStyle}
                            labelId="PSM" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Stockist">Stockist</InputLabel>
                        <Select value={formData.Stockist} onChange={(e) => handleChange("Stockist", e.target.value)} id='Stockist' label="Stockist" MenuProps={menuStyle}
                            labelId="Stockist" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                            {stkData?.map((val) => (
                                <MenuItem key={val.id} value={val.id}>{val?.stk_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Status">Status</InputLabel>
                        <Select value={formData.Status} onChange={(e) => handleChange("Status", e.target.value)} id='Status' label="Status" MenuProps={menuStyle}
                            labelId="Status" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="1">All Active</MenuItem>
                            <MenuItem style={{ fontSize: "11px" }} value="4">Deleted</MenuItem>
                        </Select>
                    </FormControl>

                    {!extractPath && (
                        <Button variant='contained' color="primary" onClick={handleLoad}>Search</Button>
                    )}

                    {progress ? <CircularProgressLoading progress={progress} /> :
                        <Button variant='contained' color='warning' startIcon={<AiOutlineFileExcel />} onClick={handleDownloadExcel}>
                            Export to Excel
                        </Button>}
                </Box>
            </Box>
            {/* table */}
            {showTable && (
                <Box p={1.5}>
                    <DataTable
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow:
                                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                        data={tableData}
                        columns={columns}
                        loading={loading}
                        grandTotal={false}
                        defaultPageSize={50}
                    />
                </Box>
            )}
        </Layout>
    )
}

export default OrderReport;