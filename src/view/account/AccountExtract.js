import React, { useEffect, useState } from "react";
import Layout from "../../layout";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  IconButton,Button
} from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import DataTable from "../../utils/dataTable";
import "../../assets/css/accountMas.css";
import useToast from "../../utils/useToast";
import { DownloadCSV } from "../../utils/Download CSV/DownloadCSV";
import { AiOutlineFileExcel } from "react-icons/ai";
import CircularProgress from "../../utils/CircularProgressLoading";
import dayjs from "dayjs";
import { useSnackbar } from "notistack";

function AccountExtract() {
  const navigate = useNavigate();
  const params = useParams();

  const [regionData, setRegionData] = useState([]);
  const [accTypeData, setAccTypeData] = useState([]);
  const [userTypeData, setUserTypeData] = useState([]);
  const [userData, setUserData] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState(0);
  const [selectedAccType, setSelectedAccType] = useState("");
  const [selectedUserType, setSelectedUserType] = useState(0);
  const [selectedUser, setSelectedUser] = useState(0);
  const [progress, setProgress] = useState(null);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const location = useLocation()
  const URL = location.pathname.split('/')[2]
  const { enqueueSnackbar } = useSnackbar()

  // ---------------- DECODE PARAMS ----------------
  const decode = (val) => {
    try {
      return Number(atob(val));
    } catch {
      return 0;
    }
  };

  const decodedParams = {
    country: decode(params.country),
    accType: decode(params.accType),
    userType: decode(params.userType),
    user: decode(params.user),
  };

  // ---------------- FETCH FILTER DATA ----------------
  const fetchRegions = async () => {
    try {
      const res = await api.post("/getZoneData");
      setRegionData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccType = async () => {
    try {
      const res = await api.post("/getCustomerType"); // create if not exists
      setAccTypeData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserType = async () => {
    try {
      const res = await api.post("/getUserType");
      setUserTypeData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.post("/getUserListZone", {
        country: selectedRegion,
        user_type: selectedUserType,
      });
      setUserData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- FETCH TABLE DATA ----------------
  const fetchExtractData = async (payload) => {
    try {
      setLoading(true);

      const res = await api.post("/getAccountExtract", payload);

      setTableData(
        (res.data.data || []).map((item, index) => ({
          ...item,
          sl: index + 1,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    fetchRegions();
    fetchAccType();
    fetchUserType();
  }, []);

  // ---------------- DEPENDENT USERS ----------------
  useEffect(() => {
    fetchUsers();
  }, [selectedRegion, selectedUserType]);

  // ---------------- PREFILL FROM URL ----------------
  useEffect(() => {
    if (decodedParams.country) setSelectedRegion(decodedParams.country);
    if (decodedParams.accType) setSelectedAccType(decodedParams.accType);
    if (decodedParams.userType) setSelectedUserType(decodedParams.userType);
    if (decodedParams.user) setSelectedUser(decodedParams.user);

    if (
      decodedParams.country ||
      decodedParams.accType ||
      decodedParams.userType ||
      decodedParams.user
    ) {
      fetchExtractData(decodedParams);
    }
  }, [params]);

  const handleDownloadCSV = async () => {
    let FormattedData = tableData.map((val) => ({
      ...val, id: `${val.main_id}_${val.sub_id}`,
      user_name: `${val.u_fname || ""} ${val.u_lname || ""}`
    }))

    let AccName = Number(selectedAccType) === 1 ? "HCP" : Number(selectedAccType) === 2 ? "Retailer" : null

    const safeColumns = ExcelColumns.map(
      ({ renderCell, renderHeader, ...rest }) => rest,
    );

    const meta = {
      "": `Account Master Extract (${AccName})`,
      Date: dayjs().format("DD MMM YYYY")
    }
    DownloadCSV(
      FormattedData,
      safeColumns,
      `Account_Master_Extract_(${AccName})`,
      setProgress,
      enqueueSnackbar,
      meta,
    );
  }

  const handleExtractCSV = async () => {

    try {
      setProgress("0%")
      let payload = {
        country: selectedRegion,
        accType: selectedAccType,
        user: selectedUser,
        userType: selectedUserType

      }
      let response = await api.post('/getAccountExtract', payload)
      let extData = Array.isArray(response.data.data) ? response.data.data : []
      let FormattedData = extData.map((val) => ({
        ...val, id: `${val.main_id}_${val.sub_id}`,
        user_name: `${val.u_fname || ""} ${val.u_lname || ""}`
      }))

      let AccName = Number(selectedAccType) === 1 ? "HCP" : Number(selectedAccType) === 2 ? "Retailer" : null

      const safeColumns = ExcelColumns.map(
        ({ renderCell, renderHeader, ...rest }) => rest,
      );

      const meta = {
        "": `Account Master Extract (${AccName})`,
        Date: dayjs().format("DD MMM YYYY")
      }
      DownloadCSV(
        FormattedData,
        safeColumns,
        `Account_Master_Extract_(${AccName})`,
        setProgress,
        enqueueSnackbar,
        meta,
      );
    }
    catch (err) {
      console.log("Extract CSV Error", err)
    }
  }

  // ---------------- LOAD BUTTON ----------------
  const handleLoad = () => {
    if (!selectedRegion || !selectedAccType) {
      toast.error("Please select Zone and Account Type");
      return;
    }

    const encode = (val) => btoa(val || 0);

    navigate(
      `/reports/extract/${encode(selectedRegion)}/${encode(
        selectedAccType,
      )}/${encode(selectedUserType)}/${encode(selectedUser)}`,
    );
  };

  // ---------------- TABLE COLUMNS ----------------
  const columns = [
    { field: "sl", headerName: "SL", width: 80 },

    { field: "reg_name", headerName: "Region", width: 120 },

    { field: "emp_code", headerName: "SO Code", width: 120 },

    {
      field: "user_name",
      headerName: "SO Name",
      width: 150,
      renderCell: ({ row }) => `${row.u_fname || ""} ${row.u_lname || ""}`,
    },

    { field: "so_hq_name", headerName: "HQ", width: 120 },

    {
      field: "id",
      headerName: "ID",
      width: 140,
      renderCell: ({ row }) => `${row.main_id}_${row.sub_id}`,
    },

    { field: "stk_name", headerName: "Stockist", width: 150 },

    { field: "sup_name", headerName: "WD Name", width: 150 },

    { field: "clinic_name", headerName: "Store Name", width: 150 },

    {
      field: "P_class",
      headerName: "Potential Class",
      width: 120,
    },

    {
      field: "cus_visit_freq",
      headerName: "Frequency",
      width: 120,
    },

    { field: "area_name", headerName: "Area", width: 150 },

    { field: "beat_name", headerName: "Beat", width: 150 },

    { field: "mobile", headerName: "Mobile", width: 150 },
  ];

  const ExcelColumns = [
    { field: "reg_name", headerName: "Region" },
    { field: "emp_code", headerName: "SO/User Code" },
    { field: "user_name", headerName: "SO/User Name" },
    { field: "so_hq_name", headerName: "SO/HQ" },
    { field: "id", headerName: "Customer ID" },
    { field: "stk_name", headerName: "WD Name" },
    { field: "sup_name", headerName: "Distributor" },
    { field: "clinic_name", headerName: "Store Name" },
    { field: "P_class", headerName: "Potential Class" },
    { field: "cus_visit_freq", headerName: "Frequency Class" },
    { field: "area_name", headerName: "Area" },
    { field: "beat_name", headerName: "Beat/Territory" },
    { field: "mobile", headerName: "Mobile No" },

  ]

  return (
    <Layout>
      <Box
        p={2}
        sx={{ borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h2 className="mainTitle">Account Master Extract</h2>
        </Box>

        <Box sx={{
          backgroundColor: "#fff", boxShadow:
            "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
          padding: "16px 18px",
          borderRadius: "10px",
        }} >
          <Grid container spacing={2}>
            {/* ZONE */}
            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Zone</InputLabel>
                <Select
                  value={selectedRegion}
                  label="Zone"
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <MenuItem value={0}>Select</MenuItem>
                  {regionData.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.zone_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ACCOUNT TYPE */}
            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={selectedAccType}
                  label="Account Type"
                  onChange={(e) => setSelectedAccType(e.target.value)}
                >
                  {accTypeData.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.cus_type_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* USER TYPE */}
            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>User Type</InputLabel>
                <Select
                  value={selectedUserType}
                  label="User Type"
                  onChange={(e) => setSelectedUserType(e.target.value)}
                >
                  <MenuItem value={0}>All</MenuItem>
                  {userTypeData
                    .filter((u) => u.id >= 6 && u.id <= 10)
                    .map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.client_alias}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* USER */}
            <Grid size={{ xs: 12, md: 2, lg: 3 }}>
              <Autocomplete
                options={userData}
                getOptionLabel={(option) =>
                  `${option.first_name || ""} ${option.last_name || ""} (${option.id})`.trim()
                }
                value={userData.find((u) => u.id === selectedUser) || null}
                onChange={(e, val) => setSelectedUser(val ? val.id : 0)}
                renderInput={(params) => (
                  <TextField {...params} label="User" size="small" />
                )}
              />
            </Grid>

            {/* LOAD BUTTON */}
            {URL !== 'extract_new' &&
              <Grid size={{ xs: 12, md: 2, lg: 1 }}>
                <button
                  onClick={handleLoad}
                  style={{
                    padding: "6px 16px",
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Load
                </button>
              </Grid>}
            <Grid size={{ xs: 12, md: 2, lg: 1 }}>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                sx={{height:'2.4rem',width:'2rem'}}
                
                onClick={() => URL !== 'extract_new' ? handleDownloadCSV() : handleExtractCSV()}
              >
                Excel
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* ---------------- TABLE ---------------- */}
        <Box>
          {URL !== 'extract_new' &&
            <DataTable
              data={tableData}
              columns={columns}
              loading={loading}
              title="Account Extract List"
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
  );
}

export default AccountExtract;
