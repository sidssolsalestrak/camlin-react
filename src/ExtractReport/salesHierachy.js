import { useState, useEffect, useRef } from "react";
import Layout from "../layout";
import api from "../services/api";
import useToast from "../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab, TextField, FormControl, Select, MenuItem, InputLabel, IconButton, Autocomplete, Grid
} from "@mui/material";
import { AiOutlineFileExcel } from "react-icons/ai";
import { DownloadCSV } from "../utils/Download CSV/DownloadCSV";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import DataTable from "../utils/dataTable";
import CircularProgress from "../utils/CircularProgressLoading";
import { getMasterPanel } from "../services/masterPanelService";

export default function SalesHierachy() {
    const [selZone, setSelZone] = useState(0)
    const [allZone, setAllZone] = useState([])
    const [allRegion, setAllRegion] = useState([])
    const [allUserType, setAllUserType] = useState([])
    const [allDistributor, setAllDistributor] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [selRegion, setSelRegion] = useState(0)
    const [selUserType, setSelUserType] = useState(0)
    const [selUsers, setSelUsers] = useState({ id: 0, u_name: "All" })
    const [selDistributor, setSelDistributor] = useState(0)
    const [userError, setUserError] = useState(false)
    const [progress, setProgress] = useState(null);
    const [progress1, setProgress1] = useState(null);
    const [allHierachyData, setAllHeirachyData] = useState([])
    const [tableloading, settableloading] = useState(false);
    const { zoneid, regionid, usertypeId, userid, distributorid } = useParams()
    const decodedZoneId = zoneid !== undefined && zoneid !== null ? Number(atob(zoneid)) : 0
    const decodedRegionId = regionid !== undefined && regionid !== null ? Number(atob(regionid)) : 0
    const decodedUserTypeId = usertypeId !== undefined && usertypeId !== null ? Number(atob(usertypeId)) : 0
    const decodeduserId = userid !== undefined && userid !== null ? Number(atob(userid)) : 0
    const decodedDistributorId = distributorid !== undefined && distributorid !== null ? Number(atob(distributorid)) : 0
    const toast = useToast()
    const location = useLocation()
    const navigate = useNavigate()
    const URL = location.pathname.split('/')[2]
    const numericProgress =
        typeof progress === "string" && progress.endsWith("%")
            ? parseInt(progress)
            : null;

    const [masterPanel, setMasterPanel] = useState({});

    // tracks whether the decoded (URL) user has already been auto-applied for the
    // current navigation, so manual selUserType changes after that don't re-apply it
    const appliedDecodedUserRef = useRef(false);

    // labels derived from masterPanel with fallbacks
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const areaLabel = masterPanel["AREA"] || "Area";
    const regionLabel = masterPanel["REGN"] || "Region";
    const territoryLabel = masterPanel["TERR"] || "Territory";
    const userLabel = masterPanel["USER"] || "Users";
    const stkLabel = masterPanel["STKS"] || "Distributor";
    const catLabel = masterPanel["PCAT"] || "Category";
    const rsmLabel = masterPanel["ZM"] || "RSM";     // tag ZM -> alias "RSM"
    const zbmLabel = masterPanel["RM"] || "ZBM";     // tag RM -> alias "ZBM"
    const amLabel = masterPanel["ASM"] || "AM/FSO";  // tag ASM -> alias "AM/FSO"
    const srLabel = masterPanel["KAM"] || "SR";      // tag KAM -> alias "SR"

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        fetchZone()
        fetchUserType()
    }, [])

    useEffect(() => {
        if (!decodedRegionId) {
            setSelRegion(0)
        }
        setAllRegion([])
        if (!selZone || selZone === 0) return
        fetchRegion(selZone)

    }, [selZone])

    useEffect(() => {
        if (!decodeduserId) {
            setSelUsers({ id: 0, u_name: "All" })
        }
        if (!selUserType || selUserType === 0) {
            setAllUsers([])
            setSelUsers({ id: 0, u_name: "All" })
            return
        }
        fetchSSUserList()
    }, [selUserType, selZone, selRegion])

    useEffect(() => {
        if (!decodedDistributorId) {
            setSelDistributor(0)
            setAllDistributor([])
        }
        if ((!selRegion || selRegion === 0) && (!selUsers || selUsers.id === 0)) {
            setSelDistributor(0)
            setAllDistributor([])
            return
        }
        fetchDistributor()
    }, [selRegion, selUsers])

    useEffect(() => {
        const fetchTableData = async () => {
            if (URL !== 'active_sales_new') {
                setSelZone(Number(zoneid ? decodedZoneId : 0))
                setSelRegion(Number(regionid ? decodedRegionId : 0))
                setSelUserType(Number(usertypeId ? decodedUserTypeId : 0))
                setSelDistributor(Number(decodedDistributorId ? decodedDistributorId : 0))
            }
            let hierachyData = await fetchHierachyData(decodedZoneId, decodedRegionId, decodedUserTypeId, decodeduserId, decodedDistributorId)
            setAllHeirachyData(hierachyData)
        }
        if (zoneid || regionid || usertypeId || userid || distributorid) {
            fetchTableData()
        }
    }, [zoneid, regionid, usertypeId, userid, distributorid])

    // New navigation (Load click / URL change) → allow the decoded user to be
    // auto-applied again once
    useEffect(() => {
        appliedDecodedUserRef.current = false
    }, [decodeduserId])

    // Once the user list loads, resolve the decoded user ID into the full object.
    // Only does this once per navigation - manual selUserType changes afterwards
    // (e.g. reset to All, then re-pick the same type) won't re-select it.
    useEffect(() => {
        if (!decodeduserId || appliedDecodedUserRef.current) return
        if (!allUsers || allUsers.length === 0) return
        let UserData = allUsers.find((val) => val.id === Number(decodeduserId)) ?? { id: 0, u_name: "All" }
        console.log("selc user data", UserData)
        setSelUsers(UserData)
        appliedDecodedUserRef.current = true
    }, [allUsers, decodeduserId])


    const fetchUserType = async () => {
        try {
            let response = await api.post("/getuserTypeExtract")
            let usertypeRes = Array.isArray(response.data.data) ? response.data.data : []
            console.log("user type response", usertypeRes)
            setAllUserType(usertypeRes)
        }
        catch (err) {
            console.log("fetch user typeerr", err)
        }
    }
    const fetchZone = async () => {
        try {
            let response = await api.post("/getReportsZone", { zone_id: null })
            let zoneRes = Array.isArray(response.data.data) ? response.data.data : []
            console.log("zoneRes", zoneRes)
            setAllZone(zoneRes)
        }
        catch (err) {
            console.log("fetch zone err", err)
        }
    }
    const fetchRegion = async (zoneid) => {
        try {
            let response = await api.post("/extractRegionList", { zone_id: zoneid })
            let regionres = Array.isArray(response.data.data) ? response.data.data : []
            console.log("region response", regionres)
            setAllRegion(regionres)

        }
        catch (err) {
            console.log("fetch region err", err)
        }
    }
    const fetchSSUserList = async () => {
        try {
            let payload = {
                zone_id: selZone,
                reg_id: selRegion,
                user_type: selUserType
            }
            let response = await api.post("/getExtractSSUserList", payload)
            let userListRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllUsers(userListRes)
            console.log("user list res", userListRes)

        }
        catch (err) {
            console.log("fetching ssuserlist err", err)
        }
    }

    const fetchDistributor = async () => {
        try {
            let payload = {
                reg_id: selRegion,
                user_id: selUsers?.id
            }
            let response = await api.post('/getStockstk', payload)
            let distributorres = Array.isArray(response.data.data) ? response.data.data : []
            setAllDistributor(distributorres)
            console.log("all Distributor", distributorres)

        }
        catch (err) {
            console.log("fetch distributor err", err)

        }
    }

    const columns = [
        {
            field: "sno",
            headerName: "SL No.",
        },
        {
            field: "stk_code",
            headerName: `${stkLabel} Code`
        },
        {
            field: "stk_name",
            headerName: `${stkLabel} Name`,
        },
        {
            field: "city_name",
            headerName: "City"
        },
        {
            field: "state_name",
            headerName: "State",
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "zone_name",
            headerName: zoneLabel,
        },
        {
            field: "reg_name",
            headerName: regionLabel,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "area_name",
            headerName: areaLabel,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "ter_name",
            headerName: territoryLabel,
        },
        {
            field: "rsm_code",
            headerName: `${rsmLabel} Code`,
        },
        {
            field: "rsm_name",
            headerName: `${rsmLabel} Name`,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "rsm_email",
            headerName: `${rsmLabel} Email`,
        },
        {
            field: "rsm_mobile",
            headerName: `${rsmLabel} Mobile`,
        },
        {
            field: "zbm_code",
            headerName: `${zbmLabel} Code`,
        },
        {
            field: "zbm_name",
            headerName: `${zbmLabel} Name`,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "zbm_email",
            headerName: `${zbmLabel} Email`,
        },
        {
            field: "zbm_mobile",
            headerName: `${zbmLabel} Mobile`,
        },
        {
            field: "am_code",
            headerName: `${amLabel} Code`,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "am_name",
            headerName: `${amLabel} Name`,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "am_email",
            headerName: `${amLabel} Email`,
        },
        {
            field: "am_mobile",
            headerName: `${amLabel} Mobile`,
        },
        {
            field: "sr_code",
            headerName: `${srLabel} Code`,
        },
        {
            field: "sr_name",
            headerName: `${srLabel} Name`,
            renderCell: (params) => (
                <Typography sx={{ textWrap: 'nowrap' }}>{params.value}</Typography>
            )
        },
        {
            field: "sr_hq_name",
            headerName: `${srLabel} Headquarter`,
        },
        {
            field: "sr_email",
            headerName: `${srLabel} Email`,
        },
        {
            field: "sr_mobile",
            headerName: `${srLabel} Mobile`,
        },

    ]

    // ─── Main fetch used by the visible DataTable ───────────────────────────
    // Toggles tableloading, which the visible DataTable's `loading` prop is
    // bound to. Do NOT reuse this for one-off actions like Excel export — it
    // will flash the on-screen table into a loading state.
    const fetchHierachyData = async (zone, region, usertyp, userid, stkid) => {
        try {
            settableloading(true)
            let payload = {
                zone_id: zone,
                reg_id: region,
                user_type: usertyp,
                user_id: userid,
                stk_id: stkid
            }
            let response = await api.post("/getSalesHierachy", payload)
            let hierachyData = Array.isArray(response.data.data) ? response.data.data : []
            let finalHierachyData = hierachyData.map((val, index) => ({ ...val, sno: index + 1 }))
            return finalHierachyData

        }
        catch (err) {
            console.log("fetching heirachy data error", err)
            return []
        }finally{
            settableloading(false)
        }
    }

    // ─── Export-only fetch ───────────────────────────────────────────────────
    // Same request/shape as fetchHierachyData, but intentionally does NOT
    // toggle settableloading, so the visible DataTable is completely
    // unaffected when the user clicks the Excel download icon.
    const fetchHierachyDataForExport = async (zone, region, usertyp, userid, stkid) => {
        try {
            let payload = {
                zone_id: zone,
                reg_id: region,
                user_type: usertyp,
                user_id: userid,
                stk_id: stkid
            }
            let response = await api.post("/getSalesHierachy", payload)
            let hierachyData = Array.isArray(response.data.data) ? response.data.data : []
            let finalHierachyData = hierachyData.map((val, index) => ({ ...val, sno: index + 1 }))
            return finalHierachyData

        }
        catch (err) {
            console.log("fetching heirachy data for export error", err)
            return []
        }
    }
    // ────────────────────────────────────────────────────────────────────────

    let handleLoad = () => {
        if (selUsers?.id === 0 && selUserType > 0) {
            setUserError(true)
            toast.warning("Please Select User to Load")
            return
        }
        setUserError(false)
        navigate(`/reports/active_sales/${btoa(selZone || 0)}/${btoa(selRegion || 0)}/${btoa(selUserType || 0)}/${btoa(selUsers?.id || 0)}/${btoa(selDistributor || 0)}`)
    }

    const handleDownloadExcel = async () => {
        try {
            setProgress1("0%")
            if (selUsers?.id === 0 && selUserType > 0) {
                setUserError(true)
                toast.warning("Please Select User to Load")
                return
            }
            setUserError(false)

            // Uses the export-only fetch so the visible DataTable's loading
            // state / data are never touched by this action.
            let finalHierachyData = await fetchHierachyDataForExport(selZone, selRegion, selUserType, selUsers.id, selDistributor)
            const safeColumns = columns.map(
                ({ renderCell, renderHeader, ...rest }) => rest,
            );
            await new Promise((r) => setTimeout(r, 100));
            setProgress1("50%");
            //  Build dynamic meta from selected filter values
            const getLabel = (list, selectedId, labelKey, prefix) => {
                if (!selectedId || selectedId === 0) return `${prefix}- All`
                const match = list.find((item) => item.id === selectedId)
                return match ? `${prefix}- ${match[labelKey]}` : `${prefix}- All`
            }
            const userLabel1 = (masterPanel["USER"] || "Users").replace(/\s+T\s*$/, '').trim() || "Users";

            const selectedUserTypeLabel = (() => {
                if (!selUserType || selUserType === 0) return `${userLabel1} Type - All`
                const match = allUserType.find((u) => u.id === selUserType)
                return match ? `${userLabel1} Type- ${match.client_alias}` : `${userLabel1} Type - All`
            })()

            const selectedDistributorLabel = (() => {
                if (!selDistributor || selDistributor === 0) return `${stkLabel}- All`
                const match = allDistributor.find((d) => d.stk_id === selDistributor)
                return match ? `${stkLabel}-${match.stk_code}-${match.stk_name}` : `${stkLabel}- All`
            })()

            const meta = {
                Zone: getLabel(allZone, selZone, "zone_name", zoneLabel),
                Region: getLabel(allRegion, selRegion, "reg_name", regionLabel),
                UserType: selectedUserTypeLabel,
                User: `${userLabel} - ${selUsers?.u_name ?? "All"}`,
                Distributor: selectedDistributorLabel,
            }


            DownloadCSV(
                finalHierachyData,
                safeColumns,
                "Sales_Hierachy_List",
                setProgress,
                toast,
                meta,                   // ← pass meta here
            );

            await new Promise((r) => setTimeout(r, 100));
            setProgress1("100%");
        }
        catch (err) {
            console.log("Download excel err", err)
        } finally {
            setProgress1(null)
        }
    }
    console.log("All Heirachy Data", allHierachyData)
    console.log("All user ids", allUsers)
    console.log("selected distributor id", selDistributor)
    console.log("params ", zoneid, regionid, distributorid)

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Extract", path: URL !== 'active_sales_new' ? "/reports/active_sales" : "/reports/active_sales_new" },
                { label: "Sales Hierachy" }
            ]}>
            <Box p={0.5}>
                <Box
                    p={2}
                    sx={{ borderRadius: 1 }}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                >
                    <Box>
                        <h1 className="mainTitle">Sales Hierachy</h1>
                    </Box>
                    <Box sx={{
                        backgroundColor: "#fff", boxShadow:
                            "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px"
                    }}>
                        <Grid container spacing={0.95}>
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth sx={{ height: '3rem' }}>
                                    <InputLabel id="zone">{zoneLabel} </InputLabel>
                                    <Select value={selZone} onChange={(e) => {
                                        setSelRegion(0)
                                        setSelZone(e.target.value)
                                    }} labelId="zone" label={zoneLabel} size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value={0}>All</MenuItem>
                                        {allZone.map((val) => (
                                            <MenuItem key={val.id} value={val.id}>{val.zone_name}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth sx={{ height: '3rem' }}>
                                    <InputLabel id="region">{regionLabel} </InputLabel>
                                    <Select value={selRegion} onChange={(e) => {
                                        setSelDistributor(0)
                                        setSelRegion(e.target.value)
                                    }} labelId="region" label={regionLabel} size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200
                                                }
                                            }
                                        }}

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
                                    <InputLabel id="usr_type">{userLabel} Type </InputLabel>
                                    <Select value={selUserType} onChange={(e) => {
                                        setSelUsers({ id: 0, u_name: "All" })
                                        setSelUserType(e.target.value)
                                    }} labelId="usr_type" label={`${userLabel} Type`} size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value={0}>All</MenuItem>
                                        {allUserType.map((val) => (
                                            <MenuItem value={val.id} key={val.id}>{val.client_alias}</MenuItem>
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
                                        onChange={(event, newValue) => {
                                            setSelDistributor(0)
                                            setSelUsers(newValue)
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={userLabel}
                                                size="small"
                                                error={!!userError}
                                                helperText={userError ? "Please Select User to Load" : ""}
                                            />
                                        )}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ md: 3, lg: 2, xs: 12, sm: 6 }}>
                                <FormControl fullWidth sx={{ height: '3rem' }}>
                                    <InputLabel id="Distributor">{stkLabel}</InputLabel>
                                    <Select value={selDistributor} onChange={(e) => setSelDistributor(e.target.value)} labelId="Distributor" label={stkLabel} size="small"
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 200,
                                                }
                                            }
                                        }}

                                    >
                                        <MenuItem value={0}>All</MenuItem>
                                        {allDistributor.map((val) => (
                                            <MenuItem sx={{ textWrap: 'wrap' }} key={val.stk_id} value={val.stk_id}>{val.stk_code}-{val.stk_name}</MenuItem>
                                        ))}

                                    </Select>
                                </FormControl>
                            </Grid>
                            {URL !== 'active_sales_new' && <Grid size={{ md: 1.3, lg: 1, xs: 4, sm: 2 }}> <Button variant="contained" sx={{ mt: 0.1 }} onClick={() => handleLoad()} >
                                Load
                            </Button>
                            </Grid>
                            }
                            <Grid size={{ md: 1, lg: 0.5, xs: 2, sm: 1 }}>
                                {progress1 ? (
                                    <CircularProgress progress={progress1} />
                                ) : (
                                    <span onClick={handleDownloadExcel} style={{ cursor: 'pointer' }}>
                                        <AiOutlineFileExcel style={{ color: "green", height: "30px", width: "30px" }} />
                                    </span>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                    {URL !== 'active_sales_new' &&
                        <DataTable
                            columns={columns}
                            data={allHierachyData}
                            loading={tableloading}
                            sx={{
                                background: "#fff",
                                borderRadius: "10px",
                                boxShadow:
                                    "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                            }}
                        />}
                </Box>
            </Box>

        </Layout>
    )
}