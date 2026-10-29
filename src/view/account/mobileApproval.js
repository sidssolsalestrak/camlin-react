import React, { useState, useEffect, useMemo } from "react";
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
import useToast from "../../utils/useToast";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { getUserFromToken } from "../../utils/getUserFromToken";
import ConfirmationDialog from "../../utils/confirmDialog";
import { getMasterPanel } from "../../services/masterPanelService";
import usePageTitle from "../../services/usePageTitle";

function MobileApproval() {
  const user = getUserFromToken();
  const location = useLocation();
  const loggedInUserId = user?.user_id;
  const loggedInUserType = Number(user?.user_type);
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
      login_id: decode(params.login_id),
    }),
    [params],
  );

  console.log("encoded login id passes", params.login_id);

  const [accStat, setAccStat] = useState(null);

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

  const title = "Approval List";
  usePageTitle(title);

  const [regionData, setRegionData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(0);

  const [userType, setUserType] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState(0);

  const [userData, setUserData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(0);

  const reqType = 0;

  const [tableData, setTableData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(
    "Are you sure you want to Approve requests?",
  );

  const [approvalState, setApprovalState] = useState({});

  useEffect(() => {
    const resolveAccStat = async () => {
      try {
        const res = await api.post("/getAccStat", {
          menu_url: "customers/AllDoctors/NA==/MA==/MA==/MA==/Mg==",
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
        cus_req: 2,
        req_type: reqType,
        user_type: selectedUserType,
        trigger_type,
      });
      setUserData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async (newSelectedUser = null) => {
    const users =
      newSelectedUser === 0 || typeof newSelectedUser === "number"
        ? newSelectedUser
        : selectedUser;

    try {
      setLoadingTable(true);
      setApprovalState({});

      const res = await api.post("/getDoctorsList", {
        country: selectedRegion,
        users,
        userType: selectedUserType,
        cus_req: 2,
        req_type: reqType,
        beatId: 0,
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

  const badge = (color) => ({
    backgroundColor: color,
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
  });

  const isRowActionAllowed = (row) => {
    const isManagerLevelApprover =
      row.am_user_id == loggedInUserId ||
      row.zbm_user_id == loggedInUserId ||
      row.rsm_user_id == loggedInUserId ||
      row.sh_user_id == loggedInUserId;

    const isAdminFinalApprover = loggedInUserType == 2 || loggedInUserType == 3;
    const isFinalApprover = isAdminFinalApprover || isManagerLevelApprover;

    if (Number(accStat) === 2) {
      if (isManagerLevelApprover && isAdminFinalApprover) {
        return true;
      }
      return isManagerLevelApprover && row.mgr_approved_stat == 0;
    }

    if (Number(accStat) === 0) {
      return isManagerLevelApprover || isFinalApprover;
    }

    return false;
  };

  useEffect(() => {
    fetchRegionData();
    fetchUserType();
    loadData();
  }, []);

  useEffect(() => {
    fetchUsers({ trigger_type: 1 });
  }, [selectedRegion, selectedUserType]);

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
            <div style={{ color: "#666",fontSize: "11px" }}>{row.req_full_name}</div>
            <div style={{ fontSize: "11px" }}>
              {row.usertype} | {row.reg_name}
            </div>
          </div>
        );
      },
      width: 130,
    },

    {
      field: "account",
      headerName: `${(masterPanel["ACCM"] || "Account").toUpperCase()} DETAILS`,
      renderCell: ({ row }) => {
        const name = row.full_name;
        const type = row.cus_type_id == 1 ? "HCP" : "Retailer";
        return (
          <div style={{ cursor: "pointer" }} >
            <div
              style={{
                fontSize: "12px",
                color: row.cus_type_id == 1 ? "orange" : "blue",
              }}
            >
              {type} | {name}
            </div>
            <div style={{ fontSize: "11px" }}>
              {row.cat_type}-{row.cus_freq} | {row.clinic_name} | {row.ter_name}
            </div>
          </div>
        );
      },
      width: 330,
    },

    {
      field: "status",
      headerName: "REQ. TYPE",
      type:"alignright",
      renderCell: ({ row }) => {
        if (row.request_type == 1)
          return <span style={badge("#8bc34a")}>Add +</span>;
        if (row.request_type == 2)
          return <span style={badge("#ffc107")}>Update !</span>;
        if (row.request_type == 3)
          return <span style={badge("#e84e40")}>Delete !</span>;
        return <span style={badge("#90a4ae")}>----</span>;
      },
      width: 75,
    },
    ...([0, 2].includes(Number(accStat))
      ? [
        {
          field: "approve",
          headerName: "APPROVE",
          type:'alignright',
          renderCell: ({ row }) => {
            const state = approvalState[row.id] || 0;

            if (!isRowActionAllowed(row)) return <span>-</span>;

            return (
              <span
                style={{
                  fontSize: "18px",
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

    ...([0, 2].includes(Number(accStat))
      ? [
        {
          field: "reject",
          headerName: "REJECT",
          type:"alignCenter",
          renderCell: ({ row }) => {
            const state = approvalState[row.id] || 0;

            if (!isRowActionAllowed(row)) return <span>-</span>;

            return (
              <span
                style={{
                  fontSize: "18px",
                  color: state === 2 ? "red" : "#a5a0a0",
                  cursor: "pointer",
                }}
                onClick={() => handleReject(row)}
              >
                <FaThumbsDown />
              </span>
            );
          },
          width: 50,
        },
      ]
      : []),
  ];

  const handleApprove = (row) => {
    setApprovalState((prev) => {
      const current = prev[row.id] || 0;

      return {
        ...prev,
        [row.id]: current === 1 ? 0 : 1,
      };
    });
  };

  const handleReject = (row) => {
    setApprovalState((prev) => {
      const current = prev[row.id] || 0;

      return {
        ...prev,
        [row.id]: current === 2 ? 0 : 2,
      };
    });
  };

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
      if (approveRows.length > 0) {
        await api.post("/approveRequestsDoctor", buildPayload(approveRows));
      }

      if (rejectRows.length > 0) {
        await api.post("/rejectRequestsDoctor", buildPayload(rejectRows));
      }

      toast.success("Request Updated successfully");
      setApprovalState({});
      loadData();
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
      updates[row.id] = allApproved ? 0 : 1;
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
      updates[row.id] = allRejected ? 0 : 2;
    });

    setApprovalState((prev) => ({ ...prev, ...updates }));
  };

  const buildPayload = (rows) => {
    return {
      val: reqType,
      val2: selectedRegion,
      val3: selectedUser,

      app_type: decodedParams.login_id ? 1 : 0,
      login_id: decodedParams.login_id || 0,

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

  return (
      <Box p={3} display="flex" flexDirection="column" gap={2}>
        <h2>{title}</h2>

        <Grid
          container
          spacing={2}
          sx={{
            background: "#fff",
            borderRadius: "10px",
            boxShadow:
              "0 2px 6px rgba(0,0,0,0.10), 0 6px 18px rgba(0,0,0,0.07)",
            padding: "16px 18px",
          }}
        >
          <Grid size={{ xs: 12, md: 2, lg: 2 }}>
            <FormControl  fullWidth size="small">
              <InputLabel id="region-label">{masterPanel["REGN"] || "Region"}</InputLabel>

              <Select
                labelId="region-label"
                value={selectedRegion}
                label={masterPanel["REGN"] || "Region"}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedUser(0);
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
            <FormControl fullWidth size="small">
              <InputLabel id="userType-label">{masterPanel["USER"] || "User"} Type</InputLabel>

              <Select
                labelId="userType-label"
                value={selectedUserType}
                label={`${masterPanel["USER"] || "User"} Type`}
                onChange={(e) => {
                  setSelectedUserType(e.target.value);
                  setSelectedUser(0);
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
                options={[{ id: 0, full_name: "All" }, ...userData]}
                getOptionLabel={(option) => {
                  if (Number(option.id) === 0) return "All";
                  return `${option.full_name}${option.count ? ` (${option.count})` : ""}`;
                }}
                isOptionEqualToValue={(option, value) =>
                  Number(option.id) === Number(value.id)
                }
                renderOption={(props, option) => {
                  if (Number(option.id) === 0) {
                    return (
                      <li {...props} key={0}>
                        All
                      </li>
                    );
                  }

                  return (
                    <li {...props} key={option.id}>
                      {option.full_name}
                      {option.count ? ` (${option.count})` : ""}
                    </li>
                  );
                }}
                value={
                  userData.find((u) => Number(u.id) === Number(selectedUser)) ||
                  (Number(selectedUser) === 0 ? { id: 0, full_name: "All" } : null)
                }
                onChange={(e, newValue) => {
                  const userId = newValue ? Number(newValue.id) : 0;
                  setSelectedUser(userId);
                  loadData(userId);
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
            <Box>
              <button
                onClick={() => loadData()}
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

        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.10), 0 6px 18px rgba(0,0,0,0.07)",
          }}
        >
          {[0, 2].includes(Number(accStat)) &&
            tableData.some((row) => isRowActionAllowed(row)) && (
              <Box display="flex" justifyContent="flex-end" gap={3} px={4} pt={2}>
                <span
                  onClick={handleApproveAll}
                  style={{
                    fontSize: "15px",
                    color: tableData
                      .filter((row) => isRowActionAllowed(row))
                      .every((row) => approvalState[row.id] === 1)
                      ? "#0bd00b"
                      : "#a5a0a0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Approve All <FaThumbsUp size={18} style={{ marginBottom: "8px" }} />
                </span>

                <span
                  onClick={handleRejectAll}
                  style={{
                    fontSize: "15px",
                    color: tableData
                      .filter((row) => isRowActionAllowed(row))
                      .every((row) => approvalState[row.id] === 2)
                      ? "red"
                      : "#a5a0a0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  Reject All <FaThumbsDown size={18} style={{ marginTop: "6px" }} />
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

        {[0, 2].includes(Number(accStat)) &&
          tableData.some((row) => isRowActionAllowed(row)) && (
            <Box display="flex" justifyContent="center">
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
      </Box>
  );
}

export default MobileApproval;