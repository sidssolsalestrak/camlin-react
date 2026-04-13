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

  const [weeklyOff, setWeeklyOff] = useState([]);
  const [weekDays, setWeekDays] = useState([]);

  const showPlanDay = ["3", "4"].includes(planSubCutoff);
  const showWeekend = repSubCutoff === "3";
  const showRsDay = repSubCutoff === "5";

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [errors, setErrors] = useState({});

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
    const res = await axios.post("/get_repo_to_user", {
      rep_to_type: String(typeId),
    });

    if (res.data.status === 200) {
      const formatted = (res.data.data || []).map((item) => ({
        ...item,
        full_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
      }));

      setReportToUsers(formatted);
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
        setSelectedTitle(d.title_id || "");

        setEmployeeCode(d.emp_code || "");
        setFullName(d.first_name || "");
        setLastName(d.last_name || "");
        setMobileNum(d.mob_no || "");
        setEmail(d.email_id || "");
        setAddress(d.user_addr || "");

        setDateOfBirth(d.dob || "");
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
        setGrossSalary(d.sal_amt || "");

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
          setPreviewImage(`${process.env.REACT_APP_IMAGE_URL}/${d.image_upl}`);
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

        setAppConfigStatus(d.app_config_stat || 0);
        setDelFlag(d.del_flag || 0);
        setAccStatus(d.acc_stat || 0);
        setRelievingDate(d.emp_reliev_dt ? d.emp_reliev_dt.split("T")[0] : "");
        setDeactivateType(String(d.deact_type || "0"));
        setDeactivateRemarks(d.remarks || "");

        if (d.zone_id) {
          const zones = d.zone_id.split(",");
          setSelectedZones(zones);

          const regRes = await axios.post("/getRegion", { zone: zones });
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
        setWeekend(""); // if needed
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
    if (!selectedType) temp.selectedType = "Please select user type";
    if (!selectedDept) temp.selectedDept = "Please select department";
    if (!selectedDesig) temp.selectedDesig = "Please select designation";
    if (!selectedTitle) temp.selectedTitle = "Please select title";
    if (!employeeCode.trim()) temp.employeeCode = "Employee Code is required";
    if (!fullName.trim()) temp.fullName = "First Name is required";
    if (!mobileNum.trim()) temp.mobileNum = "Mobile number is required";
    if (!email.trim()) temp.email = "Email is required";
    if (!address.trim()) temp.address = "Address is required";
    if (!hq.trim()) temp.hq = "Please Enter HQ";
    if (
      ["13", "14", "15", "16"].includes(String(selectedType)) &&
      selectedRegions.length === 0
    ) {
      temp.region = "Please Select Region";
    }
    if (!selectedReportType) temp.reportType = "Please Select Reporting Type";
    if (!selectedReportTo) temp.reportTo = "Please Select Reporting To User";
    if (!employeeType) temp.employeeType = "Select Employee Type";
    if (!employeeStatus) temp.employeeStatus = "Select Employee Status";
    if (!grossSalary) {
      temp.grossSalary = "Enter Gross Salary";
    }
    if (!grossSalary || Number(grossSalary) <= 0) {
      temp.grossSalary = "Enter valid Gross Salary";
    }

    if (Number(selectedType) > 4) {
      if (mngType === 1 && selectedZones.length === 0) {
        temp.zone = "Select Zone";
      }

      if (mngType === 2) {
        if (selectedZones.length === 0) temp.zone = "Select Zone";
        if (selectedRegions.length === 0) temp.region = "Select Region";
      }

      if (mngType === 3) {
        if (selectedZones.length === 0) temp.zone = "Select Zone";
        if (selectedRegions.length === 0) temp.region = "Select Region";
        if (selectedAreas.length === 0) temp.area = "Select Area";
      }

      if (mngType === 4) {
        if (selectedZones.length === 0) temp.zone = "Select Zone";
        if (selectedRegions.length === 0) temp.region = "Select Region";
        if (selectedAreas.length === 0) temp.area = "Select Area";
        if (selectedTerritories.length === 0)
          temp.territory = "Select Territory";
      }

      if (mngType === 0) {
        if (selectedZones.length === 0) temp.zone = "Select Zone";
        if (selectedRegions.length === 0) temp.region = "Select Region";
        if (selectedAreas.length === 0) temp.area = "Select Area";
        if (selectedTerritories.length === 0)
          temp.territory = "Select Territory";
        if (selectedBeats.length === 0) temp.beat = "Select Beat";
      }
    }

    // ===== PASSWORD VALIDATION =====
    if (!id) {
      if (!password) temp.password = "Please Enter Password";
      if (!confirmPassword)
        temp.confirmPassword = "Please Enter Confirm Password";
      if (password && confirmPassword && password !== confirmPassword) {
        temp.confirmPassword = "Password & Confirm Password does not Match";
      }
      if (password) {
        const pwdCheck = checkPasswordValidation(password);
        if (pwdCheck !== 1) {
          temp.password = pwdCheck;
        }
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
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  //   if (!useMobile && !useEmail) {
  //     temp.userId = "Select Mobile OR Email for Username";
  //   }

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append("user_id", id || 0);
    formData.append("user_type", selectedType);
    formData.append("dept_id", selectedDept);
    formData.append("design_id", selectedDesig);
    formData.append("title_id", selectedTitle);
    formData.append("emp_code", employeeCode);
    formData.append("first_name", fullName);
    formData.append("last_name", lastName);
    formData.append("mobile", mobileNum);
    formData.append("email_id", email);
    formData.append("dob", dateOfBirth);
    formData.append("doj", dateOfJoin);
    formData.append("address", address);
    formData.append("user_id_stat", userIdStat);
    formData.append("emp_type", employeeType);
    formData.append("emp_stat", employeeStatus);
    formData.append("gross_salary", grossSalary);
    formData.append("other_ref", otherRef);

    // formData.append("zone_id", selectedZones.join(","));
    // formData.append("reg_id", selectedRegions.join(","));
    // formData.append("area_id", selectedAreas.join(","));
    // formData.append("ter_id", selectedTerritories.join(","));
    // formData.append("beat_id", selectedBeats.join(","));

    formData.append("hq", hq);
    // formData.append(
    //   "zone_id",
    //   selectedRegions.length ? selectedRegions.join(",") : "",
    // );
    if (Number(selectedType) > 4) {
      if (mngType === 1) {
        formData.append("zone_id", selectedZones.join(","));
        formData.append("reg_id", 0);
        formData.append("area_id", 0);
        formData.append("ter_id", 0);
        formData.append("beat_id", 0);
      } else if (mngType === 2) {
        formData.append("zone_id", selectedZones.join(","));
        formData.append("reg_id", selectedRegions.join(","));
        formData.append("area_id", 0);
        formData.append("ter_id", 0);
        formData.append("beat_id", 0);
      } else if (mngType === 3) {
        formData.append("zone_id", selectedZones.join(","));
        formData.append("reg_id", selectedRegions.join(","));
        formData.append("area_id", selectedAreas.join(","));
        formData.append("ter_id", 0);
        formData.append("beat_id", 0);
      } else if (mngType === 4) {
        formData.append("zone_id", selectedZones.join(","));
        formData.append("reg_id", selectedRegions.join(","));
        formData.append("area_id", selectedAreas.join(","));
        formData.append("ter_id", selectedTerritories.join(","));
        formData.append("beat_id", 0);
      } else if (mngType === 0) {
        formData.append("zone_id", selectedZones.join(","));
        formData.append("reg_id", selectedRegions.join(","));
        formData.append("area_id", selectedAreas.join(","));
        formData.append("ter_id", selectedTerritories.join(","));
        formData.append("beat_id", selectedBeats.join(","));
      }
    } else {
      formData.append("zone_id", 0);
      formData.append("reg_id", 0);
      formData.append("area_id", 0);
      formData.append("ter_id", 0);
      formData.append("beat_id", 0);
    }
    formData.append("report_type", selectedReportType);
    formData.append("report_user_id", selectedReportTo);

    formData.append("user_name", userId);
    formData.append("password", password);
    formData.append("conf_password", confirmPassword);

    formData.append("web_access", webAccess === "yes" ? 0 : 1);
    formData.append("app_access", appAccess === "yes" ? 0 : 1);

    formData.append("plan_sub_cutoff", planSubCutoff);
    formData.append("ps_day", psDay);
    formData.append("plan_approval", planApproval);

    formData.append("rep_sub_cutoff", repSubCutoff);
    formData.append("weekend", weekend);
    formData.append("rs_day", rsDay);

    formData.append("report_type", reportType);
    formData.append("data_mode", dataMode);
    formData.append("location_tracking", locationTracking);
    formData.append("selfie", selfie);
    formData.append("attendance", attendance);

    formData.append("weekly_off", weeklyOff.join(","));

    if (selectedFile) {
      formData.append("profileImg_file", selectedFile);
    }

    /* ===== DEBUG (remove later) ===== */
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    // return;

    try {
      const res = await axios.post("/createNewUser", formData, {
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

  const handleAreaChange = async (value) => {
    const val = Array.isArray(value) ? value : [value];
    setSelectedAreas(val);
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

    if (val.length > 0) {
      const res = await axios.post("/getBeat", {
        ter: val,
      });

      setBeats(res.data.data || []);
    } else {
      setBeats([]);
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

    // RESET ALL
    setShowZone(false);
    setShowRegion(false);
    setShowArea(false);
    setShowTerritory(false);
    setShowBeat(false);

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
        if (selected === 12) {
          return; // hide all
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

    // if number (timestamp in seconds)
    if (!isNaN(val)) {
      return dayjs(val * 1000).format("DD-MMM-YYYY HH:mm:ss");
    }

    // if ISO string
    return dayjs(val).format("DD-MMM-YYYY HH:mm:ss");
  };

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
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="User Type"
                  value={selectedType}
                  //   onChange={handleUserTypeChange}
                  onChange={handleUserTypeChange}
                  options={userTypes}
                  valueKey="id"
                  labelKey="client_alias"
                  error={Boolean(errors.selectedType)}
                />
                {errors.selectedType && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
                    {errors.selectedType}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Department"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  options={departments}
                  valueKey="id"
                  labelKey="dept_name"
                  error={Boolean(errors.selectedDept)}
                />
                {errors.selectedDept && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
                    {errors.selectedDept}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Designation"
                  value={selectedDesig}
                  onChange={(e) => setSelectedDesig(e.target.value)}
                  options={designations}
                  valueKey="id"
                  labelKey="desig_name"
                  error={Boolean(errors.selectedDesig)}
                />
                {errors.selectedDesig && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
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
                />
                {errors.selectedTitle && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
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
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  error={Boolean(errors.employeeCode)}
                  helperText={errors.employeeCode}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  fullWidth
                  size="small"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    handleFirstNameChange(e.target.value);
                  }}
                  error={Boolean(errors.fullName)}
                  helperText={errors.fullName}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  fullWidth
                  size="small"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                      setMobileNum(e.target.value);
                      if (useMobile) setUserId(e.target.value);
                    }}
                    fullWidth
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (useEmail) setUserId(e.target.value);
                    }}
                    fullWidth
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
                  onChange={(e) => setOtherRef(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date of Join"
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
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Employee Status"
                  value={employeeStatus}
                  onChange={(e) => setEmployeeStatus(e.target.value)}
                  options={empStatusList}
                  valueKey="id"
                  labelKey="emp_stat"
                />
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
                  onChange={(e) => setAddress(e.target.value)}
                  error={Boolean(errors.address)}
                  helperText={errors.address}
                />
              </Grid>
            </Grid>
          </Box>

          <Box className="bodyDiv" style={{ marginTop: "10px" }}>
            <Typography className="headerName">Territory Details</Typography>
            {/* <Divider sx={{ mb: 2 }} /> */}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="HQ"
                  fullWidth
                  size="small"
                  value={hq}
                  onChange={(e) => setHQ(e.target.value)}
                  error={Boolean(errors.hq)}
                  helperText={errors.hq}
                />
              </Grid>

              {showZone && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Zone"
                    value={selectedZones}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    options={zones}
                    multiple
                    valueKey="id"
                    labelKey="zone_name"
                  />
                </Grid>
              )}

              {showRegion && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Region"
                    value={selectedRegions}
                    options={regions}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    multiple
                    valueKey="id"
                    labelKey="reg_name"
                    error={Boolean(errors.region)}
                  />
                  {errors.region && (
                    <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
                      {errors.region}
                    </Typography>
                  )}
                </Grid>
              )}

              {showArea && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Area"
                    value={selectedAreas}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    multiple
                    options={areas}
                    valueKey="id"
                    labelKey="area_name"
                  />
                </Grid>
              )}

              {showTerritory && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Territory"
                    value={selectedTerritories}
                    onChange={(e) => handleTerritoryChange(e.target.value)}
                    multiple
                    options={territories}
                    valueKey="id"
                    labelKey="ter_name"
                  />
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
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Report Type"
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  options={userTypes}
                  valueKey="id"
                  labelKey="client_alias"
                  error={Boolean(errors.reportType)}
                />
                {errors.reportType && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
                    {errors.reportType}
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <CommonAppSelect
                  label="Report To"
                  value={selectedReportTo}
                  onChange={(e) => setSelectedReportTo(e.target.value)}
                  options={reportToUsers}
                  valueKey="id"
                  labelKey="full_name"
                  disabled={!selectedReportType}
                />
                {errors.reportTo && (
                  <Typography sx={{ color: "red", fontSize: "12px", ml: 1 }}>
                    {errors.reportTo}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Button
              variant="contained"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => {
                if (!validate()) return;
                setOpenSaveDialog(true);
              }}
            >
              {id ? "Update User" : "Add User"}
            </Button>
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
                  label="User Id"
                  fullWidth
                  size="small"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  error={Boolean(errors.userId)}
                  helperText={errors.userId}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Password"
                  fullWidth
                  size="small"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {appConfigStatus === 1 && delFlag === 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    sx={{ float: "right", mb: 3 }}
                    onClick={() => console.log("Logout triggered")}
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
                        <span style={{ color: "red" }}>*</span>
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
                          sx={{ color: "red", fontSize: "10px", ml: 1 }}
                        >
                          {errors.deactivateType}
                        </Typography>
                      )}
                    </Box>

                    {/* Remarks */}
                    <Box sx={{ mb: 2 }}>
                      <Typography>
                        Remarks <span style={{ color: "red" }}>*</span>
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
                    { id: "1", name: "End Of Previous Month" },
                    { id: "2", name: "End of Current Month" },
                    { id: "3", name: "Specific Date Previous Month" },
                    { id: "4", name: "Specific Date Current Month" },
                  ]}
                  valueKey="id"
                  labelKey="name"
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
                  onChange={(e) => setRepSubCutoff(e.target.value)}
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
                />
              </Grid>
              {showWeekend && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <CommonAppSelect
                    label="Weekend Day"
                    value={weekend}
                    onChange={(e) => setWeekend(e.target.value)}
                    options={weekDays} // from API
                    multiple
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
              {/* <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 5 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid>
              <Grid size={{ xs: 12, sm: 6 }}></Grid> */}
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
    </Layout>
  );
}

export default AddUser;
