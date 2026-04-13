import { useState, useEffect } from "react";
import Layout from "../../layout";
import api from "../../services/api";
import useToast from "../../utils/useToast";
import {
    Box, Typography, Button,TextField, Autocomplete, MenuItem, InputLabel,
    FormControl,
    Select
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DataTable from "../../utils/dataTable";
import { IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import './AdminPanel.css'

export default function AwsLogs() {
    const { frmDate, processType, userli, processSts } = useParams()
    const decodedFromDate = frmDate !== undefined && frmDate !== null ? atob(frmDate || dayjs()) : dayjs()
    const decodedprocessType = processType !== undefined && processType !== null ? atob(processType) : null
    const decodedUserId = userli !== undefined && userli !== null ? atob(userli) : null
    const decodedprocessSts = processSts !== undefined && processSts !== null ? atob(processSts || 0) : null
    const [fromDt, setFromDate] = useState(dayjs(decodedFromDate) || dayjs())
    const [allUsers, setAllUsers] = useState([])
    const [selUsers, setSelUsers] = useState({ id: 0, user_name: 'All' })
    const [selProcesstype, setSelProcessType] = useState(0)
    const [selProcessSts, setSelProcessSts] = useState(1)
    const [allAwsLogsData, setAllAwsLogsData] = useState([])
    const [loading,setLoading]=useState(true)
    const navigate = useNavigate()
    const toast = useToast()
    const location=useLocation()

    useEffect(() => {
        fetchAllUsers()
        fetchAwsLogData()
     // eslint-disable-next-line
    }, [])

    useEffect(() => {
        if (!decodedFromDate || !decodedUserId || !decodedprocessSts || !decodedprocessType) {
            return
        }
        fetchAwsLogData()

        setSelUsers(allUsers.find((val) => val.id === Number(decodedUserId)) )
        setSelProcessSts(Number(decodedprocessSts))
        setSelProcessType(Number(decodedprocessType))
         // eslint-disable-next-line
    }, [decodedFromDate, decodedUserId, decodedprocessSts, decodedprocessType])

    useEffect(() => {
        if (allUsers.length > 0 && decodedUserId) {
            setSelUsers(allUsers.find((val) => val.id === Number(decodedUserId)))
        }
        else {
            return
        }
    }, [allUsers, decodedUserId])

    const fetchAllUsers = async () => {
        try {
            let response = await api.post("/getAllUsers")
            let allUserDatares = Array.isArray(response.data.data) ? response.data.data : []
            setAllUsers([{ id: 0, user_name: 'All' },...allUserDatares])

        }
        catch (err) {
            console.log(err)
        }
    }

    const fetchAwsLogData = async () => {
        setLoading(true)
        try {
            let submitPayload = {
                fromDate: decodedFromDate,
                typeId: decodedprocessType,
                status: decodedprocessSts,
                user_id: decodedUserId
            }
            let response = await api.post("/getAwsLogList", submitPayload)
            let awsLogsDataRes = Array.isArray(response.data.data) ? response.data.data : []
            setAllAwsLogsData(awsLogsDataRes.map((item, index) => ({ ...item, extra: "Re-Process" })))
        }
        catch (err) {
            console.log(err)

        }
        finally{
            setLoading(false)
        }
    }

    const handleSubmit = () => {
        let Payload = {
            fromDate: dayjs(fromDt) || dayjs(),
            typeId: selProcesstype || 0,
            status: selProcessSts || 0,
            user_id: selUsers?.id || 0
        }
        navigate(`/Processlist/planprocess/${btoa(Payload.fromDate)}/${btoa(Payload.typeId)}/${btoa(Payload.user_id)}/${btoa(Payload.status)}`)
    }

    const handleReprocess = async (row) => {
        try {
            let data = row.row
            let payload = {
                datakey: data.datakey || null,
                type_id: data.type_id || null
            }
            let response = await api.post("/unProcess", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            }
            else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log(err)
            toast.error("Reprocess failed Try again!!")
        }
    }

    const handleReprocessAll = async () => {
        try {
            let reprocessDatakeyId = allAwsLogsData.map((item) => item.datakey)
            let reprocessTypeId = allAwsLogsData.map((item) => item.type_id)
            let payload = {
                datakey: reprocessDatakeyId.join(",") || null,
                type_id: reprocessTypeId.join(",") || null
            }
            let response = await api.post("/unProcessAll", payload)
            if (response.data.status === 200) {
                toast.success(response.data.message)
            }
            else {
                toast.error(response.data.message)
            }
        }
        catch (err) {
            console.log(err)
            toast.error("Reprocess All failed Try again!!")
        }
    }

    const extraColumn = {
        field: 'extra', headerName: '', filterable: true, sortable: true, renderCell: (row) => (
            <Typography className="extra-field" onClick={() => handleReprocess(row)}>{row.row.extra}</Typography>
        )
    };

    const columns = [
        { field: "proj_name", headerName: "PROJECT NAME", filterable: true, sortable: true },
        { field: "user_name", headerName: "USER", filterable: true, sortable: true },
        { field: "data_date", headerName: "CALL DATE", filterable: true, sortable: true },
        { field: "type_name", headerName: "TYPE", filterable: true, sortable: true },
        { field: "data_des", headerName: "CUSTOMER", filterable: true, sortable: true },
        { field: "data_key", headerName: "KEY", filterable: true, sortable: true },
        { field: "submit_datetime", headerName: "DATETIME", filterable: true, sortable: true,renderCell:(params)=>(
            <Typography>{dayjs(params.row.submit_datetime).add(5, 'hour').add(30, 'minute').format("DD MMM YYYY hh:mm a")}</Typography>
        ) },
        {
            field: "status",
            headerName: "STATUS",
            renderCell: (row) => (
                <Box>
                    {row.row.status === 2 || row.row.status === 4
                        ? <IoClose color="red" fontSize={16} />
                        : <FaCheck color="green" fontSize={16} />}
                </Box>
            ),
        },
        ...(Number(decodedprocessSts) === 0 ? [extraColumn] : []),
        {
            field: "download",
            headerName: "",
            renderCell: (params) => {
                const handleDownload = () => {
                    const data = params.row.json;        // adjust field name as needed
                    const datakey = params.row.datakey;  // adjust field name as needed
                    const filename = `${datakey || "txt"}.txt`;

                    const element = document.createElement('a');
                    element.setAttribute(
                        'href',
                        'data:text/plain;charset=utf-8,' + encodeURIComponent(data)
                    );
                    element.setAttribute('download', filename);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                };

                return (
                    <Box sx={{ cursor: 'pointer' }} onClick={handleDownload}>
                        <FaDownload fontSize={18} color="#133BDE" />
                    </Box>
                );
            },
        },
    ];


    return (
        <Layout>
            <Box sx={{ backgroundColor: 'white', pt: 2, minHeight: '30vh', pl: 3 }}>
                <Box>
                    <h1 className="mainTitle" >Process List</h1>
                </Box>
                <Box sx={{ pt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, width: '90%' }} >
                    <FormControl >
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="From Date"
                                format="DD MMM YYYY"
                                value={fromDt}
                                onChange={(newVal) => setFromDate(newVal)}
                                slotProps={{
                                    textField: {
                                        sx: { minWidth: 90, maxWidth: 190 },
                                        size: "small",
                                        className: "date-input",
                                    },
                                }}
                                maxDate={dayjs()}
                            />
                        </LocalizationProvider>

                    </FormControl>
                    <FormControl sx={{ width: 190 }}>
                        <InputLabel id="process_type">Process Type</InputLabel>
                        <Select size="small" labelId="process_type"
                            label="Process Type" value={selProcesstype}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 200
                                    }
                                }
                            }}
                            onChange={(e) => setSelProcessType(e.target.value)}
                        >
                            <MenuItem value={0}>All</MenuItem>
                            <MenuItem value={1}>Customer Plan</MenuItem>
                            <MenuItem value={12}>Other Plan</MenuItem>
                            <MenuItem value={11}>Event Plan</MenuItem>
                            <MenuItem value={2}>Daily Report</MenuItem>
                            <MenuItem value={3}>Expense</MenuItem>
                            <MenuItem value={4}>Direct Order</MenuItem>
                            <MenuItem value={5}>Event</MenuItem>
                            <MenuItem value={6}>Stock And Sales</MenuItem>
                            <MenuItem value={7}>Timesheet</MenuItem>
                            <MenuItem value={8}>Add/Edit Customer</MenuItem>
                            <MenuItem value={9}>Delete Customer</MenuItem>
                            <MenuItem value={13}>Leave</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{ width: 200 }}>
                        <Autocomplete
                            options={allUsers}
                            getOptionLabel={(option) => option.user_name || ""}
                            value={selUsers}
                            key={(option) => option.user_name}
                            onChange={(e, newValue) => {
                                setSelUsers(newValue)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Users"
                                    size="small"
                                    // error={userTypeErr}
                                    required
                                // helperText={userTypeErr ? "User Type not Selected !" : ""}
                                // sx={{ backgroundColor: decodedmenuId ? '#EEEEEE' : undefined }}
                                />
                            )}

                        />
                    </FormControl>
                    <FormControl sx={{ width: 170 }}>
                        <InputLabel id='process_sts'>Process Status</InputLabel>
                        <Select labelId="process_sts" label="Process Status" size="small" onChange={(e) => setSelProcessSts(e.target.value)} value={selProcessSts} >
                            <MenuItem value={1}>Processed</MenuItem>
                            <MenuItem value={0}>UnProcessed</MenuItem>
                            <MenuItem value={2}>Saved</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={() => handleSubmit()}>Load</Button>
                </Box>
                <Box sx={{ mt: 2, mr: 2 }}>
                    <DataTable columns={columns} data={allAwsLogsData} loading={loading} />
                </Box>
                {Number(decodedprocessSts) === 0 && allAwsLogsData.length>0 ? <Button variant="contained" onClick={() => handleReprocessAll()} sx={{ width: '9rem', mt: 2, mb: 2 }}>Process All</Button> : null}
            </Box>

        </Layout>
    )
}