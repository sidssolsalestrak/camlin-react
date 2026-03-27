import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../../layout";
import { useParams } from "react-router-dom";
import { decode } from "../../../utils/common";
import "../../../assets/css/accountMas.css";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import api from "../../../services/api";
function AccountMas() {
  const params = useParams();

  const decodedParams = useMemo(
    () => ({
      reqType: decode(params.reqType),
      country: decode(params.country),
      user: decode(params.user),
      userType: decode(params.userType),
      cusReq: decode(params.cusReq),
      beatId: decode(params.beatId),
    }),
    [params],
  );

  const title =
    decodedParams.reqType == 2 ? "Approval List" : "Account Masters";
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");

  const [userType, setUserType] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState("");

  const [userData, setUserData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(0);

  const req = decodedParams.reqType;
  const [cusReq, setCusReq] = useState(decodedParams.cusReq || 1);
  const [reqType, setReqType] = useState(0);

  const [accountData, setAccountData] = useState(null);
  //   useEffect(() => {
  //     console.log("Decoded Params:", decodedParams);

  //     const { userType, beatId } = decodedParams;
  //   }, [decodedParams]);

  const fetchRegionData = async () => {
    try {
      const response = await api.post("/getRegionData");
      setRegionData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching region data:", error);
    }
  };

  const fetchUserType = async () => {
    try {
      const response = await api.post("/getUserType");
      setUserType(response.data.data || []);
    } catch (error) {
      console.error("Error fetching user type:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.post("/getUsersByRegion", {
        country: selectedRegion,
        cus_req: decodedParams.cusReq,
      }); // your API
      setUserData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRegionData();
    fetchUserType();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (regionData.length > 0 && decodedParams.country) {
      const exists = regionData.some(
        (r) => r.id === Number(decodedParams.country),
      );

      if (exists) {
        setSelectedRegion(Number(decodedParams.country));
      }
    }
  }, [regionData, decodedParams.country]);

  useEffect(() => {
    if (userType.length && decodedParams.userType) {
      const id = Number(decodedParams.userType);
      if (userType.some((u) => u.id === id)) {
        setSelectedUserType(id);
      }
    }
  }, [userType, decodedParams.userType]);

  useEffect(() => {
    if (decodedParams.user) {
      setSelectedUser(Number(decodedParams.user));
    }
  }, [decodedParams.user]);

  return (
    <Layout>
      <Box
        p={2}
        sx={{ backgroundColor: "#fff", borderRadius: 1 }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box>
          <h2 className="mainTitle">{title}</h2>
        </Box>
        <Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <FormControl required fullWidth size="small">
                <InputLabel id="region-label">Region</InputLabel>

                <Select
                  labelId="region-label"
                  value={selectedRegion}
                  label="Region"
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  {regionData.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.reg_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2, lg: 2 }}>
              <FormControl required fullWidth size="small">
                <InputLabel id="userType-label">User Type</InputLabel>

                <Select
                  labelId="userType-label"
                  value={selectedUserType}
                  label="Region"
                  onChange={(e) => setSelectedUserType(e.target.value)}
                >
                  {userType.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.client_alias}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth size="small">
                <Autocomplete
                  size="small"
                  options={userData}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.last_name}${
                      req == 2 && option.count ? ` (${option.count})` : ""
                    }`
                  }
                  value={userData.find((u) => u.id === selectedUser) || null}
                  onChange={(e, newValue) => {
                    setSelectedUser(newValue ? newValue.id : 0);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select User"
                      variant="outlined"
                      label="User"
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Box>
                <label className="lbl-form">Customers / Requests</label>

                <Select
                  fullWidth
                  size="small"
                  value={cusReq}
                  onChange={(e) => setCusReq(e.target.value)}
                >
                  <MenuItem value={1}>All Current Customers</MenuItem>
                  <MenuItem value={2}>Requests</MenuItem>
                </Select>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Layout>
  );
}

export default AccountMas;
