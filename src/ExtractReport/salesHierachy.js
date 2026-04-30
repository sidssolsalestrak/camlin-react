import { useState, useEffect } from "react";
import Layout from "../layout";
import api from "../services/api";
import useToast from "../utils/useToast";
import {
    Box, Typography, Button, Tabs, Tab, TextField, FormControl, Select, MenuItem, InputLabel, IconButton, Autocomplete, CircularProgress,Grid
} from "@mui/material";
import { AiOutlineFileExcel } from "react-icons/ai";
import { DownloadCSV } from "../utils/Download CSV/DownloadCSV";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import DataTable from "../utils/dataTable";

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
    const [allHierachyData, setAllHeirachyData] = useState([])
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
        if (!selUserType || selUserType === 0) return
        fetchSSUserList()
    }, [selUserType])

    useEffect(() => {
        if (!decodedDistributorId) {
            setSelDistributor(0)
            setAllDistributor([])
        }
        if (!selRegion || selRegion === 0) return
        fetchDistributor()
    }, [selRegion, selUsers])

    useEffect(() => {
          
        const fetchTableData = async () => {
            console.log("All decoded data", decodedZoneId, decodedRegionId, decodedUserTypeId, decodeduserId, decodedDistributorId)
            if (URL !== 'active_sales_new') {
                setSelZone(Number(zoneid ? decodedZoneId : 0))
                setSelRegion(Number(regionid ? decodedRegionId : 0))
                setSelUserType(Number(usertypeId ? decodedUserTypeId : 0))
                setSelUsers(
                    userid > 0
                        ? allUsers.find((val) => val.id === Number(decodeduserId)) ?? { id: 0, u_name: "All" }
                        : { id: 0, u_name: "All" }
                );
                setSelDistributor(Number(distributorid ? decodedDistributorId : 0))
            }
            let hierachyData = await fetchHierachyData(decodedZoneId, decodedRegionId, decodedUserTypeId, decodeduserId, decodedDistributorId)
            setAllHeirachyData(hierachyData)
        }
       if(zoneid || regionid|| usertypeId || userid|| distributorid){
        console.log("have params fetch table data is running")
        fetchTableData()
       }
       else return

    }, [ zoneid, regionid, usertypeId, userid, distributorid])

    useEffect(() => {
        if (!decodeduserId && allUsers) return
        let UserData = allUsers.find((val) => val.id === Number(decodeduserId)) ?? { id: 0, u_name: "All" }
        console.log("selc user data", UserData)
        setSelUsers(UserData)
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
            headerName: "DistributorCode",
        },
        {
            field: "stk_name",
            headerName: "DistributorName",
        },
        {
            field: "city_name",
            headerName: "City"
        },
        {
            field: "state_name",
            headerName: "State",
        },
        {
            field: "zone_name",
            headerName: "Zone",
        },
        {
            field: "reg_name",
            headerName: "Region",
        },
        {
            field: "area_name",
            headerName: "Area",
        },
        {
            field: "ter_name",
            headerName: "Territory",
        },
        {
            field: "rsm_code",
            headerName: "RSM Code",
        },
        {
            field: "rsm_name",
            headerName: "RSM Name",
        },
        {
            field: "rsm_email",
            headerName: "RSM Email",
        },
        {
            field: "rsm_mobile",
            headerName: "RSM Mobile",
        },
        {
            field: "zbm_code",
            headerName: "ZBM Code",
        },
        {
            field: "zbm_name",
            headerName: "ZBM Name",
        },
        {
            field: "zbm_email",
            headerName: "ZBM Email",
        },
        {
            field: "zbm_mobile",
            headerName: "ZBM Mobile",
        },
        {
            field: "am_code",
            headerName: "AM Code",
        },
        {
            field: "am_name",
            headerName: "AM Name",
        },
        {
            field: "am_email",
            headerName: "AM Email",
        },
        {
            field: "am_mobile",
            headerName: "AM Mobile",
        },
        {
            field: "sr_code",
            headerName: "SR Code",
        },
        {
            field: "sr_name",
            headerName: "SR Name",
        },
        {
            field: "sr_hq_name",
            headerName: "SR Headquarter",
        },
        {
            field: "sr_email",
            headerName: "SR Email",
        },
        {
            field: "sr_mobile",
            headerName: "SR Mobile",
        },

    ]

    const fetchHierachyData = async (zone, region, usertyp, userid, stkid) => {
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
            console.log("fetching heirachy data error", err)
            return []
        }
    }

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
            if (selUsers?.id === 0 && selUserType > 0) {
                setUserError(true)
                toast.warning("Please Select User to Load")
                return
            }
            setUserError(false)

            let finalHierachyData = await fetchHierachyData(selZone, selRegion, selUserType, selUsers.id, selDistributor)
            const safeColumns = columns.map(
                ({ renderCell, renderHeader, ...rest }) => rest,
            );

            // ── Build dynamic meta from selected filter values ──────────────────
            const getLabel = (list, selectedId, labelKey, prefix) => {
                if (!selectedId || selectedId === 0) return `${prefix}- All`
                const match = list.find((item) => item.id === selectedId)
                return match ? `${prefix}- ${match[labelKey]}` : `${prefix}- All`
            }

            const selectedUserTypeLabel = (() => {
                if (!selUserType || selUserType === 0) return "User Type - All"
                const match = allUserType.find((u) => u.id === selUserType)
                return match ? `User Type - ${match.client_alias}` : "User Type - All"
            })()

            const selectedDistributorLabel = (() => {
                if (!selDistributor || selDistributor === 0) return "Distributor- All"
                const match = allDistributor.find((d) => d.stk_id === selDistributor)
                return match ? `Distributor- ${match.stk_code}-${match.stk_name}` : "Distributor- All"
            })()

            const meta = {
                zone: getLabel(allZone, selZone, "zone_name", "Zone"),
                region: getLabel(allRegion, selRegion, "reg_name", "Region"),
                userType: selectedUserTypeLabel,
                user: `User - ${selUsers?.u_name ?? "All"}`,
                distributor: selectedDistributorLabel,
            }
            // ────────────────────────────────────────────────────────────────────

            DownloadCSV(
                finalHierachyData,
                safeColumns,
                "Sales_Hierachy_List",
                setProgress,
                toast,
                meta,                   // ← pass meta here
            );

        }
        catch (err) {
            console.log("Download excel err", err)
        }
    }
    console.log("All Heirachy Data", allHierachyData)
    console.log("All user ids", allUsers)
    console.log("selected distributor id", selDistributor)
    console.log("params ",zoneid,regionid,distributorid)

    return (
        <Layout
            breadcrumb={[
                { label: "Home", path: "/" },
                { label: "Extract", path:URL !== 'active_sales_new' ?"/reports/active_sales":"/reports/active_sales_new" },
                { label: "Sales Hierachy"}
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
                    <Box sx={{  display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' ,backgroundColor: "#fff", boxShadow:
                            "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                        padding: "16px 18px",
                        borderRadius: "10px"}}>
                        <FormControl sx={{ height: '3rem' }}>
                            <InputLabel id="zone">Zone </InputLabel>
                            <Select value={selZone} onChange={(e) =>{
                                setSelRegion(0) 
                                setSelZone(e.target.value) }} sx={{ width: URL !== 'active_sales_new'?165: 175 }} labelId="zone" label="Zone" size="small"
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
                        <FormControl sx={{ height: '3rem' }}>
                            <InputLabel id="region">Region </InputLabel>
                            <Select value={selRegion} onChange={(e) => {
                                setSelDistributor(0)
                                setSelRegion(e.target.value)
                            }} sx={{ width:URL !== 'active_sales_new'?165: 175 }} labelId="region" label="Region" size="small"
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
                        <FormControl sx={{ height: '3rem' }}>
                            <InputLabel id="usr_type">User Type </InputLabel>
                            <Select value={selUserType} onChange={(e) => setSelUserType(e.target.value)} sx={{ width: URL !== 'active_sales_new'?165:175 }} labelId="usr_type" label="User Type" size="small"
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
                        <FormControl sx={{ height: '3rem' }}>
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
                                        label="User"
                                        size="small"
                                        error={!!userError}
                                        helperText={userError ? "Please Select User to Load" : ""}
                                        sx={{ width: URL !== 'active_sales_new' ? 165 : 200 }}
                                    />
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />
                        </FormControl>
                        <FormControl sx={{ height: '3rem' }}>
                            <InputLabel id="Distributor">Distributor</InputLabel>
                            <Select value={selDistributor} onChange={(e) => setSelDistributor(e.target.value)} sx={{ width: URL !== 'active_sales_new' ? 180 : 190 }} labelId="Distributor" label="Distributor" size="small"
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            maxHeight: 200,
                                            maxWidth: URL !== 'active_sales_new' ? 175 : 200
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
                        {URL !== 'active_sales_new' && <Button variant="contained" onClick={() => handleLoad()} >
                            Load
                        </Button>
                        }
                        <IconButton onClick={() => handleDownloadExcel()} >
                            {progress ? (
                                <Box
                                    position="relative"
                                    display="inline-flex"
                                    alignItems="center"
                                >
                                    <CircularProgress
                                        variant={
                                            numericProgress !== null ? "determinate" : "indeterminate"
                                        }
                                        value={numericProgress || 0}
                                        size={30}
                                        thickness={3}
                                    />
                                    <Box
                                        top={0}
                                        left={0}
                                        bottom={0}
                                        right={0}
                                        position="absolute"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Typography
                                            variant="caption"
                                            component="div"
                                            color="textSecondary"
                                        >
                                            {progress}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <AiOutlineFileExcel size={25} color="green" />
                            )}
                        </IconButton>
                    </Box>
                    {URL !== 'active_sales_new' &&
                        <DataTable
                            columns={columns}
                            data={allHierachyData}
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