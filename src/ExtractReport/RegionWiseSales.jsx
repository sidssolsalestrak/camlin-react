import React, { useEffect, useState } from 'react'
import Layout from '../layout'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Box, Button, IconButton } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import CircularProgress from '../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from "react-icons/ai";
import dayjs from 'dayjs'
import DataTable from '../utils/dataTable'
import axios from "../services/api";

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '20vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
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

const RegionWiseSales = () => {
    let [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    /*----------------- decode frm and to dt --------*/
    let decodeFromDate = decode(searchParams.get('frmDt'));
    let decodeToDate = decode(searchParams.get('toDt'));

    /*----------------- states --------*/
    const [tableData, settableData] = useState([]);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [fromDate, setFromDate] = useState(dayjs().startOf("month"));
    const [toDate, settoDate] = useState(dayjs().endOf("month"));

    /*----------------- fetch table data --------*/
    const fetchTableData = async () => {
        try {
            setloading(true)
            let payload = {
                fromDate: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : "",
                toDate: toDate ? dayjs(toDate).format("YYYY-MM-DD") : "",
            }
            const res = await axios.post("/getRegionWiseSecSales", payload);
            let data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            settableData(data)
        } catch (error) {
            console.error(error);
            settableData([])
        } finally {
            setloading(false)
        }
    }

    useEffect(() => {
        fetchTableData()
    }, [])

    //handle load
    const handleLoad = () => {
        let params = new URLSearchParams();
        if (fromDate) params.append('frmDt', encode(fromDate));
        if (toDate) params.append('toDt', encode(toDate));
        navigate(`/reports/reg_sec_sales?${params.toString()}`)
    }

    //initialize state values
    useEffect(() => {
        if (decodeFromDate && decodeToDate) {
            setFromDate(dayjs(decodeFromDate))
            settoDate(dayjs(decodeToDate))
        } else {
            setFromDate(dayjs().startOf("month"))
            settoDate(dayjs().endOf("month"))
        }
        fetchTableData()
    }, [decodeFromDate, decodeToDate])

    /*----------------- table columns --------*/
    const columns = [
        {
            field: "reg_name",
            headerName: "Region",
            filterable: true,
        },
        {
            field: "ord_val",
            headerName: "Total Secondary MTD",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
        {
            field: "tot_cus",
            headerName: "Total Mapped Master outlets",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
        {
            field: "tot_ord_recd",
            headerName: "Total outlets billed",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
        {
            field: "avg_sku",
            headerName: "Average SKU per order",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
        {
            field: "avg_val",
            headerName: "Average order value per order",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
        {
            field: "prod_per",
            headerName: "Productivity %",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
            renderCell: (params) => (
                <span>{params?.value > 0 ? params?.value : "-"}</span>
            )
        },
    ]

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Extract", path: location.pathname },
            { label: "Regionwise Secondary Sales" },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <h1 className="mainTitle">Regionwise Secondary Sales</h1>
                    </Box>
                </Box>
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
                    <Button variant='contained' color="primary" onClick={handleLoad}>Load</Button>
                    {progress ? <CircularProgress progress={progress} /> :
                        <span>
                            <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                        </span>}
                </Box>
            </Box>
            {/* table */}
            <Box sx={headContainer}>
                <DataTable data={tableData} columns={columns} loading={loading} />
            </Box>
        </Layout>
    )
}

export default RegionWiseSales;