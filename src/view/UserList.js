import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,DialogContent,DialogContentText,DialogActions,DialogTitle,
  IconButton,
  Typography,
  TextField
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import Layout from "../layout";
import { FaMobileAlt, FaEdit, FaTrash } from "react-icons/fa";
import "../assets/css/accountMas.css";
import { Download } from '../utils/downloadExcel/Download'
import dayjs from "dayjs";
import useToast from "../utils/useToast";
import {DownloadNoCell} from ".././utils/xlsnoCellsDownload/DownloadNoCell";
import ConfirmationDialog from "../utils/confirmDialog";
import CloseIcon from "@mui/icons-material/Close";
import profile from "../assets/images/profile.jpg";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";


function UserList() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // ---------------- STATE ----------------
  const [userTypeList, setUserTypeList] = useState([]);
  const [deptList, setDeptList] = useState([]);
  const [zoneList, setZoneList] = useState([]);
  const [regionList, setRegionList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [terList, setTerList] = useState([]);
  const [userDialog,setUserDialog]=useState(false)
  const [previewImage, setPreviewImage] = useState(profile);
  const [dialogData,setDialogData]=useState([])
  const [dialogActiveStat,setDialogActiveStat]=useState(0)
  const [tableData, setTableData] = useState([]);
  const [progress, setProgress] = useState(null);
  const toast=useToast()
  const [modifyLoading, setModifyLoading] = useState(false);
  const [filters, setFilters] = useState({
    userType: 0,
    dept: 0,
    zone: 0,
    region: 0,
    area: 0,
    territory: 0,
    channel: 0,
  });

  const [confirmationDialog, setConfirmationDialog] = useState({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
      confirmText: "Confirm",
      cancelText: "Cancel",
      confirmColor: "primary",
    });

    const showConfirmationDialog = (config) => {
    setConfirmationDialog((prev) => ({ ...prev, ...config, open: true }));
  };

  const closeConfirmationDialog = () => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
  };

  const showDeleteConfirmation = (row) => {
    showConfirmationDialog({
      title: "Confirmation",
      message: "Are you sure you want to delete this record?",
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: () => handleDelete(row),
    });
  };

  // ---------------- DECODE ----------------
  const decode = (val) => {
    try {
      return Number(atob(val));
    } catch {
      return 0;
    }
  };

  const decodedParams = {
    userType: decode(params.userType),
    dept: decode(params.dept),
    zone: decode(params.zone),
    region: decode(params.reg),
    area: decode(params.area),
    territory: decode(params.ter),
    channel: decode(params.channel),
  };

  // ---------------- INITIAL DATA ----------------
  useEffect(() => {
    fetchUserTypes();
    fetchDept();
    fetchZones();
  }, []);

  const fetchUserTypes = async () => {
    try{
    const res = await api.post("/getUsertypeList");
    setUserTypeList(res.data.userRes || []);
    }
    catch(err){
      console.log("fetchuser type err",err)
    }
  };

  const fetchDept = async () => {
    try{
    const res = await api.post("/dept");
    setDeptList(res.data.data || []);
    }
    catch(err){
      console.log("fetch dept err",err)
    }
  };

  const fetchZones = async () => {
    try{
    const res = await api.post("/getZoneData");
    setZoneList(res.data.data || []);
    }
    catch(err){
      console.log("fetch zone lis err",err)
    }
  };

  // ---------------- CASCADE ----------------
  const fetchRegions = async (zoneId) => {
    try{
    const res = await api.post("/getRegionData", { zoneId });
    setRegionList(res.data.data || []);
    }
    catch(err){
      console.log("fetch Region list err",err)
    }
  };

  const fetchAreas = async (regionId) => {
    try{
    const res = await api.post("/areaData", { reqionId: regionId });
    setAreaList(res.data.data || []);
    }
    catch(err){
      console.log("fetch areas err",err)
    }
  };

  const fetchTerritory = async (areaId) => {
    try{
    const res = await api.post("/getTerriTb", { area_id:areaId });
    setTerList(res.data.data || []);
    }
    catch(err){
      console.log("fetch territory Error",err)
    }
  };

  // ---------------- PREFILL ----------------
  useEffect(() => {
    setFilters({
      userType: decodedParams.userType,
      dept: decodedParams.dept,
      zone: decodedParams.zone,
      region: decodedParams.region,
      area: decodedParams.area,
      territory: decodedParams.territory,
      channel: decodedParams.channel,
    });
  }, [params]);

  // ---------------- CASCADE LOAD ----------------
  useEffect(() => {
    if (decodedParams.zone) fetchRegions(decodedParams.zone);
  }, [decodedParams.zone]);

  useEffect(() => {
    if (decodedParams.region) fetchAreas(decodedParams.region);
  }, [decodedParams.region]);

  useEffect(() => {
    if (decodedParams.area) fetchTerritory(decodedParams.area);
  }, [decodedParams.area]);

  // ---------------- HANDLE CHANGE ----------------
    const handleChange = (key, value) => {
    if (key === "zone") {
      setFilters((prev) => ({
        ...prev,
        zone: value,
        region: 0,
        area: 0,
        territory: 0,
      }));
      if(value>0){
      fetchRegions(value);
      }
      setRegionList([]);
      setAreaList([]);
      setTerList([]);
      return;
    }

    if (key === "region") {
      setFilters((prev) => ({
        ...prev,
        region: value,
        area: 0,
        territory: 0,
      }));
      if(value>0){
      fetchAreas(value);
      }
      setAreaList([]);
      setTerList([]);
      return;
    }

    if (key === "area") {
      setFilters((prev) => ({
        ...prev,
        area: value,
        territory: 0,
      }));
      if(value>0){
      fetchTerritory(value);
      }
      setTerList([]);
      return;
    }

    // userType, dept, channel etc — no cascade
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ---------------- LOAD ----------------
  const handleLoad = () => {
    const encode = (val) => btoa(val || 0);

    navigate(
      `/Users/users_list/${encode(filters.userType)}/${encode(
        filters.dept,
      )}/${encode(filters.zone)}/${encode(filters.region)}/${encode(
        filters.area,
      )}/${encode(filters.territory)}/${encode(filters.channel)}`,
    );
  };

  // ---------------- AUTO LOAD TABLE ----------------
  useEffect(() => {
    const payload = {
      userType: decodedParams.userType || 0,
      dept: decodedParams.dept || 0,
      zone: decodedParams.zone || 0,
      region: decodedParams.region || 0,
      area: decodedParams.area || 0,
      territory: decodedParams.territory || 0,
      channel: decodedParams.channel || 0,
    };

    fetchTable(payload);
  }, [params]);

  const fetchTable = async (payload) => {
    try{
    const res = await api.post("/userList", payload);

    setTableData(
      (res.data.data || []).map((item, i) => ({
        ...item,
        sl: i + 1,
      })),
    );
  }
  catch(err){
    console.log("fetch userList Error",err)
  }

  };

  // ---------------- TABLE ----------------
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";
    if (d.getFullYear() <= 1900) return "-";

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const columns = [
    {
      field: "sl",
      headerName: "#",
      width: 10,
      sortable:true,
      renderCell: ({ value }) => <span className="sl-cell">{value}</span>,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      sortable:true,
      renderCell: ({ row }) => {
        const isAppActive = row.app_stat === 1;

        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FaMobileAlt color={isAppActive ? "green" : "red"} />

              <span
                style={{
                  cursor: "pointer",
                  color: "#1A1917",
                  fontWeight: 500,
                }}
                onClick={() => handleUserClick(row)}
              >
                {row.first_name} {row.last_name}
              </span>
            </div>

            <span style={{ fontSize: 12, marginLeft: "10%" }}>
              {row.user_desig}
            </span>
          </div>
        );
      },
    },
    {
      field: "dept_name",
      headerName: "Department",
      sortable:true,
      width: 70,
    },

    {
      field: "ter_name",
      headerName: "Territory Details",
      sortable:true,
    },
    {
      field: "reporting",
      headerName: "Reporting To",
      sortable:true,
      renderCell: ({ row }) =>
        `${row.repto_fname || ""} ${row.repto_lname || ""}`,
    },

    {
      field: "email_id",
      headerName: "Email ID",
      width: 100,
      sortable:true,
      renderCell: ({ row }) => row.email_id || "-",
    },

    {
      field: "mob_no",
      headerName: "Mobile No.",
      width: 100,
      sortable:true,
      renderCell: ({ row }) => row.mob_no || "-",
    },
    {
      field: "emp_dob",
      headerName: "Date of Birth",
      sortable:true,
      width: 100,
      renderCell: ({ row }) => formatDate(row.emp_dob),
    },
    {
      field: "emp_doj",
      headerName: "Date of Joining",
      width: 100,
      sortable:true,
      renderCell: ({ row }) => formatDate(row.emp_doj),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      sortable:true,
      renderCell: ({ row }) => {
        const isInactive = row.acc_stat === 1;

        return (
          <span className={`status-chip ${isInactive ? "inactive" : "active"}`}>
            {isInactive ? "Inactive" : "Active"}
          </span>
        );
      },
    },

    {
      field: "action",
      headerName: "Action",
      width: 50,
      renderCell: ({ row }) => (
        <div style={{ display: "flex", gap: 12 }}>
          <div className="editBtn actionBtn">
            <FaEdit
              style={{ cursor: "pointer" }}
              onClick={() => handleEdit(row)}
            />
          </div>

          <div className="dltBtn actionBtn">
            <FaTrash
              style={{ cursor: "pointer", color: "red" }}
              onClick={() => showDeleteConfirmation(row)}
            />
          </div>
        </div>
      ),
    },
  ];

  const ExcelColumn=[
    {
      field: "sl",
      headerName: "#",
    },
    {
      field: "name",
      headerName: "Name",
    },
    {
      field: "user_desig",
      headerName: "Designation",
    },
    {
      field: "dept_name",
      headerName: "Department",
    },
    {
      field:"zone_name",
      headerName:"Zone"
    },
    {
      field:"reg_name",
      headerName:"Region"
    },
    {
      field:"ter_name",
      headerName:"Territory Details"
    },
    {
      field:"user_addr",
      headerName:"Address"
    },
    {
      field:"repto_fname",
      headerName:"Reporting To"
    },
    {
      field:"email_id",
      headerName:"Email ID"
    },
    {
      field:"mob_no",
      headerName:"Mobile No."
    },
    {
      field:"emp_dob",
      headerName:"Date of Birth",
      type:'date'
    },
    {
      field:"emp_doj",
      headerName:"Date of Joining",
      type:'date'
    },
    {
      field:"acc_stat",
      headerName:"Status"
    }
  ]

  const handleUserClick = async (row) => {
  try {
    setDialogData([]);         
    setPreviewImage(profile);
    setUserDialog(true);
    setDialogActiveStat(0)
    let response = await api.post('/getUserData', { id: row.user_id });
    let resUserData = Array.isArray(response.data.data) ? response.data.data : [];
    setDialogData(resUserData);

    const imageUpl = resUserData[0]?.image_upl;
    setPreviewImage(
      imageUpl
        ? `${process.env.REACT_APP_PROFILE_URL}/${imageUpl}`
        : profile
    );
  } catch (err) {
    console.log("fetch user DialogData err", err);
  }
};

  const handleEdit = (row) => {
    const id = btoa(row.user_id);
    navigate(`/users/adminUserNew/${id}`);
  };

  const handleDelete = async(row) => {
    try{
      setModifyLoading(true)
      let payload={
        user_id:row.user_id
      }
      let response=await api.post("/userDelete",payload)
      if(response.data.status===200){
        toast.success(response.data.message)
        navigate("/Users/users_list")
      }
      else{
        toast.error(response.data.message)
      }

    }
    catch(err){
      console.log("delete Error",err)
    }
    finally{
      setModifyLoading(false)
      closeConfirmationDialog()
    }
  };

  const handleAddNew = () => {
    navigate("/users/adminUserNew");
  };

  const handleExcel = () => {
    try{
    const encode = (val) => btoa(val || 0);
    const safeColumns = ExcelColumn.map(
      ({ renderCell, renderHeader, ...rest }) => rest,
    );
    const invalidDates = ['1900-01-01', '1970-01-01', '0000-00-00', '1899-12-31'];
    const dojChanges=tableData.map((val)=>({...val,emp_dob:val.emp_dob?val.emp_dob.split("T")[0]:null,emp_doj:val.emp_doj?val.emp_doj.split("T")[0]:null}))
    const excelData=dojChanges.map((val)=>({...val,acc_stat:val.acc_stat===1?"Inactive":"Active",name:`${val.first_name?val.first_name:""} ${val.last_name?val.last_name:''}`,
      emp_dob:val.emp_dob && !invalidDates.includes(val.emp_dob)?dayjs(val.emp_dob).format('DD-MMM-YYYY'):"-",
      emp_doj:val.emp_doj && !invalidDates.includes(val.emp_doj)?dayjs(val.emp_doj).format('DD-MMM-YYYY'):"-",}))
    let filename=`User-Details-${dayjs().format("DD-MMM-YYYY")}`
    DownloadNoCell(excelData,safeColumns,filename,setProgress,toast,'User_Details')
    }
    catch(err){
      console.log("Excel Export err",err)
    }

    // const url = `/users/exportUsersNew/${encode(filters.userType)}/${encode(
    //   filters.dept,
    // )}/${encode(filters.zone)}/${encode(filters.region)}/${encode(
    //   filters.area,
    // )}/${encode(filters.territory)}/${encode(filters.channel)}`;

    // window.location.href = url;
  };

  const formatDatenew = (val) => {
    if (!val) return "";
    // if number (timestamp in seconds)
    if (!isNaN(val)) {
      return dayjs(val * 1000).format("DD-MMM-YYYY hh:mm a");
    }
    // if ISO string
    return dayjs(val).format("DD-MMM-YYYY hh:mm a");
    };

  console.log("dialog data in usr",dialogData[0]?.deact_type)
  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: "Master", path: location.pathname },
        { label: "Users", path: location.pathname },
        { label: "User List" },
      ]}
    >
      <Box
        p={2}
        sx={{ borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h1 className="mainTitle">User List</h1>
        </Box>
        <Grid
          container
          spacing={2}
          sx={{
            background: "#fff",
            borderRadius: "10px",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            padding: "16px 18px",
          }}
        >
          {/* USER TYPE */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>User Type</InputLabel>
              <Select
                value={filters.userType || 0}
                label="User Type"
                onChange={(e) => handleChange("userType", e.target.value)}
              >
                <MenuItem value={0}>All</MenuItem>
                {userTypeList.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.client_alias}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* DEPT */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.dept || 0}
                label="Department"
                onChange={(e) => handleChange("dept", e.target.value)}
              >
                <MenuItem value={0}>All</MenuItem>
                {deptList.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.dept_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ZONE */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Zone</InputLabel>
              <Select
                value={filters.zone || 0}
                label="Zone"
                onChange={(e) => handleChange("zone", e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              >
                <MenuItem value={0}>All</MenuItem>
                {zoneList.map((z) => (
                  <MenuItem key={z.id} value={z.id}>
                    {z.zone_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* REGION */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Region</InputLabel>
              <Select
                value={filters.region || 0}
                label="Region"
                onChange={(e) => handleChange("region", e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              >
                <MenuItem value={0}>All</MenuItem>
                {regionList.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.reg_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* AREA */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Area</InputLabel>
              <Select
                value={filters.area || 0}
                label="Area"
                onChange={(e) => handleChange("area", e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              >
                <MenuItem value={0}>All</MenuItem>
                {areaList.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.area_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* TERRITORY */}
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Territory</InputLabel>
              <Select
                value={filters.territory || 0}
                label="Territory"
                onChange={(e) => handleChange("territory", e.target.value)}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              >
                <MenuItem value={0}>All</MenuItem>
                {terList.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.ter_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* LOAD BUTTON */}
          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button fullWidth variant="contained" onClick={handleLoad}>
              Load
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddNew}
              sx={{ whiteSpace: "nowrap" }}
            >
              Add New
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              onClick={handleExcel}
            >
              Excel
            </Button>
          </Grid>
        </Grid>

        {/* TABLE */}
        <Box>
          <DataTable
            sx={{
              background: "#fff",
              borderRadius: "10px",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
            }}
            data={tableData}
            columns={columns}
            title="Users List"
          />
        </Box>
        <Dialog
              open={userDialog}
              maxWidth={false}
              PaperProps={{
                sx: {
                  width: { lg: '1200px', md: '1200px', sm: '80%', xs: '95%' },
                  position:'absolute',
                  top:5,
                  // '& *': {
                  //  outline: '1px solid red',           // Remove outline from all children
                  // },
                },
              }}
            >

              <DialogContent >
                 <Box sx={{position:'absolute',top:0,right:5}}>
                 <IconButton onClick={() => setUserDialog(false)}>
                  <CloseIcon />
                </IconButton>
                </Box>
                <Grid container >
                  <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <img
                      src={previewImage}
                      alt="profile"
                      style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '5px',
                        objectFit: 'cover',
                        marginBottom: '10px',
                        border: '1px solid #026cb6',
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                     <Typography sx={{ fontWeight: 600, fontSize: '24px', textTransform: 'uppercase' }}>
                        {`${dialogData[0]?.first_name || ""} ${dialogData[0]?.last_name || ""}`.trim()}
                     </Typography>

                      <Typography sx={{ fontSize: '16px' }}>
                        {dialogData[0]?.user_desig ? `${dialogData[0]?.user_desig} | ` : ''}
                        {`Emp Code: ${dialogData[0]?.emp_code ? dialogData[0]?.emp_code : ''} | `}
                        {dialogData[0]?.emp_stat_id === 1
                          ? 'Trainee'
                          : dialogData[0]?.emp_stat_id === 2
                          ? 'Probation'
                          : dialogData[0]?.emp_stat_id === 3
                          ? 'Confirmed'
                          : ''}
                      </Typography>

                      <Typography sx={{ fontSize: '16px' }}>
                        DOJ: {dialogData[0]?.emp_doj ? dayjs(dialogData[0]?.emp_doj).format('DD-MMM-YYYY') : ''} |
                        {dialogData[0]?.emp_type_id === 3
                          ? ` Franchisee`
                          : dialogData[0]?.emp_type_id === 1
                          ? ` On Roll`
                          : dialogData[0]?.emp_type_id === 2
                          ? ' Outsourced'
                          : ''}
                      </Typography>

                      <Typography sx={{ fontSize: '16px' }}>
                        Mobile: {dialogData[0]?.mob_no ? dialogData[0].mob_no : ''}  Email:{' '}
                        {dialogData[0]?.email_id ? dialogData[0]?.email_id : ''}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Grid container >
                   <Grid size={{ xs: 12, lg: 6 }}>
                        <table width="100%" style={{ borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <span style={{ fontWeight: 600 }}>App Login</span>
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <label>Yes:</label>{' '}
                                <input
                                  type="radio"
                                  value="0"
                                  checked={dialogData[0]?.app_stat === 1}
                                  readOnly
                                />
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <label style={{ paddingLeft: '20px' }}>No:</label>{' '}
                                <input
                                  type="radio"
                                  value="1"
                                  checked={dialogData[0]?.app_stat === 0}
                                  readOnly
                                />
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}></td>
                            </tr>

                            <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                              <td className="tdstyle" style={{ padding: '8px 8px' }}>
                                <span style={{ fontWeight: 600 }}>App Configured</span>
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                {dialogData[0]?.app_stat === 1 ? (
                                  <FaThumbsUp size={25} color="#3c8dbc" />
                                ) : (
                                  <FaThumbsDown size={25} color="#3c8dbc" />
                                )}
                              </td>
                              <td colSpan={2} className="tdstyle" style={{ padding: '7px 8px' }}>
                                {dialogData[0]?.app_version}
                              </td>
                            </tr>

                            <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <span style={{ fontWeight: 600 }}>OTP:</span>
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>{dialogData[0]?.app_otp}</td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <span style={{ fontWeight: 600 }}>Auth Key:</span>
                              </td>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>{dialogData[0]?.auth_key}</td>
                            </tr>

                            <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <span style={{ fontWeight: 600 }}>Last App Login:</span>
                              </td>
                              <td colSpan={3} className="tdstyle" style={{ padding: '7px 8px' }}>
                                {dialogData[0]?.last_app_login &&
                                !dayjs(dialogData[0]?.last_app_login).isSame('1900-01-01', 'day')
                                  ? dayjs(dialogData[0]?.last_app_login).format('DD MMM YYYY hh:mm a')
                                  : ''}
                              </td>
                            </tr>

                            <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                              <td className="tdstyle" style={{ padding: '7px 8px' }}>
                                <span style={{ fontWeight: 600 }}>Last Web Login:</span>
                              </td>
                              <td colSpan={3} className="tdstyle" style={{ padding: '7px 8px' }}>
                                {dialogData[0]?.last_login &&
                                !dayjs(dialogData[0]?.last_login * 1000).isSame('1900-01-01', 'day')
                                  ? formatDatenew(dialogData[0]?.last_login)
                                  : ''}
                              </td>
                            </tr>

                            {dialogData[0]?.app_stat === 1 && (
                              <tr style={{ fontSize: '16px', borderTop: '1px solid #c7c7c7' }}>
                                <td colSpan={4} align="center" className="tdstyle" style={{ padding: '7px 8px' }}>
                                  <Button variant="contained" color="error" sx={{ mt: 1 }} id="logout_user">
                                    Logout from the App
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 6 }} >
                    <FormControl  sx={{ml:{md:10,xs:0},mt:{xs:3,md:0}}}>
                    <InputLabel id="status">Status</InputLabel>
                    <Select sx={{width:200}} size="small" labelId="status" label="status" onChange={(e)=>setDialogActiveStat(e.target.value)} value={dialogActiveStat}>
                      <MenuItem value={0}>Active</MenuItem>
                      <MenuItem value={1}>In Active</MenuItem>
                     
                    </Select>  
                    </FormControl>
                    {Number(dialogActiveStat)===1 && (
                      <Box sx={{display:'flex',flexDirection:'column'}}>
                      <FormControl  sx={{ml:{md:10,xs:0},mt:{xs:3,md:2}}}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                           <DatePicker
                          label="Date Of Relieving"
                          format="DD MMM YYYY"
                          maxDate={dayjs()}
                          value={
                            dialogData[0]?.emp_reliev_dt &&
                            !dayjs(dialogData[0]?.emp_reliev_dt).isSame('1900-01-01', 'day')
                              ? dayjs(dialogData[0]?.emp_reliev_dt)
                              : null
                          }
                          defaultCalendarMonth={dayjs()}
                          placeholder="Select Date of Relieving"
                          slotProps={{
                            textField: {
                              size: 'small',
                              sx: { width: 200 }
                            }
                          }}
                      />
                      </LocalizationProvider>

                      </FormControl>
                      <FormControl sx={{ml:{md:10,xs:0},mt:{xs:3,md:2}}}>
                        <InputLabel id="deact">Deactivation Type</InputLabel>
                        <Select label="Deactivation Type" labelId="deact" size="small" sx={{width:200}}  value={Number(dialogData[0]?.deact_type)}>
                        <MenuItem value={1}>Resigned</MenuItem>
                        <MenuItem value={2}>Terminated</MenuItem>
                        <MenuItem value={3}>Absconded</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl sx={{ml:{md:10,xs:0},mt:{xs:3,md:2}}}>
                      <TextField
                        multiline
                        placeholder="Enter Remarks"
                        size="small"
                        value={dialogData[0]?.deact_rem}
                        sx={{
                          width: 200,
                          '& .MuiInputBase-root': {
                           
                          },
                          '& textarea': {
                            resize: 'both',
                            overflow: 'auto',
                          },
                        }}
                      />
                      </FormControl>
                      <Box sx={{ml:{md:10,xs:0},mt:{xs:3,md:2}}}>
                      <Button sx={{width:'15rem'}} variant="contained" color="error">Deactivate User</Button>
                      </Box>
                      </Box>
                    )
                    }

                    </Grid>
                  </Grid>
                </Box>
              </DialogContent>
              <DialogActions>
              <Button variant="contained" onClick={()=>setUserDialog(false)} color="warning">
               Close 
              </Button>
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
      </Box>
    </Layout>
  );
}

export default UserList;
