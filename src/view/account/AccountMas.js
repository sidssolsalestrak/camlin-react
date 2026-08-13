import React, { useState, useEffect, useMemo } from "react";
import Layout from "../../layout";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { decode } from "../../utils/common";
import "../../assets/css/accountMas.css";
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
import api from "../../services/api";
import DataTable from "../../../src/utils/dataTable";
import { FaEdit, FaTrash } from "react-icons/fa";
import useToast from "../../utils/useToast";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { getUserFromToken } from "../../utils/getUserFromToken";
import ConfirmationDialog from "../../utils/confirmDialog";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import "../../assets/css/accountMas.css";
import { getMasterPanel } from "../../services/masterPanelService";

function AccountMas() {
  const user = getUserFromToken();
  const location = useLocation();
  const loggedInUserId = user?.user_id;
  const loggedInUserType = Number(user?.user_type);
  // console.log("Logged User:", user);
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [masterPanel, setMasterPanel] = useState({});

  useEffect(() => {
    const loadMasterPanel = async () => {
      const data = await getMasterPanel();
      setMasterPanel(data);
    };
    loadMasterPanel();
  }, []);

  const decodedParams = useMemo(
    () => ({
      reqType: decode(params.reqType),
      country: decode(params.country),
      user: decode(params.user),
      userType: decode(params.userType),
      cusReq: decode(params.cusReq),
      beatId: decode(params.beatId),
      login_id: decode(params.login_id),
    }),
    [params],
  );
  console.log("decodedParams:", decodedParams);

  // ── Role-based access control (same pattern as Area.jsx) ──
  // ROLES: 0 = All, 1 = Maker, 2 = Checker, 3 = View Only
  const [accStat, setAccStat] = useState(null);

  useEffect(() => {
    try {
      const accStat = localStorage.getItem("acc_stat");
      setAccStat(accStat);
      console.log("Acc Stat", accStat);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    const generateToken = async () => {
      if (!decodedParams.login_id) return;

      const existingToken = localStorage.getItem("session-token");
      if (existingToken) return;

      try {
        const res = await api.post("/generateTokenFromLoginId", {
          login_id: decodedParams.login_id,
        });

        if (res.data.success && res.data.token) {
          localStorage.setItem("session-token", res.data.token);
          window.location.reload();
        }
      } catch (err) {
        console.error("Token generation failed", err);
      }
    };

    generateToken();
  }, [decodedParams.login_id]);

 const title =
  decodedParams.reqType == 2
    ? "Approval List"
    : `${masterPanel["ACCM"] || "Account"} Masters`;
  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");

  const [userType, setUserType] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState(0);

  const [userData, setUserData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(0);

  const [cusReq, setCusReq] = useState(decodedParams.cusReq || 1);
  const [reqType, setReqType] = useState(0);

  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // ── Submit (Approve/Reject) confirmation dialog state ──
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(
    "Are you sure you want to Approve requests?",
  );

  const [logOpen, setLogOpen] = useState(false);
  const [logData, setLogData] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [cusName, setCusName] = useState("");

  const [approvalState, setApprovalState] = useState({});

  const fetchRegionData = async () => {
    try {
      const response = await api.post("/getRegionData", { zoneId: 0 });
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

  const fetchUsers = async ({ trigger_type = 0 } = {}) => {
    try {
      const res = await api.post("/getUsersByRegion", {
        country: selectedRegion,
        cus_req: cusReq,
        req_type: reqType,
        user_type: selectedUserType,
        trigger_type,
      });
      setUserData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoad = (newSelectedUser = null) => {
    const effectiveSelectedUser =
      typeof newSelectedUser === "number" ? newSelectedUser : selectedUser;

    const val2 = selectedRegion; // country
    const val3 = effectiveSelectedUser; // user
    const val4 = selectedUserType; // userType
    const val5 = cusReq; // customers / requests
    let val = 0;

    if (val5 == 2) {
      val = reqType;
    } else if (val5 == 1) {
      if (val3 === 0) {
        toast.error(`Please select ${masterPanel["USER"] || "User"}!`);
        return;
      }
    }

    if (!(val2 > 0 || val3 > 0)) {
      toast.error(`Please select ${masterPanel["REGN"] || "Region"} or ${masterPanel["USER"] || "User"}`);
      return;
    }

    const encode = (val) => btoa(val || 0);

    navigate(
      `/customers/AllDoctors/${encode(val)}/${encode(val2)}/${encode(val3)}/${encode(val4)}/${encode(val5)}`,
    );
  };

  const badge = (color) => ({
    backgroundColor: color,
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
  });

  // ── Shared eligibility check — same rule used by per-row Approve/Reject,
  //     Approve All, Reject All, and the Submit button visibility. ──
  // ROLES: 0 = All, 1 = Maker, 2 = Checker, 3 = View Only
  //
  // Two distinct approval stages share this data:
  //  - Manager-level approval: identified by hierarchy membership
  //    (am_user_id / zbm_user_id / rsm_user_id / sh_user_id === loggedInUserId).
  //    This is the FIRST approval step.
  //  - Final approval: identified by loggedInUserType 2 or 3 (admin roles).
  //    This step is independent of whether manager approval has happened yet.
  const isRowActionAllowed = (row) => {
    const isManagerLevelApprover =
      row.am_user_id == loggedInUserId ||
      row.zbm_user_id == loggedInUserId ||
      row.rsm_user_id == loggedInUserId ||
      row.sh_user_id == loggedInUserId;

    const isFinalApprover = loggedInUserType == 2 || loggedInUserType == 3;

    if (Number(accStat) === 2) {
      // Checker → manager-level approval only, and only while it's still pending
      return isManagerLevelApprover && row.mgr_approved_stat == 0;
    }

    if (Number(accStat) === 0) {
      // All → final approval, regardless of whether manager approval is done or not
      return isManagerLevelApprover || isFinalApprover;
    }

    // Maker / View Only never get approve-reject rights
    return false;
  };

  useEffect(() => {
    fetchRegionData();
    fetchUserType();
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log("cusReq changes run")
    const newCusReq = decodedParams.cusReq || 1;
    setCusReq(newCusReq);
    setReqType(newCusReq === 2 ? (Number(decodedParams.reqType) || 0) : 0);
    setApprovalState({});      // clear stale approve/reject toggles from the other menu
    setSelectedUser(Number(decodedParams.user) || 0);
    setTableData([]);
  }, [decodedParams.cusReq]);

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

  const columns = [
    {
      field: "sl",
      headerName: "SL",
      renderCell: ({ row }) => row.sl,
      width: 10,
    },

    {
      field: "user",
      headerName: (masterPanel["USER"] || "User").toUpperCase(),
      renderCell: ({ row }) => {
        return (
          <div>
            <div style={{ color: "#666" }}>{row.req_full_name}</div>
            <div style={{ fontSize: "12px" }}>
              {row.usertype} | {row.reg_name}
            </div>
          </div>
        );
      },
      width: 175,
    },

      {
      field: "account",
      headerName: `${(masterPanel["ACCM"] || "Account").toUpperCase()} DETAILS`,
      renderCell: ({ row }) => {
        const name =  row.full_name;
        const type = row.cus_type_id == 1 ? "HCP" : "Retailer";

        const handleClick = () => {
          if (![0, 2 , 1].includes(Number(accStat))) return;

          if (decodedParams.cusReq == 2) {
            navigate(`/customers/editDoctor/${btoa(row.id)}/${btoa(3)}/${btoa(row.request_type)}`);
          } else {
            navigate(`/customers/editDoctor/${btoa(row.id)}/${btoa(1)}/${btoa(0)}`);
          }
        };

        return (
          <div style={{ cursor: "pointer" }} onClick={handleClick}>
            <div
              style={{
                fontSize: "1.125em",
                color: row.cus_type_id == 1 ? "orange" : "blue",
              }}
            >
              {type} | {name}
            </div>
            <div style={{ fontSize: "12px" }}>
              {row.cat_type}-{row.cus_freq} | {row.clinic_name} | {row.ter_name}
            </div>
          </div>
        );
      },
      width: decodedParams.cusReq == 2 ? 200 : 540,
    },

    {
      field: "status",
      headerName: decodedParams.cusReq == 2 ? "REQUEST TYPE" : "STATUS",
      renderCell: ({ row }) => {
        if (decodedParams.cusReq == 2) {
          if (row.request_type == 1)
            return <span style={badge("#8bc34a")}>Add +</span>;
          if (row.request_type == 2)
            return <span style={badge("#ffc107")}>Update !</span>;
          if (row.request_type == 3)
            return <span style={badge("#e84e40")}>Delete !</span>;
          return <span style={badge("#90a4ae")}>----</span>;
        } else {
          return row.del_flag == 0 ? (
            <span style={badge("#4bdb5c")}>Active</span>
          ) : (
            <span style={badge("#e84e40")}>Inactive</span>
          );
        }
      },
      width: 65,
    },

    ...(decodedParams.cusReq == 2
      ? [
        {
          field: "remark",
          headerName: "REMARK",
          renderCell: ({ row }) => {
            if (decodedParams.cusReq != 2) return "";

            const remarkMap = {
              1: "New",
              2: row.remark || "",
              3: "",
            };

            return remarkMap[row.request_type] ?? "";
          },
          width: 150,
        },
      ]
      : []),

    ...(decodedParams.cusReq == 2
      ? [
        {
          field: "update",
          headerName: "UPDATE",
          renderCell: ({ row }) => (
            <span style={{ color: "red" }}>{row.upd_data || "-"}</span>
          ),
          width: 150,
        },
      ]
      : []),

    ...(decodedParams.cusReq == 2
      ? [
        {
          field: "manager_status",
          headerName: "",
          renderCell: ({ row }) => {
            if (row.mgr_approve_user > 0) {
            return (
                <span>
                  {row.mgr_full_name} Approved.
                  <br />
                  ZM/NSM Pending
                </span>
              );
            } else {
              return <span>Manager Approval Pending.</span>;
            }
          },
          width: 200,
        },
      ]
      : []),

    // ── APPROVE — Checker: manager-level approval only (pending). All: final approval ──
    ...(decodedParams.cusReq == 2 && [0, 2].includes(Number(accStat))
      ? [
        {
          field: "approve",
          headerName: "APPROVE",
          renderCell: ({ row }) => {
            const state = approvalState[row.id] || 0;

            if (!isRowActionAllowed(row)) return <span>-</span>;

            return (
              <span
                style={{
                  fontSize: "20px",
                  color: state === 1 ? "#0bd00b" : "#a5a0a0",
                  cursor: "pointer",
                }}
                onClick={() => handleApprove(row)}
              >
                <FaThumbsUp />
              </span>
            );
          },
          width: 100,
        },
      ]
      : []),

    // ── REJECT — Checker: manager-level approval only (pending). All: final approval ──
    ...(decodedParams.cusReq == 2 && [0, 2].includes(Number(accStat))
      ? [
        {
          field: "reject",
          headerName: "REJECT",
          renderCell: ({ row }) => {
            const state = approvalState[row.id] || 0;

            if (!isRowActionAllowed(row)) return <span>-</span>;

            return (
              <span
                style={{
                  fontSize: "20px",
                  color: state === 2 ? "red" : "#a5a0a0",
                  cursor: "pointer",
                }}
                onClick={() => handleReject(row)}
              >
                <FaThumbsDown />
              </span>
            );
          },
          width: 100,
        },
      ]
      : []),

    // ── EDIT — restricted to Checker / All ──
    ...(decodedParams.cusReq == 1 && [0, 2, 1].includes(Number(accStat))
      ? [
        {
          field: "edit",
          headerName: "UPDATE",
          renderCell: ({ row }) => (
            <div className="editBtn actionBtn">
              <FaEdit
                style={{ cursor: "pointer" }}
                onClick={() => handleEdit(row)}
              />
            </div>
          ),
          width:60
        },
      ]
      : []),

    // ── DELETE — restricted to Checker / All ──
    ...(decodedParams.cusReq == 1 && [0, 2, 1].includes(Number(accStat))
      ? [
        {
          field: "delete",
          headerName: "DELETE",
          renderCell: ({ row }) => (
            <div className="dltBtn actionBtn">
              <FaTrash
                style={{ cursor: "pointer", color: "red" }}
                onClick={() => handleDelete(row)}
              />
            </div>
          ),
          width:60
        },
      ]
      : []),

    ...(decodedParams.cusReq == 1
      ? [
        {
          field: "logs",
          headerName: "",
          renderCell: ({ row }) => (
            <span
              style={{ cursor: "pointer", color: "#1976d2" }}
              onClick={() => handleViewLogs(row)}
            >
              View Logs
            </span>
          ),
          width:80
        },
      ]
      : []),
  ];

  const handleViewLogs = async (row) => {
    try {
      setLogLoading(true);
      setLogOpen(true);

      const res = await api.post("/getcustomerlogs", {
        cus_sub_id: row.act_cus_sub_id,
      });

      if (res.data.status === 200 || res.data.status === 400) {
        setLogData(res.data.data || []);
        setCusName(res.data.cus_name || "");
      } else {
        toast.error("Unable to load logs");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load logs");
    } finally {
      setLogLoading(false);
    }
  };

  const handleEdit = (row) => {
    navigate(`/customers/editDoctor/${btoa(row.id)}/${btoa(2)}/${btoa(0)}`);
  };

  // For req=2 (Requests) — clicking account name in approval list
  const handleViewRequest = (row) => {
    navigate(`/customers/editDoctor/${btoa(row.id)}/${btoa(3)}/${btoa(row.request_type)}`);
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    setConfirmOpen(true);
  };

  useEffect(() => {
    handleLoadDataFromParams();
  }, [decodedParams]);

  const handleLoadDataFromParams = async () => {
    try {
      const country = Number(decodedParams.country) || 0;
      const users = Number(decodedParams.user) || 0;
      const userType = Number(decodedParams.userType) || 0;
      const cus_req = Number(decodedParams.cusReq);
      const req_type = Number(decodedParams.reqType) || 0;
      const beatId= Number(decodedParams.beatId) || 0;

      if (cus_req === 2) {
        if (!(country || req_type || users || userType)){ 
          setTableData([]);
          return
        };
      }

      if (cus_req === 1) {
        if (!(country || userType || users)) {
          console.log("❌ Skipping API (no filters)");
          setTableData([]);
          return;
        }
      }

      setLoadingTable(true);
      const res = await api.post("/getDoctorsList", {
        country,
        users,
        userType,
        cus_req,
        req_type,
        beatId
      });

      setTableData(
        (res.data.data || []).map((item, index) => ({
          ...item,
          sl: index + 1,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    if (selectedRegion) {
      fetchUsers({ trigger_type: 1 });
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedUserType || selectedUserType === 0) {
      fetchUsers({ trigger_type: 1 });
    }
  }, [selectedUserType]);

  useEffect(() => {
    if (cusReq == 1) {
      fetchUsers({ trigger_type: 0 });
    } else {
      fetchUsers({ trigger_type: 1 });
    }
  }, [cusReq]);

  const handleConfirmDelete = async () => {
    try {
      setLoadingDelete(true);

      const res = await api.post("/deleteDoctor", {
        id: selectedRow.id,
        sub_id: selectedRow.act_cus_sub_id,
      });

      const data = res.data;

      if (data == 2) {
        toast.warning("Update Request is pending! Waiting for approval");
      } else if (data == 3) {
        toast.warning("Delete Request already pending!");
      } else if (data == 1) {
        toast.success("Delete request generated");
        handleLoad(); // refresh
      } else {
        toast.error("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setLoadingDelete(false);
      setConfirmOpen(false);
    }
  };

  const logColumns = [
    { field: "sl", headerName: "SI" },

    { field: "req_type", headerName: "TYPE" },

    {
      field: "create_dt",
      headerName: "DATE",
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD MMM YYYY h:mm A") : "-",
    },

    { field: "cat_type", headerName: (masterPanel["PCLS"] || "Potentiality Class").toUpperCase() },

    { field: "mobile", headerName: "MOBILE NUMBER" },

    { field: "email", headerName: "EMAIL ID" },

    {
      field: "dob",
      headerName: "DATE OF BIRTH",
      renderCell: (params) => {
        const row = params.row;

        let dob = "-";

        if (row.dob_stat == 0) {
          if (
            row.dob &&
            !["0000-00-00", "1900-01-01", "1970-01-01"].includes(row.dob)
          ) {
            dob = dayjs(row.dob).format("DD MMM YYYY");
          }
        }

        return dob;
      },
    },

    {
      field: "wedding_dt",
      headerName: "WEDDING DATE",
      renderCell: (params) => {
        const row = params.row;

        let doa = "-";

        if (row.wedding_stat == 0) {
          if (
            row.wedding_dt &&
            !["0000-00-00", "1900-01-01", "1970-01-01"].includes(row.wedding_dt)
          ) {
            doa = dayjs(row.wedding_dt).format("DD MMM YYYY");
          }
        }

        return doa;
      },
    },

    {
      field: "upd_data",
      headerName: "UPDATE",
      renderCell: (params) => (
        <span style={{ color: "red" }}>{params.value || ""}</span>
      ),
    },

    {
      field: "status",
      headerName: "STATUS",
      renderCell: (params) => {
        let stat = "Pending Approval";
        let color = "red";

        if (params.row.approved_stat == 1) {
          stat = "Approved";
          color = "green";
        }

        return <span style={{ color, whiteSpace: "nowrap" }}>{stat}</span>;
      },
    },
  ];

  const logRows = logData.map((item, index) => ({
    ...item,
    id: index + 1,
    sl: index + 1,
  }));

  const handleApprove = (row) => {
    setApprovalState((prev) => {
      const current = prev[row.id] || 0;

      return {
        ...prev,
        [row.id]: current === 1 ? 0 : 1, // toggle
      };
    });
  };

  const handleReject = (row) => {
    setApprovalState((prev) => {
      const current = prev[row.id] || 0;

      return {
        ...prev,
        [row.id]: current === 2 ? 0 : 2, // toggle
      };
    });
  };

  // ── Step 1: validate selection, then open confirmation dialog ──
  const handleSubmitAllClick = () => {
    let approveRows = [];
    let rejectRows = [];

    tableData.forEach((row) => {
      const state = approvalState[row.id];

      if (state === 1) approveRows.push(row);
      if (state === 2) rejectRows.push(row);
    });

    if (approveRows.length === 0 && rejectRows.length === 0) {
      toast.warning("Please Approve or Reject at least one Request");
      return;
    }

    if (approveRows.length > 0 && rejectRows.length > 0) {
      setSubmitMessage("Are you sure you want to Approve/Reject these requests?");
    } else if (rejectRows.length > 0) {
      setSubmitMessage("Are you sure you want to reject request?");
    } else {
      setSubmitMessage("Are you sure you want to Approve requests?");
    }

    setSubmitConfirmOpen(true);
  };

  // ── Step 2: actual submit, called after user confirms in the dialog ──
  const handleSubmitAll = async () => {
    let approveRows = [];
    let rejectRows = [];

    tableData.forEach((row) => {
      const state = approvalState[row.id];

      if (state === 1) approveRows.push(row);
      if (state === 2) rejectRows.push(row);
    });

    if (approveRows.length === 0 && rejectRows.length === 0) {
      toast.warning("Please Approve or Reject at least one Request");
      setSubmitConfirmOpen(false);
      return;
    }

    setSubmitLoading(true);
    try {
      // APPROVE API
      if (approveRows.length > 0) {
        await api.post("/approveRequestsDoctor", buildPayload(approveRows));
      }

      // REJECT API
      if (rejectRows.length > 0) {
        await api.post("/rejectRequestsDoctor", buildPayload(rejectRows));
      }

      toast.success("Request Updated successfully");
      handleLoad();
      setApprovalState({});
    } catch (err) {
      console.error(err);
      toast.error("Unable to update, please try again");
    } finally {
      setSubmitLoading(false);
      setSubmitConfirmOpen(false);
    }
  };

  const handleApproveAll = () => {
  if (!selectedUser || selectedUser == 0) {
    toast.warning(`Please select ${masterPanel["USER"] || "User"} to Approve All`);
    return;
  }

  const eligibleRows = tableData.filter((row) => isRowActionAllowed(row));

  const allApproved = eligibleRows.every(
    (row) => approvalState[row.id] === 1,
  );

  const updates = {};
  eligibleRows.forEach((row) => {
    updates[row.id] = allApproved ? 0 : 1; // if all approved → deselect, else → approve
  });

  setApprovalState((prev) => ({ ...prev, ...updates }));
};

const handleRejectAll = () => {
  if (!selectedUser || selectedUser == 0) {
    toast.warning(`Please select ${masterPanel["USER"] || "User"} to Reject All`);
    return;
  }

  const eligibleRows = tableData.filter((row) => isRowActionAllowed(row));

  const allRejected = eligibleRows.every(
    (row) => approvalState[row.id] === 2,
  );

  const updates = {};
  eligibleRows.forEach((row) => {
    updates[row.id] = allRejected ? 0 : 2; // if all rejected → deselect, else → reject
  });

  setApprovalState((prev) => ({ ...prev, ...updates }));
};
  const buildPayload = (rows) => {
    return {
      val: reqType, // req type (Add/Update/Delete)
      val2: selectedRegion, // country
      val3: selectedUser, // user

      app_type: decodedParams.login_id ? 1 : 0,
      login_id: decodedParams.login_id || 0,

      // take from first row (all rows will have same hierarchy)
      am_user_id: rows[0]?.am_user_id || 0,
      zbm_user_id: rows[0]?.zbm_user_id || 0,
      rsm_user_id: rows[0]?.rsm_user_id || 0,
      sh_user_id: rows[0]?.sh_user_id || 0,

      rowId: rows.map((r) => r.id),
      rowReqName: rows.map((r) => r.req_full_name),
      rowReqEmail: rows.map((r) => r.req_email),
      rowTerName: rows.map((r) => r.ter_name),
      rowClassName: rows.map((r) => r.cat_type),
      cusName: rows.map((r) => r.full_name),
      updUserId: rows.map((r) => r.upd_user),
      appStat: rows.map((r) => r.request_type),
      cus_id: rows.map((r) => r.cus_id),
      act_cus_id: rows.map((r) => r.act_cus_id),
      act_cus_sub_id: rows.map((r) => r.act_cus_sub_id),
    };
  };

  const Wrapper = decodedParams.login_id ? React.Fragment : Layout;
  return (
    <Wrapper
      {...(!decodedParams.login_id && {
        breadcrumb: [
          { label: "Home", path: "/" },
          { label: masterPanel["ACCM"] || "Account", path: location.pathname },
          { label: `${masterPanel["ACCM"] || "Account"} List` },
        ],
      })}
    >
      <Box p={2} display="flex" flexDirection="column" gap={2}>
        <h2>{title}</h2>

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
            <FormControl required fullWidth size="small">
              <InputLabel id="region-label">{masterPanel["REGN"] || "Region"}</InputLabel>

              <Select
                labelId="region-label"
                value={selectedRegion}
                label={masterPanel["REGN"] || "Region"}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedUser(0)
                  // fetchUsers({
                  //   trigger_type: 1,
                  // });
                }}
              >
                <MenuItem value={0}>All</MenuItem>
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
              <InputLabel id="userType-label">{masterPanel["USER"] || "User"} Type</InputLabel>

              <Select
                labelId="userType-label"
                value={selectedUserType}
                label={`${masterPanel["USER"] || "User"} Type`}
                onChange={(e) => {
                  setSelectedUserType(e.target.value);
                  setSelectedUser(0)
                  // fetchUsers({
                  //   trigger_type: 2,
                  // });
                }}
              >
                <MenuItem value={0}>All</MenuItem>
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
                getOptionLabel={(option) => {
                  const name = [option.first_name, option.last_name]
                    .filter((val) => val && val !== "null")
                    .join(" ");

                  return `${name}${cusReq == 2 && option.count ? ` (${option.count})` : ""
                    }`;
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => {
                  const name = [option.first_name, option.last_name]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <li {...props} key={option.id}>
                      {name}
                      {cusReq == 2 && option.count ? ` (${option.count})` : ""}
                    </li>
                  );
                }}
                value={userData.find((u) => u.id === selectedUser) || null}
                onChange={(e, newValue) => {
                  const userId = newValue ? newValue.id : 0;
                  setSelectedUser(userId);
                  handleLoad(userId);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={`Select ${masterPanel["USER"] || "User"}`}
                    variant="outlined"
                    label={masterPanel["USER"] || "User"}
                  />
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="cusReq-label">Customers / Requests</InputLabel>

              <Select
                labelId="cusReq-label"
                value={cusReq}
                label="Customers / Requests"
                onChange={(e) => setCusReq(e.target.value)}
              >
                <MenuItem value={1}>All Current Customers</MenuItem>
                <MenuItem value={2}>Requests</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid
            size={{ xs: 12, md: 2 }}
            style={{ display: cusReq == 2 ? "block" : "none" }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id="reqType-label">Request Type</InputLabel>

              <Select
                labelId="reqType-label"
                value={reqType}
                label="Request Type"
                onChange={(e) => setReqType(e.target.value)}
              >
                {decodedParams.userType == 1 || decodedParams.userType == 2 ? (
                  <MenuItem value={4}>All</MenuItem>
                ) : (
                  <MenuItem value={0}>All</MenuItem>
                )}

                <MenuItem value={1}>Add New</MenuItem>
                <MenuItem value={2}>Update</MenuItem>
                <MenuItem value={3}>Delete</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Box>
              <button
                onClick={() => handleLoad()}
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
            </Box>
          </Grid>
        </Grid>
           <Box  sx={{backgroundColor: "#fff",borderRadius: "10px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
                                            }}>
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
         {decodedParams.cusReq == 2 &&
  [0, 2].includes(Number(accStat)) &&
  tableData.some((row) => isRowActionAllowed(row)) && (
    <Box display="flex" justifyContent="flex-end" gap={3} px={4} pt={2}>
      <span
        onClick={handleApproveAll}
        style={{
          fontSize: "15px",
          color: tableData
            .filter((row) => isRowActionAllowed(row))
            .every((row) => approvalState[row.id] === 1)
            ? "#0bd00b"   // all approved → green
            : "#a5a0a0",  // not all approved → grey
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        Approve All <FaThumbsUp size={19} style={{marginBottom:'8px'}} />
      </span>

      <span
        onClick={handleRejectAll}
        style={{
          fontSize: "15px",
          color: tableData
            .filter((row) => isRowActionAllowed(row))
            .every((row) => approvalState[row.id] === 2)
            ? "red"       // all rejected → red
            : "#a5a0a0",  // not all rejected → grey
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        Reject All <FaThumbsDown size={19}  style={{marginTop:'6px'}}/>
      </span>
    </Box>
  )}

          <DataTable
            data={tableData}
            columns={columns}
            loading={loadingTable}
            title="Customers List"
          />
        </Box>
        </Box>

        {decodedParams.cusReq == 2 &&
          [0, 2].includes(Number(accStat)) &&
          tableData.some((row) => isRowActionAllowed(row)) && (
            <Box mt={2} display="flex" justifyContent="center">
              <button
                onClick={handleSubmitAllClick}
                style={{
                  padding: "8px 20px",
                  background: "#17a2b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </Box>
          )}

        <ConfirmationDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmation"
          message="Are you sure you want to delete this record?"
          confirmText="Delete"
          confirmColor="error"
          loading={loadingDelete}
        />

        {/* ── Submit (Approve/Reject) confirmation dialog ── */}
        <ConfirmationDialog
          open={submitConfirmOpen}
          onClose={() => setSubmitConfirmOpen(false)}
          onConfirm={handleSubmitAll}
          title="Confirmation"
          message={submitMessage}
          confirmText="Submit"
          cancelText="Cancel"
          confirmColor="primary"
          loading={submitLoading}
        />

        <Dialog
          open={logOpen}
          onClose={() => setLogOpen(false)}
          fullWidth
          maxWidth="lg"
          sx={{
            "& .MuiDialog-container": {
              alignItems: "flex-start",
              marginTop: "50px",
            },
          }}
        >
          <DialogTitle>Customer Logs - {cusName}</DialogTitle>

          {logLoading && <LinearProgress />}

          <DialogContent>
            <DataTable
              data={logRows}
              columns={logColumns}
              loading={logLoading}
              title=""
              style={{ opacity: logLoading ? 0.6 : 1 }}
            />

            <Box mt={2} display="flex" justifyContent="flex-end">
              <button
                onClick={() => setLogOpen(false)}
                style={{
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </Wrapper>
  );
}

export default AccountMas;