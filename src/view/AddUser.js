import React, { useEffect, useState } from "react";
import Layout from "../layout";
import axios from "../services/api";
import {
  Grid,
  Box,
  Typography,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Checkbox,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import "../assets/styles/createNewUser.css";
import CommonAppSelect from "../utils/CommonAppSelect";
import profile from "../assets/images/profile.jpg";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { jwtDecode } from 'jwt-decode'
import ConfirmationDialog from "../utils/confirmDialog";
import { getMasterPanel } from "../services/masterPanelService";

function AddUser() {
  const navigate = useNavigate();
  const { userMainId } = useParams();
  let id = null;
  try {
    if (userMainId) id = Number(atob(userMainId));
  } catch (err) {
    console.error(err);
    id = null;
  }
  const [businessUnits, setBusinessUnits] = useState([]); // options
  const [selectedBU, setSelectedBU] = useState([]); // selected
  const [userTypes, setUserTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [titles, setTitles] = useState([]);

  const [selectedType, setSelectedType] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDesig, setSelectedDesig] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfJoin, setDateOfJoin] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [hq, setHQ] = useState("");
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState("");

  const [reportToUsers, setReportToUsers] = useState([]);
  const [selectedReportTo, setSelectedReportTo] = useState("");

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [webAccess, setWebAccess] = useState("yes");
  const [appAccess, setAppAccess] = useState("yes");
  const [previewImage, setPreviewImage] = useState(profile);
  const [fileName, setFileName] = useState("");

  const [appConfigStatus, setAppConfigStatus] = useState(0);
  const [lastWebLogin, setLastWebLogin] = useState("");
  const [lastAppLogin, setLastAppLogin] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [otp, setOtp] = useState("");

  const [delFlag, setDelFlag] = useState(0);
  const [accStatus, setAccStatus] = useState(0);
  const [relievingDate, setRelievingDate] = useState("");
  const [deactivateType, setDeactivateType] = useState("0");
  const [deactivateRemarks, setDeactivateRemarks] = useState("");
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);

  const [useMobile, setUseMobile] = useState(false);
  const [useEmail, setUseEmail] = useState(false);
  const [userIdStat, setUserIdStat] = useState("");

  const [employeeType, setEmployeeType] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("");
  const [empTypes, setEmpTypes] = useState([]);
  const [empStatusList, setEmpStatusList] = useState([]);
  const [grossSalary, setGrossSalary] = useState("");

  const [otherRef, setOtherRef] = useState("");

  const [mngType, setMngType] = useState(0);

  const [showZone, setShowZone] = useState(false);
  const [showRegion, setShowRegion] = useState(false);
  const [showArea, setShowArea] = useState(false);
  const [showTerritory, setShowTerritory] = useState(false);
  const [showBeat, setShowBeat] = useState(false);

  const [zones, setZones] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [beats, setBeats] = useState([]);

  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedTerritories, setSelectedTerritories] = useState([]);
  const [selectedBeats, setSelectedBeats] = useState([]);

  const [planSubCutoff, setPlanSubCutoff] = useState("0");
  const [psDay, setPsDay] = useState("");

  const [planApproval, setPlanApproval] = useState("0");

  const [repSubCutoff, setRepSubCutoff] = useState("0");
  const [weekend, setWeekend] = useState("");
  const [rsDay, setRsDay] = useState("");

  const [reportType, setReportType] = useState("0");
  const [dataMode, setDataMode] = useState("0");
  const [locationTracking, setLocationTracking] = useState("0");
  const [selfie, setSelfie] = useState("0");
  const [attendance, setAttendance] = useState("0");

  const [weeklyOff, setWeeklyOff] = useState([1]);
  const [weekDays, setWeekDays] = useState([]);
  const [flag, setFlag] = useState(0)
  const [oldProfileImage, setOldProfileImage] = useState("")
  const [existingPass, setExistingPass] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [modifyLoading, setModifyLoading] = useState(false);

  const showPlanDay = ["3", "4"].includes(planSubCutoff);
  const showWeekend = repSubCutoff === "3";
  const showRsDay = repSubCutoff === "5";

  const [masterPanel, setMasterPanel] = useState({});

  // labels derived from masterPanel with fallbacks
  const userLabel = masterPanel["USER"] || "Users";
  const departmentLabel = masterPanel["DEPT"] || "Department";
  const zonelabel = masterPanel["ZONE"] || "Zone";
  const regLabel = masterPanel["REGN"] || "Region";
  const areaLabel = masterPanel["AREA"] || "Area";
  const territoryLabel = masterPanel["TERR"] || "Territory";
  const desigLabel = masterPanel["DESI"] || "Designation";

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const emailRegex = /^[^\s@A-Z]+@[^\s@A-Z]+\.[^\s@A-Z]+$/;

  const [errors, setErrors] = useState({});
  const [duplicateErrors, setDuplicateErrors] = useState({});

  const getBusinessUnit = async () => {
    const res = await axios.post("/bussUint");
    if (res.data.status === 200) setBusinessUnits(res.data.data);
  };

  const getUserTypes = async () => {
    const res = await axios.post("/getUserTypeMas");
    if (res.data.status === 200) setUserTypes(res.data.data);
  };

  const getUserDropdown = async () => {
    try {
      const deptRes = await axios.post("/dept");
      const desigRes = await axios.post("/designation");
      const titleRes = await axios.post("/getTitle");

      setDepartments(deptRes.data.data || []);
      setDesignations(desigRes.data.data || []);
      setTitles(titleRes.data.data || []);
    } catch (err) {
      console.error("API ERROR:", err.response?.data || err.message);
    }
  };

  const getZoneMas = async () => {
    const res = await axios.post("/getZoneMasData");
    if (res.data.status === 200) {
      setZones(res.data.data || []);
    }
  };

  const getReportToUsers = async (typeId) => {
    try {
      const res = await axios.post("/get_repo_to_user", {
        usrtyp: String(typeId),
      });

      if (res.data.status === 200) {
        const formatted = (res.data.data || []).map((item) => ({
          ...item,
          full_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
        }));

        setReportToUsers(formatted);
      }
      else {
        setReportToUsers([])
      }
    }
    catch (err) {
      console.log("fetching get to user err", err)
    }
  };

  const getEmpDropdowns = async () => {
    const typeRes = await axios.post("/getEmpType");
    const statusRes = await axios.post("/getEmpStatus");

    if (typeRes.data.status === 200) setEmpTypes(typeRes.data.data || []);
    if (statusRes.data.status === 200)
      setEmpStatusList(statusRes.data.data || []);
  };

  const getWeekDays = async () => {
    try {
      const res = await axios.post("/getWeekendMas");

      if (res.data.status === 200) {
        setWeekDays(res.data.data || []);
      }
    } catch (err) {
      console.error("WeekDays API error:", err);
    }
  };

  const getUserDetails = async () => {
    try {
      const res = await axios.post("/getUserData", { id: id });
      if (res.data.status === 200 && res.data.data?.length > 0) {
        const d = res.data.data[0];

        // Primary fields
        // setSelectedType(d.user_type || "");
        setSelectedBU(d.b_unit ? d.b_unit.split(",") : []);
        handleUserTypeChange({
          target: { value: d.user_type },
        });
        setSelectedDept(d.dep_id || "");
        setSelectedDesig(d.desig_id || "");
        setSelectedTitle(d.user_sal || "");

        setEmployeeCode(d.emp_code || "");
        setFullName(d.first_name || "");
        setLastName(d.last_name || "");
        setMobileNum(d.mob_no || "");
        setEmail(d.email_id || "");
        setAddress(d.user_addr || "");

        setOtherRef(d.user_ref || "")
        setDateOfJoin(
          d.emp_doj && d.emp_doj !== "1900-01-01T00:00:00.000Z"
            ? d.emp_doj.split("T")[0]
            : "",
        );

        setHQ(d.hq_name || "");
        setSelectedReportType(d.rep_to_type || "");
        setSelectedReportTo(d.repto_user_id || "");

        setEmployeeType(d.emp_type_id || "");
        setEmployeeStatus(d.emp_stat_id || "");
        setGrossSalary(d.sal_amt !== null && d.sal_amt !== undefined ? d.sal_amt : "");

        if (d.user_id_stat === 1) {
          setUseMobile(true);
          setUseEmail(false);
          setUserIdStat(1);
        } else {
          setUseMobile(false);
          setUseEmail(true);
          setUserIdStat(0);
        }

        // if (d.zone_id) {
        //   const zones = d.zone_id.split(",").map((z) => z.trim());
        //   setSelectedRegions(zones);
        // }
        setSelectedZones(d.zone_id?.split(",") || []);
        setSelectedRegions(d.reg_id?.split(",") || []);
        setSelectedAreas(d.area_id?.split(",") || []);
        setSelectedTerritories(d.ter_id?.split(",") || []);
        setSelectedBeats(d.beat_id?.split(",") || []);

        // Login details
        setUserId(d.user_name || "");
        setPassword("");
        setConfirmPassword("");

        // Access flags
        setWebAccess(d.web_acc_stat === 0 ? "yes" : "no");
        setAppAccess(d.app_acc_stat === 0 ? "yes" : "no");

        // setWebAccess(String(d.web_acc_stat));
        // setAppAccess(String(d.app_acc_stat));

        if (d.image_upl) {
          setPreviewImage(`${process.env.REACT_APP_PROFILE_URL}/${d.image_upl}`);
          setOldProfileImage(d.image_upl)
        }

        // if (d.rep_to_type) {
        //   await getReportToUsers(d.rep_to_type);
        //   setSelectedReportTo(d.reporting_to || "");
        // }

        setAppConfigStatus(d.app_config_stat || 0);
        setLastWebLogin(d.last_login || "");
        setLastAppLogin(d.last_app_login || "");
        setAppVersion(d.app_version || "");
        setAuthKey(d.auth_key || "");
        setOtp(d.otp || "");

        setAppConfigStatus(d.app_stat || 0);
        setDelFlag(d.del_flag || 0);
        setAccStatus(d.acc_stat || 0);
        setDeactivateType(String(d.deact_type || "0"));
        setDeactivateRemarks(d.deact_rem || "");
        setExistingPass(d.user_pass || null)
        setFlag(d.id > 0 ? 1 : 0)

        // Handle relieving date - filter out invalid default dates
        const relievingDateStr = d.emp_reliev_dt ? d.emp_reliev_dt.split("T")[0] : "";
        const invalidDates = ['1900-01-01', '1970-01-01', '0000-00-00', '1899-12-31'];
        setRelievingDate(
          relievingDateStr && !invalidDates.includes(relievingDateStr)
            ? relievingDateStr
            : ""
        );

        const dobStr = d.emp_dob ? d.emp_dob.split("T")[0] : "";
        setDateOfBirth(
          dobStr && !invalidDates.includes(dobStr)
            ? dobStr
            : ""
        );

        if (d.zone_id) {
          const zoneIds = d.zone_id.split(",");
          setSelectedZones(zoneIds);
          const regRes = await axios.post("/getRegion", { zone: zoneIds });
          const regData = regRes.data.data || [];
          setRegions(regData);

          const regs = d.reg_id?.split(",") || [];
          setSelectedRegions(regs);

          if (regs.length) {
            const areaRes = await axios.post("/getAreaData", { reg: regs });
            const areaData = areaRes.data.data || [];
            setAreas(areaData);

            const areas = d.area_id?.split(",") || [];
            setSelectedAreas(areas);

            if (areas.length) {
              const terRes = await axios.post("/getTerritory", { area: areas });
              const terData = terRes.data.data || [];
              setTerritories(terData);

              const ters = d.ter_id?.split(",") || [];
              setSelectedTerritories(ters);

              if (ters.length) {
                const beatRes = await axios.post("/getBeat", { ter: ters });
                setBeats(beatRes.data.data || []);
                setSelectedBeats(d.beat_id?.split(",") || []);
              }
            }
          }
        }
        setPlanSubCutoff(String(d.plan_rule_id || "0"));
        setPsDay(d.plan_rule_day || "");

        setRepSubCutoff(String(d.report_rule_id || "0"));
        setWeekend(d.report_rule_day || ""); // if needed
        setRsDay(d.report_rule_lag || "");

        setReportType(String(d.rep_type || "0"));
        setDataMode(String(d.data_mode || "0"));
        setLocationTracking(String(d.loc_stat || "0"));
        setSelfie(String(d.selfi_stat || "0"));
        setAttendance(String(d.att_stat || "0"));

        setWeeklyOff(d.weekly_off ? d.weekly_off.split(",") : []);
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  useEffect(() => {
    getBusinessUnit();
    getUserTypes();
    getUserDropdown();
    getZoneMas();
    getEmpDropdowns();
    getWeekDays();
    if (id > 0) {
      getUserDetails();
    }
  }, []);

  useEffect(() => {
    if (selectedReportType) {
      getReportToUsers(selectedReportType);
    }
  }, [selectedReportType]);

  useEffect(() => {
    const token = localStorage.getItem("session-token");
    if (token) {
      try {
        let decoded = jwtDecode(token)
        setSessionId(decoded.user_id)
        console.log("decoded user id", decoded.user_id)
      } catch (err) {
        console.log(err)
      }
    }
  }, [])


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

  const showLogoutConfirmation = (row) => {
    showConfirmationDialog({
      title: "Confirmation",
      message: `Are you sure you want ${fullName} ${lastName} to LOGOUT from app?`,
      confirmText: "OK",
      cancelText: "Close",
      confirmColor: "primary",
      onConfirm: () => handleAppLogout(),
    });
  };

  const checkPasswordValidation = (value) => {
    const isWhitespace = /^(?=.*\s)/;
    if (isWhitespace.test(value)) {
      return "Password must not contain Whitespaces.";
    }

    const isContainsUppercase = /^(?=.*[A-Z])/;
    if (!isContainsUppercase.test(value)) {
      return "Password must have at least one Uppercase Character.";
    }

    const isContainsLowercase = /^(?=.*[a-z])/;
    if (!isContainsLowercase.test(value)) {
      return "Password must have at least one Lowercase Character.";
    }

    const isContainsNumber = /^(?=.*[0-9])/;
    if (!isContainsNumber.test(value)) {
      return "Password must contain at least one Digit.";
    }

    const isContainsSymbol = /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹])/;
    if (!isContainsSymbol.test(value)) {
      return "Password must contain at least one Special Symbol.";
    }

    const isValidLength = /^.{6,16}$/;
    if (!isValidLength.test(value)) {
      return "Password must be 6-16 Characters Long.";
    }

    return 1;
  };

  const validate = () => {
    let temp = {};
    if (!selectedType) temp.selectedType = `Please select ${userLabel} type`;
    if (!selectedDept) temp.selectedDept = `Please select ${departmentLabel}`;
    if (!selectedDesig) temp.selectedDesig = `Please select ${desigLabel}`;
    if (!selectedTitle) temp.selectedTitle = "Please select title";
    if (!employeeCode.trim()) temp.employeeCode = "Employee Code is required";
    if (!fullName.trim()) temp.fullName = "First Name is required";
    if (!userId.trim()) temp.userId = "Please Select Mobile No. OR Email ID for username!";
    if (!String(mobileNum).trim()) temp.mobileNum = "Mobile number is required";
    if (String(mobileNum).trim() !== "" && String(mobileNum).trim().length < 10) temp.mobileNum = "Please Enter Valid 10 digit mobile number"
    if (!email.trim()) temp.email = "Email is required";
    if (email.trim() !== "" && !emailRegex.test(email.trim())) temp.email = "Please Enter a valid Email"
    if (!address.trim()) temp.address = "Address is required";
    if (!hq.trim()) temp.hq = "Please Enter HQ";
    if (!dateOfBirth) temp.dateOfBirth = "Date of Birth is required";
    if (!dateOfJoin) temp.dateOfJoin = "Date of Joining is required";
    if (
      ["13", "14", "15", "16"].includes(String(selectedType)) &&
      selectedRegions.length === 0
    ) {
      temp.region = `Please Select ${regLabel}`;
    }
    if (!selectedReportType) temp.reportType = "Please Select Reporting Type";
    if (!selectedReportTo) temp.reportTo = "Please Select Reporting To User";
    if (!employeeType) temp.employeeType = "Select Employee Type";
    if (!employeeStatus) temp.employeeStatus = "Select Employee Status";
    if (!selectedBU || selectedBU.length === 0) temp.selectBUnit = "Please select Business Unit"
    if (grossSalary && (isNaN(Number(grossSalary)) || Number(grossSalary) < 0)) {
      temp.grossSalary = "Enter valid Gross Salary";
    }

    if (Number(selectedType) > 4) {
      if (mngType === 1 && showZone && selectedZones.length === 0) {
        temp.zone = `Select ${zonelabel}`;
      }

      if (mngType === 2) {
        if (showZone && selectedZones.length === 0) temp.zone = `Select ${zonelabel}`;
        if (showRegion && selectedRegions.length === 0) temp.region = `Select ${regLabel}`;
      }

      if (mngType === 3) {
        if (showZone && selectedZones.length === 0) temp.zone = `Select ${zonelabel}`;
        if (showRegion && selectedRegions.length === 0) temp.region = `Select ${regLabel}`;
        if (showArea && selectedAreas.length === 0) temp.area = `Select ${areaLabel}`;
      }

      if (mngType === 4) {
        if (showZone && selectedZones.length === 0) temp.zone = `Select ${zonelabel}`;
        if (showRegion && selectedRegions.length === 0) temp.region = `Select ${regLabel}`;
        if (showArea && selectedAreas.length === 0) temp.area = `Select ${areaLabel}`;
        if (showTerritory && selectedTerritories.length === 0) temp.territory = `Select ${territoryLabel}`;
      }

      if (mngType === 0) {
        if (showZone && selectedZones.length === 0) temp.zone = `Select ${zonelabel}`;
        if (showRegion && selectedRegions.length === 0) temp.region =`Select ${regLabel}`;
        if (showArea && selectedAreas.length === 0) temp.area = `Select ${areaLabel}`;
        if (showTerritory && selectedTerritories.length === 0) temp.territory = `Select ${territoryLabel}`;
        if (showBeat && selectedBeats.length === 0) temp.beat = "Select Beat";
      }
    }

    if (!id) {
      if (!password.trim()) {
        temp.password = "Password is required";
      } else {
        const pwdCheck = checkPasswordValidation(password);
        if (pwdCheck !== 1) temp.password = pwdCheck;
      }
      if (!confirmPassword.trim()) {
        temp.confirmPassword = "Confirm Password is required";
      } else if (password !== confirmPassword) {
        temp.confirmPassword = "Password & Confirm Password does not match";
      }
    }
    // UPDATE USER
    if (id && (password || confirmPassword)) {
      if (!password || !confirmPassword) {
        temp.confirmPassword = "Both password fields are required";
      } else if (password !== confirmPassword) {
        temp.confirmPassword = "Password & Confirm Password does not Match";
      } else {
        const pwdCheck = checkPasswordValidation(password);
        if (pwdCheck !== 1) {
          temp.password = pwdCheck;
        }
      }
    }
    console.log("validation failures", temp)
    setErrors(temp);

    const duplicateKeys = ['email', 'mobileNum', 'employeeCode'];
    const hasDuplicateError = duplicateKeys.some(key => duplicateErrors[key]);

    return Object.keys(temp).length === 0 && !hasDuplicateError;
  };

  //   if (!useMobile && !useEmail) {
  //     temp.userId = "Select Mobile OR Email for Username";
  //   }

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const formData = new FormData();

      // Helper to get name by id from an options array
      const getNames = (selectedIds, options, valueKey, labelKey) => {
        if (!selectedIds || selectedIds.length === 0) return "";
        return selectedIds
          .map((id) => {
            const found = options.find((o) => String(o[valueKey]) === String(id));
            return found ? found[labelKey] : "";
          })
          .join(",");
      };

      formData.append("user_id", id || 0);
      formData.append("user_type", selectedType);
      formData.append("dept_id", selectedDept);
      formData.append("design_id", selectedDesig);
      formData.append("title_id", selectedTitle);
      formData.append("emp_code", employeeCode.trim());
      formData.append("first_name", fullName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("mobile", mobileNum);
      formData.append("email_id", email);
      formData.append("dob", dateOfBirth);
      formData.append("doj", dateOfJoin);
      formData.append("address", address);
      formData.append("user_id_stat", userIdStat);
      formData.append("emp_type", employeeType);
      formData.append("emp_stat", employeeStatus);
      formData.append("gross_salary", grossSalary || 0);
      formData.append("other_ref", otherRef);
      formData.append("hq", hq.trim());

      // Business Unit IDs + Names
      formData.append("buUnit", selectedBU.join(","));
      formData.append("buUnitName", getNames(selectedBU, businessUnits, "id", "brand_name"));

      if (Number(selectedType) > 4) {
        if (mngType === 1) {
          formData.append("zone_id", selectedZones.join(","));
          formData.append("zone_name", getNames(selectedZones, zones, "id", "zone_name"));
          formData.append("reg_id", 0);
          formData.append("reg_Name", "");
          formData.append("area_id", 0);
          formData.append("area_name", "");
          formData.append("ter_id", 0);
          formData.append("ter_name", "");
          formData.append("beat_id", 0);
          formData.append("beat_name", "");
        } else if (mngType === 2) {
          formData.append("zone_id", selectedZones.join(","));
          formData.append("zone_name", getNames(selectedZones, zones, "id", "zone_name"));
          formData.append("reg_id", selectedRegions.join(","));
          formData.append("reg_Name", getNames(selectedRegions, regions, "id", "reg_name"));
          formData.append("area_id", 0);
          formData.append("area_name", "");
          formData.append("ter_id", 0);
          formData.append("ter_name", "");
          formData.append("beat_id", 0);
          formData.append("beat_name", "");
        } else if (mngType === 3) {
          formData.append("zone_id", selectedZones.join(","));
          formData.append("zone_name", getNames(selectedZones, zones, "id", "zone_name"));
          formData.append("reg_id", selectedRegions.join(","));
          formData.append("reg_Name", getNames(selectedRegions, regions, "id", "reg_name"));
          formData.append("area_id", selectedAreas.join(","));
          formData.append("area_name", getNames(selectedAreas, areas, "id", "area_name"));
          formData.append("ter_id", 0);
          formData.append("ter_name", "");
          formData.append("beat_id", 0);
          formData.append("beat_name", "");
        } else if (mngType === 4) {
          formData.append("zone_id", selectedZones.join(","));
          formData.append("zone_name", getNames(selectedZones, zones, "id", "zone_name"));
          formData.append("reg_id", selectedRegions.join(","));
          formData.append("reg_Name", getNames(selectedRegions, regions, "id", "reg_name"));
          formData.append("area_id", selectedAreas.join(","));
          formData.append("area_name", getNames(selectedAreas, areas, "id", "area_name"));
          formData.append("ter_id", selectedTerritories.join(","));
          formData.append("ter_name", getNames(selectedTerritories, territories, "id", "ter_name"));
          formData.append("beat_id", 0);
          formData.append("beat_name", "");
        } else if (mngType === 0) {
          formData.append("zone_id", selectedZones.join(","));
          formData.append("zone_name", getNames(selectedZones, zones, "id", "zone_name"));
          formData.append("reg_id", selectedRegions.join(","));
          formData.append("reg_Name", getNames(selectedRegions, regions, "id", "reg_name"));
          formData.append("area_id", selectedAreas.join(","));
          formData.append("area_name", getNames(selectedAreas, areas, "id", "area_name"));
          formData.append("ter_id", selectedTerritories.join(","));
          formData.append("ter_name", getNames(selectedTerritories, territories, "id", "ter_name"));
          formData.append("beat_id", selectedBeats.join(","));
          formData.append("beat_name", getNames(selectedBeats, beats, "id", "beat_name"));
        }
      } else {
        formData.append("zone_id", 0);
        formData.append("zone_name", "");
        formData.append("reg_id", 0);
        formData.append("reg_Name", "");
        formData.append("area_id", 0);
        formData.append("area_name", "");
        formData.append("ter_id", 0);
        formData.append("ter_name", "");
        formData.append("beat_id", 0);
        formData.append("beat_name", "");
      }

      formData.append("report_type", selectedReportType);
      formData.append("report_user_id", selectedReportTo);
      formData.append("user_name", userId);
      formData.append("password", password || existingPass);
      formData.append("conf_password", confirmPassword);
      formData.append("web_access", webAccess === "yes" ? 0 : 1);
      formData.append("app_access", appAccess === "yes" ? 0 : 1);
      formData.append("plan_sub_cutoff", planSubCutoff);
      formData.append("ps_day", psDay);
      formData.append("plan_approval", planApproval);
      formData.append("rep_sub_cutoff", repSubCutoff);
      formData.append("weekend", weekend);
      formData.append("rs_day", rsDay || 0);
      formData.append("data_mode", dataMode);
      formData.append("location_tracking", locationTracking);
      formData.append("selfie", selfie);
      formData.append("attendance", attendance);

      formData.append("weekly_off", weeklyOff.join(","));
      formData.append("dor", relievingDate);
      formData.append("deact_type", deactivateType);
      formData.append("deactRemarks", deactivateRemarks);
      formData.append("flag", flag);
      formData.append("rep_type", reportType)
      formData.append("desig_name", getNames([selectedDesig], designations, "id", "desig_name"))
      formData.append("oldStat", accStatus)

      if (selectedFile) {
        formData.append("profileImg_file", selectedFile);
      }
      else {
        formData.append("hdprofileImg", oldProfileImage)
      }

      /* ===== DEBUG (remove later) ===== */
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      // return;


      const res = await axios.post("/AddNewUser", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status === 200) {
        setToast({
          open: true,
          message: res.data.message,
          severity: "success",
        });

        setTimeout(() => {
          navigate(-1);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateDeactivation = () => {
    let temp = {};

    if (!relievingDate) temp.relievingDate = "Date of Relieving is required";
    if (!deactivateType || deactivateType === "0")
      temp.deactivateType = "Please select deactivation type";
    if (!deactivateRemarks.trim())
      temp.deactivateRemarks = "Remarks are required";

    setErrors((prev) => ({ ...prev, ...temp }));

    return Object.keys(temp).length === 0;
  };

  const handleDeactivateClick = () => {
    if (!validateDeactivation()) return;
    setOpenDeactivateDialog(true);
  };

  const handleConfirmDeactivate = async () => {
    const payload = {
      user_id: id,
      dor: relievingDate,
      deact_type: deactivateType,
      deactRemarks: deactivateRemarks,
    };

    try {
      const res = await axios.post("/userDeactivate", payload);

      if (res.data.status === 200) {
        setToast({
          open: true,
          message: res.data.message,
          severity: "success",
        });
        setOpenDeactivateDialog(false);
        navigate(-1);
      } else {
        setToast({
          open: true,
          message: res.data.message || "Failed to deactivate user",
          severity: "error",
        });
      }
    } catch (err) {
      setToast({
        open: true,
        message: "Server error while deactivating user",
        severity: "error",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. File size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({
        open: true,
        message: "File size must be under 2MB",
        severity: "error",
      });
      e.target.value = '';
      return;
    }

    // 2. Extension check
    const allowed = /jpeg|jpg|gif|jpe|png/;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.test(ext)) {
      setToast({
        open: true,
        message: "Only jpg, jpeg, png, gif files are allowed",
        severity: "error",
      });
      e.target.value = '';
      return;
    }

    // 3. MIME type check
    if (!allowed.test(file.type)) {
      setToast({
        open: true,
        message: "Only jpg, jpeg, png, gif file types are allowed",
        severity: "error",
      });
      e.target.value = '';
      return;
    }

    // 4. Safe filename check (no double extensions like file.php.jpg)
    const nameParts = file.name.split('.');
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'jpe'];
    const middleParts = nameParts.slice(1, -1);
    const hasDangerousExt = middleParts.some(
      (part) => !allowedTypes.includes(part.toLowerCase())
    );
    if (hasDangerousExt) {
      setToast({
        open: true,
        message: "Invalid filename",
        severity: "error",
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMobileCheck = () => {
    setUseMobile(true);
    setUseEmail(false);
    setUserIdStat(1);
    setUserId(mobileNum);
  };

  const handleEmailCheck = () => {
    setUseEmail(true);
    setUseMobile(false);
    setUserIdStat(0);
    setUserId(email);
  };

  const handleFirstNameChange = (value) => {
    const regex = /^[a-zA-Z\s]*$/;

    if (!regex.test(value)) {
      setToast({
        open: true,
        message: "Special Characters Not Allowed",
        severity: "warning",
      });
      return;
    }

    setFullName(value);
  };

  const handleZoneChange = async (value) => {
    const val = Array.isArray(value) ? value : [value];

    setSelectedZones(val);
    setSelectedRegions([])
    setSelectedAreas([])
    setSelectedTerritories([])
    setSelectedBeats([])
    if (val.length > 0) {
      const res = await axios.post("/getRegion", {
        zone: val,
      });

      setRegions(res.data.data || []);
    } else {
      setRegions([]);
      setAreas([]);
      setTerritories([]);
      setBeats([]);
    }
  };

  const handleRegionChange = async (value) => {
    const val = Array.isArray(value) ? value : [value];
    setSelectedRegions(val);
    setSelectedAreas([])
    setSelectedTerritories([])
    setSelectedBeats([])
    if (val.length > 0) {
      const res = await axios.post("/getAreaData", {
        reg: val,
      });

      setAreas(res.data.data || []);
    } else {
      setAreas([]);
      setTerritories([]);
      setBeats([]);
    }
  };

  const checkEmailDuplicate = async (emailVal) => {
    const trimmed = emailVal.trim();

    // If empty or invalid format, let validate() handle it — don't clear/set here
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) return;

    try {
      const res = await axios.post("/checkEmailUser", { email: trimmed, id: id || null });
      if (res.data.status === 400) {
        setDuplicateErrors(prev => ({ ...prev, email: res.data.message }));
      } else {
        setDuplicateErrors(prev => { const e = { ...prev }; delete e.email; return e; });
      }
    } catch (err) {
      console.error("Email check failed", err);
    }
  };

  const checkMobileDuplicate = async (mobileVal) => {
    if (!mobileVal || mobileVal.length < 10) return;
    try {
      const res = await axios.post("/checkMobileNumber", { mobile: mobileVal, id: id || null });
      if (res.data.status === 400) {
        setDuplicateErrors(prev => ({ ...prev, mobileNum: res.data.message }));
      } else {
        setDuplicateErrors(prev => { const e = { ...prev }; delete e.mobileNum; return e; });
      }
    } catch (err) {
      console.error("Mobile check failed", err);
    }
  };

  const checkEmpCodeDuplicate = async (codeVal) => {
    if (!codeVal.trim()) return;
    try {
      const res = await axios.post("/checkEmpCode", { empCode: codeVal, id: id || null });
      if (res.data.status === 400) {
        setDuplicateErrors(prev => ({ ...prev, employeeCode: res.data.message }));
      } else {
        setDuplicateErrors(prev => { const e = { ...prev }; delete e.employeeCode; return e; });
      }
    } catch (err) {
      console.error("Emp code check failed", err);
    }
  };

  const handleAreaChange = async (value) => {
    const val = Array.isArray(value) ? value : [value];
    setSelectedAreas(val);
    setSelectedTerritories([])
    setSelectedBeats([])
    if (val.length > 0) {
      const res = await axios.post("/getTerritory", {
        area: val,
      });

      setTerritories(res.data.data || []);
    } else {
      setTerritories([]);
      setBeats([]);
    }
  };

  const handleTerritoryChange = async (value) => {
    const val = Array.isArray(value) ? value : [value];

    setSelectedTerritories(val);
    setSelectedBeats([])
    if (val.length > 0) {
      const res = await axios.post("/getBeat", {
        ter: val,
      });

      setBeats(res.data.data || []);
    } else {
      setBeats([]);
    }
  };

  const handleAppLogout = async () => {
    try {
      const res = await axios.post("/logoutApp", { user_id: id });
      if (res.data.success) {
        setToast({
          open: true,
          message: `${fullName} ${lastName} has been Logged Out!`,
          severity: "success",
        });
        // Refresh user details to reflect updated app_stat
        getUserDetails();
      } else {
        setToast({
          open: true,
          message: res.data.message || "Logout failed",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
      setToast({
        open: true,
        message: "Server error during logout",
        severity: "error",
      });
    }
    finally {
      closeConfirmationDialog()
    }
  };

  const handleUserTypeChange = (e) => {
    const selected = e.target.value;
    const selectedObj = userTypes.find(
      (u) => String(u.id) === String(selected),
    );
    const mng = selectedObj?.mng_type || 0;
    setSelectedType(selected);
    setMngType(mng);

    // RESET ALL VISIBILITY
    setShowZone(false);
    setShowRegion(false);
    setShowArea(false);
    setShowTerritory(false);
    setShowBeat(false);

    // ✅ CLEAR ERRORS for all territory fields when user type changes
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.selectedType;
      delete updated.zone;
      delete updated.region;
      delete updated.area;
      delete updated.territory;
      delete updated.beat;
      return updated;
    });

    // RESET SELECTED VALUES too (so stale data doesn't linger)
    setSelectedZones([]);
    setSelectedRegions([]);
    setSelectedAreas([]);
    setSelectedTerritories([]);
    setSelectedBeats([]);

    if (selected > 4) {
      if (mng === 1) {
        setShowZone(true);
      }
      if (mng === 2) {
        setShowZone(true);
        setShowRegion(true);
      }
      if (mng === 3) {
        setShowZone(true);
        setShowRegion(true);
        setShowArea(true);
      }
      if (mng === 4) {
        setShowZone(true);
        setShowRegion(true);
        setShowArea(true);
        setShowTerritory(true);
      }
      if (mng === 0) {
        if (Number(selected) === 12) {
          return;
        }
        setShowZone(true);
        setShowRegion(true);
        setShowArea(true);
        setShowTerritory(true);
        setShowBeat(true);
      }
    }
  };

  const formatDate = (val) => {
    if (!val) return "";

    let d;
    if (!isNaN(val)) {
      // number (timestamp in seconds)
      d = dayjs(val * 1000);
    } else {
      // ISO string
      d = dayjs(val);
    }

    if (d.year() === 1900) return "";

    return d.format("DD-MMM-YYYY HH:mm:ss");
  };

  console.log("Selected buieness unit", selectedBU)
  return (
    <Layout>
      <Grid container spacing={2} sx={{ padding: "8px" }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="bodyDiv">
            <Typography className="headerName">Primary Details</Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Business Unit"
                  value={selectedBU}
                  onChange={(e) => setSelectedBU(e.target.value)}
                  options={businessUnits}
                  multiple
                  valueKey="id"
                  labelKey="brand_name"
                  required={true}
                  error={Boolean(errors.selectBUnit)}
                />
                {errors.selectBUnit && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.selectBUnit}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label={`${userLabel} Type`}
                  value={selectedType}
                  //   onChange={handleUserTypeChange}
                  onChange={handleUserTypeChange}
                  options={userTypes}
                  valueKey="id"
                  labelKey="client_alias"
                  error={Boolean(errors.selectedType)}
                  required={true}
                />
                {errors.selectedType && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.selectedType}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label={departmentLabel}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  options={departments}
                  valueKey="id"
                  labelKey="dept_name"
                  error={Boolean(errors.selectedDept)}
                  required={true}
                />
                {errors.selectedDept && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.selectedDept}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label={desigLabel}
                  value={selectedDesig}
                  onChange={(e) => setSelectedDesig(e.target.value)}
                  options={designations}
                  valueKey="id"
                  labelKey="desig_name"
                  error={Boolean(errors.selectedDesig)}
                  required={true}
                />
                {errors.selectedDesig && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.selectedDesig}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Title"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                  options={titles}
                  valueKey="id"
                  labelKey="title_name"
                  error={Boolean(errors.selectedTitle)}
                  required={true}
                />
                {errors.selectedTitle && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.selectedTitle}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Employee Code"
                  fullWidth
                  size="small"
                  value={employeeCode}
                  required
                  onBlur={(e) => checkEmpCodeDuplicate(e.target.value)}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setEmployeeCode(onlyText)
                  }}
                  error={Boolean(errors.employeeCode || duplicateErrors.employeeCode)}
                  helperText={errors.employeeCode || duplicateErrors.employeeCode}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  value={fullName}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    handleFirstNameChange(onlyText);
                  }}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setLastName(onlyText)
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox checked={useMobile} onChange={handleMobileCheck} />
                  <TextField
                    size="small"
                    label="Mobile"
                    value={mobileNum}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setMobileNum(value);
                      if (useMobile) setUserId(value);
                    }}
                    onBlur={(e) => checkMobileDuplicate(e.target.value)}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
                    fullWidth
                    error={Boolean(errors.mobileNum || duplicateErrors.mobileNum)}
                    helperText={errors.mobileNum || duplicateErrors.mobileNum}
                    required={true}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Checkbox checked={useEmail} onChange={handleEmailCheck} />
                  <TextField
                    size="small"
                    label="Email"
                    value={email}
                    onBlur={(e) => checkEmailDuplicate(e.target.value)}
                    onChange={(e) => {
                      const onlyText = e.target.value.replace(/^\s+/, "");
                      setEmail(onlyText);
                      if (useEmail) setUserId(onlyText);
                    }}
                    fullWidth
                    error={Boolean(errors.email || duplicateErrors.email)}
                    helperText={errors.email || duplicateErrors.email}
                    required={true}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date of Birth"
                    format="DD MMM YYYY"
                    maxDate={dayjs()}
                    value={dateOfBirth ? dayjs(dateOfBirth) : null}
                    onChange={(newValue) => {
                      setDateOfBirth(
                        newValue ? newValue.format("YYYY-MM-DD") : "",
                      );
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        error: Boolean(errors.dateOfBirth),
                        helperText: errors.dateOfBirth,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size="small"
                  label="Any Other Reference"
                  fullWidth
                  value={otherRef}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setOtherRef(onlyText)
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date of Joining"
                    format="DD MMM YYYY"
                    maxDate={dayjs()}
                    value={dateOfJoin ? dayjs(dateOfJoin) : null}
                    onChange={(newValue) => {
                      setDateOfJoin(
                        newValue ? newValue.format("YYYY-MM-DD") : "",
                      );
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        error: Boolean(errors.dateOfJoin),
                        helperText: errors.dateOfJoin,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Employee Type"
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                  options={empTypes}
                  valueKey="id"
                  labelKey="type"
                  error={Boolean(errors.employeeType)}
                  required={true}
                />
                {errors.employeeType && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.employeeType}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Employee Status"
                  value={employeeStatus}
                  onChange={(e) => setEmployeeStatus(e.target.value)}
                  options={empStatusList}
                  valueKey="id"
                  labelKey="emp_stat"
                  error={Boolean(errors.employeeStatus)}
                  required={true}
                />
                {errors.employeeStatus && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.employeeStatus}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Gross Salary"
                  fullWidth
                  size="small"
                  value={grossSalary}
                  onChange={(e) => {
                    // allow only numbers + optional decimal
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setGrossSalary(val);
                    }
                  }}
                  error={Boolean(errors.grossSalary)}
                  helperText={errors.grossSalary}
                  inputProps={{ inputMode: "decimal" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12 }}>
                <TextField
                  label="Address"
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  value={address}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setAddress(onlyText)
                  }}
                  error={Boolean(errors.address)}
                  helperText={errors.address}
                />
              </Grid>
            </Grid>
          </Box>

          <Box className="bodyDiv" style={{ marginTop: "10px" }}>
            <Typography className="headerName">{territoryLabel} Details</Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="HQ"
                  fullWidth
                  size="small"
                  value={hq}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setHQ(onlyText)
                  }}
                  error={Boolean(errors.hq)}
                  helperText={errors.hq}
                  required
                />
              </Grid>

              {showZone && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label={zonelabel}
                    value={selectedZones}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    options={zones}
                    multiple
                    valueKey="id"
                    labelKey="zone_name"
                    error={Boolean(errors.zone)}
                    required={true}
                  />
                  {errors.zone && (
                    <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                      {errors.zone}
                    </Typography>
                  )}
                </Grid>
              )}

              {showRegion && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label={regLabel}
                    value={selectedRegions}
                    options={regions}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    multiple
                    valueKey="id"
                    labelKey="reg_name"
                    error={Boolean(errors.region)}
                    required={true}
                  />
                  {errors.region && (
                    <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                      {errors.region}
                    </Typography>
                  )}
                </Grid>
              )}

              {showArea && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label={areaLabel}
                    value={selectedAreas}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    multiple
                    options={areas}
                    valueKey="id"
                    labelKey="area_name"
                    error={Boolean(errors.area)}
                    required={true}
                  />
                  {errors.area && (
                    <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                      {errors.area}
                    </Typography>
                  )}
                </Grid>
              )}

              {showTerritory && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label={territoryLabel}
                    value={selectedTerritories}
                    onChange={(e) => handleTerritoryChange(e.target.value)}
                    multiple
                    options={territories}
                    valueKey="id"
                    labelKey="ter_name"
                    error={Boolean(errors.territory)}
                    required={true}
                  />
                  {errors.territory && (
                    <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                      {errors.territory}
                    </Typography>
                  )}
                </Grid>
              )}
              {showBeat && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Beats Assigned"
                    value={selectedBeats}
                    onChange={(e) => setSelectedBeats(e.target.value)}
                    multiple
                    options={beats}
                    valueKey="id"
                    labelKey="beat_name"
                    error={Boolean(errors.beat)}
                    required={true}
                  />
                  {errors.beat && (
                    <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                      {errors.beat}
                    </Typography>
                  )}
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Report To Type"
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  options={userTypes.filter(type => type.id !== 2)}
                  valueKey="id"
                  labelKey="client_alias"
                  error={Boolean(errors.reportType)}
                  required={true}
                />
                {errors.reportType && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.reportType}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Reporting To"
                  value={selectedReportTo}
                  onChange={(e) => setSelectedReportTo(e.target.value)}
                  options={reportToUsers}
                  valueKey="id"
                  labelKey="full_name"
                  disabled={!selectedReportType}
                  required={true}
                  error={Boolean(errors.reportTo)}
                />
                {errors.reportTo && (
                  <Typography sx={{ color: "#d32f2f", fontSize: "9px", ml: 1 }}>
                    {errors.reportTo}
                  </Typography>
                )}
              </Grid>
            </Grid>
            {Number(flag) === 0 &&
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => {
                  if (!validate()) {
                    setToast({
                      open: true,
                      message: "Please fix all mandotory fields",
                      severity: "error",
                    });
                    return
                  };
                  setOpenSaveDialog(true);
                }}
              >
                Add User
              </Button>}
            {Number(flag) === 1 && Number(accStatus) === 0 && Number(sessionId) !== id &&
              <Button variant="contained"
                sx={{ mt: 2 }}
                onClick={() => {
                  if (!validate()) {
                    setToast({
                      open: true,
                      message: "Please fix all mandotory fields",
                      severity: "error",
                    });
                    return
                  };
                  setOpenSaveDialog(true);
                }}>
                Update User
              </Button>
            }
          </Box>
        </Grid>

        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            borderLeft: { md: "1px solid #e6e6e6" },
            paddingLeft: { md: 2 },
          }}
        >
          <Box className="bodyDiv">
            <Typography className="headerName">Login Details</Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}

            <Grid container spacing={2}>
              {/* LEFT SIDE */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={`${userLabel} Id`}
                  fullWidth
                  size="small"
                  value={userId}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/^\s+/, "");
                    setUserId(onlyText)
                  }}
                  error={Boolean(errors.userId)}
                  helperText={errors.userId}
                  InputProps={{ readOnly: true }}
                  required
                />

                <TextField
                  label="Password"
                  fullWidth
                  size="small"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    setPassword(onlyText)
                  }}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  sx={{ mt: 2 }}
                />

                <TextField
                  label="Confirm Password"
                  fullWidth
                  size="small"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    setConfirmPassword(onlyText)
                  }}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword}
                  sx={{ mt: 2 }}
                />

                <Typography className="headerName">App Login</Typography>

                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography sx={{ width: "120px" }}>Web Access:</Typography>
                  <label>
                    <input
                      type="radio"
                      checked={webAccess === "yes"}
                      onChange={() => setWebAccess("yes")}
                    />{" "}
                    Yes
                  </label>
                  <label style={{ marginLeft: "15px" }}>
                    <input
                      type="radio"
                      checked={webAccess === "no"}
                      onChange={() => setWebAccess("no")}
                    />{" "}
                    No
                  </label>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography sx={{ width: "120px" }}>App Access:</Typography>
                  <label>
                    <input
                      type="radio"
                      checked={appAccess === "yes"}
                      onChange={() => setAppAccess("yes")}
                    />{" "}
                    Yes
                  </label>
                  <label style={{ marginLeft: "15px" }}>
                    <input
                      type="radio"
                      checked={appAccess === "no"}
                      onChange={() => setAppAccess("no")}
                    />{" "}
                    No
                  </label>
                </Box>

                {id > 0 && (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography sx={{ width: "150px" }}>
                        App Configured status
                      </Typography>
                      {appConfigStatus === 1 ? (
                        <FaThumbsUp size={28} color="green" />
                      ) : (
                        <FaThumbsDown size={28} color="red" />
                      )}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography>
                        Last Web Login: {formatDate(lastWebLogin)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography>
                        Last App Login: {formatDate(lastAppLogin)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography>
                        Mobile App Version: {appVersion || ""}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography>Auth Key: {authKey || ""}</Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Typography>OTP: {otp || ""}</Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", alignItems: "center", mt: 1 }}
                    ></Box>
                  </>
                )}
              </Grid>

              {/* RIGHT SIDE */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <img
                  src={previewImage}
                  alt="profile"
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "5px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />

                <Button variant="outlined" component="label">
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>

                <Typography sx={{ mt: 1, mb: 1 }}>
                  {fileName || "No file chosen"}
                </Typography>
                {Number(appConfigStatus) === 1 && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{ float: "right", mb: 3 }}
                    onClick={() => showLogoutConfirmation()}
                  >
                    Logout from App
                  </Button>
                )}

                {/* If user exists */}
                {id > 0 && (
                  <>
                    <Box sx={{ mb: 2 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Date Of Relieving"
                          format="DD MMM YYYY"
                          maxDate={dayjs()}
                          value={relievingDate ? dayjs(relievingDate) : null}
                          defaultCalendarMonth={dayjs()}
                          placeholder="Select Date of Relieving"
                          onChange={(newValue) => {
                            setRelievingDate(
                              newValue ? newValue.format("YYYY-MM-DD") : "",
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: Boolean(errors.relievingDate),
                              helperText: errors.relievingDate,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Box>

                    {/* Deactivation Type */}
                    <Box sx={{ mb: 2 }}>
                      <Typography>
                        Deactivation Type{" "}
                        <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>

                      <CommonAppSelect
                        value={deactivateType}
                        onChange={(e) => setDeactivateType(e.target.value)}
                        options={[
                          { id: "0", label: "Select" },
                          { id: "1", label: "Resigned" },
                          { id: "2", label: "Terminated" },
                          { id: "3", label: "Absconded" },
                        ]}
                        valueKey="id"
                        labelKey="label"
                        error={Boolean(errors.deactivateType)}
                      />
                      {errors.deactivateType && (
                        <Typography
                          sx={{ color: "#d32f2f", fontSize: "10px", ml: 1 }}
                        >
                          {errors.deactivateType}
                        </Typography>
                      )}
                    </Box>

                    {/* Remarks */}
                    <Box sx={{ mb: 2 }}>
                      <Typography>
                        Remarks <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>
                      <TextField
                        multiline
                        minRows={2}
                        fullWidth
                        size="small"
                        value={deactivateRemarks}
                        onChange={(e) => setDeactivateRemarks(e.target.value)}
                        error={Boolean(errors.deactivateRemarks)}
                        helperText={errors.deactivateRemarks}
                        placeholder="Enter Remarks on Deactivation"
                      />
                    </Box>

                    {/* Deactivate button */}
                    {accStatus === 0 && delFlag === 0 && (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ float: "right" }}
                        onClick={handleDeactivateClick}
                      >
                        Deactivate
                      </Button>
                    )}
                  </>
                )}
              </Grid>
            </Grid>
          </Box>

          <Box className="bodyDiv" style={{ marginTop: "10px" }}>
            <Typography className="headerName">Access Control</Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Plan Submission Cutoff"
                  value={planSubCutoff}
                  onChange={(e) => setPlanSubCutoff(e.target.value)}
                  options={[
                    { id: "0", name: "No Rules" },
                    { id: "1", name: "End of Previous Month" },
                    { id: "2", name: "End of Current Month" },
                    { id: "3", name: "Specific Date Previous Month" },
                    { id: "4", name: "Specific Date Current Month" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                  required={true}
                />
              </Grid>
              {showPlanDay && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date of month"
                    value={psDay}
                    onChange={(e) => setPsDay(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Plan Approval"
                  value={planApproval}
                  onChange={(e) => setPlanApproval(e.target.value)}
                  options={[
                    { id: "0", name: "Optional" },
                    { id: "1", name: "Mandatory" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Report Submission Cutoff"
                  value={repSubCutoff}
                  onChange={(e) => {
                    setRepSubCutoff(e.target.value)
                    if (e.target.value === "3" && weekend.length === 0) {
                      setWeekend([1])
                    }
                    if (e.target.value === "5" && rsDay === "") {
                      setRsDay(1)
                    }
                  }}
                  options={[
                    { id: "0", name: "No Rules" },
                    { id: "1", name: "Real Time" },
                    { id: "2", name: "End of Day" },
                    { id: "3", name: "End of the Week" },
                    { id: "4", name: "End of the Month" },
                    { id: "5", name: "Standard Lag Days" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                  required={true}
                />
              </Grid>
              {showWeekend && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Weekend Day"
                    value={weekend}
                    onChange={(e) => setWeekend(e.target.value)}
                    options={weekDays} // from API
                    valueKey="id"
                    labelKey="visit_day"
                  />
                </Grid>
              )}

              {showRsDay && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Standard Lag Day"
                    value={rsDay}
                    onChange={(e) => setRsDay(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Reporting Type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  options={[
                    { id: "0", name: "Open" },
                    { id: "1", name: "Daily Without Gaps" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Data Mode"
                  value={dataMode}
                  onChange={(e) => setDataMode(e.target.value)}
                  options={[
                    { id: "0", name: "Online" },
                    { id: "1", name: "Offline: Manual Sync Mode" },
                    { id: "2", name: "Offline - Auto Sync when Online" },
                    { id: "3", name: "Offline - Alternate Mode" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Location Tracking"
                  value={locationTracking}
                  onChange={(e) => setLocationTracking(e.target.value)}
                  options={[
                    { id: "0", name: "Not Applicable" },
                    { id: "1", name: "Compulsory" },
                    { id: "2", name: "Optional" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Reporting Selfie"
                  value={selfie}
                  onChange={(e) => setSelfie(e.target.value)}
                  options={[
                    { id: "0", name: "Not Applicable" },
                    { id: "1", name: "Compulsory" },
                    { id: "2", name: "Optional" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Attendance"
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  options={[
                    { id: "0", name: "Not Compulsory" },
                    { id: "1", name: "Compulsory" },
                  ]}
                  valueKey="id"
                  labelKey="name"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Weekly Off"
                  value={weeklyOff}
                  onChange={(e) => setWeeklyOff(e.target.value)}
                  options={weekDays}
                  multiple
                  valueKey="id"
                  labelKey="visit_day"
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={openDeactivateDialog}
        onClose={() => setOpenDeactivateDialog(false)}
      >
        <DialogTitle>Confirm Deactivation</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to DEACTIVATE {fullName} {lastName}?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpenDeactivateDialog(false)}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirmDeactivate}
            variant="contained"
            color="error"
          >
            Yes, Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Confirmation</DialogTitle>

        <DialogContent>
          <Typography>
            {id
              ? "Are you sure want to Update this User?"
              : "Are you sure want to save this User?"}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenSaveDialog(false)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setOpenSaveDialog(false);
              handleSubmit();
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        on={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
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
    </Layout>
  );
}

export default AddUser;