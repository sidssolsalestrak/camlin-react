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
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import DataTable from "../utils/dataTable";
import Layout from "../layout";
import { FaMobileAlt, FaEdit, FaTrash } from "react-icons/fa";
import "../assets/css/accountMas.css";

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

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState({
    userType: 0,
    dept: 0,
    zone: 0,
    region: 0,
    area: 0,
    territory: 0,
    channel: 0,
  });

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
    const res = await api.post("/getUsertypeList");
    setUserTypeList(res.data.userRes || []);
  };

  const fetchDept = async () => {
    const res = await api.post("/dept");
    setDeptList(res.data.data || []);
  };

  const fetchZones = async () => {
    const res = await api.post("/getZoneData");
    setZoneList(res.data.data || []);
  };

  // ---------------- CASCADE ----------------
  const fetchRegions = async (zoneId) => {
    const res = await api.post("/getRegionData", { zoneId });
    setRegionList(res.data.data || []);
  };

  const fetchAreas = async (regionId) => {
    const res = await api.post("/areaData", { reqionId: regionId });
    setAreaList(res.data.data || []);
  };

  const fetchTerritory = async (areaId) => {
    const res = await api.post("/territoryData", { areaId });
    setTerList(res.data.data || []);
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
    setFilters((prev) => ({ ...prev, [key]: value }));

    if (key === "zone") {
      fetchRegions(value);
      setRegionList([]);
      setAreaList([]);
      setTerList([]);
    }

    if (key === "region") {
      fetchAreas(value);
      setAreaList([]);
      setTerList([]);
    }

    if (key === "area") {
      fetchTerritory(value);
      setTerList([]);
    }
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
    const res = await api.post("/userList", payload);

    setTableData(
      (res.data.data || []).map((item, i) => ({
        ...item,
        sl: i + 1,
      })),
    );
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
    { field: "sl", headerName: "#", width: 10 },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: ({ row }) => {
        const isAppActive = row.app_stat === 1;

        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FaMobileAlt color={isAppActive ? "green" : "red"} />

              <span
                style={{
                  cursor: "pointer",
                  color: "#1976d2",
                  fontWeight: 500,
                }}
                onClick={() => handleUserClick(row)}
              >
                {row.first_name} {row.last_name}
              </span>
            </div>

            <span style={{ fontSize: 12, color: "#9b9090", fontWeight: 600 }}>
              {row.user_desig}
            </span>
          </div>
        );
      },
    },
    {
      field: "dept_name",
      headerName: "Department",
      width: 70,
    },

    {
      field: "ter_name",
      headerName: "Territory Details",
      width: 350,
      renderCell: ({ row }) => (
        <div
          style={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: "1.2",
          }}
        >
          {row.ter_name || "-"}
        </div>
      ),
    },
    {
      field: "reporting",
      headerName: "Reporting To",
      width: 100,
      renderCell: ({ row }) =>
        `${row.repto_fname || ""} ${row.repto_lname || ""}`,
    },

    {
      field: "email_id",
      headerName: "Email ID",
      width: 100,
      renderCell: ({ row }) => row.email_id || "-",
    },

    {
      field: "mob_no",
      headerName: "Mobile No.",
      width: 100,
      renderCell: ({ row }) => row.mob_no || "-",
    },
    {
      field: "emp_dob",
      headerName: "Date of Birth",
      width: 100,
      renderCell: ({ row }) => formatDate(row.emp_dob),
    },
    {
      field: "emp_doj",
      headerName: "Date of Joining",
      width: 100,
      renderCell: ({ row }) => formatDate(row.emp_doj),
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: ({ row }) => (row.acc_stat === 1 ? "Inactive" : "Active"),
    },

    {
      field: "action",
      headerName: "Action",
      width: 50,
      renderCell: ({ row }) => (
        <div style={{ display: "flex", gap: 12 }}>
          <FaEdit
            style={{ cursor: "pointer" }}
            onClick={() => handleEdit(row)}
          />

          <FaTrash
            style={{ cursor: "pointer", color: "red" }}
            onClick={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  const handleUserClick = (row) => {
    console.log("Open modal (same as PHP)", row);
  };

  const handleEdit = (row) => {
    const id = btoa(row.user_id);
    navigate(`/users/adminUserNew/${id}`);
  };

  const handleDelete = (row) => {
    if (!window.confirm("Are you sure to delete?")) return;
    console.log("Delete API call", row.user_id);
  };

  const handleAddNew = () => {
    navigate("/users/adminUserNew"); // same as PHP
  };

  const handleExcel = () => {
    const encode = (val) => btoa(val || 0);

    const url = `/users/exportUsersNew/${encode(filters.userType)}/${encode(
      filters.dept,
    )}/${encode(filters.zone)}/${encode(filters.region)}/${encode(
      filters.area,
    )}/${encode(filters.territory)}/${encode(filters.channel)}`;

    window.location.href = url;
  };

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
        <Grid container spacing={2} sx={{ background: "#fff" }} p={2}>
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

          {/* <Grid size={{ xs: 12, md: 2, lg: 2 }}></Grid>
          <Grid size={{ xs: 12, md: 2, lg: 2 }}></Grid>
          <Grid size={{ xs: 12, md: 2, lg: 2 }}></Grid> */}

          <Grid size={{ xs: 12, md: 1, lg: 1 }}>
            <Button fullWidth variant="contained" onClick={handleAddNew}>
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
        <Box mt={3}>
          <DataTable data={tableData} columns={columns} title="Users List" />
        </Box>
      </Box>
    </Layout>
  );
}

export default UserList;
