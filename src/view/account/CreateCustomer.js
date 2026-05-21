import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Layout from "../../layout";
import CommonAppSelect from "../../utils/CommonAppSelect";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SecondaryInfo from "./SecondaryInfo";
import ContactInfo from "./ContactInfo";
import CompetitorMappping from "./CompetitorMappping";
import {
  Box, Grid, Typography, TextField, Button, Divider,
  RadioGroup, FormControlLabel, FormControl, Radio,
  Dialog, DialogTitle, DialogContent, IconButton,
  DialogActions
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { LocationTaggingMap } from "./LocationTaggingMap";
import { useSubmitCustomer } from "./useSubmitCustomer";
import { useParams } from "react-router-dom";
import AddCompetitor from "./AddCompetitor";

const headContainer = {
  background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
  m: 1.5, p: 1.5, borderRadius: '10px', boxShadow:
    "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
  padding: "16px 18px",
  width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}
const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc" }

const DEFAULT_CLINIC = {
  repIncharge: "0",
  repInchargePOS: "0",
  beat: "",
  beatOptions: [],
  clinicName: "",
  contactName: "",
  contactNo: "",
  hospitalAttached: "0",
  pharmacyAttached: "0",
  pharmacistName: "",
  meetingDays: [],
  meetingTime: "",
  address: "",
  city: "",
  zipCode: "",
  stkId: "0",
  phChain: "",
};

function CreateCustomer() {
  const { id } = useParams();
  let decodedID = id ? atob(id) : null;
  // ---------------- STATE ----------------
  const [fieldConfig, setFieldConfig] = useState({});
  const [dropdowns, setDropdowns] = useState({
    cusTypeMas: [],
  });
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [pharmaOptions, setPharmaOptions] = useState([]);
  const [practiseType, setpractiseType] = useState([]);
  const [marketingOptions, setMarketingOptions] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [regionOptions, setRegionOptions] = useState([]);
  const [ageOptions, setAgeOptions] = useState([]);
  const [potentialityOptions, setPotentialityOptions] = useState([]);
  const [frequencyOptions, setFrequencyOptions] = useState([]);
  const [loyaltyTypeOptions, setLoyaltyTypeOptions] = useState([]);
  const [adoptionOptions, setAdoptionOptions] = useState([]);
  const [repInchargeOptions, setRepInchargeOptions] = useState([]);
  const [repPOSOptions, setRepPOSOptions] = useState([]);
  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [pharmacyOptions, setPharmacyOptions] = useState([]);
  const [distributorOptions, setDistributorOptions] = useState([]);
  const [locationTagged, setLocationTagged] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: "0",
    longitude: "0",
  });
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [competitorRows, setCompetitorRows] = useState([]);
  // ── 3 Contact Info rows ──
  const [clinics, setClinics] = useState([
    { ...DEFAULT_CLINIC },
  ]);
  const [form, setForm] = useState({
    cusType: "2",
    gender: "1",
    retailerType: "1",
    practiseType: "",
    marketingTools: [],
    agegroup: "1",
  });

  const isHcpField = (form.cusType === "1"); // hcpDiv2 fields only show for HCP
  const isRetailerField = (form.cusType === "2"); // retailerDiv fields only show for Retailer
  const [brandData, setBrandData] = useState([]);
  const competitorBrands = brandData
    .filter(b => b.competition === 1)
    .map(b => b.subCatId);

  const { handleSubmit, handleUpdate } = useSubmitCustomer({
    form, clinics, brandData, competitorBrands, competitorRows
  });  // ---------------- GENERIC LOADER ----------------
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
      loadDynamicForm("2");
      loadStaticDropdowns();
    } catch (err) {
      console.error(err);
    }
  };

  const loadStaticDropdowns = async () => {
    try {
      const [hospRes, pharRes] = await Promise.all([
        api.post("/getCusData"),
        api.post("/getPharmaData"),
      ]);
      setHospitalOptions((hospRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
      setPharmacyOptions((pharRes.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
    } catch (err) { console.error(err); }
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
    setForm((f) => ({
      ...f, cusType: val,
      gender: "1", agegroup: "1", pharmaType: "", practiceType: "",
      potentiality: "", loyalty: "", loyaltyType: "", frequency: "",
      retailerType: "1",
    }));
    setGenderOptions([]); setAgeOptions([]);
    setPracticeOptions([]); setPharmaOptions([]);
    setPotentialityOptions([]);
    setRepInchargeOptions([]); setRepPOSOptions([]);
    setClinics([{ ...DEFAULT_CLINIC }]);
    loadDynamicForm(val);
  };

  const handleRegionChange = async (val) => {
    // find zone_id from the selected region
    const selectedRegion = regionOptions.find(r => r.id === val);
    const zoneId = selectedRegion?.zone_id || "0";

    setForm((f) => ({ ...f, region: val }));

    try {
      const [repRes, repPoso, distRes, brandsRes] = await Promise.all([
        api.post("/getRepIncharge", { regId: val, requestType: form.cusType }),
        api.post("/getRepInchargePos", { regId: val }),
        api.post("/getDistributor", { regId: val }),
        api.post("/getBrands", { doctorId: decodedID > 0 ? decodedID : 0 }), // ← missing
      ]);

      setRepInchargeOptions((repRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
      setRepPOSOptions((repPoso.data.data || []).map(i => ({ ...i, id: String(i.id) })));
      setDistributorOptions((distRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));

      // brands for CompetitorMappping
      setBrandData((brandsRes.data.data || []).map(b => ({
        subCatId: String(b.id),
        name: b.sub_name,      // ← matches SQL: sc.sub_name
        focus: b.focusChecked ? 1 : 0,   // backend already calculates this
        reminder: b.remChecked ? 1 : 0,
        competition: 0,
      })));

    } catch (err) { console.error(err); }
  };

  const handlePotentialityChange = async (val) => {
    setForm((f) => ({ ...f, potentiality: val, frequency: "" }));
    setFrequencyOptions([]);
    try {
      const res = await api.post("/getCustomerFreq", { potentialityId: val, hdnCustomerFrequency: "" });
      setFrequencyOptions((res.data.data || []).map((i) => ({ ...i, id: String(i.id) })));
    } catch (err) { console.error(err); }
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
      key: "Practice Type/Speciality",
      state: practiseType,
      setter: setpractiseType,
      apiCall: "/practiceType",
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

    loadIfNeeded({
      key: "Potentiality Class",
      state: potentialityOptions,
      setter: setPotentialityOptions,
      apiCall: "/getPotentiality"
    });

    loadIfNeeded({
      key: "Loyalty Type",
      state: loyaltyTypeOptions,
      setter: setLoyaltyTypeOptions,
      apiCall: "/getLoyaltyType"
    });

    loadIfNeeded({
      key: "Adoption/Current Zone",
      state: adoptionOptions,
      setter: setAdoptionOptions,
      apiCall: "/getAdoption"
    });
  }, [fieldConfig]);

  const columns = [
    { field: "zone_name", headerName: "Brand", filterable: true },
    { field: "zone_name", headerName: "Focus", filterable: true },
    { field: "zone_name", headerName: "Reminder", filterable: true },
    { field: "zone_name", headerName: "Competition", filterable: true },
  ]

  const handleRepChange = async (idx, repId, isPos = false) => {
    const updated = clinics.map((c, i) => {
      if (i !== idx) return c;
      return { ...c, [isPos ? "repInchargePOS" : "repIncharge"]: repId };
    });
    try {
      const res = await api.post("/getClinicBeat", { repInchargeId: repId });
      const opts = (Array.isArray(res.data.data.beats) ? res.data.data.beats : []).map((i) => ({ ...i, id: String(i.id) }));
      console.log("beat options", opts);

      updated[idx] = { ...updated[idx], beatOptions: opts, beat: "" };
    } catch (err) { console.error(err); }
    setClinics(updated);
  };

  const updateClinic = (idx, field, value) =>
    setClinics((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

  const toggleMeetingDay = (idx, dayValue) =>
    setClinics((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const days = c.meetingDays.includes(dayValue)
          ? c.meetingDays.filter((d) => d !== dayValue)
          : [...c.meetingDays, dayValue];
        return { ...c, meetingDays: days };
      })
    );

  const handleConfirmTagging = () => {
    if (!selectedLocation.latitude || !selectedLocation.longitude) {
      alert("Please select a location on the map to continue!");
      return;
    }
    setLocationTagged(true);
    setMapDialogOpen(false);
    // Persist to form so it gets submitted
    setForm((f) => ({
      ...f,
      customerLatitude: selectedLocation.latitude,
      customerLongitude: selectedLocation.longitude,
    }));
  };

  //get edit data
  useEffect(() => {
    if (!decodedID || decodedID === "0") return;
    const getEditData = async () => {
      try {
        const res = await api.post("/getDoctorsData", { id: decodedID });
        const d = res.data.data[0];
        if (!d) return;

        // ── 1. Load dynamic form for this cusType first ──────────────────────
        await loadDynamicForm(String(d.cus_type_id));

        // ── 2. Populate primary form fields ──────────────────────────────────
        setForm({
          cusType: String(d.cus_type_id || "2"),
          retailerType: String(d.retail_type || "1"),
          pharmaType: String(d.pharmacy_type_id || "0"),
          practiseType: String(d.practice_id || "0"),
          gender: String(d.gender || "1"),
          firstName: d.first_name || "",
          lastName: d.last_name || "",
          titleQualification: d.qualification || "",
          mobile: d.mobile || "",
          sendSms: String(d.mobile_stat || "0"),
          email: d.email || "",
          sendEmail: String(d.email_stat || "0"),
          potentiality: String(d.p_class_id || "0"),
          loyalty: String(d.l_class_id || "0"),
          loyaltyType: String(d.loyality_id || "0"),
          frequency: String(d.cus_visit_freq || "0"),
          keyOpinionLeader: String(d.kol_stat || "1"),
          adoption: String(d.adoption_id || "0"),
          region: String(d.reg_id || "0"),
          competitorPref: d.comp_pref || "",
          hobbies: d.hob_intersest || "",
          remarks: d.remark || "",
          agegroup: String(d.age_grp_id || "1"),
          dob: d.dob_stat === 1 ? "" : (d.dob?.split("T")[0] || ""),
          dobNA: d.dob_stat === 1,
          anniversary: d.wedding_stat === 1 ? "" : (d.wedding_dt?.split("T")[0] || ""),
          anniversaryNA: d.wedding_stat === 1,
          customerLatitude: d.gps_lat || "0",
          customerLongitude: d.gps_long || "0",
        });

        // ── 3. Location tag icon ─────────────────────────────────────────────
        if (d.gps_tag_stat === 1) {
          setLocationTagged(true);
          setSelectedLocation({
            latitude: String(d.gps_lat || "0"),
            longitude: String(d.gps_long || "0"),
          });
        }

        // ── 4. Populate clinic row ───────────────────────────────────────────
        setClinics([{
          ...DEFAULT_CLINIC,
            clinicId: d.detId || 0,         
          repIncharge: String(d.user_id || "0"),
          repInchargePOS: String(d.user_id || "0"),
          beat: String(d.beat_id || "0"),
          beatOptions: [],
          clinicName: d.clinic_name || "",
          contactName: d.cont_person || "",
          contactNo: d.clinic_phone || "",
          address: d.clinic_addr || "",
          city: d.city || "",
          zipCode: String(d.zip_code || ""),
          stkId: String(d.stk_id || "0"),
          phChain: String(d.chain_id || "0"),
          hospitalAttached: String(d.hospital_id || "0"),
          pharmacyAttached: String(d.pharmacy_id || "0"),
          meetingTime: d.visit_time || "",
          meetingDays: d.visit_day ? d.visit_day.split(",").filter(Boolean) : [],
        }]);

        // ── 5. Load regions first to get correct zone_id ─────────────────────
        // FIX: regionOptions is empty at this point (race condition)
        // so we fetch directly instead of relying on handleRegionChange
        if (d.reg_id) {
          let regions = regionOptions;
          if (regions.length === 0) {
            const regRes = await api.post("/getRegionMas");
            regions = (regRes.data.data || []).map(i => ({ ...i, id: String(i.id) }));
            setRegionOptions(regions);
          }

          // Now zone_id is correctly resolved
          const selectedRegion = regions.find(r => r.id === String(d.reg_id));
          const zoneId = selectedRegion?.zone_id || "0";

          const [repRes, repPosRes, distRes, brandsRes] = await Promise.all([
            api.post("/getRepIncharge", { regId: String(d.reg_id), requestType: String(d.cus_type_id) }),
            api.post("/getRepInchargePos", { regId: String(d.reg_id) }),
            api.post("/getDistributor", { regId: String(d.reg_id) }),
            api.post("/getBrands", { doctorId: decodedID > 0 ? decodedID : 0 }), // ← correct zoneId
          ]);

          setRepInchargeOptions((repRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
          setRepPOSOptions((repPosRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
          setDistributorOptions((distRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));

          // FIX: b.sub_name not b.subcat_name — matches backend SQL (sc.sub_name)
          setBrandData((brandsRes.data.data || []).map(b => ({
            subCatId: String(b.id),
            name: b.sub_name,             // ← fixed field name
            focus: b.focusChecked ? 1 : 0, // ← backend pre-calculates this
            reminder: b.remChecked ? 1 : 0,
            competition: 0,
          })));
        }

        // ── 6. Load beat options for saved rep ──────────────────────────────
        if (d.user_id) {
          const beatRes = await api.post("/getClinicBeat", { repInchargeId: d.user_id });
          const opts = (Array.isArray(beatRes.data.data.beats) ? beatRes.data.data.beats : [])
            .map(i => ({ ...i, id: String(i.id) }));
          setClinics(prev => [{
            ...prev[0],
            beatOptions: opts,
            beat: String(d.beat_id || "0"),
          }]);
        }

        // ── 7. Load frequency options for saved potentiality ─────────────────
        if (d.p_class_id) {
          const freqRes = await api.post("/getCustomerFreq", {
            potentialityId: d.p_class_id,
            hdnCustomerFrequency: d.cus_visit_freq || "",
          });
          setFrequencyOptions(
            (freqRes.data.data || []).map(i => ({ ...i, id: String(i.id) }))
          );
        }

      } catch (error) {
        console.error(error);
      }
    };
    getEditData();
  }, [decodedID]);

  // ---------------- UI ----------------
  return (
    <Layout
      breadcrumb={[{ label: "Home", path: "/" }, { label: "Account Master" }]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box sx={{ ml: 1.5, mt: 1.5 }}>
          <h1 className="mainTitle">Account Master</h1>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, mr: 1.5 }}>
          {decodedID && (
            <Button variant="contained" onClick={() => handleUpdate(decodedID)}>
              Generate Update Request
            </Button>
          )}          {!decodedID && <Button variant="contained" onClick={handleSubmit}>Generate Add Request</Button>}
          <Button variant="contained" sx={{ bgcolor: "#2196f3", color: "white" }}>HCP / Retailer List</Button>
        </Box>
      </Box>
      <Box sx={headContainer}>
        <Typography variant="h6" color="initial" sx={subHeaderStyle}>Primary Details</Typography>
        <Divider />
        <Grid container spacing={2} alignItems="center">
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

          {/* practise Type */}
          {fieldConfig["Practice Type/Speciality"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Practice Type/Speciality"]?.label}
                value={form.practiseType || ""}
                onChange={(e) =>
                  setForm({ ...form, practiseType: String(e.target.value) })
                }
                options={practiseType}
                labelKey="pharmacy_type"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <LocationOnIcon
              sx={{
                color: locationTagged ? "green" : "red",   // ← red → green after tagging
                height: "30px",
                width: "30px",
                cursor: "pointer",
                transition: "color 0.3s ease",
              }}
              onClick={() => setMapDialogOpen(true)}
            />
          </Grid>

          {/* Gender */}
          {fieldConfig["Gender"]?.show && isHcpField && (
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

          {/* First Name */}
          {fieldConfig["Last Name"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["Last Name"]?.label || "Last Name"}
                fullWidth
                size="small"
                value={form.lastName || ""}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </Grid>
          )}

          {/* Title / Qualification – hcpDiv2 */}
          {fieldConfig["Title/Qualification"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Title/Qualification"]?.label || "Title / Qualification"}
                fullWidth size="small"
                value={form.titleQualification}
                onChange={(e) =>
                  setForm({ ...form, titleQualification: e.target.value })
                }
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

          {/* Send SMS */}
          {fieldConfig["Mobile"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl component="fieldset">
                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                  Send SMS
                </Typography>
                <RadioGroup
                  row
                  value={form.sendSms?.toString() || "0"}
                  onChange={(e) => {
                    console.log("Send SMS changed to:", e.target.value);
                    setForm({ ...form, sendSms: e.target.value });
                  }}
                >
                  <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
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

          {/* Send Email */}
          {fieldConfig["Email"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl component="fieldset">
                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                  Send Email
                </Typography>
                <RadioGroup
                  row
                  value={form.sendEmail?.toString() || "0"}
                  onChange={(e) => {
                    console.log("Send Email changed to:", e.target.value);
                    setForm({ ...form, sendEmail: e.target.value });
                  }}
                >
                  <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* Potentiality Class */}
          {fieldConfig["Potentiality Class"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Potentiality Class"]?.label || "Potentiality Class"}
                value={form.potentiality}
                onChange={(e) => handlePotentialityChange(String(e.target.value))}
                options={potentialityOptions}
                valueKey="id"
                labelKey="cat_type"
              />
            </Grid>
          )}

          {/* Key Opinion Leader – hcpDiv2 */}
          {fieldConfig["Key Opinion Leader"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Key Opinion Leader"].label || "Key Opinion Leader"}
                value={form.keyOpinionLeader}
                onChange={(e) =>
                  setForm({ ...form, keyOpinionLeader: String(e.target.value) })
                }
                options={[
                  { id: "0", name: "Yes" },
                  { id: "1", name: "No" },
                ]}
                valueKey="id"
                labelKey="name"
              />
            </Grid>
          )}

          {/* Loyalty Class */}
          {fieldConfig["Loyalty Class"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Loyalty Class"].label || "Loyalty Class"}
                value={form.loyalty}
                onChange={(e) =>
                  setForm({ ...form, loyalty: String(e.target.value) })
                }
                options={potentialityOptions}
                valueKey="id"
                labelKey="cat_type"
              />
            </Grid>
          )}

          {/* Visit Frequency / Year */}
          {fieldConfig["Visit Frequency/Year"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Visit Frequency/Year"]?.label || "Visit Frequency / Year"}
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: String(e.target.value) })
                }
                options={frequencyOptions}
                valueKey="id"
                labelKey="freq_name"
              />
            </Grid>
          )}

          {fieldConfig["Loyalty Type"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Loyalty Type"]?.label || "Loyalty Type"}
                value={form.loyaltyType}
                onChange={(e) =>
                  setForm({ ...form, loyaltyType: String(e.target.value) })
                }
                options={loyaltyTypeOptions}
                valueKey="id"
                labelKey="loyalty_type"
              />
            </Grid>
          )}

          {/* Adoption / Current Zone – hcpDiv2 */}
          {fieldConfig["Adoption/Current Zone"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Adoption/Current Zone"]?.label || "Adoption / Current Zone"}
                value={form.adoption}
                onChange={(e) =>
                  setForm({ ...form, adoption: String(e.target.value) })
                }
                options={adoptionOptions}
                valueKey="id"
                labelKey="adoption_style"
              />
            </Grid>
          )}

          {/* Region */}
          {fieldConfig["Region"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Region"]?.label || "Region"}
                value={form.region || ""}
                onChange={(e) => handleRegionChange(String(e.target.value))}
                options={regionOptions}
                valueKey="id"
                labelKey="reg_name"
              />
            </Grid>
          )}

          {/* Remarks */}
          {fieldConfig["Remarks"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Remarks"]?.label || "Remarks"}
                fullWidth size="small" multiline rows={2}
                value={form.remarks || ""}
                onChange={(e) =>
                  setForm({ ...form, remarks: String(e.target.value) })
                }
              />
            </Grid>
          )}
        </Grid>
        {/*------------ SecondaryInfo------------------------ */}
        <Typography variant="h6" color="initial" sx={subHeaderStyle}>Secondary Info</Typography>
        <Divider />
        <SecondaryInfo
          fieldConfig={fieldConfig}
          form={form}
          setForm={setForm}
          isHcpField={isHcpField}
          ageOptions={ageOptions}
          marketingOptions={marketingOptions} />

        {/*------------  Competitor Mapping ------------------------ */}
        <Typography variant="h6" color="initial" sx={subHeaderStyle}>Competitor Mapping</Typography>
        <Divider />
        <Box sx={{ width: "50%" }}>
          <CompetitorMappping
            brandData={brandData}
            setBrandData={setBrandData}
            onOpenCompModal={(brand) => {
              setSelectedBrand(brand);   // track which brand was clicked
              setCompModalOpen(true);
            }}
          />
        </Box>
      </Box>
      {/*------------ contact info ------------------------ */}
      <ContactInfo
        fieldConfig={fieldConfig}
        form={form}
        setForm={setForm}
        isHcp={isHcpField}
        isRetailer={isRetailerField}
        clinics={clinics}
        handleRepChange={handleRepChange}
        updateClinic={updateClinic}
        toggleMeetingDay={toggleMeetingDay}
        repInchargeOptions={repInchargeOptions}
        repPOSOptions={repPOSOptions}
        pharmacyOptions={pharmacyOptions}
        hospitalOptions={hospitalOptions}
        distributorOptions={distributorOptions}
      />
      {/* ---------------- Map Dialog ------------------------- */}
      <Dialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Location Tagging
          <IconButton onClick={() => setMapDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <LocationTaggingMap
            initialLat={selectedLocation.latitude}
            initialLng={selectedLocation.longitude}
            onLocationSelect={(lat, lng) =>
              setSelectedLocation({ latitude: lat, longitude: lng })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmTagging}
          >
            Confirm Tagging
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setMapDialogOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <AddCompetitor
        selectedBrand={selectedBrand}
        compModalOpen={compModalOpen}
        setCompModalOpen={setCompModalOpen}
        cusId={decodedID || 0}
        tempId={0}
        onSave={(editedRows) => {
          // Attach subcat_id to each row so competitor_subcat_id array is correct
          const rowsWithSubcat = editedRows.map(r => ({
            ...r,
            subcat_id: selectedBrand?.subCatId || 0,
          }));
          setCompetitorRows(prev => {
            // Replace rows for this subcat, keep others
            const filtered = prev.filter(r => r.subcat_id !== selectedBrand?.subCatId);
            return [...filtered, ...rowsWithSubcat];
          });
          setBrandData(prev => prev.map(b =>
            b.subCatId === selectedBrand?.subCatId
              ? { ...b, compCount: editedRows.length }
              : b
          ));
        }}
      />
    </Layout>
  );
}

export default CreateCustomer;