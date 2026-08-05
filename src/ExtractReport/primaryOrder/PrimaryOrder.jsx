import React, { useEffect, useMemo, useState, useRef } from 'react'
import dayjs from "dayjs";
import { useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import useToast from '../../utils/useToast';
import CircularProgress from '../../utils/CircularProgressLoading';
import { AiOutlineFileExcel } from "react-icons/ai";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import Layout from '../../layout';
import axios from "../../services/api";
import DataTable from '../../utils/dataTable';
import PopUpTable from './PopUpTable';
import { DownloadCSV } from '../../utils/Download CSV/DownloadCSV';
import { addSubtotalsPrimary } from './addSubtotalsPrimary';
import { getMasterPanel } from "../../services/masterPanelService";

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
    const [progress1, setProgress1] = useState(null);
    const showAlert = useToast();
    const [formData, setformData] = useState({
        zone: "0",
        region: "0",
        area: "0",
        distributor: "0",
    })
    const [open, setOpen] = useState(false);
    const [rowData, setRowData] = useState(null);
    const isInitializing = useRef(true);
    const isZoneSelected = decodedZone && decodedZone !== "0";
    const [masterPanel, setMasterPanel] = useState({});

    // labels derived from masterPanel with fallbacks
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const userLabel = masterPanel["USER"] || "Users";
    const beatLabel = masterPanel["BEAT"] || "Beat";
    const distributorLabel = masterPanel["STKS"] || "Distributor";
    const prodLabel = masterPanel["PROD"] || "Product";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

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
            const res = await axios.post("/getReportsZone");
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
            let response = await axios.post("/extractRegionList", { zone_id: formData.zone })
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
            const res = await axios.post("/extractAreaList", payload);
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
            zone: decodedZone || "0",
            region: decodedRegion || "0",
            area: decodedArea || "0",
            distributor: decodedDistribute || "0"
        });
    }, [decodedMonth, decodedZone, decodedRegion, decodedArea, decodedDistribute]);


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
        if (Number(formData?.zone) > 0) {
            fetchRegion();
        } else if (!isInitializing.current) {
            setarea([]);
            setregionData([]);
            setAllDistributor([]);
            setformData((prev) => ({ ...prev, region: "0", area: "0", distributor: "0" }));
        }
    }, [formData?.zone]);

    // Region changes
    useEffect(() => {
        if (formData?.region > 0) {
            fetchArea();
        } else if (!isInitializing.current) {
            setarea([]);
            setAllDistributor([]);
            setformData((prev) => ({ ...prev, area: "0", distributor: "0" }));
        }
    }, [formData?.region]);

    // area changes
    useEffect(() => {
        if (formData?.area > 0) {
            fetchDistributor();
        } else if (!isInitializing.current) {
            setAllDistributor([]);
            setformData((prev) => ({ ...prev, distributor: "0" }));
        }
        // flip after the URL-restore has had a chance to flow through all three cascades
        if (isInitializing.current) {
            const t = setTimeout(() => { isInitializing.current = false; }, 0);
            return () => clearTimeout(t);
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
            renderCell: (params)=>(
            <span>{params.value ? `#${params.value}` : ''}</span>
           )
        },
        {
            field: "ord_date",
            headerName: "Order Date",
            filterable: true,
        },
        {
            field: "distributor",
            headerName: distributorLabel,
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
            headerName: userLabel,
            filterable: true,
        },
        {
            field: "ord_qty",
            headerName: "Total Ord. Qty",
            filterable: true,
            type: "alignCenter",
        },
        {
            field: "ord_val",
            headerName: "Total Ord.Value",
            filterable: true,
            type: "alignCenter",
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
            headerName: `${distributorLabel} Code`,
        },
        {
            field: "stk_name",
            headerName: `${distributorLabel} Name`,
        },
        {
            field: "user_name",
            headerName: userLabel,
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

    /*----------------- handle download xl --------*/
    const handleDownloadExcel = async () => {
        try {
            setProgress1("0%")
            const getLabel = (list, selectedId, labelKey, prefix) => {
                if (!selectedId || selectedId === 0 || selectedId === "0") return `${prefix} All`;
                const match = list.find((item) => String(item.id) === String(selectedId));
                if (!match) return `${prefix} All`;
                const label = typeof labelKey === "function" ? labelKey(match) : match[labelKey];
                return `${prefix} ${label}`;
            };

            const meta = {
                Month: `Month - ${dayjs(month).format("MMM YYYY")}`,
                zoneLabel: getLabel(zoneData, formData.zone, "zone_name", zoneLabel),
                regionLabel: getLabel(regionData, formData.region, "reg_name", regionLabel),
                areaLabel: getLabel(area, formData.area, "area_name", areaLabel),
                distributorLabel: getLabel(allDistributor, formData.distributor, (item) => `${item.stk_code} - ${item.stk_name}`, distributorLabel),
            };

            // ── Fetch fresh data for extractPath, use state for report path ────────
            let sourceData = tableData;
            if (extractPath) {
                const newData = await fetchTableData({
                    month, zone: formData.zone, region: formData.region,
                    area: formData.area, distribute: formData.distributor
                });
                sourceData = newData ?? [];
            }
            await new Promise((r) => setTimeout(r, 100));
            setProgress1("80%");

            DownloadCSV(addSubtotalsPrimary(sourceData, false), columnsExcel, `Primary_Order`, setProgress, enqueueSnackbar, meta, false);
            await new Promise((r) => setTimeout(r, 100));
            setProgress1("100%");
        } catch (err) {
            if (err?.response?.status === 404) {
                showAlert.error("No Data Available To Export Excel")
            } else {
                console.error(err);
                showAlert.error("Failed to Export Excel")
            }
        } finally {
            setProgress1(null)
        }
    };

    console.log("form Data in primary order", formData)

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: extractPath ? "Extract" : "Report", path: location.pathname },
            { label: "Primary Order" },
        ]}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box sx={{ ml: 1.5, mt: 1.5 }}>
                    <h1 className="mainTitle">Primary Order</h1>
                </Box>
            </Box>
            <Box sx={headContainer}>
                <Grid container spacing={1}>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
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
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="zone">{zoneLabel}</InputLabel>
                            <Select value={formData.zone} onChange={(e) => handleChange("zone", e.target.value)} id='zone' label={zoneLabel} MenuProps={menuStyle}
                                labelId="zone" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {zoneData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.zone_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Region">{regionLabel}</InputLabel>
                            <Select id='Region' label={regionLabel} MenuProps={menuStyle}
                                value={formData.region} onChange={(e) => handleChange("region", e.target.value)}
                                labelId="Region" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {regionData?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.reg_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Area">{areaLabel}</InputLabel>
                            <Select id='Area' label={areaLabel} MenuProps={menuStyle}
                                value={formData.area} onChange={(e) => handleChange("area", e.target.value)}
                                labelId="Area" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {area?.map((val) => (
                                    <MenuItem key={val.id} value={val.id}>{val?.area_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2, lg: 2 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="Distributor">{distributorLabel}</InputLabel>
                            <Select id='Distributor' label={distributorLabel} MenuProps={menuStyle}
                                value={formData.distributor} onChange={(e) => handleChange("distributor", e.target.value)}
                                labelId="Distributor" variant="outlined" >
                                <MenuItem style={{ fontSize: "11px" }} value="0">All</MenuItem>
                                {allDistributor.map((val) => (
                                    <MenuItem sx={{ textWrap: 'wrap' }} key={val.id} value={val.id}>{val.stk_code}-{val.stk_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3, md: 1, lg: 1 }}>
                        {!extractPath && (
                            <Button variant='contained' color="primary" onClick={handleLoad}>Load</Button>
                        )}
                    </Grid>
                    <Grid size={{ xs: 3, sm: 3, md: 1, lg: 1 }}>
                        {progress1 ? <CircularProgress progress={progress1} /> :
                            <span onClick={handleDownloadExcel}>
                                <AiOutlineFileExcel style={{ color: "green", cursor: "pointer", height: "30px", width: "30px" }} />
                            </span>}
                    </Grid>
                </Grid>
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
                        data={addSubtotalsPrimary(tableData, true, isZoneSelected)}
                        columns={columns}
                        loading={loading}
                        onRowClick={handleRowClick}
                        rowStyle={(row) => {
                            if (row._grandTotal) return { "& td": { backgroundColor: "#bdbdbd !important", fontWeight: 600 } };
                            if (row._zoneTotal) return { "& td": { backgroundColor: "#e0e0e0 !important", fontWeight: 600 } };
                            if (row._isSubtotal) return { "& td": { backgroundColor: "#eeeeee !important", fontWeight: 600 } };  // ← was _subtotal
                            return {};
                        }}
                        defaultPageSize={50}
                    />
                </Box>
            )}
            <PopUpTable
                open={open}
                setOpen={setOpen}
                rowData={rowData}
                distributorLabel={distributorLabel}
                userLabel={userLabel}
                prod={prodLabel}
            />
        </Layout>
    )
}

export default PrimaryOrder