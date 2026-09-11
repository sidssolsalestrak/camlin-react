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
  DialogActions, CircularProgress
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { LocationTaggingMap } from "./LocationTaggingMap";
import { useSubmitCustomer } from "./useSubmitCustomer";
import { useParams,useLocation } from "react-router-dom";
import AddCompetitor from "./AddCompetitor";
import { jwtDecode } from "jwt-decode";
import useToast from "../../utils/useToast";
import { getMasterPanel } from "../../services/masterPanelService";
import ConfirmationDialog from "../../utils/confirmDialog";

const headContainer = {
  background: "#fff", display: "flex", flexDirection: 'column', gap: 2,
  m: 1.5, borderRadius: '10px', boxShadow:
  "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
  padding: '16px 18px',
  width: { lg: '98%', md: '98%', sm: '90%', xs: '90%' }
}

const subHeaderStyle = { textDecoration: "underline", textUnderlineOffset: "5px", textDecorationColor: "#ccc" }

const ALL_REGION_OPTION = { id: "0", reg_name: "All" };

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
  const { id, reqType = "0", req = "0" } = useParams();

  const safeAtob = (str) => {
    try { return atob(str); } catch (e) { return str; }
  };

  let decodedID = id ? safeAtob(id) : null;
  let decodedReqType = reqType ? safeAtob(reqType) : "0";
  let decodedReq = req ? safeAtob(req) : "0";
  const isTemp = decodedReq !== "0";

  const showAlert = useToast();

  // ── Role-based access control (same pattern as Area.jsx / AccountMas.jsx) ──
  // ROLES: 0 = All, 1 = Maker, 2 = Checker, 3 = View Only
  const [accStat, setAccStat] = useState(null);
  const [editDataLoading, setEditDataLoading] = useState(!!decodedID && decodedID !== "0");

    useEffect(() => {
    const resolveAccStat = async () => {
      try {
        const res = await api.post("/getAccStat", {
          menu_url: "Customers/CreateDoctor",
        });

        const stat = res.data?.data?.acc_stat;
        if (stat !== null && stat !== undefined) {
          localStorage.setItem("acc_stat", stat);
          setAccStat(String(stat));
        }
      } catch (err) {
        console.log(err);
      }
    };

    resolveAccStat();
  }, []);

  // ── Master Panel (dynamic labels) ──
  const [masterPanel, setMasterPanel] = useState({});

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  // ---------------- STATE ---------------------------
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
      pharmaType: "1",  
    marketingTools: [],
    agegroup: "1",
    potentiality: "1",
    region: "0",
  });

  const isHcpField = (form.cusType === "1"); // hcpDiv2 fields only show for HCP
  const isRetailerField = (form.cusType === "2"); // retailerDiv fields only show for Retailer
  const [brandData, setBrandData] = useState([]);
  const location=useLocation()
  const competitorBrands = brandData
  .filter(b => b.focus === 1 || b.reminder === 1)
  .map(b => b.subCatId);
  const [userType, setUserType] = useState(null)
  const [pendingRequest, setPendingRequest] = useState(null); // { request_type: 2 or 3 } or null
  const [delFlag, setDelFlag] = useState(0); // 0 = Active, 1 = Inactive
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    mobile: "",
    email: "",
    contactNum: {}   // ← indexed by clinic position: { 0: "error", 1: "" , ... }
  });

  // ── Confirmation dialog (Add / Update) ──
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Cancel",
    confirmColor: "primary",
  });

  const closeConfirm = () =>
    setConfirm((c) => ({ ...c, open: false, onConfirm: null }));

  // ── Baseline snapshot for "Generate Update Request" change detection ──
  const [originalSnapshot, setOriginalSnapshot] = useState(null);

  // ── Normalizes only user-editable fields so unrelated noise (beatOptions,
  //    clinicId, brand names, etc.) never triggers a false "changed" state.
  const buildComparableSnapshot = (formVal, clinicsVal, brandDataVal, competitorRowsVal) => {
    const f = {
      cusType: formVal.cusType || "",
      retailerType: formVal.retailerType || "",
      pharmaType: formVal.pharmaType || "",
      practiseType: formVal.practiseType || "",
      gender: formVal.gender || "",
      firstName: (formVal.firstName || "").trim(),
      lastName: (formVal.lastName || "").trim(),
      titleQualification: formVal.titleQualification || "",
      mobile: formVal.mobile || "",
      sendSms: formVal.sendSms || "0",
      email: formVal.email || "",
      sendEmail: formVal.sendEmail || "0",
      potentiality: formVal.potentiality || "",
      loyalty: formVal.loyalty || "",
      loyaltyType: formVal.loyaltyType || "",
      frequency: formVal.frequency || "48",
      keyOpinionLeader: formVal.keyOpinionLeader !==null && formVal.keyOpinionLeader!==undefined ? String(formVal.keyOpinionLeader):"0" ,
      adoption: formVal.adoption || "",
      region: formVal.region || "",
      competitorPref: formVal.competitorPref || "",
      hobbies: formVal.hobbies || "",
      remarks: formVal.remarks || "",
      agegroup: formVal.agegroup || "",
      dob: formVal.dobNA ? "" : (formVal.dob || ""),
      dobNA: !!formVal.dobNA,
      anniversary: formVal.anniversaryNA ? "" : (formVal.anniversary || ""),
      anniversaryNA: !!formVal.anniversaryNA,
      customerLatitude: String(formVal.customerLatitude || "0"),
      customerLongitude: String(formVal.customerLongitude || "0"),
    };

    const c = (clinicsVal || []).map(cl => ({
      repIncharge: cl.repIncharge || "0",
      repInchargePOS: cl.repInchargePOS || "0",
      beat: cl.beat || "",
      clinicName: cl.clinicName || "",
      contactName: cl.contactName || "",
      contactNo: cl.contactNo || "",
      hospitalAttached: cl.hospitalAttached || "0",
      pharmacyAttached: cl.pharmacyAttached || "0",
      meetingDays: [...(cl.meetingDays || [])].sort(),
      meetingTime: cl.meetingTime || "",
      address: cl.address || "",
      city: cl.city || "",
      zipCode: String(cl.zipCode || ""),
      stkId: cl.stkId || "0",
      phChain: cl.phChain || "",
    }));

    const b = (brandDataVal || [])
      .map(br => ({ subCatId: br.subCatId, focus: br.focus || 0, reminder: br.reminder || 0 }))
      .sort((x, y) => String(x.subCatId).localeCompare(String(y.subCatId)));

    const comp = (competitorRowsVal || [])
      .map(r => ({
        subcat_id: r.subcat_id,
        pid: r.pid,
        prod_qty: r.prod_qty || 0,
        comp_id_1: r.comp_id_1 || "0",
        comp_id_1_qty: r.comp_id_1_qty || 0,
        comp_id_2: r.comp_id_2 || "0",
        comp_id_2_qty: r.comp_id_2_qty || 0,
        comp_id_3: r.comp_id_3 || "0",
        comp_id_3_qty: r.comp_id_3_qty || 0,
        other_name: r.other_name || "",
        oth_qty: r.oth_qty || 0,
      }))
      .sort((x, y) => String(x.pid).localeCompare(String(y.pid)) || String(x.subcat_id).localeCompare(String(y.subcat_id)));

    return JSON.stringify({ f, c, b, comp });
  };

  const isUpdateDisabled = () => {
    if (originalSnapshot === null) return false; // baseline not loaded yet — don't block
    return buildComparableSnapshot(form, clinics, brandData, competitorRows) === originalSnapshot;
  };

  const { handleSubmit, handleUpdate } = useSubmitCustomer({
    form, clinics, brandData, competitorBrands, competitorRows, setFieldErrors, setForm
  });

 const validateEmail = (email) => {
  const filter =
    /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return filter.test(email);
};

const validateMobile = (mobile) => mobile && mobile.length === 10;

const validateForm = () => {
  const newErrors = {};
  const toastMessages = [];
  let hasError = false;

  if (!form.cusType) {
    newErrors.cusType = "Account Type is Required";
    hasError = true;
  }
  if (!form.retailerType) {
    newErrors.retailerType = "Type is Required";
    hasError = true;
  }
  if (!form.potentiality) {
    newErrors.potentiality = "Potentiality Class is Required";
    hasError = true;
  }

  if (!form.firstName || !form.firstName.trim()) {
    newErrors.firstName = "Store Name is required";
    hasError = true;
  }

  if (!form.region || form.region === "0" || form.region === "") {
    newErrors.region = "Region is required";
    hasError = true;
  }

  if (!clinics[0]?.stkId || clinics[0].stkId === "0") {
    newErrors.stkId = "Distributor is required";
    hasError = true;
  }

  if (form.sendSms === "1" && (!form.mobile || !form.mobile.trim())) {
    newErrors.mobile = "Mobile No is required";
    hasError = true;
  } else if (form.mobile && form.mobile.trim() && !validateMobile(form.mobile)) {
    newErrors.mobile = "Please enter valid Mobile No";
    hasError = true;
  } else {
    newErrors.mobile = "";
  }

  if (form.sendEmail === "1" && (!form.email || !form.email.trim())) {
    newErrors.email = "Email is required";
    hasError = true;
  } else if (form.email && form.email.trim() && !validateEmail(form.email)) {
    newErrors.email = "Please enter valid Email address";
    hasError = true;
  } else {
    newErrors.email = "";
  }

  const lat = Number(form.customerLatitude);
  const lng = Number(form.customerLongitude);
  if (!form.customerLatitude || !form.customerLongitude || !lat || !lng) {
    newErrors.location = "Please Add Location By Clicking Location Icon!!";
    hasError = true;
  }

  if (form.cusType === "1") {
    const repIds = clinics.map((c) => c.repIncharge).filter((id) => id && id !== "0");
    if (repIds.length !== new Set(repIds).size) {
      toastMessages.push("Rep Incharge in multiple Contact Info can't be same.. Please compare Contact Info details!");
      hasError = true;
    }
  }

  if (form.cusType === "2") {
    const posIds = clinics.map((c) => c.repInchargePOS).filter((id) => id && id !== "0");
    if (posIds.length !== new Set(posIds).size) {
      toastMessages.push("Account Owner (KAM) in multiple Contact Info can't be same.. Please compare Contact Info details!");
      hasError = true;
    }
  }

  const filteredClinics = clinics.filter((c) =>
    form.cusType === "1"
      ? c.repIncharge && c.repIncharge !== "0"
      : c.repInchargePOS && c.repInchargePOS !== "0",
  );

  const noAccountOwner = clinics.some((c) =>
    form.cusType === "2"
      ? !c.repInchargePOS || c.repInchargePOS === "0"
      : !c.repIncharge || c.repIncharge === "0",
  );
  if (noAccountOwner) {
    newErrors.repIncharge = form.cusType === "2" ? "Account Owner is Required" : "Rep Incharge is Required";
    hasError = true;
  }

  const noBeat = filteredClinics.some((c) => !c.beat || c.beat === "0");
  if (noBeat) {
    newErrors.beat = "Beat is Required";
    hasError = true;
  }

  const noBranch = filteredClinics.some((c) => !c.clinicName || c.clinicName.trim() === "");
  if (noBranch) {
    newErrors.clinicName = "Branch Name is Required";
    hasError = true;
  }

  const contactNumErrors = {};
  let hasContactNumError = false;
  clinics.forEach((c, i) => {
    const no = c.contactNo;
    if (no && no.length !== 10) {
      contactNumErrors[i] = "Please enter valid 10-digit Contact No";
      hasContactNumError = true;
    }
  });
  if (hasContactNumError) hasError = true;
  newErrors.contactNum = contactNumErrors;

  setFieldErrors((prev) => ({ ...prev, ...newErrors }));

  if (newErrors.mobile) setForm((f) => ({ ...f, sendSms: "0" }));
  if (newErrors.email) setForm((f) => ({ ...f, sendEmail: "0" }));

  if (hasError) {
    toastMessages.forEach((msg) => showAlert.error(msg));
    showAlert.error("Please fix all mandatory fields");
  }

  return !hasError;
};

const onAddClick = () => {
  if (!validateForm()) return;
  setConfirm({
    open: true,
    title: "Confirmation",
    message: "Are you sure you want to submit this request?",
    confirmText: "OK",
    cancelText: "Cancel",
    confirmColor: "primary",
    onConfirm: async () => {
      closeConfirm();
      if (submitting) return;
      setSubmitting(true);
      try { await handleSubmit(); } finally { setSubmitting(false); }
    },
  });
};

const onUpdateClick = () => {
  if (!validateForm()) return;
  setConfirm({
    open: true,
    title: "Confirmation",
    message: "Are you sure you want to update this request?",
    confirmText: "OK",
    cancelText: "Cancel",
    confirmColor: "primary",
    onConfirm: async () => {
      closeConfirm();
      if (submitting) return;
      setSubmitting(true);
      try { await handleUpdate(decodedID); } finally { setSubmitting(false); }
    },
  });
};

  

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // numbers only
    setForm((f) => ({ ...f, mobile: val, sendSms: "0" }));
    setFieldErrors((prev) => ({ ...prev, mobile: "" })); // clear error on type
  };

  const handleSendSmsChange = (e) => {
    const val = e.target.value;
    if (val === "1") {
      if (!form.mobile) {
        showAlert.error("Mobile No is required to enable this feature..!")
        setForm((f) => ({ ...f, sendSms: "0" }));
        return;
      }
    }
    setForm((f) => ({ ...f, sendSms: val }));
  };

  const handleEmailChange = (e) => {
    const onlyText = e.target.value.replace(/^\s+/, "");
    setForm((f) => ({ ...f, email: onlyText, sendEmail: "0" }));
    setFieldErrors((prev) => ({ ...prev, email: "" }));
  };

  const handleSendEmailChange = (e) => {
    const val = e.target.value;
    if (val === "1") {
      if (!form.email) {
        showAlert.error("Email address is required to enable this feature..!")
        setForm((f) => ({ ...f, sendEmail: "0" }));
        return;
      }
    }
    setForm((f) => ({ ...f, sendEmail: val }));
  };

  // ── Contact No: only clear the error while typing. Never flag an
  //    incomplete number as invalid mid-keystroke. ──
  const handleClinicContactNoChange = (idx, value) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 10);
    updateClinic(idx, "contactNo", numericValue);

    setFieldErrors((prev) => ({
      ...prev,
      contactNum: { ...prev.contactNum, [idx]: "" },
    }));
  };

  // ── Contact No: validate once the user leaves the field, so a
  //    still-incomplete number is judged only after they're done typing. ──
  const handleClinicContactNoBlur = (idx, value) => {
    if (value && value.length !== 10) {
      setFieldErrors((prev) => ({
        ...prev,
        contactNum: { ...prev.contactNum, [idx]: "Please enter valid 10-digit Contact No" },
      }));
    }
  };

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

  useEffect(() => {
    const token = localStorage.getItem("session-token");
    if (token) {
      try {
        let decoded = jwtDecode(token)
        setUserType(decoded.user_type || null)
      } catch (err) {
        console.log(err)
      }
    }
  }, [])

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
    fetchAccountOwner()
  }, []);

  const handleAccTypeChange = (e) => {
    const val = String(e.target.value);
    setForm((f) => ({
    ...f, cusType: val,
    gender: "1", agegroup: "1", pharmaType: 1, practiceType: "",
    potentiality: "1", loyalty: "", loyaltyType: "", frequency: "",  // ← "1" not ""
    retailerType: "1",
    }));
    setFieldErrors((prev) => ({ ...prev, cusType: "" }));
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
    setFieldErrors((prev) => ({ ...prev, region: "" }));

    try {
      const [repRes, repPoso, distRes, brandsRes] = await Promise.all([
        api.post("/getRepIncharge", { regId: val, requestType: form.cusType }),
        api.post("/getRepInchargePos", { regId: val }),
        api.post("/getDistributor", { regId: val }),
        api.post("/getBrands", { doctorId: decodedID > 0 ? decodedID : 0 }), // ← missing
      ]);

      setRepInchargeOptions((repRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
      setRepPOSOptions((repRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
      setDistributorOptions((distRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
      const brandsRaw = brandsRes.data.data || [];
      console.log("brands Raw in list",brandsRaw)
      const mappedBrands = brandsRaw.map(b => ({
        subCatId: String(b.id),
        name: b.sub_name,
        focus: b.foc? 1 : 0,
        reminder: b.rem ? 1 : 0,
        competition: 0,
        compCount: 0,
    }));
      setBrandData(mappedBrands);

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
      setter: (data) => setRegionOptions([{ ...ALL_REGION_OPTION }, ...data]),
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

    loadIfNeeded({
      key: "Visit Frequency/Year",
      state: frequencyOptions,
      setter: setFrequencyOptions,
      apiCall: "/getCustomerFreq"
    });
  }, [fieldConfig]);

  const handleRepChange = async (idx, repId, isPos = false) => {
    const updated = clinics.map((c, i) => {
      if (i !== idx) return c;
      return { ...c, [isPos ? "repInchargePOS" : "repIncharge"]: repId };
    });

    // ── clear the mandatory error as soon as a value is picked ──
    setFieldErrors((prev) => ({ ...prev, repIncharge: "" }));

    try {
      const res = await api.post("/getClinicBeat", { repInchargeId: repId });
      const opts = (Array.isArray(res.data.data.beats) ? res.data.data.beats : []).map((i) => ({ ...i, id: String(i.id) }));
      updated[idx] = { ...updated[idx], beatOptions: opts, beat: "" };
    } catch (err) { console.error(err); }
    setClinics(updated);
};

  const fetchAccountOwner = async () => {
    try {
      let response = await api.post("/getRepInchargePos", { regId: 0 })
      let saleresult = Array.isArray(response.data.data) ? response.data.data : []
      setRepPOSOptions(saleresult)

    }
    catch (err) {
      console.log("fetch sales o region error", err)
    }
  }

  const updateClinic = (idx, field, value) => {
    setClinics((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

    // ── clear relevant field error on edit ──
    if (field === "beat" && value && value !== "0") {
      setFieldErrors((prev) => ({ ...prev, beat: "" }));
    }
    if (field === "clinicName" && value && value.trim() !== "") {
      setFieldErrors((prev) => ({ ...prev, clinicName: "" }));
    }
    if (field === "stkId" && value && value !== "0") {
      setFieldErrors((prev) => ({ ...prev, stkId: "" }));
    }
};

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
    const lat = parseFloat(selectedLocation.latitude);
    const lng = parseFloat(selectedLocation.longitude);

    if (!lat || !lng || lat === 0 || lng === 0) {
      showAlert.error("Please select a location on the map to continue!");
      return;
    }
    setLocationTagged(true);
    setMapDialogOpen(false);
    setForm((f) => ({
      ...f,
      customerLatitude: String(lat),
      customerLongitude: String(lng),
    }));
    setFieldErrors((prev) => ({ ...prev, location: "" }));
  };

  const checkPendingRequest = async () => {
    try {
      const pendingRes = await api.post("/getPendingRequest", {
        cus_id: decodedID,
        req_type: decodedReqType,   // ← segment(4) → "0" or non-zero
        req_user: decodedReq,            // ← segment(5) → "0" or non-zero
      });

      const pendingData = pendingRes.data.data;
      if (pendingData && pendingData.length > 0) {
        setPendingRequest(pendingData[0]);
      } else {
        setPendingRequest(null);
      }
    } catch (err) {
      console.error("pending request check failed", err);
      setPendingRequest(null);
    }
  };

  const getPendingRequestName = (requestType) => {
    if (requestType === 2) return "Update";
    if (requestType === 3) return "Delete";
    return "";
  };

  //get edit data
  useEffect(() => {
      setForm({
      cusType: "2",
      gender: "1",
      retailerType: "1",
      practiseType: "",
      pharmaType: "1",
      marketingTools: [],
      agegroup: "1",
      potentiality: "1",
      region: "0",
    });
    setClinics([{ ...DEFAULT_CLINIC }]);
    setBrandData([]);
    setCompetitorRows([]);
    setOriginalSnapshot(null);
    setLocationTagged(false);
    setSelectedLocation({ latitude: "0", longitude: "0" });
    setDelFlag(0);
    setPendingRequest(null);
    setFieldErrors({ mobile: "", email: "", contactNum: {} });

    // ── reset dependent dropdown lists too, so B doesn't inherit A's
    //    rep/beat/distributor/brand options while the new fetch is in flight
    setRepInchargeOptions([]);
    setRepPOSOptions([]);
    setDistributorOptions([]);
    if (!decodedID || decodedID === "0") {
      setEditDataLoading(false);
      return;
    }
    setEditDataLoading(true);
    const getEditData = async () => {
      try {
        // ── 1. PRIMARY data based on isTemp
        const primaryEndpoint = isTemp ? "/getDoctorsDatatemp" : "/getDoctorsData";
        const res = await api.post(primaryEndpoint, { id: decodedID });
        const d = res.data.data[0];
        if (!d) return;

        // ── 2. Load dynamic form first
        await loadDynamicForm(String(d.cus_type_id));

        // ── 3. Load regions before setting form.region
        let regions = regionOptions;
        if (regions.length === 0) {
          const regRes = await api.post("/getRegionMas");
          regions = [{ ...ALL_REGION_OPTION }, ...(regRes.data.data || []).map(i => ({ ...i, id: String(i.id) }))];
          setRegionOptions(regions);
        }

        // ── 4. Populate primary form fields (no lat/long here)
        const loadedForm = {
          cusType: String(d.cus_type_id || "2"),
          retailerType: String(d.retail_type || "1"),
          pharmaType: String(d.pharmacy_type_id || 1),
          practiseType: String(d.practice_id || "0"),
          gender: String(d.gender || "1"),
          firstName: d.first_name || "",
          lastName: d.last_name || "",
          titleQualification: d.qualification || "",
          mobile: d.mobile || "",
          sendSms: String(d.mobile_stat || "0"),
          email: d.email || "",
          sendEmail: String(d.email_stat || "0"),
          potentiality: String(d.p_class_id || "1"),
          loyalty: String(d.l_class_id || "0"),
          loyaltyType: String(d.loyality_id || "0"),
          frequency: String(d.cus_visit_freq || ""),
          keyOpinionLeader: d.kol_stat !== null && d.kol_stat !== undefined
          ? String(d.kol_stat)
          : "0",
          adoption: String(d.adoption_id || "0"),
          marketingTools: d.marketing_tool_ids
          ? String(d.marketing_tool_ids).split(",").filter(Boolean)
          : [],
          region: String(d.reg_id || "0"),
          competitorPref: d.comp_pref || "",
          hobbies: d.hob_intersest || "",
          remarks: d.remark || "",
          agegroup: String(d.age_grp_id || "1"),
          dob: d.dob_stat === 1 ? "" : (d.dob?.split("T")[0] || ""),
          dobNA: d.dob_stat === 1,
          anniversary: d.wedding_stat === 1 ? "" : (d.wedding_dt?.split("T")[0] || ""),
          anniversaryNA: d.wedding_stat === 1,
          customerLatitude: "0",   // ← will be updated from clinic row
          customerLongitude: "0",   // ← will be updated from clinic row
        };
        setForm(loadedForm);

        setDelFlag(d.del_flag ?? 0);
        await checkPendingRequest();

        // ── 5. Load all dependent dropdowns in parallel
        let loadedBrandData = [];
        if (d.reg_id) {
          const [repRes, repPosRes, distRes, brandsRes, freqRes] = await Promise.all([
            api.post("/getRepIncharge", { regId: String(d.reg_id), requestType: String(d.cus_type_id) }),
            api.post("/getRepInchargePos", { regId: String(d.reg_id) }),
            api.post("/getDistributor", { regId: String(d.reg_id) }),
            api.post("/getBrands", { doctorId: decodedID > 0 ? decodedID : 0 }),
            api.post("/getCustomerFreq"),
          ]);

          setRepInchargeOptions((repRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
          setRepPOSOptions((repPosRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
          setDistributorOptions((distRes.data.data || []).map(i => ({ ...i, id: String(i.id) })));
          setFrequencyOptions((freqRes.data.data || []).map(i => ({
            ...i,
            id: String(i.id),
            no_freq_visit: String(i.no_freq_visit),
          })));
          let com_count=0
          loadedBrandData = (brandsRes.data.data || []).map(b => ({
          subCatId: String(b.id),
          name: b.sub_name,
          focus: b.foc? 1 : 0,
          reminder: b.rem ? 1 : 0,
          competition: 0,
          compCount:b.subcat_id>0?com_count+1:com_count,
          }));
          setBrandData(loadedBrandData);
        }

        // ── 5b. Load actual competitor rows for EVERY brand so the baseline
        //        matches exactly what a no-op AddCompetitor save would produce.
        let loadedCompetitorRows = [];
        if (loadedBrandData.length > 0) {
          try {
            const compRequests = loadedBrandData.map(brand =>
              api.post("/getCompModal", {
                subcat_id: brand.subCatId,
                cus_id: decodedID || 0,
                temp_id: 0,
              })
            );
            const compResponses = await Promise.all(compRequests);

            compResponses.forEach((cRes, index) => {
              const brand = loadedBrandData[index];
              const backendProducts = cRes.data.data?.products || [];

              const rowsForThisBrand = backendProducts
                .filter(p =>
                  Number(p.prod_qty) > 0 ||
                  Number(p.comp_id_1) > 0 ||
                  Number(p.comp_id_2) > 0 ||
                  Number(p.comp_id_3) > 0 ||
                  Number(p.oth_qty) > 0 ||
                  (p.other_name && p.other_name.trim() !== '')
                )
                .map(p => ({
                  pid: p.pid,
                  subcat_id: brand.subCatId,
                  prod_qty: p.prod_qty || 0,
                  comp_id_1: p.comp_id_1 ? String(p.comp_id_1) : "0",
                  comp_id_1_qty: p.comp_id_1_qty || 0,
                  comp_id_2: p.comp_id_2 ? String(p.comp_id_2) : "0",
                  comp_id_2_qty: p.comp_id_2_qty || 0,
                  comp_id_3: p.comp_id_3 ? String(p.comp_id_3) : "0",
                  comp_id_3_qty: p.comp_id_3_qty || 0,
                  other_name: p.other_name || "",
                  oth_qty: p.oth_qty || 0,
                }));

              loadedCompetitorRows = [...loadedCompetitorRows, ...rowsForThisBrand];
            });

            // ── keep brandData's compCount in sync with actual saved rows ──
            loadedBrandData = loadedBrandData.map(b => ({
              ...b,
              compCount: loadedCompetitorRows.filter(r => r.subcat_id === b.subCatId).length,
            }));
            setBrandData(loadedBrandData);
          } catch (err) {
            console.error("competitor rows load error", err);
          }
        }
        setCompetitorRows(loadedCompetitorRows);

        // ── 6. CLINIC rows — API based on isTemp
        //       isTemp=false → /getcusdetData    → cus_det table
        //       isTemp=true  → /getTempCusClinic → temp_cus_det table
        const clinicEndpoint = isTemp ? "/getTempCusClinic" : "/getcusdetData";
        const clinicPayload = isTemp ? { Id: decodedID } : { id: decodedID };
        const clinicRes = await api.post(clinicEndpoint, clinicPayload);
        const clinicRows = clinicRes.data.data || [];

        if (clinicRows.length > 0) {
          // ── 7. lat/long comes from FIRST clinic row (not from getDoctorsData)
          const firstClinic = clinicRows[0];
          const lat = firstClinic.gps_lat || "0";
          const long = firstClinic.gps_long || "0";

          // ── update form with lat/long
          setForm(prev => ({
            ...prev,
            customerLatitude: String(lat),
            customerLongitude: String(long),
          }));
          loadedForm.customerLatitude = String(lat);
          loadedForm.customerLongitude = String(long);

          // Replace the existing if block with this:
          const hasLocation = lat && long && String(lat) !== "0" && String(long) !== "0";

          if (hasLocation) {
            setLocationTagged(true);
            setSelectedLocation({
              latitude: String(lat),
              longitude: String(long),
            });
          }
          // ── 8. Load beat options for each clinic row in parallel
          const clinicsWithBeats = await Promise.all(
            clinicRows.map(async (c) => {
              let beatOptions = [];
              if (c.user_id) {
                try {
                  const beatRes = await api.post("/getClinicBeat", { repInchargeId: c.user_id });
                  beatOptions = (
                    Array.isArray(beatRes.data.data?.beats)
                      ? beatRes.data.data.beats
                      : []
                  ).map(i => ({ ...i, id: String(i.id) }));
                } catch (e) {
                  console.error("beat load error", e);
                }
              }

              return {
                ...DEFAULT_CLINIC,
                clinicId: c.id || 0,
                repIncharge: String(c.user_id || "0"),
                repInchargePOS: String(c.user_id || "0"),
                beat: String(c.beat_id || "0"),
                beatOptions,
                clinicName: c.clinic_name || "",
                contactName: c.cont_person || "",
                contactNo: c.clinic_phone || "",
                address: c.clinic_addr || "",
                city: c.city || "",
                zipCode: String(c.zip_code || ""),
                stkId: String(c.stk_id || "0"),
                phChain: String(c.chain_id || "0"),
                hospitalAttached: String(c.hospital_id || "0"),
                pharmacyAttached: String(c.pharmacy_id || "0"),
                pharmacistName: c.pharmacy_cont_person || "",
                meetingTime: c.visit_time || "",
                meetingDays: c.visit_day
                  ? c.visit_day.split(",").filter(Boolean)
                  : [],
              };
            })
          );

          setClinics(clinicsWithBeats);

          // ── capture baseline for change detection ──
          setOriginalSnapshot(
            buildComparableSnapshot(
              loadedForm,
              clinicsWithBeats,
              loadedBrandData,
              loadedCompetitorRows
            )
          );
        } else {
          setClinics([{ ...DEFAULT_CLINIC }]);
          setOriginalSnapshot(
            buildComparableSnapshot(loadedForm, [{ ...DEFAULT_CLINIC }], loadedBrandData, loadedCompetitorRows)
          );
        }

      } catch (error) {
        console.error("getEditData error:", error);
      }
      finally{
         setEditDataLoading(false);
      }
    };

    getEditData();
  }, [decodedID]);

  const ALLOWED_USER_TYPES = [2, 6, 8, 15];

  // In CreateCustomer.jsx
  const handleOpenMap = () => {
    // ── use saved lat/long from form (set from clinic row)
    setSelectedLocation({
      latitude: form.customerLatitude || "0",
      longitude: form.customerLongitude || "0",
    });
    setMapDialogOpen(true);
  };
 console.log("acc_sta",accStat)
  // ---------------- UI ----------------
  return (
    <Layout
      breadcrumb={[{ label: "Home", path: "/" }, 
        { label: `${masterPanel["ACCM"] || "Account"} Master`, path:location.pathname },
        {label: "Add New Request", path:location.pathname}
      ]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Box sx={{ ml: 1.5, mt: 1.5 }}>
          <h2>{masterPanel["ACCM"] || "Account"} Master</h2>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, mr: 1.5 }}>
          {/* Only show for allowed user types */}
          {decodedID && ALLOWED_USER_TYPES.includes(Number(userType)) && (
            <>
              {pendingRequest ? (
                <Box
                  sx={{
                    background: "#ffd36f",
                    padding: "2px 8px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  {getPendingRequestName(pendingRequest.request_type)} Request is pending
                  for this account ! Waiting for Approval..
                </Box>
              ) : (
                delFlag === 0 && [0, 2, 1].includes(Number(accStat)) && (
                  <Button
                    variant="contained"
                    disabled={isUpdateDisabled() || submitting || editDataLoading}
                    onClick={onUpdateClick}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {submitting ? "Submitting..." : "Generate Update Request"}
                  </Button>
                )
              )}
            </>
          )}

          {/* Add New Request — Maker / All only */}
          {!decodedID && [0, 1, 2].includes(Number(accStat)) && (
            <Button
              variant="contained"
              onClick={onAddClick}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {submitting ? "Submitting..." : "Generate Add Request"}
            </Button>
          )}

          <Button
            variant="contained"
            sx={{ bgcolor: "#2196f3", color: "white" }}
            href="/customers/AllDoctors/NA==/MA==/MA==/MA==/MQ=="
          >
            HCP / Retailer List
          </Button>
        </Box>
      </Box>
      <Box sx={headContainer}>
       <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="initial" sx={subHeaderStyle}>Primary Details</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
          <Box>
            <LocationOnIcon
              sx={{
                color: locationTagged ? "green" : "red",
                height: "30px",
                width: "30px",
                cursor: "pointer",
                transition: "color 0.3s ease",
              }}
              onClick={handleOpenMap}
            />
          </Box>
          {fieldErrors.location && <Typography sx={{color:'#D32F2F',fontSize:'9px'}}>{fieldErrors.location}</Typography>}
        </Box>
      </Box>
      <Divider sx={{ mt: -1.5 }} />
        <Grid container spacing={2} alignItems="center">
          {/* Account Type */}
          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <CommonAppSelect
              label={fieldConfig["Customer Type"]?.label || "Type"}
              value={form.cusType}
              onChange={handleAccTypeChange}
              options={dropdowns.cusTypeMas}
              valueKey="id"
              labelKey="cus_type_name"
              required={true}
              disabled={!!decodedID && decodedID !== "0"}
              sx={
                decodedID && decodedID !== "0"
                  ? { backgroundColor: "#EEEEEE" }
                  : undefined
              }
              error={!!fieldErrors.cusType}
              helperText={fieldErrors.cusType}
            />
          </Grid>

          {/* Type */}
          {fieldConfig["Type"]?.show && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Type"]?.label || "Type"}
                value={form.retailerType}
                onChange={(e) => {
                  setForm({ ...form, retailerType: String(e.target.value) })
                  setFieldErrors((prev) => ({ ...prev, retailerType: "" }));
                }}
                options={[
                  { id: "1", name: "Retailer" },
                  { id: "2", name: "HO" },
                  { id: "3", name: "Hospital" },
                  { id: "4", name: "Institution" },
                ]}
                valueKey="id"
                labelKey="name"
                required={true}
                error={!!fieldErrors.retailerType}
                helperText={fieldErrors.retailerType}
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
          {/* First Name */}
          {fieldConfig["First Name"]?.show && !isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["First Name"]?.label || "First Name"}
                fullWidth required
                size="small"
                sx={{height:'3rem'}}
                value={form.firstName || ""}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, firstName: onlyText })
                  setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                }}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
              />
            </Grid>
           )}
          </Grid>
          {isHcpField && <Grid container spacing={2} alignItems="center">
          {/* First Name */}
          {fieldConfig["First Name"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["First Name"]?.label || "First Name"}
                fullWidth required
                size="small"
                sx={{height:'3rem'}}
                value={form.firstName || ""}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, firstName: onlyText })
                  setFieldErrors((prev) => ({ ...prev, firstName: "" }));
                }}
                error={!!fieldErrors.firstName}
                helperText={fieldErrors.firstName}
              />
            </Grid>
           )}

             {/* Last Name */}
          {fieldConfig["Last Name"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }}>
              <TextField
                label={fieldConfig["Last Name"]?.label || "Last Name"}
                fullWidth
                size="small"
                value={form.lastName || ""}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, lastName: onlyText })
                }}
              />
            </Grid>
          )}
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
           {/* Title / Qualification – hcpDiv2 */}
          {fieldConfig["Title/Qualification"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Title/Qualification"]?.label || "Title / Qualification"}
                fullWidth size="small"
                value={form.titleQualification}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, titleQualification: onlyText })
                }}
              />
            </Grid>
          )}
          </Grid> }

     
          {/* Mobile */}
          <Grid container spacing={2} alignItems="center">
          {fieldConfig["Mobile"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Mobile"]?.label || "Mobile"}
                fullWidth
                size="small"
                value={form.mobile || ""}
                onChange={handleMobileChange}          // ← updated
                inputProps={{ maxLength: 10 }} 
                sx={{height:'3rem'}}         // ← limit to 10 digits
                error={!!fieldErrors.mobile}
                helperText={fieldErrors.mobile}         // ← shows error below field
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
                  onChange={handleSendSmsChange}        // ← updated
                >
                  <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}

          {/* Email */}
          {fieldConfig["Email"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Email"]?.label || "Email"}
                fullWidth
                size="small"
                value={form.email || ""}
                sx={{height:'3rem'}}
                onChange={handleEmailChange}            // ← updated
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}          // ← shows error below field
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
                  onChange={handleSendEmailChange}      // ← updated
                >
                  <FormControlLabel value="1" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="0" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}
          </Grid>
          <Grid container spacing={2} alignItems="center">
          {/* Potentiality Class */}
          {fieldConfig["Potentiality Class"]?.show && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Potentiality Class"]?.label || "Potentiality Class"}
                value={form.potentiality || "1"}
                onChange={(e) => {
                  setForm({ ...form, potentiality: String(e.target.value) })
                  setFieldErrors((prev) => ({ ...prev, potentiality: "" }));
                }}
                options={potentialityOptions}
                valueKey="id"
                labelKey="cat_type"
                required={true}
                error={!!fieldErrors.potentiality}
                helperText={fieldErrors.potentiality}
              />
            </Grid>
          )}

          {/* Key Opinion Leader – hcpDiv2 */}
          {fieldConfig["Key Opinion Leader"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <CommonAppSelect
                label={fieldConfig["Key Opinion Leader"].label || "Key Opinion Leader"}
                value={form.keyOpinionLeader || "0"}
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
                value={form.loyalty || 1}
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
                value={form.frequency || "48"}
                onChange={(e) =>
                  setForm({ ...form, frequency: String(e.target.value) })
                }
                options={frequencyOptions}
                valueKey="no_freq_visit"
                labelKey="freq_name"
                required={true}
              />
            </Grid>
          )}

           {/* Region */}
          {fieldConfig["Region"]?.show && !isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }} sx={{height:'3rem'}}>
              <CommonAppSelect
                label={fieldConfig["Region"]?.label || "Region"}
                value={form.region || "0"}
                onChange={(e) => handleRegionChange(String(e.target.value))}
                options={regionOptions}
                valueKey="id"
                labelKey="reg_name"
                required={true}
                error={!!fieldErrors.region}
                helperText={fieldErrors.region}
              />
              {fieldErrors.region && (
                <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>{fieldErrors.region}</Typography>
              )}
            </Grid>
          )}

        
          {/* Remarks */}
          {fieldConfig["Remarks"]?.show && !isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Remarks"]?.label || "Remarks"}
                fullWidth size="small" multiline rows={2}
                value={form.remarks || ""}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, remarks: onlyText })
                }}
              />
            </Grid>
          )}
          </Grid>

          <Grid container spacing={2} alignItems="center">
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
          {fieldConfig["Region"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3, lg: 3 }} sx={{height:'3rem'}}>
              <CommonAppSelect
                label={fieldConfig["Region"]?.label || "Region"}
                value={form.region || "0"}
                onChange={(e) => handleRegionChange(String(e.target.value))}
                options={regionOptions}
                valueKey="id"
                labelKey="reg_name"
                required={true}
                error={!!fieldErrors.region}
                helperText={fieldErrors.region}
              />
              {fieldErrors.region && (
                <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>{fieldErrors.region}</Typography>
              )}
            </Grid>
          )}

          {/* Remarks */}
          {fieldConfig["Remarks"]?.show && isHcpField && (
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label={fieldConfig["Remarks"]?.label || "Remarks"}
                fullWidth size="small" multiline rows={2}
                value={form.remarks || ""}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "")
                  setForm({ ...form, remarks: onlyText })
                }}
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

        
         </Box>
       {/*------------  Competitor Mapping ------------------------ */}
       <CompetitorMappping
            brandData={brandData}
            setBrandData={setBrandData}
            cusId={decodedID || 0}   
            tempId={0}     
            competitorRows={competitorRows}         
            onOpenCompModal={(brand) => {
              setSelectedBrand(brand);   // track which brand was clicked
              setCompModalOpen(true);
            }}
          />
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
        fieldErrors={fieldErrors}
        handleClinicContactNoChange={handleClinicContactNoChange}
        handleClinicContactNoBlur={handleClinicContactNoBlur}
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

      {/* ---------------- Add / Update Confirmation Dialog ------------------------- */}
      <ConfirmationDialog
        open={confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        loading={submitting}
        confirmColor={confirm.confirmColor}
      />

      <AddCompetitor
  selectedBrand={selectedBrand}
  compModalOpen={compModalOpen}
  setCompModalOpen={setCompModalOpen}
  cusId={decodedID || 0}
  tempId={0}
  existingRows={competitorRows.filter(r => r.subcat_id === selectedBrand?.subCatId)}
  onSave={async (saveData) => {
    const editedRows = saveData.rows;
    console.log("Edited rows from Add Competitor:", editedRows);
    if (!decodedID || decodedID === "0") {
    const rowsWithSubcat = editedRows.map(r => ({
      ...r,
      subcat_id: selectedBrand?.subCatId || 0,
    }));

    setCompetitorRows(prev => {
      const filtered = prev.filter(r => r.subcat_id !== selectedBrand?.subCatId);
      return [...filtered, ...rowsWithSubcat];
    });

    setBrandData(prev => prev.map(b =>
      b.subCatId === selectedBrand?.subCatId
        ? { ...b, compCount: rowsWithSubcat.length }
        : b
    ));
    return;
  }
    
    try {
      // ✅ Fetch data for ALL brands/subcategories
      const allBrandRequests = brandData.map(brand => 
        api.post("/getCompModal", {
          subcat_id: brand.subCatId,
          cus_id: decodedID || 0,
          temp_id: 0,
        })
      );
      
      const allBrandResponses = await Promise.all(allBrandRequests);
      
      // ✅ Combine all existing data from all brands
      let allExistingRows = [];
      
      allBrandResponses.forEach((res, index) => {
        const brand = brandData[index];
        const backendProducts = res.data.data?.products || [];
        
        const rowsForThisBrand = backendProducts
          .filter(p => {
            // Only keep rows that have data
            return (
              Number(p.prod_qty) > 0 ||
              Number(p.comp_id_1) > 0 ||
              Number(p.comp_id_2) > 0 ||
              Number(p.comp_id_3) > 0 ||
              Number(p.oth_qty) > 0 ||
              (p.other_name && p.other_name.trim() !== '')
            );
          })
          .map(p => ({
            pid: p.pid,
            subcat_id: brand.subCatId,
            prod_qty: p.prod_qty || 0,
            comp_id_1: p.comp_id_1 ? String(p.comp_id_1) : "0",
            comp_id_1_qty: p.comp_id_1_qty || 0,
            comp_id_2: p.comp_id_2 ? String(p.comp_id_2) : "0",
            comp_id_2_qty: p.comp_id_2_qty || 0,
            comp_id_3: p.comp_id_3 ? String(p.comp_id_3) : "0",
            comp_id_3_qty: p.comp_id_3_qty || 0,
            other_name: p.other_name || "",
            oth_qty: p.oth_qty || 0,
          }));
        
        allExistingRows = [...allExistingRows, ...rowsForThisBrand];
      });
      
      console.log("All existing rows from all brands:", allExistingRows);
      
      // ✅ Get existing rows for the current brand only
      const existingForThisBrand = allExistingRows.filter(
        r => r.subcat_id === selectedBrand?.subCatId
      );
      
      // ✅ Merge: update edited rows, keep untouched ones
      const mergedRows = existingForThisBrand.map(existingRow => {
        const editedRow = editedRows.find(e => e.pid === existingRow.pid);
        if (editedRow) {
          // This product was edited, use new data
          return { ...editedRow, subcat_id: selectedBrand?.subCatId || 0 };
        }
        // This product wasn't touched, keep existing
        return existingRow;
      });
      
      // ✅ Add any completely new products (not in existing)
      editedRows.forEach(editedRow => {
        if (!existingForThisBrand.find(e => e.pid === editedRow.pid)) {
          mergedRows.push({ ...editedRow, subcat_id: selectedBrand?.subCatId || 0 });
        }
      });
      
      console.log("Merged rows for current brand:", mergedRows);
      
      // ✅ Update state: keep other brands' data, update current brand
      setCompetitorRows(prev => {
        const otherBrands = allExistingRows.filter(
          r => r.subcat_id !== selectedBrand?.subCatId
        );
        return [...otherBrands, ...mergedRows];
      });
      
      setBrandData(prev => prev.map(b =>
        b.subCatId === selectedBrand?.subCatId
          ? { ...b, compCount: mergedRows.length }
          : b
      ));
      
    } catch (err) {
      console.error("Error fetching existing competitor data:", err);
      // Fallback: just use edited rows
      const rowsWithSubcat = editedRows.map(r => ({
        ...r,
        subcat_id: selectedBrand?.subCatId || 0,
      }));
      
      setCompetitorRows(prev => {
        const filtered = prev.filter(r => r.subcat_id !== selectedBrand?.subCatId);
        return [...filtered, ...rowsWithSubcat];
      });
      
      setBrandData(prev => prev.map(b =>
        b.subCatId === selectedBrand?.subCatId
          ? { ...b, compCount: editedRows.length }
          : b
      ));
    }
  }}
/>
    </Layout>
  );
}

export default CreateCustomer;