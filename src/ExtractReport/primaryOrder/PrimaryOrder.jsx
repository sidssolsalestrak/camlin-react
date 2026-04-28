import React, { useEffect, useMemo, useState } from 'react'
import dayjs from "dayjs";
import { useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import useToast from '../../utils/useToast';
import CircularProgress from '../../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from "react-icons/ai";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import Layout from '../../layout';
import axios from "../../services/api";
import DataTable from '../../utils/dataTable';
import PopUpTable from './PopUpTable';
import { DownloadCSV } from '../../utils/Download CSV/DownloadCSV';

const headContainer = {
    backgroundColor: 'white', display: "flex", flexDirection: 'column', gap: 2,
    m: 2, p: 2, borderRadius: '6px',
    minHeight: '20vh', width: { lg: '97%', md: '97%', sm: '90%', xs: '90%' }
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

const PrimaryOrder = () => {
    /*------------- decode from url ---------- */
    const [searchParams] = useSearchParams();
    let decodedMonth = decode(searchParams.get('mtd'));
    let decodedZone = decode(searchParams.get('zone'));
    let decodedRegion = decode(searchParams.get('reg'));
    let decodedArea = decode(searchParams.get('area'));
    let decodedDistribute = decode(searchParams.get('distributor'));

    /*----------------- states --------*/
    const navigate = useNavigate();
    const [tableData, settableData] = useState([]);
    const [showTable, setshowTable] = useState(false);
    const [loading, setloading] = useState(false);
    const extractPath = useMatch("/reports/primary_order_new");
    const [zoneData, setzoneData] = useState([]);
    const [regionData, setregionData] = useState([]);
    const [area, setarea] = useState([])
    const [allDistributor, setAllDistributor] = useState([])
    const [month, setMonth] = useState(dayjs().startOf("month"));
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const [progress, setProgress] = useState(null);
    const showAlert = useToast();
    const [formData, setformData] = useState({
        zone: "",
        region: "",
        area: "",
        distributor: "",
    })
    const [open, setOpen] = useState(false);
    const [rowData, setRowData] = useState(null);

    //handle change
    const handleChange = (name, value) => {
        setformData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    //handle load
    const handleLoad = async () => {
        let params = new URLSearchParams();
        if (month) params.append('mtd', encode(dayjs(month).format("YYYY-MM-DD")));
        if (formData.zone) params.append('zone', encode(formData.zone));
        if (formData.region) params.append('reg', encode(formData.region));
        if (formData.area) params.append('area', encode(formData.area));
        if (formData.distributor) params.append('distributor', encode(formData.distributor));
        navigate(`/reports/primary_order?${params}`)
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
    /*----------fetch Distributor---------*/
    const fetchDistributor = async () => {
        try {
            let payload = {
                area_id: formData.area,
            }
            let res = await axios.post('/get_distributor_new', payload)
            const data = Array.isArray(res?.data?.data) ? res?.data?.data : [];
            setAllDistributor(data)
        }
        catch (err) {
            console.log("fetch distributor err", err)
            setAllDistributor([])
        }
    }

    const fetchTableData = async ({ month, zone, region, area, distribute }) => {
        if (!extractPath) {
            setshowTable(true)
        }
        try {
            setloading(true)
            let payload = {
                month: month ? dayjs(month).format("YYYY-MM") : "",
                ord_zone_id: zone || "",
                ord_reg_id: region || "",
                ord_area_id: area || "",
                ord_stk_id: distribute || "",
            }
            const res = await axios.post("/getPrimaryOrder", payload);
            let data = Array.isArray(res?.data?.data) ? res?.data?.data?.map((row, index) => ({
                ...row,
                index: index + 1
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

    /*----------initialize states from decoded---------*/
    useEffect(() => {
        setMonth(decodedMonth ? dayjs(decodedMonth) : dayjs().startOf("month"));
        setformData({
            zone: decodedZone || "",
            region: decodedRegion || "",
            area: decodedArea || "",
            distributor: decodedDistribute || ""
        })
    }, [decodedMonth, decodedZone, decodedRegion, decodedArea, decodedDistribute])

    //fetch table data 
    useEffect(() => {
        if (!decodedMonth && !decodedZone && !decodedRegion && !decodedArea && !decodedDistribute) {
            settableData([])
            setshowTable(false)
            return;
        }
        fetchTableData({
            month: decodedMonth,
            zone: decodedZone,
            region: decodedRegion,
            area: decodedArea,
            distribute: decodedDistribute
        })
    }, [decodedMonth, decodedZone, decodedRegion, decodedArea, decodedDistribute])

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
            setAllDistributor([])
            setformData((prev) => ({
                ...prev,
                region: "",
                area: "",
                distributor: ""
            }))
        }
    }, [formData?.zone]);

    // Region changes
    useEffect(() => {
        if (formData?.region > 0) {
            fetchArea();
        } else {
            setarea([])
            setAllDistributor([])
            setformData((prev) => ({
                ...prev,
                area: "",
                distributor: ""
            }))
        }
    }, [formData?.region]);

    // area changes
    useEffect(() => {
        if (formData?.area > 0) {
            fetchDistributor();
        } else {
            setAllDistributor([])
            setformData((prev) => ({
                ...prev,
                distributor: ""
            }))
        }
    }, [formData?.area]);

    const columns = [
        {
            field: "index",
            headerName: "#",
            filterable: true,
        },
        {
            field: "ord_id",
            headerName: "Order #",
            filterable: true,
        },
        {
            field: "ord_date",
            headerName: "Order Date",
            filterable: true,
        },
        {
            field: "distributor",
            headerName: "Distributor",
            filterable: true,
            renderCell: (params) => (
                <span onClick={() => setOpen(true)}
                    onMouseEnter={(e) => e.currentTarget.style.borderBottom = "1px solid #133bde"}
                    onMouseLeave={(e) => e.currentTarget.style.borderBottom = ""}
                    style={{ color: "#133bde", cursor: "pointer" }}>{params?.row?.stk_code} - {params?.row?.stk_name}</span>
            )
        },
        {
            field: "user_name",
            headerName: "User",
            filterable: true,
        },
        {
            field: "ord_qty",
            headerName: "Total Ord. Qty",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
        },
        {
            field: "ord_val",
            headerName: "Total Ord.Value",
            filterable: true,
            type: "alignCenter",
            showTotal: true,
        },
    ]

    const columnsExcel = [
        {
            field: "index",
            headerName: "#",
        },
        {
            field: "ord_id",
            headerName: "Order #",
        },
        {
            field: "ord_date",
            headerName: "Order Date",
        },
        {
            field: "stk_code",
            headerName: "Distributor Code",
        },
        {
            field: "stk_name",
            headerName: "Distributor Name",
        },
        {
            field: "user_name",
            headerName: "User",
        },
        {
            field: "ord_qty",
            headerName: "Total Ord. Qty",
        },
        {
            field: "ord_val",
            headerName: "Total Ord.Value",
        },
    ]

    const handleRowClick = (row) => {
        //console.log("Row clicked:", row);
        setRowData(row)
    };

    const buildDataWithSubtotals = (data, levels) => {
        if (!levels || levels.length === 0) return [...data];

        const [currentLevel, ...remainingLevels] = levels;
        const groupMap = new Map();
        const groupOrder = [];

        data.forEach((row) => {
            const key = row[currentLevel] || "Unknown";
            if (!groupMap.has(key)) { groupMap.set(key, []); groupOrder.push(key); }
            groupMap.get(key).push(row);
        });

        const result = [];
        groupOrder.forEach((groupKey) => {
            const rows = groupMap.get(groupKey);
            const subResult = remainingLevels.length > 0
                ? buildDataWithSubtotals(rows, remainingLevels)
                : [...rows];
            result.push(...subResult);

            const subtotalRow = { _isSubtotal: true };   //marker for UI styling
            columns.forEach((col) => { subtotalRow[col.field] = ""; });
            subtotalRow["user_name"] = groupKey;
            ["ord_qty", "ord_val"].forEach((field) => {
                const sum = rows.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0);
                subtotalRow[field] = Math.round(sum * 100) / 100;
            });
            result.push(subtotalRow);
        });

        return result;
    };

    const groupLevels = ["zone_name", "reg_name"];

    const displayData = useMemo(() => {
        if (!tableData.length) return [];
        return buildDataWithSubtotals(tableData, groupLevels);
    }, [tableData]);

    /*----------------- handle download xl --------*/
    const handleDownloadExcel = async () => {
        try {
            const getLabel = (list, selectedId, labelKey, prefix) => {
                if (!selectedId || selectedId === 0 || selectedId === "0") return `${prefix}- All`;
                const match = list.find((item) => String(item.id) === String(selectedId));
                if (!match) return `${prefix}- All`;
                const label = typeof labelKey === "function" ? labelKey(match) : match[labelKey];
                return `${prefix}- ${label}`;
            };

            const meta = {
                Month: `- ${dayjs(month).format("MMM YYYY")}`,
                zone: getLabel(zoneData, formData.zone, "zone_name", ""),
                region: getLabel(regionData, formData.region, "reg_name", ""),
                area: getLabel(area, formData.area, "area_name", ""),
                distributor: getLabel(allDistributor, formData.distributor, (item) => `${item.stk_code} - ${item.stk_name}`, ""),
            };

            const numericFields = ["ord_qty", "ord_val"];

            // ── Fetch fresh data for extractPath, use state for report path ────────
            let sourceData = tableData;
            if (extractPath) {
                const newData = await fetchTableData({
                    month, zone: formData.zone, region: formData.region,
                    area: formData.area, distribute: formData.distributor
                });
                sourceData = newData ?? [];
            }

            const processedData = buildDataWithSubtotals(sourceData, groupLevels);

            const grandTotalRow = {};
            columnsExcel.forEach((col) => {
                if (col.field === "user_name") {
                    grandTotalRow[col.field] = "Grand Total";
                } else if (numericFields.includes(col.field)) {
                    const sum = sourceData.reduce((s, row) => s + (parseFloat(row[col.field]) || 0), 0);
                    grandTotalRow[col.field] = Math.round(sum * 100) / 100;
                } else {
                    grandTotalRow[col.field] = "";
                }
            });
            processedData.push(grandTotalRow);

            DownloadCSV(processedData, columnsExcel, `Primary_Order`, setProgress, enqueueSnackbar, meta, false);
        } catch (err) {
            console.log("excelDownload error", err);
        }
    };

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: extractPath ? "Extract" : "Report", path: location.pathname },
            { label: "Primary Order" },
        ]}>
            <Box sx={headContainer}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <Box>
                        <h1 className="mainTitle">Primary Order</h1>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Month *"
                            format="MMM YYYY"
                            views={["month", "year"]}
                            value={month}
                            onChange={(newValue) => setMonth(newValue)}
                            slotProps={{ textField: { size: "small", sx: { maxWidth: 150 } } }}
                        />
                    </LocalizationProvider>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="zone">Zone</InputLabel>
                        <Select value={formData.zone} onChange={(e) => handleChange("zone", e.target.value)} id='zone' label="Zone" MenuProps={menuStyle}
                            labelId="zone" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="">All</MenuItem>
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
                            <MenuItem style={{ fontSize: "11px" }} value="">All</MenuItem>
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
                            <MenuItem style={{ fontSize: "11px" }} value="">All</MenuItem>
                            {area?.map((val) => (
                                <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ width: 150 }}>
                        <InputLabel id="Distributor">Distributor</InputLabel>
                        <Select id='Distributor' label="Distributor" MenuProps={menuStyle}
                            value={formData.distributor} onChange={(e) => handleChange("distributor", e.target.value)}
                            labelId="Distributor" variant="outlined" >
                            <MenuItem style={{ fontSize: "11px" }} value="">All</MenuItem>
                            {allDistributor.map((val) => (
                                <MenuItem sx={{ textWrap: 'wrap' }} key={val.id} value={val.id}>{val.stk_code}-{val.stk_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {!extractPath && (
                        <Button variant='contained' color="primary" onClick={handleLoad}>Load</Button>
                    )}

                    {progress ? <CircularProgress progress={progress} /> :
                        <span onClick={handleDownloadExcel}>
                            <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                        </span>}
                </Box>
            </Box>
            {/* table */}
            {showTable && (
                <Box sx={headContainer}>
                    <DataTable
                        data={displayData}
                        columns={columns}
                        loading={loading}
                        grandTotal={true}
                        onRowClick={handleRowClick}
                        rowStyle={(row) =>
                            row._isSubtotal
                                ? {
                                    "& td": {
                                        backgroundColor: "#eef2ff !important",
                                    }
                                }
                                : {}
                        }
                    />
                </Box>
            )}
            <PopUpTable
                open={open}
                setOpen={setOpen}
                rowData={rowData}
            />
        </Layout>
    )
}

export default PrimaryOrder