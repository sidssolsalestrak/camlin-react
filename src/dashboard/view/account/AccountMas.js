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

  useEffect(() => {
    fetchRegionData();
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

  return (
    <Layout>
      <Box p={2} sx={{ backgroundColor: "#fff", borderRadius: 1 }}>
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
          </Grid>
        </Box>
      </Box>
    </Layout>
  );
}

export default AccountMas;
