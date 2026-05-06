import { useEffect, useState } from "react";
import Layout from "../layout";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import {
    Box, Button, FormControl, InputLabel, Select, MenuItem, Typography, IconButton
} from "@mui/material";
import { FaPlus, FaMinus } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { OutletCountMap } from "./OutletCountMap";
import useToast from "../utils/useToast";
import CircularProgress from "../utils/CircularProgressLoading";
import { AiOutlineFileExcel } from "react-icons/ai";
import { Download } from "../utils/downloadExcel/Download";
import { useNavigate, useParams } from "react-router-dom";


const fmt = (val) => (!val || Number(val) === 0 ? "-" : val);

function buildZoneData(rows) {
    const zoneMap = new Map();

    rows.forEach((r) => {
        if (!zoneMap.has(r.zone_id)) {
            zoneMap.set(r.zone_id, {
                zone_id: r.zone_id,
                zone_name: r.zone_name,
                regionMap: new Map(),
            });
        }
        const zone = zoneMap.get(r.zone_id);

        if (!zone.regionMap.has(r.reg_id)) {
            zone.regionMap.set(r.reg_id, {
                reg_id: r.reg_id,
                reg_name: r.reg_name,
                zone_id: r.zone_id,
                reps: [],
            });
        }
        zone.regionMap.get(r.reg_id).reps.push(r);
    });

    const zones = [];

    zoneMap.forEach(({ zone_id, zone_name, regionMap }) => {
        let zoneTot = 0;
        const regions = [];

        regionMap.forEach(({ reg_id, reg_name, reps }) => {
            let regTot = 0;
            reps.forEach((r) => { regTot += Number(r.tot_cus) || 0; });
            zoneTot += regTot;

            regions.push({
                regRow: {
                    id: `reg-${zone_id}-${reg_id}`,
                    _rowType: "region",
                    _zoneId: zone_id,
                    _regId: reg_id,
                    _regKey: `${zone_id}-${reg_id}`,
                    _name: `Total ${reg_name}`,
                    tot_cus: regTot,
                },
                repRows: reps.map((r, i) => ({
                    ...r,
                    id: `rep-${zone_id}-${reg_id}-${r.user_id ?? i}-${r.beat_id ?? i}`,
                    _rowType: "rep",
                    _zoneId: zone_id,
                    _regId: reg_id,
                    _regKey: `${zone_id}-${reg_id}`,
                    _name: r.uname,
                })),
            });
        });

        zones.push({
            zoneRow: {
                id: `zone-${zone_id}`,
                _rowType: "zone",
                _zoneId: zone_id,
                _name: `Total ${zone_name}`,
                tot_cus: zoneTot,
            },
            regions,
        });
    });

    return zones;
}

function buildColumns(expandedZones, expandedRegs, toggleZone, toggleReg, handleBeatClick) {
    return [
        {
            field: "_name",
            headerName: "Zone",
            renderHeader: () => (<Typography sx={{ textAlign: 'start', ml: 2 }}>Zone</Typography>),
            width: 500,
            renderCell: ({ row }) => {
                if (row._rowType === "subheader") return (
                    <Box display="flex" gap={1} alignItems="center" sx={{ width: "100%" }}>
                        <Typography sx={{ width: 20, fontWeight: 700, fontSize: 12, color: "#555" }}>#</Typography>
                        <Typography sx={{ width: 150, fontWeight: 700, fontSize: 12, color: "#555" }}>SO</Typography>
                        <Typography sx={{ width: 140, fontWeight: 700, fontSize: 12, color: "#555" }}>Territory</Typography>
                        <Typography sx={{ width: 100, fontWeight: 700, fontSize: 12, color: "#555" }}>Beat</Typography>
                    </Box>
                );
                if (row._rowType === "zone") return (
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row._name}</Typography>
                );
                if (row._rowType === "region") return (
                    <Typography sx={{ fontWeight: 700, fontSize: 12 }}>{row._name}</Typography>
                );
                if (row._rowType === "grand") return (
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{row._name}</Typography>
                );

                return (
                    <Box display="flex" gap={1} alignItems="center" sx={{ width: "100%" }}>
                        <Typography sx={{ width: 20, fontSize: 12 }}>{row._seq}</Typography>
                        <Box sx={{ width: 150 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: 12 }}>
                                {row.emp_code ? `${row.emp_code} - ${row.uname}` : row.uname}
                            </Typography>
                        </Box>
                        <Typography sx={{ width: 140, fontSize: 12 }}>{row.ter_name || "-"}</Typography>
                        <Typography
                            onClick={() => handleBeatClick(row)}
                            sx={{ width: 100, fontSize: 12, textDecoration: "underline", cursor: "pointer", textWrap: 'nowrap' }}
                        >
                            {row.beat_name || "-"}
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: "tot_cus",
            headerName: "Outlets",
            width: 100,
            renderHeader: () => (<Typography sx={{ textAlign: 'start' }}>Outlets</Typography>),
            renderCell: ({ row }) => {
                if (row._rowType === "subheader") return (
                    <Typography sx={{ fontWeight: 700, fontSize: 12, color: "#555", textAlign: "right", width: "100%" }}>
                        Total Outlets
                    </Typography>
                );
                return (
                    <Typography sx={{
                        textAlign: "center",
                        fontWeight: row._rowType !== "rep" ? 700 : 400,
                        fontSize: 12,
                        width: "100%"
                    }}>
                        {fmt(row.tot_cus)}
                    </Typography>
                );
            },
        },
        {
            field: "_expand",
            headerName: "",
            width: 50,
            renderCell: ({ row }) => {
                if (row._rowType === "zone") {
                    const isOpen = expandedZones.has(row._zoneId);
                    return (
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleZone(row._zoneId); }} sx={{ color: "#2e7d32", p: 0.5 }}>
                            {isOpen ? <FaMinus size={14} /> : <FaPlus size={14} />}
                        </IconButton>
                    );
                }
                if (row._rowType === "region") {
                    const isOpen = expandedRegs.has(row._regKey);
                    return (
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleReg(row._zoneId, row._regId); }} sx={{ color: "#2e7d32", p: 0.5 }}>
                            {isOpen ? <FaMinus size={14} /> : <FaPlus size={14} />}
                        </IconButton>
                    );
                }
                return null;
            },
        },
    ];
}

function grandTotal(zones) {
    return zones.reduce((sum, z) => sum + (Number(z.zoneRow.tot_cus) || 0), 0);
}

export default function OutletCount() {
    const { enzone, enRegion, enArea, enSo } = useParams();
    const navigate = useNavigate();

    const decodeZone = enzone != null && enzone !== 'undefined' ? Number(atob(enzone)) : 0;
    const decodeRegion = enRegion != null && enRegion !== 'undefined' ? Number(atob(enRegion)) : 0;
    const decodeArea = enArea != null && enArea !== 'undefined' ? Number(atob(enArea)) : 0;
    const decodeSo = enSo != null && enSo !== 'undefined' ? Number(atob(enSo)) : 0;

    const [selZone, setSelZone] = useState(decodeZone);
    const [selRegion, setSelRegion] = useState(decodeRegion);
    const [selArea, setSelArea] = useState(decodeArea);
    const [selSo, setSelSo] = useState(decodeSo);

    const [allZone, setAllZone] = useState([]);
    const [allRegion, setAllRegion] = useState([]);
    const [allArea, setAllArea] = useState([]);
    const [allSo, setAllSo] = useState([]);

    const [zoneData, setZoneData] = useState([]);
    const [expandedZones, setExpandedZones] = useState(new Set());
    const [expandedRegs, setExpandedRegs] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [mapOpen, setMapOpen] = useState(false);
    const [userType, setUserType] = useState(null);
    const [userId, setUserId] = useState(null);
    const [progress, setProgress] = useState(null);
    const [allOutLets, setAlltotOutlets] = useState([]);

    const toast = useToast();

    useEffect(() => {
        const token = localStorage.getItem("session-token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserType(decoded.user_type);
                setUserId(decoded.user_id);
            } catch (e) { console.log(e); }
        }
        fetchZoneList();
    }, []);

    useEffect(() => {
        const loadFromParams = async () => {
            try {
                setSelZone(decodeZone);
                setSelRegion(decodeRegion);
                setSelArea(decodeArea);
                setSelSo(decodeSo);

                if (decodeZone) {
                    const r = await api.post("/extractRegionList", { zone_id: decodeZone });
                    setAllRegion(Array.isArray(r.data.data) ? r.data.data : []);
                }
                if (decodeRegion) {
                    const r = await api.post("/extractAreaList", { reg_id: decodeRegion });
                    setAllArea(Array.isArray(r.data.data) ? r.data.data : []);
                }
                if (decodeArea) {
                    const r = await api.post("/getOutletSoList", {
                        zone_id: decodeZone,
                        reg_id: decodeRegion,
                        area_id: decodeArea,
                    });
                    setAllSo(Array.isArray(r.data.data) ? r.data.data : []);
                }

                await handleLoadWithValues(decodeZone, decodeRegion, decodeArea, decodeSo);
            } catch (e) {
                console.log("Param load error:", e);
            }
        };

        loadFromParams();
    }, [decodeZone, decodeRegion, decodeArea, decodeSo]);

    const fetchZoneList = async () => {
        try {
            const r = await api.post("/getReportsZone");
            setAllZone(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const fetchRegionList = async (zoneId) => {
        try {
            const r = await api.post("/extractRegionList", { zone_id: zoneId });
            setAllRegion(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const fetchAreaList = async (regId) => {
        try {
            const r = await api.post("/extractAreaList", { reg_id: regId });
            setAllArea(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const fetchSoList = async (zoneId, regId, areaId) => {
        try {
            const r = await api.post("/getOutletSoList", { zone_id: zoneId, reg_id: regId, area_id: areaId });
            setAllSo(Array.isArray(r.data.data) ? r.data.data : []);
        } catch (e) { console.log(e); }
    };

    const handleZoneChange = (zoneId) => {
        setSelZone(zoneId);
        setSelRegion(0); setSelArea(0); setSelSo(0);
        setAllRegion([]); setAllArea([]); setAllSo([]);
        if (zoneId) fetchRegionList(zoneId);
        fetchSoList(zoneId,null,null);
    };

    const handleRegionChange = (regId) => {
        setSelRegion(regId);
        setSelArea(0); setSelSo(0);
        setAllArea([]); setAllSo([]);
        if (regId) fetchAreaList(regId);
       fetchSoList(selZone, regId,null);
    };

    const handleAreaChange = (areaId) => {
        setSelArea(areaId);
        setSelSo(0); setAllSo([]);
        if (areaId) fetchSoList(selZone, selRegion, areaId);
    };

    const handleLoad = async () => {
        await handleLoadWithValues(selZone, selRegion, selArea, selSo);
    };

    const handleLoadWithValues = async (zoneId, regId, areaId, soId) => {
        try {
            setLoading(true);
            const r = await api.post("/getOutletCount", {
                zone_id: zoneId || null,
                reg_id: regId || null,
                area_id: areaId || null,
                user_id: soId || null,
            });
            const raw = Array.isArray(r.data.data) ? r.data.data : [];
            setZoneData(buildZoneData(raw));
            setAlltotOutlets(raw);
            setExpandedZones(new Set());
            setExpandedRegs(new Set());
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const encodeAndNavigate = () => {
        const enc = (v) => btoa(v ?? 0);
        navigate(`/reports/outlet_count/${enc(selZone)}/${enc(selRegion)}/${enc(selArea)}/${enc(selSo)}`);
    };

    const handleRenderLocation = async () => {
        try {
            let response = await api.post("/render_loc_map");
            if (response.data.status === 200) {
                toast.success(response.data.message);
            } else {
                toast.success(response.data.message);
            }
        } catch (err) {
            toast.error("Unable to Render");
        }
    };

    const handleBeatClick = (row) => {
        const encode = (val) => btoa(val || 0);
        navigate(
            `/customers/AllDoctors/${encode(0)}/${encode(row.reg_id)}/${encode(row.user_id)}/${encode(0)}/${encode(1)}/${encode(row.beat_id)}/${encode(0)}`
        );
    };

    const toggleZone = (id) =>
        setExpandedZones((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const toggleReg = (zoneId, regId) => {
        const key = `${zoneId}-${regId}`;
        setExpandedRegs((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    };

    const tableData = [];
    zoneData.forEach(({ zoneRow, regions }) => {
        if (expandedZones.has(zoneRow._zoneId)) {
            regions.forEach(({ regRow, repRows }) => {
                if (expandedRegs.has(regRow._regKey)) {
                    tableData.push({
                        id: `subheader-${regRow._regKey}`,
                        _rowType: "subheader",
                        _zoneId: regRow._zoneId,
                        _regKey: regRow._regKey,
                    });
                    repRows.forEach((rep, i) => tableData.push({ ...rep, _seq: i + 1 }));
                }
                tableData.push({ ...regRow });
            });
        }
        tableData.push({ ...zoneRow });
    });

    if (zoneData.length > 0) {
        tableData.push({
            id: "grand-total",
            _rowType: "grand",
            _name: "Grand Total",
            tot_cus: grandTotal(zoneData),
        });
    }

    const ExcelColumns = [
        { field: 'emp_code', headerName: 'Code' },
        { field: 'uname', headerName: 'SO' },
        { field: 'zone_name', headerName: 'Zone' },
        { field: 'reg_name', headerName: 'Region' },
        { field: 'area_name', headerName: 'Area' },
        { field: 'ter_name', headerName: 'Territory' },
        { field: 'beat_name', headerName: 'Beat' },
        { field: 'tot_cus', headerName: 'Total Outlets' },
    ];

    const handleDownloadExcel = () => {
        try {
            const safeColumns = ExcelColumns.map(({ renderCell, renderHeader, ...rest }) => rest);
            Download(allOutLets, safeColumns, 'Total_Outlets', setProgress, toast, 'Total_Outlets', {}, true);
        } catch (err) {
            console.log("Export Excel Err", err);
        }
    };

    const COLUMNS = buildColumns(expandedZones, expandedRegs, toggleZone, toggleReg, handleBeatClick);

    return (
        <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Report", path: "/reports/capability_report" },
            { label: "Outlet Count", path: "/reports/outlet_count" },
        ]}>
            <Box p={0.5}>
                <Box p={2} display="flex" flexDirection="column" gap={2}>
                    <h1 className="mainTitle">Outlet Count</h1>
                </Box>

                <Box sx={{
                    mx: 1.5,
                    display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap",
                    backgroundColor: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                    padding: "16px 18px",
                    borderRadius: "10px",
                }}>
                    <FormControl>
                        <InputLabel id="zone">Zone</InputLabel>
                        <Select
                            value={selZone}
                            labelId="zone"
                            label="Zone"
                            size="small"
                            sx={{ width: 130 }}
                            onChange={(e) => handleZoneChange(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            {allZone.map((z) => (
                                <MenuItem key={z.id} value={z.id}>{z.zone_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <InputLabel id="region">Region</InputLabel>
                        <Select
                            value={selRegion}
                            labelId="region"
                            label="Region"
                            size="small"
                            sx={{ width: 130 }}
                            onChange={(e) => handleRegionChange(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            {allRegion.map((r) => (
                                <MenuItem key={r.id} value={r.id}>{r.reg_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <InputLabel id="area">Area</InputLabel>
                        <Select
                            value={selArea}
                            labelId="area"
                            label="Area"
                            size="small"
                            MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                            sx={{ width: 130 }}
                            onChange={(e) => handleAreaChange(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            {allArea.map((a) => (
                                <MenuItem key={a.id} value={a.id}>{a.area_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl>
                        <InputLabel id="so">SO</InputLabel>
                        <Select
                            value={selSo}
                            labelId="so"
                            label="SO"
                            size="small"
                            MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                            sx={{ width: 170 }}
                            onChange={(e) => setSelSo(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            {allSo.map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.user_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button variant="contained" onClick={encodeAndNavigate}>Load</Button>

                    <Button variant="contained" onClick={() => setMapOpen(true)}>
                        Location Map
                    </Button>

                    {Number(userType) < 4 && (
                        <Button variant="contained" color="warning" onClick={handleRenderLocation}>
                            Render Location
                        </Button>
                    )}

                    {progress ? (
                        <CircularProgress progress={progress} />
                    ) : (
                        <span onClick={handleDownloadExcel} style={{ cursor: 'pointer' }}>
                            <AiOutlineFileExcel style={{ color: "green", height: "30px", width: "30px" }} />
                        </span>
                    )}
                </Box>

                <Box sx={{ p: 1.5, width: { md: '70%', xs: '100%' } }}>
                    <DataTable
                        data={tableData}
                        columns={COLUMNS}
                        searchable={false}
                        loading={loading}
                        showHeader={true}
                        defaultPageSize={100}
                        getRowSx={(row) => {
                            if (row._rowType === "subheader") return { backgroundColor: "#e8f5e9", fontWeight: 700, borderBottom: "1px solid #a5d6a7" };
                            if (row._rowType === "zone") return { backgroundColor: "#f0f0f0", fontWeight: 700, borderBottom: "2px solid #ccc" };
                            if (row._rowType === "region") return { backgroundColor: "#fad8d8", fontWeight: 700 };
                            if (row._rowType === "grand") return { backgroundColor: "#f0f0f0", fontWeight: 700, borderTop: "2px solid #aaa" };
                            return {};
                        }}
                        sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        }}
                    />
                </Box>
            </Box>

            <OutletCountMap
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                selZone={selZone}
                selRegion={selRegion}
                selArea={selArea}
                selUser={selSo}
                userType={userType}
                userId={userId}
            />
        </Layout>
    );
}