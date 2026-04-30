import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, TextField } from "@mui/material";
import api from "../../services/api";
import Layout from "../../layout";
import CommonAppSelect from "../../utils/CommonAppSelect";

function CreateCustomer() {
  // ---------------- STATE ----------------
  const [fieldConfig, setFieldConfig] = useState({});

  const [dropdowns, setDropdowns] = useState({
    cusTypeMas: [],
  });

  const [practiceOptions, setPracticeOptions] = useState([]);
  const [pharmaOptions, setPharmaOptions] = useState([]);
  const [marketingOptions, setMarketingOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [ageOptions, setAgeOptions] = useState([]);

  const [form, setForm] = useState({
    cusType: "2",
    gender: "1",
    retailerType: "1",
    marketingTools: [],
    agegroup: "1",
  });

  // ---------------- GENERIC LOADER ----------------
  const loadIfNeeded = async ({
    key,
    state,
    setter,
    apiCall,
    valueKey = "id",
  }) => {
    try {
      if (!fieldConfig[key]?.show) return;
      if (state.length > 0) return;

      const res = await api.post(apiCall);

      const data = (res.data.data || []).map((i) => ({
        ...i,
        [valueKey]: String(i[valueKey]),
      }));

      setter(data);
    } catch (err) {
      console.error(key, err);
    }
  };

  // ---------------- INITIAL DROPDOWN ----------------
  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    try {
      const res = await api.post("/cusTypeMas");

      setDropdowns({
        cusTypeMas: (res.data.data || []).map((i) => ({
          ...i,
          id: String(i.id),
        })),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- DYNAMIC FORM ----------------
  const loadDynamicForm = async (customerAccType) => {
    try {
      const res = await api.post("/getCusFormMas", {
        customerAccType,
      });

      let config = {};
      (res.data.data || []).forEach((item) => {
        config[item.label_name] = {
          label: item.alias_label_name,
          show: item.label_stat === 0,
        };
      });

      setFieldConfig(config);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDynamicForm(form.cusType);
  }, []);

  const handleAccTypeChange = (e) => {
    const val = String(e.target.value);
    setForm({ ...form, cusType: val });
    loadDynamicForm(val);
  };

  // ---------------- LAZY LOAD ALL ----------------
  useEffect(() => {
    loadIfNeeded({
      key: "Type",
      state: practiceOptions,
      setter: setPracticeOptions,
      apiCall: "/practiceType",
    });

    loadIfNeeded({
      key: "Retailer Type",
      state: pharmaOptions,
      setter: setPharmaOptions,
      apiCall: "/getPharmaType",
    });

    loadIfNeeded({
      key: "Marketing Tools",
      state: marketingOptions,
      setter: setMarketingOptions,
      apiCall: "/getMarketingTool",
    });

    loadIfNeeded({
      key: "Gender",
      state: genderOptions,
      setter: setGenderOptions,
      apiCall: "/genderMas",
    });

    loadIfNeeded({
      key: "Region",
      state: regionOptions,
      setter: setRegionOptions,
      apiCall: "/getRegionMas",
    });

    loadIfNeeded({
      key: "Age Group",
      state: ageOptions,
      setter: setAgeOptions,
      apiCall: "/agegroupmas",
    });
  }, [fieldConfig]);

  // ---------------- UI ----------------
  return (
    <Layout
      breadcrumb={[{ label: "Home", path: "/" }, { label: "Account Master" }]}
    >
      <Box p={2}>
        {/* <Typography variant="h6">Account Master</Typography> */}

        <Grid container spacing={2}>
          {/* Account Type */}
          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <CommonAppSelect
              label="Account Type"
              value={form.cusType}
              onChange={handleAccTypeChange}
              options={dropdowns.cusTypeMas}
              valueKey="id"
              labelKey="cus_type_name"
            />
          </Grid>

          {/* Type */}
          {fieldConfig["Type"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Type"]?.label || "Type"}
                value={form.retailerType}
                onChange={(e) =>
                  setForm({ ...form, retailerType: String(e.target.value) })
                }
                options={[
                  { id: "1", name: "Retailer" },
                  { id: "2", name: "HO" },
                  { id: "3", name: "Hospital" },
                  { id: "4", name: "Institution" },
                ]}
                valueKey="id"
                labelKey="name"
              />
            </Grid>
          )}

          {/* Retailer Type (HARDCODED) */}
          {fieldConfig["Retailer Type"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Retailer Type"]?.label}
                value={form.pharmaType || ""}
                onChange={(e) =>
                  setForm({ ...form, pharmaType: String(e.target.value) })
                }
                options={pharmaOptions}
                labelKey="pharmacy_type"
              />
            </Grid>
          )}

          {/* First Name */}
          {fieldConfig["First Name"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["First Name"]?.label || "First Name"}
                fullWidth
                size="small"
                value={form.firstName || ""}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </Grid>
          )}

          {/* Gender */}
          {fieldConfig["Gender"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Gender"]?.label || "Gender"}
                value={form.gender}
                onChange={(e) =>
                  setForm({ ...form, gender: String(e.target.value) })
                }
                options={genderOptions}
                valueKey="id"
                labelKey="gender_name"
              />
            </Grid>
          )}

          {fieldConfig["Age Group"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Age Group"]?.label}
                value={form.agegroup}
                onChange={(e) =>
                  setForm({ ...form, agegroup: String(e.target.value) })
                }
                options={ageOptions}
                valueKey="id"
                labelKey="age_grp_name"
              />
            </Grid>
          )}

          {/* Mobile */}
          {fieldConfig["Mobile"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["Mobile"]?.label || "Mobile"}
                fullWidth
                size="small"
                value={form.mobile || ""}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </Grid>
          )}

          {/* Email */}
          {fieldConfig["Email"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["Email"]?.label || "Email"}
                fullWidth
                size="small"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
          )}

          {/* Region */}
          {fieldConfig["Region"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Region"]?.label || "Region"}
                value={form.region || ""}
                onChange={(e) =>
                  setForm({ ...form, region: String(e.target.value) })
                }
                options={regionOptions}
                valueKey="id"
                labelKey="reg_name"
              />
            </Grid>
          )}

          {/* Marketing Tools */}
          {fieldConfig["Marketing Tools"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={
                  fieldConfig["Marketing Tools"]?.label || "Marketing Tools"
                }
                multiple
                value={form.marketingTools}
                onChange={(e) =>
                  setForm({ ...form, marketingTools: e.target.value })
                }
                options={marketingOptions}
                valueKey="id"
                labelKey="tool_name"
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  );
}

export default CreateCustomer;
