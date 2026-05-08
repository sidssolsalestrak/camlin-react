import React, { useEffect, useState } from 'react'
import Layout from '../layout'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Autocomplete, Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useToast from '../utils/useToast';
import dayjs from 'dayjs';
import axios from "../services/api";
import DataTable from '../utils/dataTable';
import FormatCurrency from "../utils/formatCurrency";
import CircularProgressLoading from '../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from 'react-icons/ai';
import { excelWithFilters } from '../utils/ExcelWithFilters';
import { addSubtotalsSales } from './addSubtotalsSales';

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

const renderCellStyle = { width: "100%", display: "flex", justifyContent: "center" }

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

const StockAndSalesReport = () => {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const showAlert = useToast();
    const navigate = useNavigate();
    //decode the url params
    let decodedMonth = decode(searchParams.get('mtd'));
    let decodedZone = decode(searchParams.get('zone'));
    let decodedRegion = decode(searchParams.get('reg'));
    let decodedUserType = decode(searchParams.get('userType'));
    let decodedUser = decode(searchParams.get('user'));
    let decodedDistributor = decode(searchParams.get('Distributor'));

    //states
    const [tableData, settableData] = useState([]);
    const [loading, setloading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [month, setMonth] = useState(dayjs().startOf("month"));
    const [formData, setFormData] = useState({
        zone: "0",
        region: "0",
        userType: "0",
        User: { id: 0, u_name: "All" },
        Distributor: "0",
    })
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [usertype, setusertype] = useState([]);
    const [user, setuser] = useState([]);
    const [distribute, setdistribute] = useState([]);
    const [zoneerror, setzoneerror] = useState("")
    const [usererror, setusererror] = useState("")

    const handleChange = (name, val) => {
        setFormData((prev) => ({
            ...prev,
            [name]: val
        }))
    }

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

    /*------------ get usertype ---------- */
    const fetchUserType = async () => {
        try {
            let response = await axios.post("/getuserTypeExtract")
            let usertypeRes = Array.isArray(response.data.data) ? response.data.data : []
            setusertype(usertypeRes)
        }
        catch (err) {
            console.log("fetch user type err", err)
            setusertype([])
        }
    }

    /*------------ get user list ---------- */
    const fetchSSUserList = async () => {
        try {
            let payload = {
                zone_id: formData.zone,
                reg_id: formData.region,
                user_type: formData.userType
            }
            let response = await axios.post("/getExtractSSUserList", payload)
            let userListRes = Array.isArray(response.data.data) ? response.data.data : []
            setuser(userListRes)
        }
        catch (err) {
            console.log("fetch user list err", err)
            setuser([])
        }
    }

    /*------------ get distributor ---------- */
    const fetchDistributor = async () => {
        try {
            let payload = {
                reg_id: formData.region,
                user_id: formData.User?.id
            }
            let response = await axios.post('/getStockstk', payload)
            let distributorres = Array.isArray(response.data.data) ? response.data.data : []
            setdistribute(distributorres)
        }
        catch (err) {
            console.log("fetch distributor err", err)
            setdistribute([])
        }
    }

    // Initial render
    useEffect(() => {
        fetchZone();
        fetchUserType();
    }, [])

    // Zone changes → fetch regions
    useEffect(() => {
        if (formData?.zone > 0) {
            fetchRegion();
        } else {
            setregionData([])
            handleChange("region", "0")
        }
    }, [formData?.zone]);

    // UserType changes → fetch users  
    useEffect(() => {
        if (formData.userType > 0) {
            fetchSSUserList();
        } else {
            setuser([])
            handleChange("User", { id: 0, u_name: "All" })
        }
    }, [formData.userType]);

    // Region or User changes → fetch distributors
    useEffect(() => {
        if (formData?.region > 0 || formData.User?.id > 0) {
            fetchDistributor();
        } else {
            setdistribute([])
            handleChange("Distributor", "0")
        }
    }, [formData?.region, formData.User]);

    const handleLoad = async () => {
        // Validations (matching PHP frontend logic)
        if (formData.zone === "0") {
            setzoneerror("Please Select Zone")
            return
        }
        setzoneerror("")
        if (formData.User?.id === 0 && formData.userType > 0) {
            setusererror("Please Select User to Load")
            return
        }
        setusererror("")
        let params = new URLSearchParams();
        if (month) params.append('mtd', encode(dayjs(month).format("YYYY-MM-DD")));
        if (formData.zone > 0) params.append('zone', encode(formData.zone));
        if (formData.region > 0) params.append('reg', encode(formData.region));
        if (formData.userType > 0) params.append('userType', encode(formData.userType));
        if (formData.User?.id > 0) params.append('user', encode(formData.User.id));
        if (formData.Distributor > 0) params.append('Distributor', encode(formData.Distributor));
        navigate(`/reports/stock_salesReport?${params.toString()}`)
    }

    //fetch table data
    const fetchTableData = async ({ mtd, zone, reg, type, usr, dist }) => {
        try {
            setloading(true)
            const payload = {
                monthVal: mtd.format("MMM YYYY"),
                zone_id: zone,
                reg_id: reg,
                user_type: type,
                user_id: usr ?? 0,
                stk_id: dist
            }
            const response = await axios.post("/getStkSales", payload)
            const data = Array.isArray(response.data.data) ? response.data.data : []
            settableData(data)
        } catch (err) {
            if (err?.response?.status === 404) {
                showAlert.warning("No Data Available")
            } else {
                console.error(err);
                showAlert.error("Failed to Load Data")
            }
            settableData([])
        } finally {
            setloading(false)
        }
    }

    //fetch table data useeffect
    useEffect(() => {
        setMonth(decodedMonth ? dayjs(decodedMonth) : dayjs().startOf("month"));
        setFormData((prev) => ({
            zone: decodedZone || "0",
            region: decodedRegion || "0",
            userType: decodedUserType || "0",
            User:
                decodedUser && String(prev.User?.id) === String(decodedUser)
                    ? prev.User
                    : { id: 0, u_name: "All" },
            Distributor: decodedDistributor || "0",
        }));
        if (!decodedMonth && !decodedZone && !decodedRegion && !decodedUserType && !decodedUser && !decodedDistributor) return;
        fetchTableData({
            mtd: decodedMonth ? dayjs(decodedMonth) : dayjs().startOf("month"),
            zone: decodedZone,
            reg: decodedRegion,
            type: decodedUserType,
            usr: decodedUser,
            dist: decodedDistributor
        })
    }, [decodedMonth, decodedZone, decodedRegion, decodedUserType, decodedUser, decodedDistributor])

    // Once user list loads, resolve the decoded user ID into the full object
    useEffect(() => {
        if (decodedUser && user.length > 0) {
            const found = user.find((u) => String(u.id) === String(decodedUser));
            if (found) handleChange("User", found);
        }
    }, [user, decodedUser]);

    const columns = [
        { field: "zone_name", headerName: "Zone", filterable: true },
        { field: "reg_name", headerName: "Region", filterable: true },
        { field: "stk_code", headerName: "Distributor Code", filterable: true },
        { field: "stk_name", headerName: "Distributor Name", width: 150, filterable: true },
        { field: "city_name", headerName: "City", filterable: true },
        { field: "state_name", headerName: "State", filterable: true },
        { field: "cat_name", headerName: "Category", filterable: true },
        { field: "sub_name", headerName: "Range", filterable: true },
        { field: "code", headerName: "SKU Code", filterable: true },
        { field: "prod_name", headerName: "SKU Name", filterable: true },
        {
            field: "prod_price", headerName: "SKU Rate", filterable: true, width: 100,
            renderCell: (params) => (
                <span style={renderCellStyle}>
                    {typeof params?.value === "string" && isNaN(params?.value)
                        ? <strong>{params.value}</strong>
                        : params?.value === 0 ? "-"
                            : FormatCurrency(params?.value)
                    }
                </span>
            )
        },
        {
            field: "open_qty", headerName: "Opening Qty", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "open_val", headerName: "Opening Value", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "pur_qty", headerName: "Pri.Qty", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "pur_val", headerName: "Pri.Value", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "tot_qty", headerName: "Total", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "sec_qty", headerName: "Secondary Qty", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "sec_val", headerName: "Secondary Value", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "physical_qty", headerName: "Closing Qty", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "cls_val", headerName: "Closing Stock Value", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value === 0 ? "-" : FormatCurrency(params?.value)}</span>
            )
        },
        {
            field: "create_dt", headerName: "Closing Submission Date", filterable: true,
            renderCell: (params) => (
                <span style={renderCellStyle}>{params?.value ? dayjs(params?.value).format("DD MMM YYYY") : null}</span>
            )
        },
    ]

    const handleDownloadExcel = async () => {
        if (!tableData.length) {
            showAlert.warning("No Data Available To Export");
            return;
        }
        try {
            const getLabel = (list, selectedId, labelKey, prefix, idKey = "id") => {
                if (!selectedId || selectedId === 0 || selectedId === "0") return `${prefix}- All`;
                const match = list.find((item) => String(item[idKey]) === String(selectedId));
                if (!match) return `${prefix}- All`;
                const label = typeof labelKey === "function" ? labelKey(match) : match[labelKey];
                return `${prefix}- ${label}`;
            };
            const excelColumns = columns
                .filter((col) => !col.renderCell || col.field)  // keep all columns
                .map((col) => ({ label: col.headerName, id: col.field }));

            const filters = [
                { label: `Month : ${dayjs(month).format("MMM YYYY")}`, bold: false, sz: 10 },
                { label: `Zone : ${getLabel(zoneData, formData.zone, "zone_name", "")}`, bold: false, sz: 10 },
                { label: `Region : ${getLabel(regionData, formData.region, "reg_name", "")}`, bold: false, sz: 10 },
                { label: `UserType : ${getLabel(usertype, formData.userType, "client_alias", "")}`, bold: false, sz: 10 },
                { label: `User : ${formData.User?.u_name}`, bold: false, sz: 10 },
                { label: `Distributor : ${getLabel(distribute, formData.Distributor, (item) => `${item.stk_code} - ${item.stk_name}`, "", "stk_id")}`, bold: false, sz: 10 },];

            await excelWithFilters(addSubtotalsSales(tableData), excelColumns, `Stock_Sales_Report_${dayjs(month).format("MMM YYYY")}`, filters, setProgress);
        } catch (err) {
            console.log(err);
            showAlert.error("failed to download");
        }
    };

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: location.pathname },
            { label: "Stock & Sales Report" },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">Stock & Sales Report</h1>
                </Box>
                {tableData.length > 0 ?
                    <Box sx={{ mr: 1.5, mt: 1.5 }}>
                        {progress ? <CircularProgressLoading progress={progress} /> :
                            <span onClick={handleDownloadExcel}>
                                <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                            </span>}
                    </Box> : null}
            </Box>
            <Box sx={headContainer}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 1.5, lg: 1.5 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Month *"
                                format="MMM YYYY"
                                views={["month", "year"]}
                                value={month}
                                onChange={(newValue) => setMonth(newValue)}
                                slotProps={{ textField: { size: "small", fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="zone">Zone</InputLabel>
                            <Select value={formData.zone} onChange={(e) => handleChange("zone", e.target.value)}
                                id='zone' label="Zone" MenuProps={menuStyle} labelId="zone" variant="outlined" error={!!zoneerror}>
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {zoneData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                ))}
                            </Select>
                            {zoneerror && <span style={{ color: "#d32f2f", fontSize: "9px", paddingLeft: "10px" }}>{zoneerror}</span>}
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Region">Region</InputLabel>
                            <Select id='Region' label="Region" MenuProps={menuStyle}
                                value={formData.region} onChange={(e) => handleChange("region", e.target.value)}
                                labelId="Region" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {regionData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="type">User Type</InputLabel>
                            <Select id='type' label="User Type" MenuProps={menuStyle}
                                value={formData.userType} onChange={(e) => handleChange("userType", e.target.value)}
                                labelId="type" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {usertype.map((val) => (
                                    <MenuItem value={val.id} key={val.id}>{val.client_alias}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <Autocomplete
                            options={[{ id: 0, u_name: "All" }, ...user]}
                            getOptionLabel={(option) => option.u_name ?? ""}
                            value={formData.User}
                            onChange={(event, newValue) => {
                                handleChange("Distributor", "0")
                                handleChange("User", newValue ?? { id: 0, u_name: "All" })
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="User" size="small" error={!!usererror} helperText={usererror ? usererror : null} />
                            )}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 1.9, lg: 1.9 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Distributor">Distributor</InputLabel>
                            <Select id='Distributor' label="Distributor" MenuProps={menuStyle}
                                value={formData.Distributor} onChange={(e) => handleChange("Distributor", e.target.value)}
                                labelId="Distributor" variant="outlined">
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {distribute.map((val) => (
                                    <MenuItem sx={{ textWrap: 'wrap' }} key={val.stk_id} value={val.stk_id}>
                                        {val.stk_code}-{val.stk_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 0.8, lg: 0.8 }}>
                        <Button variant='contained' color="primary" onClick={handleLoad}>Load</Button>
                    </Grid>
                </Grid>
            </Box>
            <Box p={1.5}>
                <DataTable
                    sx={{
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    }}
                    data={addSubtotalsSales(tableData)}
                    columns={columns}
                    loading={loading}
                    defaultPageSize={100}
                    rowStyle={(row) => {
                        if (row._grandTotal) return { "& td": { backgroundColor: "#bdbdbd !important", fontWeight: 800 } };
                        if (row._zoneTotal) return { "& td": { backgroundColor: "#e0e0e0 !important", fontWeight: 700 } };
                        if (row._subtotal) return { "& td": { backgroundColor: "#eeeeee !important", fontWeight: 600 } };
                        return {};
                    }}
                />
            </Box>
        </Layout>
    )
}

export default StockAndSalesReport