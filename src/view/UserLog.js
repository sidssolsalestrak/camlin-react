import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import Layout from "../layout";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import useToast from "../utils/useToast";

function UserLog() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const toast = useToast();

  const [userTypeList, setUserTypeList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState({
    module: "-1",
    fromDt: null,
    toDt: null,
    userType: 0,
    user: 0,
  });

  const decode = (val) => {
    try {
      return atob(val);
    } catch {
      return "";
    }
  };

  const decodedParams = {
    module: decode(params.module) || "-1",
    fromDt: decode(params.fromDt),
    toDt: decode(params.toDt),
    userType: Number(decode(params.userType)) || 0,
    user: Number(decode(params.user)) || 0,
  };

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const fetchUserTypes = async () => {
    const res = await api.post("/getUsertypeList");
    setUserTypeList(res.data.userRes || []);
  };

  useEffect(() => {
    const now = dayjs();

    const firstDay = now.startOf("month");
    const lastDay = now.endOf("month");

    const from = decodedParams.fromDt ? dayjs(decodedParams.fromDt) : firstDay;

    const to = decodedParams.toDt ? dayjs(decodedParams.toDt) : lastDay;

    setFilters({
      module: decodedParams.module || "-1",
      fromDt: from,
      toDt: to,
      userType: decodedParams.userType || 0,
      user: decodedParams.user || 0,
    });
  }, [params]);

  const fetchUsersByType = async (userType) => {
    if (!userType) return;

    const res = await api.post("/getUserByType", { userType });
    setUserList(res.data.data || []);
  };

  useEffect(() => {
    if (filters.userType) {
      fetchUsersByType(filters.userType);
    } else {
      setUserList([]);
    }
  }, [filters.userType]);

  const fetchTable = async () => {
    const res = await api.post("/getUserLog", {
      module: decodedParams.module,
      fromDt: decodedParams.fromDt,
      toDt: decodedParams.toDt,
      userType: decodedParams.userType,
      userId: decodedParams.user,
    });

    setTableData(
      (res.data.data || []).map((item, i) => ({
        ...item,
        sl: i + 1,
      })),
    );
  };

  useEffect(() => {
    if (decodedParams.userType > 0) {
      fetchTable();
    } else {
      setTableData([]);
    }
  }, [params]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleLoad = () => {
    if (!filters.userType) {
      toast.warning("Select User Type");
      return;
    }

    const encode = (val) => btoa(val || "");

    navigate(
      `/Users/userLog/${encode(filters.module)}/${encode(
        filters.fromDt?.format("YYYY-MM-DD"),
      )}/${encode(filters.toDt?.format("YYYY-MM-DD"))}/${encode(
        filters.userType,
      )}/${encode(filters.user)}`,
    );
  };
  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 220,
      renderCell: ({ row }) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span className="marker-link">
            {row.first_name} {row.last_name || ""}
          </span>

          <span
            style={{
              fontSize: 12,
              color: "#9b9090",
              fontWeight: 600,
            }}
          >
            {row.user_desig || ""}
          </span>
        </div>
      ),
    },
    { field: "client_alias", headerName: "User Type", width: 150 },
    { field: "module", headerName: "Module", width: 120 },
    {
      field: "log_type",
      headerName: "Log Type",
      width: 150,
      renderCell: ({ value }) => {
        if (value == 1) return "System Login";
        if (value == 2) return "App Login";
        if (value == 3) return "App Sync";
        if (value == 4) return "Plan Submit";
        if (value == 5) return "Visit Submit";
        return "-";
      },
    },
    { field: "browser", headerName: "Browser" },
    { field: "browser_ver", headerName: "Version" },
    { field: "os", headerName: "OS" },
    { field: "device", headerName: "Device" },
    {
      field: "date",
      headerName: "Date",
      width: 180,
      renderCell: ({ value }) =>
        value ? dayjs(value).format("DD MMM YYYY HH:mm:ss") : "-",
    },
  ];

  return (
    <Layout
      breadcrumb={[
        { label: "Home", path: "/" },
        { label: "Master", path: location.pathname },
        { label: "Users", path: location.pathname },
        { label: "User Log", path: location.pathname },
      ]}
    >
      <Box p={2} display="flex" flexDirection="column" gap={2}>
        <h2>User Log</h2>

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
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Module</InputLabel>
              <Select
                value={filters.module}
                label="Module"
                onChange={(e) => handleChange("module", e.target.value)}
              >
                <MenuItem value="-1">All</MenuItem>
                <MenuItem value="1">Log In</MenuItem>
                <MenuItem value="2">App Log In</MenuItem>
                <MenuItem value="3">App Sync</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="From"
                value={filters.fromDt}
                format="DD MMM YYYY"
                onChange={(newValue) => handleChange("fromDt", newValue)}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="To"
                value={filters.toDt}
                format="DD MMM YYYY"
                onChange={(newValue) => handleChange("toDt", newValue)}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>User Type</InputLabel>
              <Select
                value={filters.userType}
                label="User Type"
                onChange={(e) => handleChange("userType", e.target.value)}
              >
                {/* ALL */}
                <MenuItem value={0}>All</MenuItem>

                {/* SUPER ADMIN (Manual like PHP) */}
                <MenuItem value={2}>Super Admin</MenuItem>

                {/* OTHER USER TYPES */}
                {userTypeList
                  .filter((u) => u.id !== 2) // avoid duplicate
                  .map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.client_alias}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>User</InputLabel>
              <Select
                value={filters.user}
                label="User"
                onChange={(e) => handleChange("user", e.target.value)}
              >
                <MenuItem value={0}>All</MenuItem>
                {userList.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name || ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button fullWidth variant="contained" onClick={handleLoad}>
              Load
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button fullWidth variant="contained" color="warning">
              Excel
            </Button>
          </Grid>
        </Grid>

        {/* TABLE */}
        <DataTable data={tableData} columns={columns} title="User Log" />
      </Box>
    </Layout>
  );
}

export default UserLog;
